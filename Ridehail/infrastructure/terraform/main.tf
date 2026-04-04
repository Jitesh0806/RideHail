terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Optional: store state in S3 so your team shares the same state
  # Uncomment after creating the bucket manually first
  # backend "s3" {
  #   bucket = "ridehail-terraform-state"
  #   key    = "prod/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "RideHail"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
