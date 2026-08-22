# Backend

This folder contains the Node.js Express backend used for local testing and as the basis for AWS deployment.

Quick start:

```powershell
cd backend
npm install
npm run dev
```


Environment variables: create a `.env` file with values:

- `AWS_REGION` (e.g., ap-south-1)
- `STEP_FN_ARN` (your Step Functions state machine ARN)
- `MANDI_API_URL` (optional) — set if you have a real mandi/pricing API to forward to
- `ORDERS_TABLE` (optional) — DynamoDB table for storing orders
- `ORDERS_PHONE_INDEX` (optional) — GSI name (Partition Key: `phone`, Sort Key: `timestamp`)
- `USERS_TABLE` (optional) — DynamoDB table for storing user profiles
 - `APPLICATIONS_TABLE` (optional) — DynamoDB table name where scheme applications will be stored (e.g. `KrishiApplications`). If `DYNAMODB_ENDPOINT` is set and `create_tables.js` runs, a local `Applications` table will be created.
- `S3_UPLOADS_BUCKET` (optional) — S3 bucket for soil image uploads (required for Step Functions flow)
- `COGNITO_USER_POOL_ID` (optional) — ID of the Cognito User Pool
- `COGNITO_CLIENT_ID` (optional) — ID of the Cognito App Client
- `WEBSOCKET_CALLBACK_URL` (optional) — URL of the WebSocket API Stage (e.g., https://xyz.execute-api.region.amazonaws.com/prod)
- `BATCH_JOB_QUEUE` (optional) — Name or ARN of the AWS Batch Job Queue
- `BATCH_JOB_DEFINITION` (optional) — Name or ARN of the AWS Batch Job Definition
- `BATCH_NOTIFICATION_TOPIC_ARN` (optional) — ARN of the SNS topic for Batch notifications (created by Terraform)
- `DB_SECRET_ARN` (optional) — ARN of the Secrets Manager secret containing DB credentials

Schemes feed & live updates:
- `SCHEMES_FEED_URL` (optional) — public JSON URL returning an array of schemes (or { schemes: [...] }). When set, the backend fetches it every 60s and uses it to populate `/schemes`.
- AWS credentials via standard `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` or IAM role when deployed

Bedrock / LLM notes:
- This scaffold includes a `/llm` placeholder endpoint that should be replaced with a real Bedrock call. Use the AWS SDK v3 `@aws-sdk/client-bedrock-runtime` or Bedrock HTTP API and your chosen Bedrock model (e.g., `anthropic.claude-3.5-sonnet` or `meta-llama/Llama-3`).

Polly / TTS:
- The `/tts` endpoint uses Amazon Polly to synthesize short replies and returns base64-encoded MP3 audio for playback in the browser. When deployed, you may want to store the audio in S3 and return a pre-signed URL instead of embedding base64 payloads.

Mandi Prices:
- The `/prices` endpoint returns mock prices for demo. To use live data, set `MANDI_API_URL` and implement forwarding in `server.js`.

SMS / Keypad phone support:
- The `/webhook/twilio` endpoint supports Twilio SMS/WhatsApp and replies using TwiML XML. This enables replies to feature phones via SMS. For keypad-style usage, instruct users to send simple commands such as:
SMS / Keypad phone support:

- The `/webhook/twilio` endpoint supports Twilio SMS/WhatsApp and replies using TwiML XML. This enables replies to feature phones via SMS. For keypad-style usage, instruct users to send simple commands such as:

	- `PRICE <crop>` — get mandi price for `<crop>`
	- `SOILPHOTO` — reply with an instruction to upload a photo (for smartphones) or visit a local extension point

USSD / IVR:
- USSD requires integration with telecom providers or aggregators. As an alternative, use SMS menus or Twilio Programmable Voice for IVR flows where users can call and use DTMF keypad inputs. Expand the Twilio integration for voice if desired.

TTS presigned URLs:

- The `/tts` endpoint will upload synthesized audio to S3 and return a presigned URL when environment variable `S3_TTS_BUCKET` is set. This is the recommended production mode to avoid sending large base64 payloads over the wire.

Testing the agent Lambda locally:

- A small test runner for the packaged agent Lambda is available at `infra/cdk/lambda/test_agent_handler.js`. Run it with Node.js:

```powershell
node infra/cdk/lambda/test_agent_handler.js
```

**Satellite Imagery Batch Processing**

To deploy the Docker image for AWS Batch processing:
1. Ensure Terraform has been applied (creating the ECR repo).
2. Run the push script:
```powershell
node scripts/push-batch-image.js
```

This test uses the mocked Bedrock mode (`USE_BEDROCK=false`) by default and verifies a simple intent path. For tests that call Rekognition or real Bedrock, ensure AWS credentials and permissions are configured.

Docker (backend):

Build the backend Docker image:

```powershell
cd backend
docker build -t krishi-net-backend:local .
```

Run the container (exposes port 4000):

```powershell
docker run -p 4000:4000 --env-file .env -e S3_TTS_BUCKET=your-tts-bucket krishi-net-backend:local
```

Notes:
- Use `--env-file .env` to provide AWS credentials and other env vars in development (avoid committing `.env`).

- In production, run the service on ECS/EKS or as a Lambda behind API Gateway with proper IAM roles.

Running in Docker

- Build the backend image:

```powershell
cd backend
docker build -t krishi-backend .
```

- Run container:

```powershell
docker run -p 4000:4000 --env-file .env krishi-backend
```

This runs the backend on port `4000` inside a container. Use `ngrok http 4000` to expose it for webhook testing.

Endpoints:
- `GET /health` - health check
- `POST /webhook/whatsapp` - placeholder webhook for WhatsApp/voice
- `POST /upload/soil` - multipart/form-data upload with field `photo`
- `POST /agent/start` - start a Step Functions execution (requires `STEP_FN_ARN`)

Service worker and offline:

- The frontend registers a service worker (`frontend/src/service-worker.js`) to cache critical assets and TTS responses for offline playback. To test locally, run the frontend build and serve it (or use the `frontend` Docker build) over HTTP/HTTPS.

Replace placeholder AWS clients with the v3 SDK or Bedrock/Boto calls as you wire real services.

Endpoints summary:

- `GET /health` - health check
- `POST /webhook/whatsapp` - placeholder webhook for WhatsApp/voice
- `POST /upload/soil` - multipart/form-data upload with field `photo`
- `POST /agent/start` - start a Step Functions execution (requires `STEP_FN_ARN`)
