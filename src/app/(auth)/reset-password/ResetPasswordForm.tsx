"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import PasswordInput from "@/components/Form/PasswordInput";
import PasswordStrength from "@/components/Form/PasswordStrength";
import { authService } from "@/service/auth.service";

type TFormInput = {
  password: string;
  confirmPassword: string;
};

const ResetPasswordForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      router.push("/forgot-password");
    }
  }, [router, searchParams]);

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

  const onSubmit: SubmitHandler<TFormInput> = async (data) => {
    if (data.password !== data.confirmPassword) {
      toast.error("Password and Confirm Password must be the same!", {
        duration: 2000,
      });
      return;
    }

    const payload = {
      requestType: "forgot_password",
      newPassword: data.password,
    };

    const toastId = toast.loading("Trying to reset password...", {
      duration: 0,
    });

    try {
      const responseData = await authService.resetPasswordWithToken(payload, {
        token,
      });

      if (!responseData.success) {
        toast.error(responseData.message, { id: toastId, duration: 2000 });
      } else {
        toast.success(responseData.message, { id: toastId, duration: 2000 });
        router.push("/sign-in");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Failed to reset password. Please try again.", {
        id: toastId,
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
            Reset Your Password
          </h2>
        </div>

        <hr />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-gray-500 text-sm mb-5">
            Enter your new password below. Password must be at least 8
            characters long.
          </p>

          <div>
            <label className="text-gray-700">Password</label>
            <PasswordInput
              autoComplete="new-password"
              placeholder="Enter your password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters long",
                },
              })}
              className="mt-1 h-11"
            />
            <PasswordStrength password={watch("password")} />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-gray-700">Confirm Password</label>
            <PasswordInput
              autoComplete="new-password"
              placeholder="Re-enter your password"
              {...register("confirmPassword", {
                required: "Confirm password is required",
                validate: (value) =>
                  value === watch("password") || "Passwords do not match",
              })}
              className="mt-1 h-11"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-base mt-1"
            disabled={
              watch("password") !== watch("confirmPassword") ||
              watch("password").length < 8
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
              Return to <span className="font-bold">Home</span> page
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
