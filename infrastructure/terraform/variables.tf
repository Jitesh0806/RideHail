variable "aws_region" {
  description = "AWS region to deploy all resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "Application name used as prefix for all resources"
  type        = string
  default     = "ridehail"
}

# ─── Networking ────────────────────────────────────────────────────────────────

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per AZ) — used by EC2 and ALB"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (one per AZ) — used by RDS and ElastiCache"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

# ─── EC2 ───────────────────────────────────────────────────────────────────────

variable "ec2_instance_type" {
  description = "EC2 instance type for the backend server"
  type        = string
  default     = "t2.micro" # free tier eligible
}

variable "ec2_key_pair_name" {
  description = "Name of an existing EC2 key pair for SSH access"
  type        = string
  default     = ""
}

# ─── RDS ───────────────────────────────────────────────────────────────────────

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro" # free tier eligible
}

variable "rds_db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "ridehail"
}

variable "rds_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "ridehail"
}

variable "rds_password" {
  description = "PostgreSQL master password"
  type        = string
  sensitive   = true
}

variable "rds_allocated_storage" {
  description = "Allocated storage in GB for RDS"
  type        = number
  default     = 20 # free tier max
}

# ─── ElastiCache ───────────────────────────────────────────────────────────────

variable "elasticache_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}

# ─── S3 ────────────────────────────────────────────────────────────────────────

variable "s3_bucket_name" {
  description = "S3 bucket name for file uploads (must be globally unique)"
  type        = string
  default     = "ridehail-uploads"
}

# ─── App ───────────────────────────────────────────────────────────────────────

variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "JWT refresh token signing secret"
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret key (optional)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "docker_image" {
  description = "Docker image URI for the backend (e.g. from ECR)"
  type        = string
  default     = "ridehail-backend:latest"
}
