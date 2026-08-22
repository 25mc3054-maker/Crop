# Deployment checklist

Use this checklist before deploying to production.

- [ ] Verify AWS credentials and target account
- [ ] Confirm `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION`
- [ ] Review IAM roles for least privilege (Lambda, Step Functions, CloudFront)
- [ ] Ensure `S3_TTS_BUCKET` exists and is private with correct CORS
- [ ] Generate prebuilt audio (optional): `node infra/generate_audio.js --out ../frontend/public/audio`
- [ ] Build frontend: `cd frontend && npm run build`
- [ ] Deploy frontend via CDK BucketDeployment (CDK will pick up `frontend/dist`) or run `node infra/deploy_frontend.js`
- [ ] `cdk deploy` the stack; review outputs for `FrontendUrl` and API Gateway URL
- [ ] Configure DNS / ACM for CloudFront if using custom domain
- [ ] Populate secrets in CI (AWS creds, BEDROCK keys, META_VERIFY_TOKEN, TWILIO creds)
- [ ] Smoke test: health endpoint, LLM/tts flow, upload/soil, Twilio webhook
- [ ] Monitor CloudWatch logs for errors and increase Lambda timeouts if needed

Rollback notes:
- Use `cdk destroy` for test stacks. For production, prefer CloudFront invalidation + rollback to previous S3 content.
