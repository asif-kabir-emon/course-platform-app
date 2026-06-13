import nodemailer from "nodemailer";

export const sendEmail = async ({
  email,
  subject,
  emailTexInPlain,
  emailTextInHTML,
}: {
  email: string;
  subject: string;
  emailTexInPlain?: string; // Optional
  emailTextInHTML: string;
}) => {
  try {
    const host = process.env.EMAIL_HOST;
    const port = Number(process.env.EMAIL_PORT);
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!host || !port || !user || !pass) {
      console.error("Email delivery is not configured.");
      return {
        success: false,
        message: "Email service is not configured",
      };
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port === 587,
      auth: {
        user,
        pass,
      },
    } as nodemailer.TransportOptions);

    const mailOptions = {
      from: `"KnowVeria" <${user}>`,
      to: email,
      subject,
      text: emailTexInPlain || "",
      html: emailTextInHTML,
    };

    const info = await transporter.sendMail(mailOptions);

    if (info.accepted.length === 0) {
      return { success: false, message: "Failed to send email", info };
    }

    return { success: true, message: "Email sent successfully", info };
  } catch (error) {
    console.error(
      "Email delivery failed:",
      error instanceof Error ? error.message : error,
    );
    return { success: false, message: "Failed to send OTP", error };
  }
};
