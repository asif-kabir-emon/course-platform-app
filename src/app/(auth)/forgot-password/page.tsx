"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";

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
        const remainingTime = Math.ceil((120000 - elapsedTime) / 1000); // Convert to seconds
        setTimeLeft(remainingTime);
        setIsButtonDisabled(true);
      } else {
        sessionStorage.removeItem("lastRequestTime");
      }
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setIsButtonDisabled(false);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const onSubmit: SubmitHandler<TFormInput> = async (data) => {
    setIsButtonDisabled(true);
    // Save the current time for the next request delay
    sessionStorage.setItem("lastRequestTime", String(Date.now()));

    const payload = {
      email: data.email,
      otpType: "forgot_password_verification",
    };

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!responseData.success) {
        setIsButtonDisabled(false);

        toast.error(responseData.message, {
          position: "top-center",
          duration: 2000,
        });
      } else {
        toast.success(responseData.message, {
          position: "top-center",
          duration: 2000,
        });

        // Set the timer for re-enabling the button after 2 minutes
        setTimeLeft(120);
        let countDown = 120; // 2 minutes in seconds
        const interval = setInterval(() => {
          countDown -= 1;
          setTimeLeft(countDown); // Convert seconds to milliseconds for accuracy

          if (countDown <= 0) {
            clearInterval(interval);
            setIsButtonDisabled(false);
          }
        }, 1000);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      setIsButtonDisabled(false);
      toast.error("Failed to sign in. Please try again.", {
        position: "top-center",
        duration: 2000,
      });
    }
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
            {isButtonDisabled && timeLeft > 0
              ? `Try again in ${timeLeft} seconds`
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
