# Passwordless donor accounts

The donor login and account creation pages use email verification codes through the existing Supabase project. Google sign-in is optional. This change does not configure hosted providers or send test messages automatically.

## 1. Configure email authentication

In the Supabase dashboard, open Authentication and the Email provider settings:

- Enable email authentication and allow new users to sign up.
- Keep email confirmation enabled. An account must not become an authenticated session before verification.
- Prefer a six-digit email OTP. Supabase supports six through ten digits; the form accepts that supported range and Supabase validates the actual token.
- Set Email OTP expiration to **600 seconds** for a ten-minute validity window if suitable for your users. Supabase's documented default is **3,600 seconds**. The page and templates deliberately do not promise a fixed expiry, so changing the server setting does not leave inaccurate instructions.
- Keep the minimum resend interval at **60 seconds** or align any custom setting with the page's resend cooldown. The browser countdown is a convenience; Supabase must enforce the real limits.

The expiry setting is shared with other email authentication links, including password recovery. Consider existing administrator recovery flows before reducing it.

References: [Passwordless email authentication](https://supabase.com/docs/guides/auth/auth-email-passwordless), [OTP length configuration](https://supabase.com/docs/guides/local-development/cli/config#auth.email.otp_length).

## 2. Configure production email delivery

Connect a transactional email provider using Authentication > Emails > SMTP Settings. Use a verified sending domain and complete the provider's domain authentication steps. Store the SMTP credentials in Supabase, never in a `VITE_` variable or browser code.

Supabase's default email service is for development: it currently delivers only to project team addresses and permits two messages per hour. A working request from a team member does not prove public delivery works. Custom SMTP is required for real users. Its initial Supabase rate limit is currently 30 messages per hour; adjust that limit to your expected traffic and the provider's quota.

Reference: [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

### Resend settings for Kadesh

The existing contact-email functions use Resend and the sender `noreply@contact.kadeshhopemission.org`. This is a candidate for authentication email too; the repository does not prove that this domain is currently verified or that the deployed key is active. Confirm the sending domain in the intended Resend account first.

In Supabase, open **Authentication > Email > SMTP Settings**, enable custom SMTP, and enter:

| Setting | Value |
| --- | --- |
| Sender email | `noreply@contact.kadeshhopemission.org`, after verifying its domain |
| Sender name | `Kadesh Hope Mission` |
| Host | `smtp.resend.com` |
| Port | `465` (implicit TLS) |
| Username | `resend` |
| Password | A Resend API key with permission to send from the verified domain |

The password is the API key value, not the text `RESEND` or `RESEND_API_KEY`. Those are secret names used by the existing server functions; they are not automatically connected to Supabase Auth's SMTP settings. Prefer a separate sending-only Resend key restricted to the verified sending domain. Keep it in Supabase's SMTP password field, never browser code or a `VITE_` variable.

References: [Resend's Supabase SMTP instructions](https://resend.com/docs/send-with-supabase-smtp), [Resend API-key permissions](https://resend.com/docs/api-reference/api-keys/create-api-key).

After saving SMTP settings, install the **Magic Link / OTP** and **Confirm signup** templates from this repository so both messages display `{{ .Token }}`. Request a fresh code; an email that was already delivered will not change. Verify delivery to an address outside the Supabase project team before launch.

Supabase's default-sender template restriction applies to new Free projects created from 3 June 2026. Configuring custom SMTP restores template customization on Free; a Pro upgrade is not required for this route. A disabled SMTP or URL-setting control is a separate access/UI limitation to resolve with an account that can edit this project's Auth configuration. [Supabase's template-policy announcement](https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier).

As checked on 1 October 2026, Resend Free includes **3,000 emails per month, at most 100 per day**, and three sending domains. SMTP is supported. Pro starts at **$20/month for 50,000 emails**. Authentication requests, resends, and existing contact emails consume the same transactional quota if they use the same Resend account. [Resend pricing](https://resend.com/pricing).

## 3. Install both code email templates

Under Authentication > Emails > Templates, paste the checked-in HTML into the corresponding message body:

| Supabase template | File | Suggested subject |
| --- | --- | --- |
| Magic Link / OTP | `supabase/templates/magic-link.html` | Your Kadesh sign-in code |
| Confirm signup | `supabase/templates/confirm-signup.html` | Verify your Kadesh email |

Preserve the exact `{{ .Token }}` variable. It supplies the verification code generated by Supabase. Using only `{{ .ConfirmationURL }}` would send a link even though the page asks for a code. Configure both templates so first-time and returning users receive the expected message. The application verifies the email and code using `type: "email"`.

These templates do not contain sign-in links, tracking pixels, user-supplied HTML, or a hardcoded validity period. If the provider enables email tracking, turn it off for authentication messages.

References: [Email template variables](https://supabase.com/docs/guides/auth/auth-email-templates), [Requesting an OTP](https://supabase.com/docs/reference/javascript/auth-signinwithotp).

## 4. Configure site and callback URLs

Set the Supabase Site URL to the deployed HTTPS origin. Add the application's permitted authentication return URLs to the redirect allow list. The page returns through:

```text
https://YOUR_DOMAIN/donor-auth?mode=login&redirect=ENCODED_LOCAL_DESTINATION
```

For example, if the intended destination is `/account`, the exact callback is:

```text
https://YOUR_DOMAIN/donor-auth?mode=login&redirect=%2Faccount
```

Replace the example domain and destination with the values used by the deployed application. Add exact entries for supported destinations and local development as needed. Prefer explicit production URLs, including their query strings; avoid broad production host or path wildcards. URL-encode the local destination once. The `redirect` value must remain a permitted local route, never an arbitrary external URL.

Configure the web host to serve the application for `/donor-auth` when that path is opened directly. A development server working locally does not prove the deployed callback route works.

Reference: [Redirect URL configuration](https://supabase.com/docs/guides/auth/redirect-urls).

## 5. Optional Google sign-in

1. Create or use a Google Cloud project and configure its OAuth audience, app branding, and consent screen.
2. Create an OAuth client for a web application. Add the site's origins and the **Supabase callback URL displayed in its Google provider settings** as an authorized redirect URI in Google. This provider callback is different from the application return URL above.
3. Enable Google in Supabase and save its client ID and secret there. Do not put the secret in the frontend.
4. Complete the app redirect allow list and test the full round trip, including canceling the Google prompt.
5. Set `VITE_GOOGLE_AUTH_ENABLED=true` in the frontend's build environment and rebuild when the provider is ready. Leave it disabled until then.

Check the Google app's publishing/audience status: a testing-only client may restrict access to configured test users.

Reference: [Google sign-in setup](https://supabase.com/docs/guides/auth/social-login/auth-google).

## 6. Abuse controls and access rules

Set server-side authentication request and verification limits in Supabase and monitor email usage. Add CAPTCHA protection together with a matching frontend challenge that passes the provider token; enabling server CAPTCHA without that client integration will reject requests. Configure provider spending alerts where available.

Keep row-level security on donor data. A verified session proves the user's identity; policies must still restrict records to their owner. Never expose a service-role key or trust editable user metadata as an administrator role.

References: [Production checklist](https://supabase.com/docs/guides/deployment/going-into-prod), [Row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Release verification

Use accounts and email addresses you control to confirm:

- A new signup receives a code and cannot access protected data before verification.
- Correct, incorrect, expired, and already-used codes have the expected outcomes.
- Resending respects limits, and the newest message can be used successfully.
- An existing password account can log in through email without creating a second account.
- Refreshing an authenticated page preserves the session; signing out clears access.
- The intended destination is restored after sign-in, while external redirect values are rejected.
- Google sign-in and cancellation behave correctly if enabled.
- Emails reach a recipient outside the Supabase project team.

These hosted delivery and provider checks require a configured project and controlled test accounts. A successful frontend build alone does not verify them.

## Charges

Checked against official pages on 30 September 2026; plans and rates can change.

| Service | Published allowance or example cost |
| --- | --- |
| Supabase Auth | Free includes 50,000 monthly active users and social OAuth providers. |
| Email delivery example: Resend | Free includes 3,000 emails/month, capped at 100/day. Pro starts at $20/month for 50,000 emails. Resends also consume email quota. |
| SMS example: Twilio Verify | $0.05 per successful verification plus channel charges; its US SMS example adds $0.0083 per message. Country and carrier costs vary. |

Email OTP can start within free quotas but is not unconditionally free. SMS login is not enabled by this implementation and would need an SMS provider. Google through Supabase uses its social auth allowance without an OTP delivery message.

References: [Supabase pricing](https://supabase.com/pricing), [Resend pricing](https://resend.com/pricing?volume=50000), [Twilio Verify pricing](https://www.twilio.com/en-us/verify/pricing).

