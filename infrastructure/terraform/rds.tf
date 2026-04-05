# ─── RDS Subnet Group ──────────────────────────────────────────────────────────
# RDS must be placed in at least 2 AZs for high availability

resource "aws_db_subnet_group" "main" {
  name       = "${var.app_name}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = { Name = "${var.app_name}-db-subnet-group" }
}

# ─── RDS PostgreSQL Instance ───────────────────────────────────────────────────

resource "aws_db_instance" "postgres" {
  identifier = "${var.app_name}-postgres"

  # Engine
  engine               = "postgres"
  engine_version       = "15"
  instance_class       = var.rds_instance_class
  allocated_storage    = var.rds_allocated_storage
  max_allocated_storage = 100 # auto-scaling storage up to 100GB
  storage_type         = "gp2"
  storage_encrypted    = true

  # Database
  db_name  = var.rds_db_name
  username = var.rds_username
  password = var.rds_password
  port     = 5432

  # Network
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false # only accessible from inside VPC

  # Backups
  backup_retention_period = 0    # keep 7 days of backups
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  # High availability
  multi_az = false # set to true in production for failover

  # Deletion protection
  deletion_protection       = false # set to true in production
  skip_final_snapshot       = true  # set to false in production
  final_snapshot_identifier = "${var.app_name}-final-snapshot"

  # Performance insights
  performance_insights_enabled = false # enable in production

  tags = { Name = "${var.app_name}-postgres" }
}
