output "docs_url" {
  description = "Public docs site URL"
  value       = "https://${var.domain_name}"
}

output "s3_bucket" {
  description = "S3 bucket the built site is synced to (repo variable DOCS_S3_BUCKET)"
  value       = aws_s3_bucket.site.bucket
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution id (repo variable DOCS_CF_DISTRIBUTION_ID)"
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.site.domain_name
}

output "gha_docs_deploy_role_arn" {
  description = "Role ARN GitHub Actions assumes (repo variable AWS_DOCS_DEPLOY_ROLE_ARN)"
  value       = aws_iam_role.gha_docs_deploy.arn
}
