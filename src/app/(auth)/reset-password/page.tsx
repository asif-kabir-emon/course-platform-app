"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";

type TFormInput = {
  password: string;
  confirmPassword: string;
};

const ResetPasswordPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<TFormInput>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit: SubmitHandler<TFormInput> = (data) => {
    if (data.password !== data.confirmPassword) return;

    console.log("Login Data:", data);
    alert("Login successful!");
  };
  return (
    <div className="p-2 w-full max-w-md mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-2xl border-2 space-y-7">
        <div className="flex flex-col justify-center items-center gap-1">
          <h3 className="text-gray-500 text-2xl">Welcome back!</h3>
          <h2 className="text-xl">Try to Reset Your Password</h2>
        </div>

        <hr />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-gray-500 text-sm mb-5">
            Enter your new password below. Password must be at least 6
            characters long.
          </p>

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

          {/* Confirm Password Field */}
          <div>
            <label className="text-gray-700">Confirm Password</label>
            <Input
              type="password"
              placeholder="Re-enter your password"
              {...register("confirmPassword", {
                required: "Confirm password is required",
                validate: (value) =>
                  value === watch("password") || "Passwords do not match",
              })}
              className="mt-1"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                {String(errors.confirmPassword.message)}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full text-md py-2 mt-1"
            disabled={
              watch("password") !== watch("confirmPassword") ||
              watch("password").length < 6 ||
              watch("confirmPassword").length < 6
            }
          >
            Reset Password
          </Button>
        </form>

        <hr />

        <div>
          <p className="text-gray-700 text-center">
            <Link
              href="/"
              className="hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Return to
              <span className="font-bold"> Home </span>
              page
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
