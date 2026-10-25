import "server-only";
import nodemailer from "nodemailer";
import { getSettings } from "./settings";

type Mail = { to: string; subject: string; html: string; text?: string };

function transport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
}

export async function sendMail(mail: Mail) {
  const t = transport();
  const settings = await getSettings();
  const from = process.env.MAIL_FROM || `${settings.name} <no-reply@example.com>`;
  if (!t) {
    console.log(`\n📧 [mail → ${mail.to}] ${mail.subject}\n${mail.text ?? mail.html.replace(/<[^>]+>/g, "")}\n`);
    return;
  }
  try {
    await t.sendMail({ from, ...mail });
  } catch (err) {
    console.error("Mail send failed", err);
  }
}

export function appUrl(path = "") {
  return `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${path}`;
}

export function layout(title: string, body: string, brand = process.env.NEXT_PUBLIC_GYM_NAME || "Your gym") {
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;background:#0a0a0a;color:#f4f4f5;border-radius:12px">
  <h1 style="color:#E5B93C;font-size:22px;margin:0 0 16px">${title}</h1>
  <div style="font-size:15px;line-height:1.6">${body}</div>
  <p style="color:#71717a;font-size:12px;margin-top:24px">${brand}</p>
</div>`;
}
