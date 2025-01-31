"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppName } from "@/constants/App.constant";
import { useRouter } from "next/navigation";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";

type TFormInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

const SignUpPage = () => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TFormInput>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  const onSubmit: SubmitHandler<TFormInput> = async (data) => {
    console.log("Login Data:", data);
    alert("Login successful!");

    // set Temporary session to verify otp
    if (data.email) {
      const expiryTime = new Date().getTime() + 10 * 60 * 1000; // 10 minutes expiration
      sessionStorage.setItem(
        "emailVerifyData",
        JSON.stringify({ email: data.email, expiry: expiryTime }),
      );
      router.push("/verify-otp");
    }
  };

  return (
    <div className="p-2 w-full max-w-md mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-2xl border-2 space-y-7">
        <div className="flex flex-col justify-center items-center gap-1">
          <h3 className="text-gray-500 text-2xl">Welcome</h3>
          <h2 className="text-xl">Sign Up to {String(AppName)}</h2>
        </div>

        <hr />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* FirstName Field */}
          <div>
            <label className="text-gray-700">First Name</label>
            <Input
              type="text"
              placeholder="Enter your first name"
              {...register("firstName", {
                required: "First Name is required",
                minLength: {
                  value: 3,
                  message: "First Name must be at least 3 characters long",
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

          {/* lastName Field */}
          <div>
            <label className="text-gray-700">Last Name</label>
            <Input
              type="text"
              placeholder="Enter your last name"
              {...register("lastName", {
                required: "Last Name is required",
                minLength: {
                  value: 3,
                  message: "Last Name must be at least 3 characters long",
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

          {/* Submit Button */}
          <Button type="submit" className="w-full text-md py-2 mt-1">
            Sign Up
          </Button>
        </form>

        <hr />

        <div>
          <p className="text-gray-700 text-center">
            Already have an account?{" "}
            <a href="/sign-in" className="font-bold hover:underline">
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
