"""Email service for sending transactional emails via Resend."""

import html
import resend
from ..core.config import get_settings


def send_team_invite(
    to_email: str,
    inviter_name: str,
    org_name: str,
    invite_link: str,
    message: str | None = None,
) -> bool:
    """Send a team invitation email via Resend.

    Args:
        to_email: Recipient email address
        inviter_name: Name of the person sending the invite
        org_name: Name of the organization
        invite_link: URL for accepting the invitation
        message: Optional personal message from the inviter

    Returns:
        True if sent successfully, False otherwise
    """
    settings = get_settings()

    if not settings.resend_api_key:
        return False

    resend.api_key = settings.resend_api_key

    # Escape user-provided values to prevent HTML injection
    safe_org = html.escape(org_name)
    safe_message = html.escape(message) if message else None

    # Build a clean HTML email
    email_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="480" cellpadding="0" cellspacing="0" style="border:1px solid #1a1a1a;border-radius:0;background:#111;">
          <!-- Header -->
          <tr>
            <td style="padding:24px 28px 0;text-align:center;">
              <span style="font-size:11px;font-weight:700;color:#e0e0e0;letter-spacing:2px;text-transform:uppercase;">
                ⚡ SECURITHM
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#e0e0e0;letter-spacing:0.5px;">
                You've been invited to <span style="color:#fff;">{org_name}</span>
              </h1>
              <p style="margin:0 0 16px;font-size:13px;color:#888;line-height:1.6;font-family:monospace;">
                {inviter_name} has invited you to collaborate on Securithm — the AI-powered 
                smart contract security analysis platform.
              </p>
"""

    if safe_message:
        email_html += f"""          <!-- Personal Message -->
          <div style="margin:0 0 20px;padding:16px;border-left:2px solid #e0e0e0;background:#0d0d0d;">
            <p style="margin:0 0 4px;font-size:10px;color:#666;font-family:monospace;text-transform:uppercase;">
              Personal note:
            </p>
            <p style="margin:0;font-size:12px;color:#bbb;line-height:1.5;font-style:italic;">
              &ldquo;{safe_message}&rdquo;
            </p>
          </div>
"""

    email_html += f"""          <!-- Invite Button -->
          <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr>
              <td style="border:1px solid #e0e0e0;padding:0;">
                <a href="{invite_link}" 
                   style="display:inline-block;padding:10px 28px;font-size:11px;font-weight:600;
                          color:#0a0a0a;background:#e0e0e0;text-decoration:none;
                          letter-spacing:1px;text-transform:uppercase;font-family:monospace;">
                  Accept Invitation
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:0 0 4px;font-size:11px;color:#666;line-height:1.5;font-family:monospace;">
            This invitation expires in 7 days.
          </p>
          <p style="margin:0;font-size:11px;color:#555;line-height:1.5;font-family:monospace;">
            Or copy this link:<br>
            <span style="color:#888;word-break:break-all;">{invite_link}</span>
          </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 28px;border-top:1px solid #1a1a1a;">
              <p style="margin:0;font-size:9px;color:#444;text-align:center;font-family:monospace;">
                Securithm — Smart Contract Security Audits<br>
                If you weren't expecting this invitation, you can ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    text_content = (
        f"You've been invited to {org_name}\n\n"
        f"{inviter_name} has invited you to collaborate on Securithm.\n\n"
        f"Accept the invitation: {invite_link}\n\n"
        f"This invitation expires in 7 days."
    )

    from_email = settings.resend_from_email or "Securithm <onboarding@resend.dev>"

    try:
        response = resend.Emails.send(
            {
                "from": from_email,
                "to": [to_email],
                "subject": f"You've been invited to {safe_org} on Securithm",
                "html": email_html,
                "text": text_content,
            }
        )
        return bool(response and response.get("id"))
    except Exception:
        return False
