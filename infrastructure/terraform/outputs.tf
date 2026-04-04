# ─── Outputs ───────────────────────────────────────────────────────────────────
# These values are printed after `terraform apply` completes

output "alb_dns_name" {
  description = "ALB DNS name — use this as your API base URL"
  value       = "http://${aws_lb.main.dns_name}:8080"
}

output "ec2_public_ip" {
  description = "EC2 public IP for SSH access"
  value       = aws_eip.backend.public_ip
}

output "ec2_ssh_command" {
  description = "SSH command to connect to the backend server"
  value       = "ssh -i your-key.pem ec2-user@${aws_eip.backend.public_ip}"
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.postgres.address
  sensitive   = false
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "s3_bucket_name" {
  description = "S3 bucket name for file uploads"
  value       = aws_s3_bucket.uploads.bucket
}

output "sns_ride_topic_arn" {
  description = "SNS topic ARN for ride notifications"
  value       = aws_sns_topic.ride_notifications.arn
}

output "env_file_content" {
  description = "Copy this into your backend .env for production"
  sensitive   = true
  value       = <<-ENV
    NODE_ENV=production
    PORT=3000
    DB_HOST=${aws_db_instance.postgres.address}
    DB_PORT=5432
    DB_NAME=${var.rds_db_name}
    DB_USER=${var.rds_username}
    DB_PASSWORD=${var.rds_password}
    REDIS_HOST=${aws_elasticache_cluster.redis.cache_nodes[0].address}
    REDIS_PORT=6379
    AWS_REGION=${var.aws_region}
    AWS_S3_BUCKET=${aws_s3_bucket.uploads.bucket}
    AWS_SNS_TOPIC_ARN=${aws_sns_topic.ride_notifications.arn}
  ENV
}
