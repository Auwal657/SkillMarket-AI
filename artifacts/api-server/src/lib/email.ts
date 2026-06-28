import { Resend } from "resend";
import { logger } from "./logger";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.FROM_EMAIL ?? "SkillMarket AI <noreply@skillmarketai.com>";

function getBaseUrl(req?: { protocol?: string; get?: (h: string) => string }): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (req?.get && req?.protocol) return `${req.protocol}://${req.get("host")}`;
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return "http://localhost:5000";
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string,
  req?: { protocol?: string; get?: (h: string) => string }
): Promise<void> {
  const baseUrl = getBaseUrl(req);
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

  if (!resend) {
    logger.info({ verifyUrl }, "Email provider not configured — verification URL logged for dev");
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:32px 40px;text-align:center">
            <div style="width:48px;height:48px;background:rgba(255,255,255,.2);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#fff;margin-bottom:12px">S</div>
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">SkillMarket AI</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px">
            <h2 style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700">Verify your email address</h2>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6">Hi ${name}, thanks for joining! Please verify your email to unlock all features including posting projects, applying for work, and sending messages.</p>
            <div style="text-align:center;margin:32px 0">
              <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:.01em">Verify my email</a>
            </div>
            <p style="margin:0 0 8px;color:#6b7280;font-size:13px">Or copy this link into your browser:</p>
            <p style="margin:0 0 24px;font-size:12px;color:#9ca3af;word-break:break-all;background:#f9fafb;padding:10px 14px;border-radius:8px">${verifyUrl}</p>
            <p style="margin:0;color:#9ca3af;font-size:12px;border-top:1px solid #f3f4f6;padding-top:20px">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Verify your SkillMarket AI email address",
      html,
    });
    logger.info({ to }, "Verification email sent");
  } catch (err) {
    logger.error({ err, to }, "Failed to send verification email");
  }
}
