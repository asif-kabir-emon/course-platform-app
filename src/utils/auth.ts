import { toast } from "sonner";

export const sendOTP = async (email: string): Promise<boolean> => {
  const payload = {
    email: email,
    otpType: "email_verification",
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
      toast.error(responseData.message, {
        duration: 2000,
      });
      return false;
    } else {
      toast.success(responseData.message, {
        duration: 2000,
      });
      return true;
    }
  } catch {
    toast.error("Failed to send the verification code. Please try again.", {
      duration: 2000,
    });
    return false;
  }
};
