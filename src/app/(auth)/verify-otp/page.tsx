"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { authKey } from "@/constants/AuthKey.constant";
import { sendOTP } from "@/utils/auth";
import { authService } from "@/service/auth.service";

const VerifyOtpPage = () => {
  const router = useRouter();
  const [emailAddress, setEmailAddress] = useState("");

  useEffect(() => {
    const storedEmailData = sessionStorage.getItem("emailVerifyData");

    if (storedEmailData) {
      const { email, expiry } = JSON.parse(storedEmailData);

      if (new Date().getTime() > expiry) {
        // Expired: Remove session and redirect
        sessionStorage.removeItem("emailData");
        router.push("/");
      } else {
        setEmailAddress(email);
        router.replace(`/verify-otp?email=${email}`);
      }
    } else {
      router.push("/");
    }
  }, [router]);

  const [otp, setOtp] = useState(Array(6).fill(""));
  const [seconds, setSeconds] = useState(120); // Countdown timer
  const [isResendDisabled, setIsResendDisabled] = useState(true); // Disable Resend button initially

  useEffect(() => {
    if (seconds > 0) {
      const interval = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds - 1);
      }, 1000);
      return () => clearInterval(interval); // Clean up interval on component unmount
    } else {
      setIsResendDisabled(false); // Enable Resend button after 2 minutes
    }
  }, [seconds]);

  const handleOtpChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const newOtp = [...otp];
    newOtp[index] = e.target.value.slice(0, 1); // Ensure only one digit
    setOtp(newOtp);

    // Move to the next input field automatically
    if (e.target.value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && otp[index] === "") {
      // Move focus to the previous input when backspace is pressed
      if (index > 0) {
        const prevInput = document.getElementById(`otp-input-${index - 1}`);
        prevInput?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").slice(0, 6); // Extract first 6 digits

    if (/^\d{6}$/.test(pasteData)) {
      setOtp(pasteData.split(""));

      // Move focus to the last input field
      const lastIndex = pasteData.length - 1;
      const lastInput = document.getElementById(`otp-input-${lastIndex}`);
      lastInput?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (emailAddress) {
      const otpSent = await sendOTP(emailAddress);

      if (otpSent) {
        // Reset the OTP and start the countdown again
        setOtp(Array(6).fill(""));
        setSeconds(120); // Reset timer to 2 minutes
        setIsResendDisabled(true); // Disable Resend button during countdown
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      email: emailAddress,
      otpType: "email_verification",
      otpCode: otp.join(""),
    };

    const toasterId = toast.loading("Trying to verify your account!", {
      duration: 2000,
    });

    try {
      const responseData = await authService.verifyOtp(payload);

      if (responseData.success) {
        toast.success(responseData.message, {
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

        router.push("/");
      } else {
        toast.error(responseData.message, {
          id: toasterId,
          duration: 2000,
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      toast.error("Failed to verify your account. Please try again.", {
        id: toasterId,
        duration: 2000,
      });
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-xl border border-slate-200 space-y-6 sm:space-y-7">
        <div className="flex flex-col justify-center items-center gap-1">
          <h3 className="text-gray-500 text-xl sm:text-2xl">Welcome</h3>
          <h2 className="text-lg sm:text-xl text-center">
            Verify Your Account
          </h2>
        </div>

        <hr />

        <div className="space-y-4">
          <p className="text-gray-500 text-sm mb-5">
            We&apos;ve sent a verification code to your email address. Please
            enter the code below.
          </p>

          {/* Resend Otp to Email with countdown */}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 6 - digit Otp input box */}
            <div className="grid grid-cols-6 gap-1.5 sm:gap-2 my-5">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-input-${index}`}
                  type="text"
                  value={digit}
                  onChange={(e) => handleOtpChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)} // Handling Backspace
                  onPaste={handlePaste}
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  aria-label={`OTP digit ${index + 1}`}
                  maxLength={1}
                  className="w-full min-w-0 aspect-square text-center text-lg border-2 border-gray-300 rounded-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              ))}
            </div>

            {/* Resend OTP Button with Countdown */}
            <p className="text-gray-500 text-center">
              {isResendDisabled ? (
                <>
                  You can resend the OTP in{" "}
                  <span className="font-bold">
                    {Math.floor(seconds / 60)}:
                    {String(seconds % 60).padStart(2, "0")}
                  </span>
                </>
              ) : (
                <>
                  Didn&apos;t receive the OTP?{" "}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="font-bold hover:underline focus:outline-none"
                  >
                    Resend OTP
                  </button>
                </>
              )}
            </p>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 text-base mt-5"
              disabled={otp.some((digit) => digit === "")}
            >
              Verify Account
            </Button>
          </form>
        </div>

        <hr />

        <div>
          <p className="text-gray-700 text-center">
            <Link href="/" className="hover:underline">
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

export default VerifyOtpPage;
