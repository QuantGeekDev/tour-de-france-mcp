output "public_ip" {
  description = "Elastic IP of the instance"
  value       = aws_eip.this.public_ip
}

output "instance_id" {
  description = "EC2 instance id"
  value       = aws_instance.this.id
}

output "mcp_endpoint" {
  description = "Public MCP endpoint URL"
  value       = "https://${var.domain_name}/mcp"
}

output "ssh_command" {
  description = "SSH into the box (key written next to this config)"
  value       = "ssh -i ${abspath(local_sensitive_file.private_key.filename)} ec2-user@${aws_eip.this.public_ip}"
}
