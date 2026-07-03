variable "aws_profile" {
  description = "AWS CLI named profile to use"
  type        = string
  default     = "alex-salisol"
}

variable "region" {
  description = "AWS region for the S3 bucket (CloudFront + ACM cert are always us-east-1)"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Fully-qualified subdomain to serve the docs site on"
  type        = string
  default     = "tdf-docs.andru.codes"
}

variable "hosted_zone_name" {
  description = "Route53 hosted zone the subdomain lives under"
  type        = string
  default     = "andru.codes"
}

variable "github_repo" {
  description = "GitHub repo (owner/name) allowed to deploy the docs via OIDC"
  type        = string
  default     = "QuantGeekDev/tour-de-france-mcp"
}

variable "price_class" {
  description = "CloudFront price class (PriceClass_100 = NA + EU, cheapest)"
  type        = string
  default     = "PriceClass_100"
}
