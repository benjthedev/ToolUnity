import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getSupabase, getSupabaseAdmin } from '@/lib/supabase';
import { serverLog } from '@/lib/logger';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const supabase = getSupabase();

        // Check if the input is an email or username
        let loginEmail = credentials.email;
        if (!loginEmail.includes('@')) {
          // It's a username - look up the email
          const { data: userRecord } = await supabase
            .from('users_ext')
            .select('email')
            .eq('username', loginEmail)
            .single();

          if (!userRecord?.email) {
            serverLog.error('Username not found:', loginEmail);
            return null;
          }
          loginEmail = userRecord.email;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: credentials.password,
        });

        if (error || !data.user) {
          serverLog.error('Auth error:', error?.message);
          return null;
        }

        // Check email verification status from auth.users.email_confirmed_at
        let emailVerified = data.user.email_confirmed_at ? true : false;
        let stripeConnectId = '';
        
        // Also check our custom email_verified field in users_ext as fallback and get Stripe info
        try {
          const { data: userExt, error: userExtError } = await supabase
            .from('users_ext')
            .select('email_verified, stripe_connect_account_id')
            .eq('user_id', data.user.id)
            .single();
          
          // SAFETY NET: If user exists in auth but NOT in users_ext, create the profile
          if (userExtError && userExtError.code === 'PGRST116') {
            serverLog.warn('Orphaned auth user detected, creating profile:', data.user.id, data.user.email);
            
            const adminSupabase = getSupabaseAdmin();
            const { error: insertError } = await adminSupabase.from('users_ext').insert({
              user_id: data.user.id,
              email: data.user.email,
              username: data.user.email?.split('@')[0] || 'user',
              phone_number: null,
              subscription_tier: 'free',
              email_verified: emailVerified,
              tools_count: 0,
              created_at: new Date().toISOString(),
            });

            if (insertError) {
              serverLog.error('Failed to create safety-net profile:', insertError.message);
            } else {
              serverLog.info('Safety-net profile created for:', data.user.email);
            }
          } else if (userExt) {
            if (userExt.email_verified) {
              emailVerified = true;
            }
            if (userExt.stripe_connect_account_id) {
              stripeConnectId = userExt.stripe_connect_account_id;
            }
          }
        } catch (err) {
          // Silently fail - just use the Supabase auth status
        }

        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email,
          emailVerified: emailVerified,
          stripeConnectId: stripeConnectId,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.emailVerified = user.emailVerified || false;
        token.stripeConnectId = (user as any).stripeConnectId || '';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.emailVerified = token.emailVerified as boolean;
        (session.user as any).stripeConnectId = token.stripeConnectId as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours - max session duration
    updateAge: 12 * 60 * 60, // Refresh token every 12 hours of activity
  },
  secret: process.env.NEXTAUTH_SECRET,
};
