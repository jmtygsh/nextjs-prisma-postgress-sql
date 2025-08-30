"use client";

import { useSession } from "next-auth/react";
import { doSocialLogin, doCredentialLogin } from "@/lib/authcontrol";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Github, Mail } from "lucide-react";
import { toast } from "sonner";

import { useForm } from "react-hook-form";

// -------------------- TS Types --------------------
type LoginFormData = {
  email: string;
  password: string;
};

// -------------------- Component --------------------
export default function SignIn() {
  const { data: session, status, update } = useSession();

  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>();

  async function onSubmit(data: LoginFormData) {
    setLoading(true);
    try {
      const response = await doCredentialLogin(data);

      if (response?.error) {
        toast.error("Invalid credentials");
      } else {
        toast.success("Login successful!");
        await update(); // refresh session
        router.push("/dashboard");
      }
    } catch (e) {
      console.error(e);
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
      reset();
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
          <p className="text-gray-600">Sign in to continue to your account</p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <input
              id="email"
              type="text"
              placeholder="Email or Username"
              autoComplete="email"
              disabled={loading}
              {...register("email", { required: "Email is required" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <input
              id="password"
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              disabled={loading}
              {...register("password", { required: "Password is required" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="text-right text-sm">
            <a href="#" className="text-indigo-600 hover:text-indigo-500">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 text-white font-medium bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-2">
          <div className="flex-grow h-px bg-gray-300"></div>
          <span className="text-sm text-gray-500">or continue with</span>
          <div className="flex-grow h-px bg-gray-300"></div>
        </div>

        {/* Social Buttons */}
        <div className="flex gap-3">
          <form action={() => doSocialLogin("github")} className="w-1/2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2 px-4 border rounded-lg hover:bg-gray-50"
            >
              <Github className="w-4 h-4" />
              GitHub
            </button>
          </form>
          <form action={() => doSocialLogin("google")} className="w-1/2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2 px-4 border rounded-lg hover:bg-gray-50"
            >
              <Mail className="w-4 h-4" />
              Google
            </button>
          </form>
        </div>

        {/* Sign Up */}
        <p className="text-sm text-center text-gray-600">
          Not a member?{" "}
          <a
            href="/sign-up"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign up now
          </a>
        </p>
      </div>
    </div>
  );
}
