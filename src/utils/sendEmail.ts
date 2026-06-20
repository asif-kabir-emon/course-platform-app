import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

export const sendEmail = async ({
  email,
  subject,
  emailTexInPlain,
  emailTextInHTML,
  template = "custom",
}: {
  email: string;
  subject: string;
  emailTexInPlain?: string; // Optional
  emailTextInHTML: string;
  template?: string;
}) => {
  let deliveryId: string | undefined;
  try {
    deliveryId = (await prisma.emailDeliveries.create({
      data: { recipient: email, subject, template, status: "queued" },
      select: { id: true },
    })).id;
    const host = process.env.EMAIL_HOST;
    const port = Number(process.env.EMAIL_PORT);
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!host || !port || !user || !pass) {
      console.error("Email delivery is not configured.");
      if (deliveryId) {
        await prisma.emailDeliveries.update({
          where: { id: deliveryId },
          data: {
            status: "failed",
            failureReason: "Email service is not configured",
          },
        });
      }
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
      if (deliveryId) await prisma.emailDeliveries.update({ where: { id: deliveryId }, data: { status: "failed", failureReason: "Provider did not accept the recipient" } });
      return { success: false, message: "Failed to send email", info };
    }

    if (deliveryId) await prisma.emailDeliveries.update({ where: { id: deliveryId }, data: { status: "sent", sentAt: new Date(), providerId: info.messageId } });

    return { success: true, message: "Email sent successfully", info };
  } catch (error) {
    console.error(
      "Email delivery failed:",
      error instanceof Error ? error.message : error,
    );
    if (deliveryId) {
      await prisma.emailDeliveries
        .update({
          where: { id: deliveryId },
          data: {
            status: "failed",
            failureReason:
              error instanceof Error ? error.message : "Unknown delivery error",
          },
        })
        .catch(() => undefined);
    }
    return { success: false, message: "Failed to send OTP", error };
  }
};
