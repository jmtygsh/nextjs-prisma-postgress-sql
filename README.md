# Full-Stack Authentication with Next.js, Prisma, and Auth.js

This guide provides a comprehensive walkthrough for setting up a robust authentication system in a Next.js application. It covers:
- Credentials Login: Traditional email and password.
- Social Logins: GitHub and Google.
- ORM: Prisma with a PostgreSQL database.
- Auth Library: Auth.js (NextAuth.js v5).


# 1. Project Setup and Dependencies

First, ensure you have a Next.js project. If not, create one:

```bash 
npx create-next-app@latest my-auth-app
```

Next, install the necessary dependencies for Prisma and Auth.js.

```bash 

# Install Prisma CLI and tsx for running scripts
npm install prisma tsx --save-dev

# Install Prisma Client
npm install @prisma/extension-accelerate @prisma/client

# Install Auth.js and the Prisma adapter
npm install @auth/prisma-adapter next-auth@beta

# Install bcrypt for password hashing
npm install bcrypt
npm install @types/bcrypt --save-dev

```

# 2. Initialize Prisma

Initialize Prisma in your project. This command creates a prisma directory with a schema.prisma file and sets up the .env file

```bash 
npx prisma init
```


# 3. Configure Prisma Schema

Open prisma/schema.prisma and configure it to connect to your PostgreSQL database and define the data models required by Auth.js.

Important Note: We've added a password field to the User model to support the "Credentials" (email/password) provider.

```bash 
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Required models for Auth.js Prisma Adapter

model Account {
  id                String  @id @default(cuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime? @map("email_verified")
  image         String?
  password      String? // Added for Credentials provider
  accounts      Account[]
  sessions      Session[]

  @@map("users")
}

model VerificationToken {
  identifier String
  token      String
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}


```



# 4. Set Up Environment Variables

Create or update your .env file with your database connection string, an Auth.js secret, and your OAuth credentials from Google and GitHub.

You can generate a strong secret with: npx auth secret

```bash 

# .env

# Your PostgreSQL connection string (e.g., from Neon, Vercel Postgres, or Supabase)
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# Your generated Auth.js secret
AUTH_SECRET="your-super-strong-secret-here"

# GitHub OAuth App credentials
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"

# Google OAuth App credentials
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"


```



# 5. Migrate Your Database
Apply the schema to your database to create the required tables.

```bash 
npx prisma migrate dev --name init
```
This command also generates the Prisma Client based on your schema.


# 6. Create a Singleton Prisma Client
To avoid creating multiple instances of Prisma Client in a serverless development environment, create a singleton instance.

Create a file at lib/prisma.ts:

```bash 
// lib/prisma.ts

import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

```


# 7. Configure Auth.js

Auth.js configuration is split into a few files for better organization.

auth.config.ts

This file contains configuration that is safe to run on the Edge, including your social providers.

```bash 

// auth.config.ts

import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export default {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/signin", // URL for your custom sign-in page
  },
} satisfies NextAuthConfig;

```

auth.ts

This is the main configuration file that brings everything together, including the Prisma Adapter and the server-side-only Credentials provider logic.

```bash 

// auth.ts

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma";
import authConfig from "./auth.config";

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
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});

```


app/api/auth/[...nextauth]/route.ts

This API route exposes the Auth.js handlers.

```bash

// app/api/auth/[...nextauth]/route.ts

import { handlers } from '@/lib/auth'
export const { GET, POST } = handlers


```



# 8. Set Up Middleware

Middleware protects routes and redirects users based on their authentication status.

```bash 

// middleware.ts

import NextAuth from "next-auth";
import authConfig from "./auth.config";
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute = ["/signin", "/signup"].includes(nextUrl.pathname);
  const isProtectedRoute = nextUrl.pathname.startsWith("/dashboard");

  if (isApiAuthRoute) {
    return;
  }

  if (isPublicRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/dashboard", nextUrl));
    }
    return;
  }
  
  if (isProtectedRoute && !isLoggedIn) {
    return Response.redirect(new URL("/signin", nextUrl));
  }

  return;
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};


```


# 9. Client-Side Session Provider

Wrap your application in SessionProvider to access session data on the client side.

Create a file app/providers.tsx:

```bash 

// app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

```

then use it in your root layout app/layout.tsx:

```bash 

// app/layout.tsx
import Providers from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

```

# 10. Usage

Server Actions for Login

Create server actions to handle login and logout logic.

```bash 
// actions/auth.ts
"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

// Login with email and password
export async function doCredentialLogin(formData: FormData) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials." };
        default:
          return { error: "Something went wrong." };
      }
    }
    throw error;
  }
}

// Login with a social provider
export const doSocialLogin = async (provider: 'github' | 'google') => {
  await signIn(provider, { redirectTo: "/dashboard" });
};

// Sign out
export const doSignOut = async () => {
    await signOut({ redirectTo: "/signin" });
}

```


Client-Side Component Example

Here's how you might use useSession and the server actions in a component, with buttons for each login method.

```bash 

// components/AuthComponent.tsx
"use client";

import { useSession } from "next-auth/react";
import { doSignOut, doSocialLogin } from "@/actions/auth";

export default function AuthComponent() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (status === "authenticated") {
    return (
      <div>
        <p>Signed in as {session.user?.email}</p>
        <form action={doSignOut}>
          <button type="submit">Sign out</button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <p>You are not signed in.</p>
      {/* A real sign-in form for credentials would go here.
        It would call doCredentialLogin on submit.
      */}
      
      {/* Social Login Buttons */}
      <form action={() => doSocialLogin('github')}>
        <button type="submit">Sign in with GitHub</button>
      </form>
      <form action={() => doSocialLogin('google')}>
        <button type="submit">Sign in with Google</button>
      </form>
    </div>
  );
}


```









