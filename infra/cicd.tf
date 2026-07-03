# ---------------------------------------------------------------------------
# CI/CD: GitHub Actions -> AWS via OIDC -> SSM Run Command redeploy.
#
# No long-lived credentials are stored anywhere. GitHub Actions exchanges its
# short-lived OIDC token for a scoped AWS role (restricted to pushes on the
# main branch of this repo), and uses SSM to run the redeploy script on the
# instance. No inbound port is opened.
# ---------------------------------------------------------------------------

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# The GitHub OIDC provider already exists in this account — reference it.
data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

locals {
  github_repo = "QuantGeekDev/tour-de-france-mcp"
}

# ---------------------------------------------------------------------------
# Role assumed by GitHub Actions (main branch only)
# ---------------------------------------------------------------------------

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

    # Restrict to this repo's main branch (push + workflow_dispatch on main).
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${local.github_repo}:ref:refs/heads/main"]
    }
  }
}

resource "aws_iam_role" "gha_deploy" {
  name                 = "tour-de-france-mcp-gha-deploy"
  assume_role_policy   = data.aws_iam_policy_document.gha_assume.json
  max_session_duration = 3600

  tags = {
    Name    = "tour-de-france-mcp-gha-deploy"
    Project = "tour-de-france-mcp"
  }
}

# Least privilege: only SendCommand to THIS instance via the managed shell doc.
data "aws_iam_policy_document" "gha_deploy" {
  statement {
    sid       = "SendCommandToThisInstance"
    effect    = "Allow"
    actions   = ["ssm:SendCommand"]
    resources = ["arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:instance/${aws_instance.this.id}"]
  }

  statement {
    sid       = "SendCommandViaShellDocument"
    effect    = "Allow"
    actions   = ["ssm:SendCommand"]
    resources = ["arn:aws:ssm:${data.aws_region.current.name}::document/AWS-RunShellScript"]
  }

  statement {
    sid       = "ReadCommandResults"
    effect    = "Allow"
    actions   = ["ssm:GetCommandInvocation", "ssm:ListCommandInvocations", "ssm:ListCommands"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "gha_deploy" {
  name   = "ssm-redeploy"
  role   = aws_iam_role.gha_deploy.id
  policy = data.aws_iam_policy_document.gha_deploy.json
}

# ---------------------------------------------------------------------------
# Instance profile so the box can register with SSM
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "ec2_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ec2_ssm" {
  name               = "tour-de-france-mcp-ec2-ssm"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json

  tags = {
    Name    = "tour-de-france-mcp-ec2-ssm"
    Project = "tour-de-france-mcp"
  }
}

resource "aws_iam_role_policy_attachment" "ec2_ssm_core" {
  role       = aws_iam_role.ec2_ssm.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2_ssm" {
  name = "tour-de-france-mcp-ec2-ssm"
  role = aws_iam_role.ec2_ssm.name
}

# ---------------------------------------------------------------------------
# Outputs consumed when wiring up the GitHub Actions workflow
# ---------------------------------------------------------------------------

output "gha_deploy_role_arn" {
  description = "Role ARN GitHub Actions assumes via OIDC (set as repo variable AWS_DEPLOY_ROLE_ARN)"
  value       = aws_iam_role.gha_deploy.arn
}
