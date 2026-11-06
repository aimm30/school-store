import "server-only";
import nodemailer from "nodemailer";
import { siteConfig } from "./config";

export async function sendMail(opts: { to: string; subject: string; text: string }): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  if (!host) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`\n[mail:dev] To: ${opts.to}\nSubject: ${opts.subject}\n${opts.text}\n`);
    } else {
      console.warn("[mail] SMTP is not configured; email was NOT sent.");
    }
    return false;
  }
  try {
    const transport = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    await transport.sendMail({
      from: process.env.MAIL_FROM || `${siteConfig.storeName} <no-reply@localhost>`,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
    });
    return true;
  } catch (err) {
    console.error("[mail] send failed", err);
    return false;
  }
}
