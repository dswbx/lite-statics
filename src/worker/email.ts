import type { EmailDriver, EmailMessage } from "@supabase/lite";
import type { Env } from "./env";

export class EmailConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailConfigError";
  }
}

export async function sendEmail(
  env: Env,
  message: { to: string; subject: string; html: string; text: string },
): Promise<{ messageId: string }> {
  if (!env.EMAIL_FROM_ADDRESS?.trim()) {
    throw new EmailConfigError("EMAIL_FROM_ADDRESS is not configured.");
  }

  const fromName = env.EMAIL_FROM_NAME?.trim() || "Statics";
  const response = await env.EMAIL.send({
    to: message.to,
    from: { email: env.EMAIL_FROM_ADDRESS.trim(), name: fromName },
    subject: message.subject,
    html: message.html,
    text: message.text,
  });

  return { messageId: response.messageId };
}

export function createCloudflareEmailDriver(env: Env): EmailDriver {
  return {
    async send(message: EmailMessage) {
      await sendEmail(env, {
        to: message.to,
        subject: message.subject,
        html: message.html ?? message.text ?? "",
        text: message.text ?? message.html ?? "",
      });
    },
  };
}
