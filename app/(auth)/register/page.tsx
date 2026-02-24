"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.png";

const signUpSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Please enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignUpForm = z.infer<typeof signUpSchema>;

const passwordRequirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
];

export default function SignUpPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
  });

  const password = watch("password", "");

  const onSubmit = async (data: SignUpForm) => {
    setIsLoading(true);
    setServerError(null);

    const { error } = await signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
      callbackURL: "/dashboard",
    });

    if (error) {
      setServerError(error.message ?? "Failed to create account. Please try again.");
      setIsLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen grid place-items-center bg-linear-to-br from-slate-50 to-indigo-50 px-6 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-10 shadow-xl">

        {/* Logo */}
        <div className="flex items-center mb-8">
          <Image src={logo} alt="logo" width={45} />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            Create your account
          </h2>
          <p className="text-sm text-slate-500">
            Join thousands of businesses on Fuse
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

          {serverError && (
            <div className="flex items-center gap-2 text-sm bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              ⚠ {serverError}
            </div>
          )}

          {/* Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Full Name</label>
            <input
              type="text"
              autoComplete="name"
              placeholder="Jane Smith"
              {...register("name")}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition
                ${errors.name
                  ? "border-red-400 focus:ring-red-200"
                  : "border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                }`}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              {...register("email")}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition
                ${errors.email
                  ? "border-red-400 focus:ring-red-200"
                  : "border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                }`}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Create a strong password"
              {...register("password")}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition
                ${errors.password
                  ? "border-red-400 focus:ring-red-200"
                  : "border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                }`}
            />

            {password && (
              <ul className="mt-1 space-y-1 text-xs">
                {passwordRequirements.map((req) => (
                  <li
                    key={req.label}
                    className={`flex items-center gap-2 ${
                      req.test(password) ? "text-green-600" : "text-slate-400"
                    }`}
                  >
                    {req.test(password) ? "✓" : "○"} {req.label}
                  </li>
                ))}
              </ul>
            )}

            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Confirm Password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              {...register("confirmPassword")}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition
                ${errors.confirmPassword
                  ? "border-red-400 focus:ring-red-200"
                  : "border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                }`}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Button */}
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
              "Create account →"
            )}
          </button>

          {/* Terms */}
          <p className="text-xs text-slate-500 text-center">
            By signing up you agree to our{" "}
            <Link href="/terms" className="text-indigo-600 font-medium hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-indigo-600 font-medium hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}