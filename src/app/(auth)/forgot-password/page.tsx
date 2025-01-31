"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

type TFormInput = {
  email: string;
};

const ForgotPasswordPage = () => {
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TFormInput>({
    defaultValues: {
      email: "",
    },
  });

  // Check if 2 minutes have passed since the last request
  useEffect(() => {
    const lastRequestTime = Number(sessionStorage.getItem("lastRequestTime"));
    if (lastRequestTime) {
      const elapsedTime = Date.now() - lastRequestTime;
      if (elapsedTime < 120000) {
        const remainingTime = Math.max(0, 120000 - elapsedTime);
        setTimeLeft(Math.floor(remainingTime / 1000)); // seconds
        setIsButtonDisabled(true);
      } else {
        sessionStorage.removeItem("lastRequestTime");
      }
    }
  }, []);

  const onSubmit: SubmitHandler<TFormInput> = (data) => {
    console.log("Requesting password reset for:", data.email);

    // Save the current time for the next request delay
    sessionStorage.setItem("lastRequestTime", String(Date.now()));

    // Simulate sending the reset link
    alert("Password reset link sent!");

    // Set the timer for re-enabling the button after 2 minutes
    setIsButtonDisabled(true);
    let countDown = 120; // 2 minutes in seconds
    const interval = setInterval(() => {
      countDown -= 1;
      setTimeLeft(countDown * 1000); // Convert seconds to milliseconds for accuracy

      if (countDown <= 0) {
        clearInterval(interval);
        setIsButtonDisabled(false);
      }
    }, 1000);
  };

  return (
    <div className="p-2 w-full max-w-md mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-2xl border-2 space-y-7">
        <div className="flex flex-col justify-center items-center gap-1">
          <h3 className="text-gray-500 text-2xl mx-auto">Welcome!</h3>
          <h2 className="text-xl">Recovery Password</h2>
        </div>

        <hr />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-gray-500 text-sm mb-5">
            Enter your email address and we will send you a link to reset your
            password.
          </p>

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

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full text-md py-2 mt-1"
            disabled={isButtonDisabled}
          >
            {isButtonDisabled
              ? `Try again in ${timeLeft / 1000} seconds`
              : "Send Reset Link"}
          </Button>
        </form>

        <hr />

        <div>
          <p className="text-gray-700 text-center">
            <Link href="/sign-in" className="hover:underline">
              Return to
              <span className="font-bold"> Sign In </span>
              page
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
