import { toast } from "sonner";

export const sendOTP = async (email: string) => {
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
        position: "top-center",
        duration: 2000,
      });
    } else {
      toast.success(responseData.message, {
        position: "top-center",
        duration: 2000,
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error: unknown) {
    toast.error("Failed to sign in. Please try again.", {
      position: "top-center",
      duration: 2000,
    });
  }
};
