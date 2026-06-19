import { toast } from "sonner";
import { authService } from "@/service/auth.service";

export const sendOTP = async (email: string): Promise<boolean> => {
  const payload = {
    email: email,
    otpType: "email_verification",
  };
  try {
    const responseData = await authService.sendOtp(payload);

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
