"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.png";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

type SignInForm = z.infer<typeof signInSchema>;

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInForm) => {
    setIsLoading(true);
    setServerError(null);

    const { error } = await signIn.email({
      email: data.email,
      password: data.password,
      callbackURL: callbackUrl,
    });

    if (error) {
      setServerError(error.message ?? "Invalid credentials. Please try again.");
      setIsLoading(false);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {serverError && (
        <div className="flex items-center gap-2 text-sm bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          ⚠ {serverError}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Email</label>
        <input
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          {...register("email")}
          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${
            errors.email
              ? "border-red-400 focus:ring-red-200"
              : "border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          }`}
        />
        {errors.email && (
          <p className="text-xs text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-slate-700">Password</label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-indigo-600 hover:underline"
          >
            Forgot?
          </Link>
        </div>
        <input
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          {...register("password")}
          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${
            errors.password
              ? "border-red-400 focus:ring-red-200"
              : "border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          }`}
        />
        {errors.password && (
          <p className="text-xs text-red-500">{errors.password.message}</p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
        <input
          type="checkbox"
          {...register("rememberMe")}
          className="w-4 h-4 accent-indigo-600"
        />
        Remember me for 7 days
      </label>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-linear-to-r from-indigo-600 to-violet-600 text-white py-2.5 text-sm font-semibold shadow-md hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition"
      >
        {isLoading ? (
          <span className="flex justify-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-150" />
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-300" />
          </span>
        ) : (
          "Sign in →"
        )}
      </button>
    </form>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-linear-to-br from-slate-50 to-indigo-50 px-6 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-10 shadow-xl">
        <div className="flex items-center gap-2 mb-8">
          <Image src={logo} alt="logo" width={50} />
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
          <p className="text-sm text-slate-500">Sign in to your account to continue</p>
        </div>

        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-slate-100" />}>
          <SignInForm />
        </Suspense>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-indigo-600 font-medium hover:underline">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}