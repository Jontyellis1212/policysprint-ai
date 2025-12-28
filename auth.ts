import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // NextAuth expects a plain object with at least an id
        return {
          id: user.id,
          name: user.name ?? null,
          email: user.email ?? null,
          image: user.image ?? null,
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  callbacks: {
    // Put userId onto the token so we can use it easily later
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      // session.user exists for logged-in users
      if (session.user && token?.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
});
