import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getSupabase } from '@/lib/supabase';
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
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
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
          const { data: userExt } = await supabase
            .from('users_ext')
            .select('email_verified, stripe_connect_account_id')
            .eq('user_id', data.user.id)
            .single();
          
          if (userExt?.email_verified) {
            emailVerified = true;
          }
          if (userExt?.stripe_connect_account_id) {
            stripeConnectId = userExt.stripe_connect_account_id;
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
