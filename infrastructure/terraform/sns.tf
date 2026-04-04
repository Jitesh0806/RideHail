# ─── SNS Topics ────────────────────────────────────────────────────────────────

# Topic for ride-related notifications (driver assigned, arriving, completed)
resource "aws_sns_topic" "ride_notifications" {
  name = "${var.app_name}-ride-notifications"
  tags = { Name = "${var.app_name}-ride-notifications" }
}

# Topic for system alerts (backend errors, high load)
resource "aws_sns_topic" "system_alerts" {
  name = "${var.app_name}-system-alerts"
  tags = { Name = "${var.app_name}-system-alerts" }
}

# ─── SNS Topic Policies ────────────────────────────────────────────────────────

resource "aws_sns_topic_policy" "ride_notifications" {
  arn = aws_sns_topic.ride_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { AWS = aws_iam_role.ec2_role.arn }
        Action    = "sns:Publish"
        Resource  = aws_sns_topic.ride_notifications.arn
      }
    ]
  })
}

# ─── IAM Policy for EC2 to publish to SNS ─────────────────────────────────────

resource "aws_iam_policy" "sns_access" {
  name        = "${var.app_name}-sns-access"
  description = "Allow EC2 to publish to SNS topics"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sns:Publish",
          "sns:CreatePlatformEndpoint",
          "sns:DeleteEndpoint",
          "sns:GetEndpointAttributes",
          "sns:SetEndpointAttributes"
        ]
        Resource = [
          aws_sns_topic.ride_notifications.arn,
          aws_sns_topic.system_alerts.arn,
          "arn:aws:sns:${var.aws_region}:*:endpoint/*"
        ]
      }
    ]
  })
}
