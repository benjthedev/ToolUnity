import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user?: DefaultSession['user'] & {
      id: string;
      emailVerified?: boolean;
    };
  }

  interface User {
    id: string;
    emailVerified?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    emailVerified?: boolean;
  }
}
