# Infra

This folder contains sample infrastructure artifacts and guidance for deploying the Krishi-Agent flows on AWS.

Included:
- `step_function_agent.json` – Step Functions state machine (ASL) sample that chains three Lambda tasks: check mandi price, analyze soil image, and generate contract.
- `terraform/` – (not included) Use Terraform or CDK to create IAM roles, Lambda functions, Step Functions, and Bedrock/Batch integrations.

Notes:
- This repo includes placeholders only. Use Amazon Q (or your preferred IaC tooling) to generate account-specific Terraform/CDK stacks.
- Ensure IAM roles grant Step Functions permission to invoke Lambdas and Lambdas permission to call Bedrock/Polly/Rekognition.
