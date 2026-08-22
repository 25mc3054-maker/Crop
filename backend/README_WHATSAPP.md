# WhatsApp & SMS Integration

This document explains how to connect Meta WhatsApp Cloud API or Twilio to the backend webhooks in this repo.

Meta (WhatsApp Cloud API)
- Set `META_VERIFY_TOKEN` in your backend environment.
- Expose `https://yourhost/webhook/meta` as the webhook URL in the Meta App dashboard.
- On `GET /webhook/meta` the server will verify `hub.verify_token` and respond with `hub.challenge`.
- On `POST /webhook/meta` incoming messages are parsed and forwarded to the Bedrock `/llm` flow in `server.js`.

Twilio
- Configure your Twilio SMS/WhatsApp webhook to point to `/webhook/twilio`.
- The server parses Twilio form-encoded fields and returns a JSON reply for demo; replace with TwiML or Twilio REST API calls to send outbound messages.

Testing locally
- Use `ngrok http 4000` (or `localtunnel`) to expose your local server for webhook testing.
- Example ngrok command:

```powershell
ngrok http 4000
```

Security
- Do not embed long-lived provider tokens in client-side code. Store tokens in environment variables or AWS Secrets Manager.
