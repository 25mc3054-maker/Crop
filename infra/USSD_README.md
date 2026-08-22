# USSD Integration Guide

USSD requires a telco aggregator or direct operator integration. For Bharat/regional rollouts consider partners such as:

- Karix.io (now routee), Gupshup, Infobip, Twilio (select markets), or local aggregators.
- Use an aggregator that supports short codes and USSD sessions for the target telecom operators.

Quick design for USSD flow (example):

1. User dials the USSD code (e.g., *123*45#).
2. Aggregator POSTs session requests to your webhook with `sessionId`, `msisdn`, `text`.
3. Your server responds with next menu text and a flag to continue or end session.

Example JSON flow:

Request (POST) to your webhook:

```json
{ "sessionId": "abc", "msisdn": "+919876543210", "text": "" }
```

Response (200):

```json
{ "message": "Welcome. For mandi prices press 1. For soil help press 2.", "continue": true }
```

Considerations:

- USSD session timeouts are short (seconds) — keep flows minimal.

- For image uploads or richer flows, use USSD to instruct the user to switch to WhatsApp or IVR.

- Local language support: present menu text in the user's language when possible (aggregators sometimes detect operator locale).

Security & scaling:
- Verify incoming requests using aggregator-provided signatures.

- Store `msisdn` consent and rate-limit per number to avoid abuse.

Recommendation:

- Start with Twilio or Gupshup trial to prototype USSD flows; then port to a production aggregator that offers the regional operator connectivity you need.

- Verify incoming requests using aggregator-provided signatures.

