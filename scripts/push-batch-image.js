const { execSync } = require('child_process');
const path = require('path');

// Configuration
const REGION = process.env.AWS_REGION || 'ap-south-1';
const PROJECT = 'krishi-net';
const REPO_NAME = `${PROJECT}-satellite-processor`;

function run(cmd, options = {}) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', ...options });
}

try {
  console.log('Preparing to push Batch Docker image...');

  // 1. Get Account ID
  const accountId = execSync('aws sts get-caller-identity --query Account --output text').toString().trim();
  const ecrUri = `${accountId}.dkr.ecr.${REGION}.amazonaws.com`;
  const imageUri = `${ecrUri}/${REPO_NAME}:latest`;

  console.log(`Target Image URI: ${imageUri}`);

  // 2. Login to ECR
  console.log('Logging in to ECR...');
  run(`aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ecrUri}`);

  // 3. Build Docker Image
  // Context is frontend/src where the Dockerfile and python script reside
  const dockerContext = path.join(__dirname, '..', 'frontend', 'src');
  console.log(`Building image from ${dockerContext}...`);
  run(`docker build -t ${REPO_NAME} .`, { cwd: dockerContext });

  // 4. Tag Image
  console.log('Tagging image...');
  run(`docker tag ${REPO_NAME}:latest ${imageUri}`);

  // 5. Push Image
  console.log('Pushing to ECR...');
  run(`docker push ${imageUri}`);

  console.log('✅ Successfully pushed image to ECR.');
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}