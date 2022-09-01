resource "aws_iam_policy" "analytics" {
  name        = "analytics-bitdao-s3"
  description = "This police is managed by Terraform, please do not delete/change"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        "Effect" : "Allow",
        "Action" : "logs:CreateLogGroup",
        "Resource" : "arn:aws:logs:us-east-1:853732489639:*"
      },
      {
        "Effect" : "Allow",
        "Action" : [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource" : [
          "arn:aws:logs:us-east-1:853732489639:log-group:/aws/lambda/analytics-bitdao-s3:*"
        ]
      },
      {
        "Effect" : "Allow",
        "Action" : [
          "s3:*",
          "s3-object-lambda:*"
        ],
        "Resource" : [
          "arn:aws:s3:::api.bitdao.io:*"
        ]
      }
    ]
  })
}

resource "aws_iam_role" "analytics" {
  assume_role_policy = jsonencode(
    {
      Statement = [
        {
          Action = "sts:AssumeRole"
          Effect = "Allow"
          Principal = {
            Service = "lambda.amazonaws.com"
          }
        },
      ]
      Version = "2012-10-17"
    }
  )
  force_detach_policies = false
  managed_policy_arns = [
    aws_iam_policy.analytics.arn
  ]
  max_session_duration = 3600
  name                 = "analytics-bitdao-s3-role"
  path                 = "/service-role/"
  tags                 = {}
  tags_all             = {}
}

resource "aws_cloudwatch_log_group" "analytics" {
  name              = "/aws/lambda/analytics-bitdao-s3"
  retention_in_days = 14

}

resource "aws_lambda_function" "analytics" {
  architectures = [
    "x86_64",
  ]
  function_name                  = "analytics-bitdao-s3"
  handler                        = "index.handler"
  filename                       = "update-api-s3.zip"
  layers                         = []
  memory_size                    = 128
  package_type                   = "Zip"
  reserved_concurrent_executions = -1
  role                           = aws_iam_role.analytics.arn
  runtime                        = "nodejs16.x"
  source_code_hash               = "pwcBv+MSlY1gGXJp4TzQk5zJ7ENVCJXOSWup7OFS+rs="
  tags                           = {}
  tags_all                       = {}
  timeout                        = 900

  environment {
    variables = {
      "AWS_BUCKET_NAME" = var.bucket_name
      "BITDAO_ACCOUNT"  = var.bitdao_account
      "BYBIT_API_KEY"   = var.bitdao_api_key
      "MAIN_RPC_URL"    = var.main_rpc_url
      "WEB3_RPC_URL"    = var.web3_rpc_url
    }
  }

  ephemeral_storage {
    size = 512
  }

  timeouts {}

  tracing_config {
    mode = "PassThrough"
  }
}

resource "aws_cloudwatch_event_rule" "analytics" {
  name                = "analytics-bitdao-s3"
  description         = "This event is handled by Terraform. Please do not delete/change."
  schedule_expression = "rate(360 minutes)"
  role_arn            = aws_lambda_function.analytics.arn

}

resource "aws_cloudwatch_event_target" "analytics" {
  rule = aws_cloudwatch_event_rule.analytics.name
  arn  = aws_lambda_function.analytics.arn

}

resource "aws_lambda_permission" "cloudwatch" {
  statement_id  = "AllowExecutionFromCloudwatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.analytics.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.analytics.arn
}