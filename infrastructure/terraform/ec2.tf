# ─── IAM Role for EC2 ──────────────────────────────────────────────────────────
# Allows EC2 to call S3 and SNS without hardcoded credentials

resource "aws_iam_role" "ec2_role" {
  name = "${var.app_name}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "ec2.amazonaws.com" }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_s3" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.s3_access.arn
}

resource "aws_iam_role_policy_attachment" "ec2_sns" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.sns_access.arn
}

resource "aws_iam_policy" "ecr_access" {
  name        = "${var.app_name}-ecr-access"
  description = "Allow EC2 to pull images from ECR"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ecr:GetAuthorizationToken", "ecr:BatchCheckLayerAvailability", "ecr:GetDownloadUrlForLayer", "ecr:BatchGetImage"]
      Resource = "*"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_ecr" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ecr_access.arn
}

resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.app_name}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# ─── Latest Amazon Linux 2023 AMI ──────────────────────────────────────────────

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ─── EC2 User Data ─────────────────────────────────────────────────────────────
# Runs on first boot: installs Docker, pulls image, starts backend

locals {
  user_data = <<-EOF
    #!/bin/bash
    set -e

    # Update system
    dnf update -y

    # Install Docker
    dnf install -y docker
    systemctl enable docker
    systemctl start docker

    # Install Docker Compose
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
      -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose

    # Create app directory
    mkdir -p /app

    # Write environment file
    cat > /app/.env <<ENVFILE
    NODE_ENV=production
    PORT=3000
    DB_HOST=${aws_db_instance.postgres.address}
    DB_PORT=5432
    DB_NAME=${var.rds_db_name}
    DB_USER=${var.rds_username}
    DB_PASSWORD=${var.rds_password}
    REDIS_HOST=${aws_elasticache_cluster.redis.cache_nodes[0].address}
    REDIS_PORT=6379
    JWT_SECRET=${var.jwt_secret}
    JWT_REFRESH_SECRET=${var.jwt_refresh_secret}
    AWS_REGION=${var.aws_region}
    AWS_S3_BUCKET=${aws_s3_bucket.uploads.bucket}
    AWS_SNS_TOPIC_ARN=${aws_sns_topic.ride_notifications.arn}
    STRIPE_SECRET_KEY=${var.stripe_secret_key}
    ENVFILE

    # Pull and start backend
    docker pull ${var.docker_image}
    docker run -d \
      --name ridehail-backend \
      --restart unless-stopped \
      --env-file /app/.env \
      -p 3000:3000 \
      ${var.docker_image}

    echo "RideHail backend started successfully"
  EOF
}

# ─── EC2 Instance ──────────────────────────────────────────────────────────────

resource "aws_instance" "backend" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.ec2_instance_type
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  key_name               = var.ec2_key_pair_name != "" ? var.ec2_key_pair_name : null

  user_data                   = base64encode(local.user_data)
  user_data_replace_on_change = true

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    encrypted   = true
  }

  tags = { Name = "${var.app_name}-backend" }

  depends_on = [
    aws_db_instance.postgres,
    aws_elasticache_cluster.redis
  ]
}

# ─── Elastic IP ────────────────────────────────────────────────────────────────
# Gives EC2 a fixed public IP that survives restarts

resource "aws_eip" "backend" {
  instance = aws_instance.backend.id
  domain   = "vpc"
  tags     = { Name = "${var.app_name}-backend-eip" }
}
