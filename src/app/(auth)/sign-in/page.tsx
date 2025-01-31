"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppName } from "@/constants/App.constant";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";

type TFormInput = {
  email: string;
  password: string;
};

const SignInPage = () => {
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

  const onSubmit: SubmitHandler<TFormInput> = (data) => {
    console.log("Login Data:", data);
    alert("Login successful!");
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
