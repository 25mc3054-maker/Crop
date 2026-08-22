// whatsapp_connector.js
// Example helpers for connecting WhatsApp Cloud API (Meta) or Twilio to your webhook.
// This file exports helper functions and configuration notes; adapt to your provider.

/**
 * Meta (WhatsApp Cloud API) example: verify webhook
 *
 * GET handler should reply with `hub.challenge` when verifying app subscription.
 * POST handler receives messages and forwards to `/webhook/whatsapp` above.
 */

function verifyMetaWebhook(query) {
  // query: req.query
  const mode = query['hub.mode']
  const token = query['hub.verify_token']
  const challenge = query['hub.challenge']
  if (mode && token && token === process.env.META_VERIFY_TOKEN) {
    return { ok: true, challenge }
  }
  return { ok: false }
}

// Twilio example: messages are posted to your webhook with form fields 'From' and 'Body'
function parseTwilioMessage(body) {
  return { from: body.From, message: body.Body }
}

module.exports = { verifyMetaWebhook, parseTwilioMessage }
