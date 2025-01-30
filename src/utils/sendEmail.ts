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
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    } as nodemailer.TransportOptions);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      text: emailTexInPlain || "",
      html: emailTextInHTML,
    };

    const info = await transporter.sendMail(mailOptions);

    if (info.accepted.length === 0) {
      return { success: false, message: "Failed to send email", info };
    }

    return { success: true, message: "Email sent successfully", info };
  } catch (error) {
    return { success: false, message: "Failed to send OTP", error };
  }
};
