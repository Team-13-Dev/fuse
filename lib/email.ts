

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}


async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.log("📧 [Email stub]", {
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return;
  }

  throw new Error(
    "Email provider not configured. See src/lib/email.ts to wire one up."
  );
}


export async function sendVerificationEmail(to: string, url: string): Promise<void> {
  await sendEmail({
    to,
    subject: "Verify your email — Nexus",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1e1e2e;">Verify your email</h2>
        <p style="color: #475569;">Click the button below to verify your email address and activate your account.</p>
        <a
          href="${url}"
          style="
            display: inline-block;
            background: #6366f1;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin: 16px 0;
          "
        >
          Verify email
        </a>
        <p style="color: #94a3b8; font-size: 13px;">
          This link expires in 24 hours. If you didn't create an account, you can ignore this email.
        </p>
      </div>
    `,
    text: `Verify your email: ${url}`,
  });
}

export async function sendPasswordResetEmail(to: string, url: string): Promise<void> {
  await sendEmail({
    to,
    subject: "Reset your password — Nexus",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1e1e2e;">Reset your password</h2>
        <p style="color: #475569;">We received a request to reset your password. Click below to choose a new one.</p>
        <a
          href="${url}"
          style="
            display: inline-block;
            background: #6366f1;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin: 16px 0;
          "
        >
          Reset password
        </a>
        <p style="color: #94a3b8; font-size: 13px;">
          This link expires in 1 hour. If you didn't request a reset, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `Reset your password: ${url}`,
  });
}