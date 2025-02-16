"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";

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
    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
    };

    const toasterId = toast.loading("Trying to sign up!", {
      position: "top-center",
      duration: 2000,
    });

    try {
      // API call
      const response = await fetch("/api/auth/sign-up/user", {
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
      } else {
        toast.success(responseData.message, {
          id: toasterId,
          duration: 2000,
        });

        if (data.email && responseData.success === true) {
          // set Temporary session to verify otp
          const expiryTime = new Date().getTime() + 10 * 60 * 1000; // 10 minutes expiration
          sessionStorage.setItem(
            "emailVerifyData",
            JSON.stringify({ email: data.email, expiry: expiryTime }),
          );
          router.push("/verify-otp");
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Failed to sign up. Please try again.", {
        id: toasterId,
        duration: 2000,
      });
    }
  };

  return (
    <div className="p-2 w-full max-w-md mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-2xl border-2 space-y-7">
        <div className="flex flex-col justify-center items-center gap-1">
          <h3 className="text-gray-500 text-2xl">Welcome</h3>
          <h2 className="text-xl">
            Sign Up to {String(process.env.NEXT_PUBLIC_APP_NAME || "KV App")}
          </h2>
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
                  value: 8,
                  message: "Password must be at least 8 characters long",
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
