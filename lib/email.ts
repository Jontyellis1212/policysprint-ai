import { Resend } from "resend";

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

function getResend() {
  const key = requiredEnv("RESEND_API_KEY");
  return new Resend(key);
}

export async function sendEmail(args: SendEmailArgs) {
  const from = requiredEnv("EMAIL_FROM");

  const resend = getResend();
  const res = await resend.emails.send({
    from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });

  return res;
}

function getAppUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) throw new Error("NEXT_PUBLIC_APP_URL (or APP_URL) is not set");
  return trimmed;
}

function baseEmailShell(innerHtml: string) {
  // Dark + emerald theme-ish in email (simple, reliable HTML)
  return `
  <div style="background:#020617;padding:24px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
    <div style="max-width:560px;margin:0 auto;border:1px solid rgba(148,163,184,0.2);border-radius:16px;background:rgba(15,23,42,0.7);padding:20px;">
      <div style="text-transform:uppercase;letter-spacing:0.12em;font-weight:700;font-size:11px;color:#94a3b8;">
        PolicySprint AI
      </div>
      <div style="margin-top:10px;color:#e2e8f0;font-size:14px;line-height:1.6;">
        ${innerHtml}
      </div>
      <div style="margin-top:18px;color:#64748b;font-size:12px;line-height:1.6;">
        If you didn’t request this, you can safely ignore this email.
      </div>
    </div>
  </div>
  `.trim();
}

export function verificationEmailTemplate(params: { verifyUrl: string }) {
  const inner = `
    <h1 style="margin:0 0 8px 0;font-size:18px;color:#f8fafc;">Verify your email</h1>
    <p style="margin:0 0 14px 0;">Click the button below to verify your email address and unlock downloads.</p>
    <p style="margin:0 0 16px 0;">
      <a href="${params.verifyUrl}"
         style="display:inline-block;background:#10b981;color:#020617;text-decoration:none;font-weight:700;padding:10px 14px;border-radius:10px;">
        Verify email
      </a>
    </p>
    <p style="margin:0;">Or copy and paste this link:</p>
    <p style="margin:6px 0 0 0;word-break:break-all;color:#a7f3d0;">${params.verifyUrl}</p>
  `;
  return baseEmailShell(inner);
}

export function resetPasswordEmailTemplate(params: { resetUrl: string }) {
  const inner = `
    <h1 style="margin:0 0 8px 0;font-size:18px;color:#f8fafc;">Reset your password</h1>
    <p style="margin:0 0 14px 0;">Click the button below to choose a new password.</p>
    <p style="margin:0 0 16px 0;">
      <a href="${params.resetUrl}"
         style="display:inline-block;background:#10b981;color:#020617;text-decoration:none;font-weight:700;padding:10px 14px;border-radius:10px;">
        Reset password
      </a>
    </p>
    <p style="margin:0;">Or copy and paste this link:</p>
    <p style="margin:6px 0 0 0;word-break:break-all;color:#a7f3d0;">${params.resetUrl}</p>
  `;
  return baseEmailShell(inner);
}

export function buildVerifyEmailUrl(token: string) {
  const appUrl = getAppUrl();
  return `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;
}

export function buildResetPasswordUrl(token: string) {
  const appUrl = getAppUrl();
  return `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
}
