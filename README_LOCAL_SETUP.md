# Local development setup (no Docker required)

Follow these steps to run the frontend and backend locally on Windows/PowerShell.

## Frontend

Install deps and build:

```powershell
cd frontend
npm install
npm run build
```

Serve the built site locally (one option):

```powershell
npx http-server ./dist -p 5000
# or: npx serve -s dist -l 5000
```

Open `http://localhost:5000` in your browser.

## Backend

Install deps and start in dev mode:

```powershell
cd backend
npm install
npm run dev
```

Health check:

```powershell
Invoke-RestMethod -Uri http://localhost:4000/health
```

## Optional helpers

Run lightweight smoke tests (from repo root):

```powershell
node scripts/smoke-test.js
```

Generate prebuilt audio prompts (requires AWS credentials with Polly access):

```powershell
node infra/generate_audio.js --out frontend/public/audio
```

## Bedrock (LLM) integration

This project uses a Bedrock placeholder by default. To enable real Bedrock calls:

 - Install the Bedrock client in the backend: `cd backend && npm install @aws-sdk/client-bedrock` (if available in your npm registry)
 - Set `USE_BEDROCK=true` and `BEDROCK_MODEL_ID=your-model-id` in `.env`

If Bedrock access is not available, the placeholder returns mocked responses for development.

## CDK synth

If you have the AWS CDK installed, you can synth the infra in `infra/cdk`:

```powershell
cd infra/cdk
npm install
npx cdk synth
```

## Notes

For production deployments, use the `infra/cdk` stack, populate secrets in CI, and run `cdk deploy` with an account that has least-privilege IAM roles configured.
