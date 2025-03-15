import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    name?: string | null;
    email: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}
