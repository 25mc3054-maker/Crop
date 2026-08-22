# Krishi-Net Agentic Marketplace


This repository is a scaffold for the "Krishi-Net Agentic Marketplace" — an agent-driven voice-first platform that enables rural Indian farmers to interact via local-language voice/WhatsApp, check mandi prices, analyze soil photos, and generate buyer contracts.

What's included:

- `backend/` – Node.js Express server with webhook endpoints and AWS placeholder clients.
- `frontend/` – React voice-first UI optimized for low-literacy users.
- `infra/` – Example Terraform + CDK notes and a Step Functions sample.

This scaffold includes placeholders and SAMPLE code to integrate with AWS services: Bedrock, Polly, Translate, Rekognition, and Step Functions. You will need to supply AWS credentials and real service ARNs.

Quick start (local dev):

1. Backend:

```powershell
cd backend
npm install
npm run dev
```

2. Frontend:

```powershell
cd frontend
npm install
npm start
```

 Deployment: see [infra/README.md](infra/README.md) for Terraform/CDK guidance. The IaC in this repo is illustrative and needs your AWS account specifics.

 - CloudFront deployment script: use `infra/deploy_frontend.js` to upload `frontend/dist` into the `FrontendBucket` and invalidate CloudFront. Requires `aws-sdk` and `minimist` in `infra/` (run `npm install` there). Example:

 ```powershell
 cd infra
 npm ci
 node deploy_frontend.js --bucket <FRONTEND_BUCKET> --dist ../frontend/dist --distribution-id <CLOUDFRONT_ID>
 ```

Audio generation:

- To generate short prebuilt audio prompts for all supported languages using Amazon Polly, run:

```powershell
cd infra
npm ci
node generate_audio.js --out ../frontend/public/audio
```

This requires AWS credentials with `polly:SynthesizeSpeech` permission. The script writes files like `hi.mp3`, `en.mp3` into `frontend/public/audio` which are cached by the service worker and used as fallbacks.

Notes: This project mentions using Amazon Q to assist with IaC (Terraform/CDK) generation, and shows Step Functions ASL to model the agentic workflow. Replace placeholder keys and test endpoints before contacting real users.

**Enabling real AWS services**

- Bedrock: set `USE_BEDROCK=true`, install `@aws-sdk/client-bedrock`, and set `BEDROCK_MODEL_ID` (for example `anthropic.claude-3.5-sonnet`). Ensure your AWS principal has Bedrock permissions.
- Polly: no extra config beyond AWS credentials; ensure the Lambda/EC2 role has `polly:SynthesizeSpeech` permission.
- Rekognition: requires `rekognition:DetectLabels` permissions for the bucket or Lambda role.

**WhatsApp / SMS**

- For Meta WhatsApp Cloud: set `META_VERIFY_TOKEN` and configure your webhook to `https://<host>/webhook/meta`. Use `ngrok` to test locally.
- For Twilio: set webhook to `https://<host>/webhook/twilio` and use TwiML or REST API to send replies.

For Twilio: set webhook to `https://<host>/webhook/twilio` and use TwiML or REST API to send replies.

IVR / USSD / Voice

- Twilio Voice can be used to implement an IVR so farmers can call a number and use DTMF or speech to interact with the agent. See `backend/twilio_ivr.js` for a simple menu example.
- For USSD you will need a telecom aggregator or provider integration; as an accessible alternative, offer SMS menus and IVR (phone call) flows.


