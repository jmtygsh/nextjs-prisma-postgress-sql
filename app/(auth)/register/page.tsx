// components/RegisterComponent.tsx
"use client";

import { useRouter } from "next/navigation";
import { doSocialLogin } from "@/lib/authcontrol";
import { toast } from "sonner";
import { useState } from "react";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// -------------------- Zod Schema --------------------
const registerSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// typescript type
type RegisterFormData = z.infer<typeof registerSchema>;

// -------------------- Component --------------------
export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  async function onRegister(data: RegisterFormData) {
    setLoading(true);


    console.log(data)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data), 
      });

      if (res.ok) {
        toast.success("Register Successful");
        router.push("/login"); // redirect after success
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to register");
      }
    } catch (error) {
      toast.error("Failed to register");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Create an Account
          </h1>
          <p className="text-gray-600">Register to get started</p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit(onRegister)}>
          {/* Full Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              {...register("name")}
              disabled={loading}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register("email")}
              disabled={loading}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register("password")}
              disabled={loading}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-2">
          <div className="flex-grow h-px bg-gray-300"></div>
          <span className="text-sm text-gray-500">or sign up with</span>
          <div className="flex-grow h-px bg-gray-300"></div>
        </div>

        {/* Social Buttons */}
        <div className="flex gap-3">
          <form action={() => doSocialLogin("github")} className="w-1/2">
            <button
              type="submit"
              className="w-full py-2 px-4 border rounded-lg hover:bg-gray-50"
            >
              GitHub
            </button>
          </form>
          <form action={() => doSocialLogin("google")} className="w-1/2">
            <button
              type="submit"
              className="w-full py-2 px-4 border rounded-lg hover:bg-gray-50"
            >
              Google
            </button>
          </form>
        </div>

        {/* Already have account */}
        <p className="text-sm text-center text-gray-600">
          Already have an account?{" "}
          <a
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
