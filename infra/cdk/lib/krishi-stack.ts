import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as path from 'path';

export class KrishiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 for uploads and TTS artifacts
    const bucket = new s3.Bucket(this, 'KrishiBucket', { removalPolicy: cdk.RemovalPolicy.DESTROY, autoDeleteObjects: true });

    // Frontend hosting bucket (for production build artifacts)
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', { websiteIndexDocument: 'index.html', publicReadAccess: false, removalPolicy: cdk.RemovalPolicy.DESTROY, autoDeleteObjects: true });

    // CloudFront distribution for frontend
    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: { origin: new origins.S3Origin(frontendBucket) },
      defaultRootObject: 'index.html'
    })

    new cdk.CfnOutput(this, 'FrontendUrl', { value: distribution.domainName })

    // Deploy local frontend build into the bucket and invalidate CloudFront
    const sourcePath = path.join(__dirname, '..', '..', '..', 'frontend', 'dist')
    new s3deploy.BucketDeployment(this, 'DeployFrontend', {
      sources: [s3deploy.Source.asset(sourcePath)],
      destinationBucket: frontendBucket,
      distribution,
      distributionPaths: ['/*']
    })

    // Lambda for agent tasks (calls Rekognition + Bedrock + writes results)
    const analyzeFn = new lambda.Function(this, 'AnalyzeFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'agent.handler',
      code: lambda.Code.fromAsset('infra/cdk/lambda'),
      environment: { BUCKET: bucket.bucketName }
    });

    // Grant S3 permissions
    bucket.grantReadWrite(analyzeFn);

    // Add IAM permissions to the Lambda role for Rekognition, Polly, Bedrock (when available), and Step Functions
    analyzeFn.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'rekognition:DetectLabels',
        's3:PutObject', 's3:GetObject', 's3:ListBucket',
        'polly:SynthesizeSpeech',
        'states:StartExecution'
      ],
      resources: ['*']
    }))

    // Bedrock permission (region/account dependent). Include if Bedrock is used.
    analyzeFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel', 'bedrock:GenerateEmbeddings'],
      resources: ['*']
    }))

    // Step Function tasks invoking the Lambda
    const analyzeTask = new tasks.LambdaInvoke(this, 'AnalyzeSoil', { lambdaFunction: analyzeFn, payloadResponseOnly: true });

    // Simple state machine that just runs analysis for demo
    const sm = new stepfunctions.StateMachine(this, 'KrishiAgentSM', {
      definition: analyzeTask,
      timeout: cdk.Duration.minutes(5)
    });

    // Create a role for Step Functions to invoke Lambdas (least privilege for demo)
    const sfnRole = new iam.Role(this, 'StepFunctionsInvokeRole', {
      assumedBy: new iam.ServicePrincipal('states.amazonaws.com')
    })
    sfnRole.addToPolicy(new iam.PolicyStatement({ actions: ['lambda:InvokeFunction'], resources: [analyzeFn.functionArn] }))

    // Grant Step Functions ability to start executions if needed
    sfnRole.addToPolicy(new iam.PolicyStatement({ actions: ['states:StartExecution'], resources: ['*'] }))

    // API Gateway to expose agent endpoints
    const api = new apigw.LambdaRestApi(this, 'KrishiApi', { handler: analyzeFn, proxy: false });
    const items = api.root.addResource('agent');
    items.addMethod('POST');

    // IAM: example role for Step Functions to invoke Lambdas (created automatically by tasks)

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url })
    new cdk.CfnOutput(this, 'StateMachineArn', { value: sm.stateMachineArn })
    new cdk.CfnOutput(this, 'Bucket', { value: bucket.bucketName })
    new cdk.CfnOutput(this, 'FrontendBucket', { value: frontendBucket.bucketName })
  }
}
