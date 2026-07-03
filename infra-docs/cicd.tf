# ---------------------------------------------------------------------------
# CI/CD: GitHub Actions -> AWS via OIDC -> `aws s3 sync` + CloudFront invalidate.
#
# Mirrors the MCP server's deploy pattern: no long-lived credentials, a role
# restricted to this repo's main branch, and least-privilege permissions
# scoped to exactly this bucket and this distribution.
# ---------------------------------------------------------------------------

# The GitHub OIDC provider already exists in this account — reference it.
data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

data "aws_iam_policy_document" "gha_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repo}:ref:refs/heads/main"]
    }
  }
}

resource "aws_iam_role" "gha_docs_deploy" {
  name                 = "tour-de-france-mcp-docs-gha-deploy"
  assume_role_policy   = data.aws_iam_policy_document.gha_assume.json
  max_session_duration = 3600

  tags = {
    Name    = "tour-de-france-mcp-docs-gha-deploy"
    Project = "tour-de-france-mcp-docs"
  }
}

data "aws_iam_policy_document" "gha_docs_deploy" {
  statement {
    sid       = "ListBucket"
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.site.arn]
  }

  statement {
    sid       = "WriteObjects"
    effect    = "Allow"
    actions   = ["s3:PutObject", "s3:DeleteObject", "s3:GetObject"]
    resources = ["${aws_s3_bucket.site.arn}/*"]
  }

  statement {
    sid       = "InvalidateCache"
    effect    = "Allow"
    actions   = ["cloudfront:CreateInvalidation"]
    resources = [aws_cloudfront_distribution.site.arn]
  }
}

resource "aws_iam_role_policy" "gha_docs_deploy" {
  name   = "s3-sync-and-invalidate"
  role   = aws_iam_role.gha_docs_deploy.id
  policy = data.aws_iam_policy_document.gha_docs_deploy.json
}
