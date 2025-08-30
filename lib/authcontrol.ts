"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";

// Login with email and password
export async function doCredentialLogin(data: any) {
  try {
    // If you're sending FormData from the client:
    let email: string, password: string;

    if (data instanceof FormData) {
      email = data.get("email") as string;
      password = data.get("password") as string;
    } else {
      // already an object (from react-hook-form)
      email = data.email;
      password = data.password;
    }

    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
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

// Social login
export const doSocialLogin = async (provider: "github" | "google") => {
  await signIn(provider, { redirectTo: "/dashboard" });
};

// Sign out
export const doSignOut = async () => {
  await signOut({ redirectTo: "/login" });
};
