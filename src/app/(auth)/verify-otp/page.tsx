"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

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

  const handleResendOtp = () => {
    // Reset the OTP and start the countdown again
    setOtp(Array(6).fill(""));
    setSeconds(120); // Reset timer to 2 minutes
    setIsResendDisabled(true); // Disable Resend button during countdown
    alert("OTP has been resent to your email address.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      email: emailAddress,
      otpType: "email_verification",
      otpCode: otp.join(""),
    };
  };

  return (
    <div className="p-2 w-full max-w-md mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-2xl border-2 space-y-7">
        <div className="flex flex-col justify-center items-center gap-1">
          <h3 className="text-gray-500 text-2xl">Welcome</h3>
          <h2 className="text-xl">Try to verify your Account</h2>
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
            <div className="flex justify-center items-center gap-2 my-5">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-input-${index}`}
                  type="text"
                  value={digit}
                  onChange={(e) => handleOtpChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)} // Handling Backspace
                  maxLength={1}
                  className="w-10 h-10 text-center text-lg border-2 border-gray-300 rounded-md"
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
              className="w-full text-md py-2 mt-5"
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
