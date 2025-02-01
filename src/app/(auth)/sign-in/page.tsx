"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppName } from "@/constants/App.constant";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { authKey } from "@/constants/AuthKey.constant";
import { useRouter } from "next/navigation";
import { sendOTP } from "../verify-otp/page";

type TFormInput = {
  email: string;
  password: string;
};

const SignInPage = () => {
  const router = useRouter();
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
      position: "top-center",
      duration: 2000,
    });

    try {
      // API call
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      // Show error message if login is unsuccessful
      if (!responseData.success) {
        toast.error(responseData.message, {
          id: toasterId,
          duration: 2000,
        });
        // set Temporary session to verify otp
        if (responseData.data.isVerified === false) {
          const expiryTime = new Date().getTime() + 10 * 60 * 1000; // 10 minutes expiration
          sessionStorage.setItem(
            "emailVerifyData",
            JSON.stringify({ email: data.email, expiry: expiryTime }),
          );
          sendOTP(data.email);
          router.push("/verify-otp");
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

      // Redirect to the home page
      router.push("/");

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      toast.error("Failed to sign in. Please try again.", {
        id: toasterId,
        duration: 2000,
      });
    }
  };

  return (
    <div className="p-2 w-full max-w-md mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-2xl border-2 space-y-7">
        <div className="flex flex-col justify-center items-center gap-1">
          <h3 className="text-gray-500 text-2xl">Welcome back!</h3>
          <h2 className="text-xl">Sign in to {String(AppName)}</h2>
        </div>

        <hr />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <div>
            <label className="text-gray-700">Email address</label>
            <Input
              type="text"
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
            <Input
              type="password"
              placeholder="Enter your password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters long",
                },
              })}
              className="mt-1"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {String(errors.password.message)}
              </p>
            )}
          </div>

          {/* Forgot Password */}
          <div>
            <a
              href="/forgot-password"
              className="text-sm text-gray-700 underline"
            >
              Forgot password?
            </a>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full text-md py-2 mt-1">
            Sign In
          </Button>
        </form>

        <hr />

        <div>
          <p className="text-gray-700 text-center">
            Don&apos;t have an account?{" "}
            <a href="/sign-up" className="font-bold hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
