"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { authKey } from "@/constants/AuthKey.constant";
import { UserRole, isAdminRole } from "@/constants/UserRole.constant";
import { useRouter, useSearchParams } from "next/navigation";
import { sendOTP } from "@/utils/auth";
import Link from "next/link";
import PasswordInput from "@/components/Form/PasswordInput";
import { authService } from "@/service/auth.service";
import { Suspense } from "react";

type TFormInput = {
  email: string;
  password: string;
};

const SignInContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const redirectTo =
    redirectParam &&
    redirectParam.startsWith("/") &&
    !redirectParam.startsWith("//") &&
    !redirectParam.startsWith("/sign-in")
      ? redirectParam
      : null;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TFormInput>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit: SubmitHandler<TFormInput> = async (data) => {
    const payload = {
      email: data.email,
      password: data.password,
    };

    const toasterId = toast.loading("Trying to sign in!", {
      duration: 2000,
    });

    try {
      const responseData = await authService.signIn(payload);

      // Show error message if login is unsuccessful
      if (!responseData.success) {
        toast.error(responseData.message, {
          id: toasterId,
          duration: 2000,
        });
        // set Temporary session to verify otp
        if (responseData.data?.isVerified === false) {
          const expiryTime = new Date().getTime() + 10 * 60 * 1000; // 10 minutes expiration
          sessionStorage.setItem(
            "emailVerifyData",
            JSON.stringify({ email: data.email, expiry: expiryTime }),
          );
          const otpSent = await sendOTP(data.email);
          if (otpSent) {
            router.push("/verify-otp");
          }
        }
        return;
      }

      // Set the auth token in cookies and session storage if login is successful
      toast.success("Signed in successfully!", {
        id: toasterId,
        duration: 2000,
      });

      Cookies.set(authKey, responseData.data.accessToken, {
        path: "/",
        secure: true,
        sameSite: "strict",
        expires: 28,
      });

      sessionStorage.setItem(
        authKey,
        JSON.stringify({
          authKey: responseData.data.accessToken,
          expiry: new Date().getTime() + 28 * 24 * 60 * 60 * 1000,
          isVerified: responseData.data.isVerified,
        }),
      );

      // Redirect to the requested local page when sign-in was triggered from a protected action.
      if (redirectTo) {
        router.push(redirectTo);
      } else if (isAdminRole(responseData.data.role)) {
        router.push("/admin");
      } else if (responseData.data.role === UserRole.user) {
        router.push("/courses");
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      toast.error("Failed to sign in. Please try again.", {
        id: toasterId,
        duration: 2000,
      });
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-xl border border-slate-200 space-y-6 sm:space-y-7">
        <div className="flex flex-col justify-center items-center gap-1">
          <h3 className="text-gray-500 text-xl sm:text-2xl">Welcome back!</h3>
          <h2 className="text-lg sm:text-xl text-center">
            Sign in to{" "}
            <Link href="/" className="hover:cursor-pointer">
              {String(process.env.NEXT_PUBLIC_APP_NAME || "KV App")}
            </Link>
          </h2>
        </div>

        <hr />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <div>
            <label className="text-gray-700">Email address</label>
            <Input
              type="email"
              autoComplete="email"
              placeholder="Enter your email address"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                  message: "Invalid email address",
                },
              })}
              className="mt-1"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {String(errors.email.message)}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="text-gray-700">Password</label>
            <PasswordInput
              autoComplete="current-password"
              placeholder="Enter your password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters long",
                },
              })}
              className="mt-1 h-11"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {String(errors.password.message)}
              </p>
            )}
          </div>

          {/* Forgot Password */}
          <div>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-black"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full h-11 text-base mt-1">
            Sign In
          </Button>
        </form>

        <hr />

        <div>
          <p className="text-gray-700 text-center">
            Don&apos;t have an account?{" "}
            <Link
              href={
                redirectTo
                  ? `/sign-up?redirect=${encodeURIComponent(redirectTo)}`
                  : "/sign-up"
              }
              className="font-bold hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const SignInPage = () => {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md">
          <div className="h-[32rem] rounded-2xl border border-slate-200 bg-white shadow-xl" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
};

export default SignInPage;
