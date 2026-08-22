terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

variable "region" {
  type    = string
  default = "ap-south-1"
}

variable "project" {
  type    = string
  default = "krishi-net"
}

variable "domain_name" {
  description = "Custom domain name (e.g., krishi-net.com)"
  type        = string
  default     = "krishi-net.com"
}

variable "hosted_zone_id" {
  description = "Route53 Hosted Zone ID for the domain"
  type        = string
  default     = ""
}

resource "aws_s3_bucket" "uploads" {
  bucket = "${var.project}-uploads-${random_id.bucket_id.hex}"
  force_destroy = true
}

resource "random_id" "bucket_id" {
  byte_length = 4
}

output "s3_bucket" {
  value = aws_s3_bucket.uploads.bucket
}

resource "aws_dynamodb_table" "orders" {
  name           = "KrishiOrders"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "orderId"

  attribute {
    name = "orderId"
    type = "S"
  }

  attribute {
    name = "phone"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  global_secondary_index {
    name               = "PhoneIndex"
    hash_key           = "phone"
    range_key          = "timestamp"
    projection_type    = "ALL"
  }
}

resource "aws_dynamodb_table" "rates" {
  name           = "KrishiAmazonRates"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "crop"

  attribute {
    name = "crop"
    type = "S"
  }
}

resource "aws_dynamodb_table" "users" {
  name           = "KrishiUsers"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "phone"

  attribute {
    name = "phone"
    type = "S"
  }
}

resource "aws_dynamodb_table" "connections" {
  name           = "KrishiConnections"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "connectionId"

  attribute {
    name = "connectionId"
    type = "S"
  }
}

resource "aws_cognito_user_pool" "pool" {
  name = "${var.project}-user-pool"
  
  # Allow login with phone number
  username_attributes = ["phone_number"]
  auto_verified_attributes = ["phone_number"]

  mfa_configuration = "OPTIONAL"

  sms_configuration {
    external_id    = "${var.project}-sms-external-id"
    sns_caller_arn = aws_iam_role.cognito_sms.arn
  }

  password_policy {
    minimum_length = 8
    require_numbers = true
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    sms_message          = "Your Krishi-Net verification code is {####}. Happy farming!"
  }

  lambda_config {
    pre_sign_up = aws_lambda_function.pre_signup.arn
    post_confirmation = aws_lambda_function.post_confirmation.arn
    custom_message    = aws_lambda_function.custom_message.arn
  }
}

resource "aws_cognito_user_pool_client" "client" {
  name = "${var.project}-client"
  user_pool_id = aws_cognito_user_pool.pool.id
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH", 
    "ALLOW_REFRESH_TOKEN_AUTH", 
    "ALLOW_USER_SRP_AUTH"
  ]
}

output "orders_table" {
  value = aws_dynamodb_table.orders.name
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.pool.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.client.id
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/pre_signup.js"
  output_path = "${path.module}/lambda/pre_signup.zip"
}

data "archive_file" "post_conf_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/post_confirmation.js"
  output_path = "${path.module}/lambda/post_confirmation.zip"
}

data "archive_file" "custom_msg_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/custom_message.js"
  output_path = "${path.module}/lambda/custom_message.zip"
}

data "archive_file" "soil_analysis_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/soil_analysis.js"
  output_path = "${path.module}/lambda/soil_analysis.zip"
}

data "archive_file" "ws_connect_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/websocket_connect.js"
  output_path = "${path.module}/lambda/websocket_connect.zip"
}

data "archive_file" "ws_disconnect_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/websocket_disconnect.js"
  output_path = "${path.module}/lambda/websocket_disconnect.zip"
}

data "archive_file" "ws_echo_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/websocket_echo.js"
  output_path = "${path.module}/lambda/websocket_echo.zip"
}

data "archive_file" "redrive_dlq_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/redrive_dlq.js"
  output_path = "${path.module}/lambda/redrive_dlq.zip"
}

resource "aws_iam_role" "lambda_exec" {
  name = "${var.project}-lambda-exec"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_dynamo" {
  name = "${var.project}-lambda-dynamo"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action   = ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:UpdateItem"]
      Effect   = "Allow"
      Resource = [aws_dynamodb_table.users.arn, aws_dynamodb_table.connections.arn]
    }]
  })
}

resource "aws_iam_role_policy" "lambda_apigw" {
  name = "${var.project}-lambda-apigw"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action   = ["execute-api:ManageConnections"]
      Effect   = "Allow"
      Resource = "arn:aws:execute-api:*:*:*/@connections/*"
    }]
  })
}

resource "aws_iam_role_policy" "lambda_rekognition" {
  name = "${var.project}-lambda-rekognition"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["rekognition:DetectLabels"]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action   = ["s3:GetObject"]
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.uploads.arn}/*"
      }
    ]
  })
}

resource "aws_lambda_function" "pre_signup" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.project}-pre-signup"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "pre_signup.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "nodejs18.x"
}

resource "aws_lambda_permission" "allow_cognito" {
  statement_id  = "AllowExecutionFromCognito"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.pre_signup.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.pool.arn
}

resource "aws_lambda_function" "post_confirmation" {
  filename         = data.archive_file.post_conf_zip.output_path
  function_name    = "${var.project}-post-confirmation"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "post_confirmation.handler"
  source_code_hash = data.archive_file.post_conf_zip.output_base64sha256
  runtime          = "nodejs18.x"

  environment {
    variables = {
      USERS_TABLE = aws_dynamodb_table.users.name
    }
  }
}

resource "aws_lambda_permission" "allow_cognito_post_conf" {
  statement_id  = "AllowExecutionFromCognitoPostConf"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.post_confirmation.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.pool.arn
}

resource "aws_lambda_function" "custom_message" {
  filename         = data.archive_file.custom_msg_zip.output_path
  function_name    = "${var.project}-custom-message"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "custom_message.handler"
  source_code_hash = data.archive_file.custom_msg_zip.output_base64sha256
  runtime          = "nodejs18.x"
}

resource "aws_lambda_permission" "allow_cognito_custom_msg" {
  statement_id  = "AllowExecutionFromCognitoCustomMsg"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.custom_message.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.pool.arn
}

resource "aws_iam_role" "cognito_sms" {
  name = "${var.project}-cognito-sms-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "cognito-idp.amazonaws.com"
      }
      Condition = {
        StringEquals = {
          "sts:ExternalId" = "${var.project}-sms-external-id"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "cognito_sms_policy" {
  name = "${var.project}-cognito-sms-policy"
  role = aws_iam_role.cognito_sms.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["sns:publish"]
      Resource = "*"
    }]
  })
}

resource "aws_lambda_function" "soil_analysis" {
  filename         = data.archive_file.soil_analysis_zip.output_path
  function_name    = "${var.project}-soil-analysis"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "soil_analysis.handler"
  source_code_hash = data.archive_file.soil_analysis_zip.output_base64sha256
  runtime          = "nodejs18.x"
}

resource "aws_iam_role" "step_functions_role" {
  name = "${var.project}-step-functions-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "states.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "step_functions_policy" {
  name = "${var.project}-step-functions-policy"
  role = aws_iam_role.step_functions_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action   = ["lambda:InvokeFunction"]
      Effect   = "Allow"
      Resource = aws_lambda_function.soil_analysis.arn
    }]
  })
}

resource "aws_sfn_state_machine" "soil_workflow" {
  name     = "${var.project}-soil-workflow"
  role_arn = aws_iam_role.step_functions_role.arn

  definition = jsonencode({
    Comment = "Soil Analysis Workflow"
    StartAt = "AnalyzeSoilImage"
    States = {
      AnalyzeSoilImage = {
        Type = "Task"
        Resource = aws_lambda_function.soil_analysis.arn
        End = true
      }
    }
  })
}

output "step_function_arn" {
  value = aws_sfn_state_machine.soil_workflow.arn
}

# --- WebSocket API ---

resource "aws_apigatewayv2_api" "websocket" {
  name                       = "${var.project}-websocket"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

resource "aws_lambda_function" "ws_connect" {
  filename         = data.archive_file.ws_connect_zip.output_path
  function_name    = "${var.project}-ws-connect"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "websocket_connect.handler"
  source_code_hash = data.archive_file.ws_connect_zip.output_base64sha256
  runtime          = "nodejs18.x"
  environment {
    variables = { CONNECTIONS_TABLE = aws_dynamodb_table.connections.name }
  }
}

resource "aws_lambda_function" "ws_disconnect" {
  filename         = data.archive_file.ws_disconnect_zip.output_path
  function_name    = "${var.project}-ws-disconnect"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "websocket_disconnect.handler"
  source_code_hash = data.archive_file.ws_disconnect_zip.output_base64sha256
  runtime          = "nodejs18.x"
  environment {
    variables = { CONNECTIONS_TABLE = aws_dynamodb_table.connections.name }
  }
}

resource "aws_lambda_function" "ws_echo" {
  filename         = data.archive_file.ws_echo_zip.output_path
  function_name    = "${var.project}-ws-echo"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "websocket_echo.handler"
  source_code_hash = data.archive_file.ws_echo_zip.output_base64sha256
  runtime          = "nodejs18.x"
}

resource "aws_apigatewayv2_integration" "ws_connect" {
  api_id           = aws_apigatewayv2_api.websocket.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.ws_connect.invoke_arn
}

resource "aws_apigatewayv2_integration" "ws_disconnect" {
  api_id           = aws_apigatewayv2_api.websocket.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.ws_disconnect.invoke_arn
}

resource "aws_apigatewayv2_integration" "ws_echo" {
  api_id           = aws_apigatewayv2_api.websocket.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.ws_echo.invoke_arn
}

resource "aws_apigatewayv2_route" "ws_connect" {
  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.ws_connect.id}"
}

resource "aws_apigatewayv2_route" "ws_disconnect" {
  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.ws_disconnect.id}"
}

resource "aws_apigatewayv2_route" "ws_echo" {
  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = "echo"
  target    = "integrations/${aws_apigatewayv2_integration.ws_echo.id}"
}

resource "aws_apigatewayv2_stage" "ws_stage" {
  api_id      = aws_apigatewayv2_api.websocket.id
  name        = "prod"
  auto_deploy = true
}

resource "aws_lambda_permission" "ws_connect_perm" {
  statement_id  = "AllowExecutionFromAPIGatewayConnect"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ws_connect.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.websocket.execution_arn}/*/$connect"
}

resource "aws_lambda_permission" "ws_disconnect_perm" {
  statement_id  = "AllowExecutionFromAPIGatewayDisconnect"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ws_disconnect.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.websocket.execution_arn}/*/$disconnect"
}

resource "aws_lambda_permission" "ws_echo_perm" {
  statement_id  = "AllowExecutionFromAPIGatewayEcho"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ws_echo.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.websocket.execution_arn}/*/echo"
}

output "websocket_url" {
  value = aws_apigatewayv2_stage.ws_stage.invoke_url
}

# --- AWS Batch for Satellite Imagery ---

# Use default VPC for simplicity in this scaffold
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

resource "aws_security_group" "batch_sg" {
  name   = "${var.project}-batch-sg"
  vpc_id = data.aws_vpc.default.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_iam_role" "batch_service_role" {
  name = "${var.project}-batch-service-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "batch.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "batch_service_role_policy" {
  role       = aws_iam_role.batch_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBatchServiceRole"
}

resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.project}-ecs-task-exec-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_batch_compute_environment" "fargate" {
  compute_environment_name = "${var.project}-fargate-env"
  type                     = "MANAGED"
  service_role             = aws_iam_role.batch_service_role.arn

  compute_resources {
    type               = "FARGATE"
    max_vcpus          = 16
    subnets            = data.aws_subnets.default.ids
    security_group_ids = [aws_security_group.batch_sg.id]
  }
}

resource "aws_batch_job_queue" "queue" {
  name                 = "${var.project}-queue"
  state                = "ENABLED"
  priority             = 1
  compute_environments = [aws_batch_compute_environment.fargate.arn]
}

resource "aws_ecr_repository" "repo" {
  name = "${var.project}-satellite-processor"
  force_delete = true
}

resource "aws_batch_job_definition" "satellite_job" {
  name = "${var.project}-satellite-job"
  type = "container"
  platform_capabilities = ["FARGATE"]

  container_properties = jsonencode({
    image = aws_ecr_repository.repo.repository_url
    resourceRequirements = [
      { type = "VCPU", value = "1.0" },
      { type = "MEMORY", value = "2048" }
    ]
    jobRoleArn = aws_iam_role.ecs_task_execution_role.arn
    executionRoleArn = aws_iam_role.ecs_task_execution_role.arn
    environment = [
      { name = "S3_BUCKET", value = "Ref::S3_BUCKET" },
      { name = "S3_KEY", value = "Ref::S3_KEY" }
    ]
  })
}

output "batch_job_queue" {
  value = aws_batch_job_queue.queue.name
}

output "batch_job_definition" {
  value = aws_batch_job_definition.satellite_job.name
}

output "ecr_repository_url" {
  value = aws_ecr_repository.repo.repository_url
}

# --- EventBridge Notification for Batch ---

resource "aws_sns_topic" "batch_notifications" {
  name = "${var.project}-batch-notifications"
}

resource "aws_cloudwatch_event_rule" "batch_job_status" {
  name        = "${var.project}-batch-job-status"
  description = "Capture Batch Job Status Changes"

  event_pattern = jsonencode({
    source      = ["aws.batch"]
    detail-type = ["Batch Job State Change"]
    detail = {
      status   = ["SUCCEEDED", "FAILED"]
      jobQueue = [aws_batch_job_queue.queue.arn]
    }
  })
}

resource "aws_cloudwatch_event_target" "sns_target" {
  rule      = aws_cloudwatch_event_rule.batch_job_status.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.batch_notifications.arn
}

resource "aws_sns_topic_policy" "default" {
  arn = aws_sns_topic.batch_notifications.arn
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "Allow_Events_to_Publish_to_SNS"
        Effect    = "Allow"
        Principal = { Service = "events.amazonaws.com" }
        Action    = "sns:Publish"
        Resource  = aws_sns_topic.batch_notifications.arn
      },
      {
        Sid       = "Allow_CloudWatch_to_Publish_to_SNS"
        Effect    = "Allow"
        Principal = { Service = "cloudwatch.amazonaws.com" }
        Action    = "sns:Publish"
        Resource  = aws_sns_topic.batch_notifications.arn
      }
    ]
  })
}

output "batch_notification_topic_arn" {
  value = aws_sns_topic.batch_notifications.arn
}

variable "alert_email" {
  description = "Email address for Batch notifications"
  type        = string
  default     = "admin@example.com"
}

resource "aws_sqs_queue" "batch_dlq" {
  name = "${var.project}-batch-dlq"
}

resource "aws_sqs_queue_policy" "batch_dlq_policy" {
  queue_url = aws_sqs_queue.batch_dlq.id
  policy    = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "sns.amazonaws.com" }
      Action    = "sqs:SendMessage"
      Resource  = aws_sqs_queue.batch_dlq.arn
      Condition = {
        ArnEquals = {
          "aws:SourceArn" = aws_sns_topic.batch_notifications.arn
        }
      }
    }]
  })
}

resource "aws_sns_topic_subscription" "batch_email_sub" {
  topic_arn = aws_sns_topic.batch_notifications.arn
  protocol  = "email"
  endpoint  = var.alert_email
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.batch_dlq.arn
  })
}

resource "aws_cloudwatch_metric_alarm" "dlq_alarm" {
  alarm_name          = "${var.project}-batch-dlq-alarm"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Maximum"
  threshold           = "1"
  alarm_description   = "Alarm when messages land in Batch DLQ"
  alarm_actions       = [aws_sns_topic.batch_notifications.arn]

  dimensions = {
    QueueName = aws_sqs_queue.batch_dlq.name
  }
}

resource "aws_lambda_function" "redrive_dlq" {
  filename         = data.archive_file.redrive_dlq_zip.output_path
  function_name    = "${var.project}-redrive-dlq"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "redrive_dlq.handler"
  source_code_hash = data.archive_file.redrive_dlq_zip.output_base64sha256
  runtime          = "nodejs18.x"

  environment {
    variables = {
      DLQ_URL   = aws_sqs_queue.batch_dlq.id
      TOPIC_ARN = aws_sns_topic.batch_notifications.arn
    }
  }
}

resource "aws_iam_role_policy" "lambda_redrive_policy" {
  name = "${var.project}-lambda-redrive-policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
        Effect   = "Allow"
        Resource = aws_sqs_queue.batch_dlq.arn
      },
      {
        Action   = ["sns:Publish"]
        Effect   = "Allow"
        Resource = aws_sns_topic.batch_notifications.arn
      }
    ]
  })
}

# --- CloudFront Static Website Hosting ---

resource "aws_s3_bucket" "frontend" {
  bucket        = "${var.project}-frontend-${random_id.bucket_id.hex}"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "frontend_block" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_control" "default" {
  name                              = "${var.project}-oac"
  description                       = "OAC for frontend bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_wafv2_web_acl" "cloudfront_waf" {
  provider    = aws.us_east_1
  name        = "${var.project}-cloudfront-waf"
  description = "WAF for CloudFront distribution"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project}-cloudfront-waf"
    sampled_requests_enabled   = true
  }

  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 1
    override_action {
      none {}
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWS-AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }
}

# --- Custom Domain & SSL ---

resource "aws_acm_certificate" "cert" {
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => dvo
  }

  allow_overwrite = true
  name            = each.value.resource_record_name
  records         = [each.value.resource_record_value]
  ttl             = 60
  type            = each.value.resource_record_type
  zone_id         = var.hosted_zone_id
}

resource "aws_acm_certificate_validation" "cert" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

resource "aws_cloudfront_distribution" "frontend_dist" {
  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.default.id
    origin_id                = "S3-${aws_s3_bucket.frontend.bucket}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases             = [var.domain_name]
  web_acl_id          = aws_wafv2_web_acl.cloudfront_waf.arn

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.frontend.bucket}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  price_class = "PriceClass_All"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.cert.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # SPA Routing: Redirect 403/404 to index.html so React Router handles it
  custom_error_response {
    error_caching_min_ttl = 10
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
  }

  custom_error_response {
    error_caching_min_ttl = 10
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
  }
}

resource "aws_route53_record" "alias" {
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend_dist.domain_name
    zone_id                = aws_cloudfront_distribution.frontend_dist.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_s3_bucket_policy" "frontend_policy" {
  bucket = aws_s3_bucket.frontend.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipal"
        Effect    = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.frontend_dist.arn
          }
        }
      }
    ]
  })
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.frontend_dist.domain_name
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.frontend_dist.id
}

output "frontend_s3_bucket" {
  value = aws_s3_bucket.frontend.bucket
}

# --- Secrets Manager for DB Credentials ---

resource "aws_secretsmanager_secret" "db_creds" {
  name        = "${var.project}-db-credentials-${random_id.bucket_id.hex}"
  description = "Database credentials for Krishi-Net"
}

resource "aws_secretsmanager_secret_version" "db_creds_val" {
  secret_id     = aws_secretsmanager_secret.db_creds.id
  secret_string = jsonencode({
    username = "admin"
    password = "change-me-in-console"
    engine   = "postgres"
    host     = "db.example.com"
    port     = 5432
  })
}

resource "aws_iam_role_policy" "lambda_secrets" {
  name = "${var.project}-lambda-secrets"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action   = ["secretsmanager:GetSecretValue"]
      Effect   = "Allow"
      Resource = aws_secretsmanager_secret.db_creds.arn
    }]
  })
}

output "db_secret_arn" {
  value = aws_secretsmanager_secret.db_creds.arn
}

/*
Note: This Terraform file is a minimal scaffold. To deploy Lambdas, Step Functions,
API Gateway and IAM roles, extend this configuration with `aws_lambda_function`,
`aws_iam_role`, `aws_apigatewayv2` or `aws_api_gateway_rest_api`, and `aws_sfn_state_machine`.

Bedrock access is managed by AWS and may require special regional endpoints or a service quota;
you will need to attach IAM policies allowing `bedrock:InvokeModel` when available in your provider.
*/
