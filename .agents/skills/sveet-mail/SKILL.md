---
name: sveet-mail
description: Adds or switches the transactional mail provider behind src/lib/server/mail.ts (Resend, Postmark, Mailgun, SES, an SMTP relay…), and adds new kinds of mail (welcome, notifications). Use when the user picks a mail provider other than Scaleway, wants to send a new email, or mail isn't arriving.
---

# Mail in sveet

`src/lib/server/mail.ts` is the only code that knows how mail leaves the app. Everything else calls `mailer.send(render…())`.

## Add a provider

1. Read the provider's HTTP API docs for sending a single message. Prefer HTTP over SMTP, because there's nothing to keep alive or pool. Use plain `fetch` rather than an SDK unless the API is complex.
2. In `mail.ts`, add `create<Provider>Mailer(config): Mailer` next to `createScalewayMailer`, using the same pattern:
   - inject `fetch` through the config, for tests
   - `AbortSignal.timeout(10_000)`
   - throw `MailDeliveryError` when the network fails or a response isn't ok, with the provider's reason (never the body, which carries the link)
   - send `Reply-To` when `replyTo` is set
3. Add the transport to `mailerFromEnv` (e.g. `MAIL_TRANSPORT=resend`). Validate its required vars and throw a message naming the missing ones. If it should be the production default, change the fallback (`options.dev ? 'console' : '<provider>'`).
4. Declare the new vars in `src/env.ts` with descriptions, and add them to `.env.example` (commented out). Non-secret values (`MAIL_TRANSPORT`, `MAIL_FROM`) go in `fly.toml`; keys go in `fly secrets set`.
5. Test it in `mail.test.ts` with a fake `fetch`: the request it makes, and that it throws `MailDeliveryError` on a non-2xx response. Extend the `mailerFromEnv` tests.
6. Remove Scaleway (its mailer, vars and docs) only if the user asks.

## Add a mail

1. Write `render<Name>(input): Mail` next to `renderMagicLink`, returning `to`, `subject` and `text`. Plain text is the default. If the user wants HTML mail, add an `html` field to `Mail`, send it in each provider, and escape every interpolated value. Keep it table-based with inline styles, because mail clients ignore stylesheets.
2. Call `mailer.send(renderX(…))` from server code. Catch `MailDeliveryError` wherever a failure must not break the user's action.
3. Test the call site with `createFakeMailer()` when sending is part of a feature’s logic; a render with no branches needs no test.

## Mail isn't arriving

Check `fly logs` for `MailDeliveryError` or `[magic-link] delivery failed`. Check that the sending domain is verified (SPF, DKIM, DMARC), that `MAIL_FROM` is on that domain, and that the key has send permission. Locally, `MAIL_TRANSPORT=<provider>` in `.env` sends for real from `bun run dev`.
