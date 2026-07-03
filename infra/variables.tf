variable "aws_profile" {
  description = "AWS CLI named profile to use"
  type        = string
  default     = "alex-salisol"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Fully-qualified subdomain to serve the MCP server on"
  type        = string
  default     = "tour-de-france.andru.codes"
}

variable "hosted_zone_name" {
  description = "Route53 hosted zone the subdomain lives under"
  type        = string
  default     = "andru.codes"
}

variable "repo_url" {
  description = "Public git repo cloned and built on the instance"
  type        = string
  default     = "https://github.com/QuantGeekDev/tour-de-france-mcp.git"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "admin_email" {
  description = "Email used for Let's Encrypt / ACME account (cert expiry notices)"
  type        = string
  default     = "alex@impulsum.vc"
}

variable "ssh_ingress_cidr" {
  description = "CIDR allowed to reach SSH (port 22). Defaults to the operator's current IP."
  type        = string
  default     = "79.153.180.99/32"
}
