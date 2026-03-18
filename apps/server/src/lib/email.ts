import { env } from "@synergine-app/env/server";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

const DEFAULT_FROM = "noreply@synergine.app";

/**
 * Send email via Resend API
 * Falls back gracefully if RESEND_API_KEY not configured
 */
async function send(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not configured, email not sent to:", options.to);
    return { success: false, error: "Email service not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: options.from || DEFAULT_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    return { success: true };
  } catch (error) {
    console.error("[Email Error]", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(to: string, name: string) {
  const html = `
    <h1>Welcome to Synergine, ${name}!</h1>
    <p>Your account is ready to use. Log in to get started.</p>
    <a href="http://localhost:3001">Open Synergine</a>
  `;

  return send({
    to,
    subject: "Welcome to Synergine",
    html,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(to: string, token: string) {
  const resetUrl = `http://localhost:3001/reset-password?token=${token}`;
  const html = `
    <h1>Reset Your Password</h1>
    <p>Click the link below to reset your password.</p>
    <a href="${resetUrl}">Reset Password</a>
    <p>This link expires in 1 hour.</p>
  `;

  return send({
    to,
    subject: "Reset Your Password",
    html,
  });
}

/**
 * Send generic email
 */
export async function sendEmail(options: SendEmailOptions) {
  return send(options);
}

export { send };
