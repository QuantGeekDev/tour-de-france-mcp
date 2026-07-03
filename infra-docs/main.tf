terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region  = var.region
  profile = var.aws_profile
}

# CloudFront and its ACM certificate must live in us-east-1, regardless of
# where the origin bucket is. This aliased provider is used for the cert.
provider "aws" {
  alias   = "us_east_1"
  region  = "us-east-1"
  profile = var.aws_profile
}

data "aws_caller_identity" "current" {}

data "aws_route53_zone" "this" {
  name         = "${var.hosted_zone_name}."
  private_zone = false
}

# ---------------------------------------------------------------------------
# Private S3 bucket holding the exported static site
# ---------------------------------------------------------------------------

resource "aws_s3_bucket" "site" {
  # Dots in bucket names complicate TLS/virtual-hosting, so derive a flat name.
  bucket = "${replace(var.domain_name, ".", "-")}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name    = var.domain_name
    Project = "tour-de-france-mcp-docs"
  }
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "site" {
  bucket = aws_s3_bucket.site.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

# Only CloudFront (this distribution) may read objects — never the public.
data "aws_iam_policy_document" "site" {
  statement {
    sid       = "AllowCloudFrontServicePrincipalRead"
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.site.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.site.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = data.aws_iam_policy_document.site.json
}
