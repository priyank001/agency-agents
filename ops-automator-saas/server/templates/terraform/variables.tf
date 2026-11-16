variable "aws_region" {
  description = "AWS deployment region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment target environment (production, staging, dev)"
  type        = string
  default     = "production"
}

variable "app_name" {
  description = "Application identifier"
  type        = string
  default     = "paystream-api"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

