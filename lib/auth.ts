
// auth.ts

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "../app/generated/prisma";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import authConfig from "./auth.config";


const prisma = new PrismaClient();
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    ...authConfig.providers,

    // Set up the Credentials provider for email and password login.
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        if (credentials === null) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });

          if (user && user.password) {
            const isPasswordCorrect = await bcrypt.compare(
              credentials.password as string,
              user.password
            );

            if (isPasswordCorrect) {
              return user;
            }
          }
          
          return null; // Return null if user not found or password incorrect
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
      }
      return session;
    },
  },
});
