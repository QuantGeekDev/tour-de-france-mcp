terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region  = var.region
  profile = var.aws_profile
}

# ---------------------------------------------------------------------------
# Lookups
# ---------------------------------------------------------------------------

# Latest Amazon Linux 2023 AMI (x86_64) via the public SSM parameter.
data "aws_ssm_parameter" "al2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

data "aws_route53_zone" "this" {
  name         = "${var.hosted_zone_name}."
  private_zone = false
}

data "aws_vpc" "default" {
  default = true
}

# AZs in this region that actually offer the requested instance type
# (default VPC has a subnet in every AZ, and some AZs don't offer t3.micro).
data "aws_ec2_instance_type_offerings" "supported" {
  filter {
    name   = "instance-type"
    values = [var.instance_type]
  }
  location_type = "availability-zone"
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
  filter {
    name   = "availability-zone"
    values = data.aws_ec2_instance_type_offerings.supported.locations
  }
}

# ---------------------------------------------------------------------------
# SSH key (generated locally so the box is reachable if you ever need it)
# ---------------------------------------------------------------------------

resource "tls_private_key" "ssh" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "this" {
  key_name   = "tour-de-france-mcp"
  public_key = tls_private_key.ssh.public_key_openssh
}

resource "local_sensitive_file" "private_key" {
  content         = tls_private_key.ssh.private_key_pem
  filename        = "${path.module}/tour-de-france-mcp-key.pem"
  file_permission = "0400"
}

# ---------------------------------------------------------------------------
# Security group: 80/443 world-open (serving + ACME), 22 restricted
# ---------------------------------------------------------------------------

resource "aws_security_group" "this" {
  name        = "tour-de-france-mcp"
  description = "tour-de-france-mcp: HTTP/HTTPS public, SSH restricted"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP (redirects to HTTPS + ACME http challenge)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS (MCP endpoint)"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH (operator)"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_ingress_cidr]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "tour-de-france-mcp"
    Project = "tour-de-france-mcp"
  }
}

# ---------------------------------------------------------------------------
# Instance
# ---------------------------------------------------------------------------

resource "aws_instance" "this" {
  ami                    = data.aws_ssm_parameter.al2023.value
  instance_type          = var.instance_type
  key_name               = aws_key_pair.this.key_name
  subnet_id              = data.aws_subnets.default.ids[0]
  vpc_security_group_ids = [aws_security_group.this.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_ssm.name

  user_data = templatefile("${path.module}/user_data.sh.tftpl", {
    domain   = var.domain_name
    email    = var.admin_email
    repo_url = var.repo_url
  })

  # Re-provision if the bootstrap script changes.
  user_data_replace_on_change = true

  root_block_device {
    volume_size = 10
    volume_type = "gp3"
  }

  metadata_options {
    http_tokens = "required" # IMDSv2 only
  }

  tags = {
    Name    = "tour-de-france-mcp"
    Project = "tour-de-france-mcp"
  }
}

# ---------------------------------------------------------------------------
# Stable public IP + DNS
# ---------------------------------------------------------------------------

resource "aws_eip" "this" {
  domain   = "vpc"
  instance = aws_instance.this.id

  tags = {
    Name    = "tour-de-france-mcp"
    Project = "tour-de-france-mcp"
  }
}

resource "aws_route53_record" "a" {
  zone_id = data.aws_route53_zone.this.zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = 300
  records = [aws_eip.this.public_ip]
}
