# ─── ElastiCache Subnet Group ──────────────────────────────────────────────────

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.app_name}-redis-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = { Name = "${var.app_name}-redis-subnet-group" }
}

# ─── ElastiCache Redis Cluster ─────────────────────────────────────────────────

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "${var.app_name}-redis"
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = var.elasticache_node_type
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379

  # Network
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.elasticache.id]

  # Maintenance
  maintenance_window       = "sun:05:00-sun:06:00"
  snapshot_retention_limit = 1
  snapshot_window          = "04:00-05:00"

  tags = { Name = "${var.app_name}-redis" }
}
