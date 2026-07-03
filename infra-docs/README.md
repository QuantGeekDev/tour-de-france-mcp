# infra-docs

Terraform for the documentation site at **https://tdf-docs.andru.codes**.

The docs are a [Fumadocs](https://fumadocs.dev) static export (see [`../docs`](../docs))
served from a private S3 bucket behind CloudFront. This state is kept **separate**
from the MCP server's (`../infra`) so deploying one never touches the other.

## What it creates

- Private **S3 bucket** (public access blocked) holding the exported site.
- **CloudFront** distribution with Origin Access Control (only CloudFront can read
  the bucket) and a viewer-request **function** that rewrites clean URLs to
  `index.html` (see [`router.js`](router.js)).
- **ACM certificate** in us-east-1, DNS-validated in Route 53.
- **Route 53** `A` + `AAAA` alias records for `tdf-docs.andru.codes`.
- A **GitHub OIDC deploy role** scoped to `s3:sync` this bucket and invalidate this
  distribution — used by [`.github/workflows/docs.yml`](../.github/workflows/docs.yml).

## Apply

```bash
cd infra-docs
terraform init
terraform apply    # uses the alex-salisol profile + andru.codes zone by default
```

The Route 53 hosted zone `andru.codes` and the account's GitHub OIDC provider must
already exist (they do — the MCP server uses the same zone/provider).

## Wire up CI/CD

After `apply`, set these as **repo variables** (Settings → Secrets and variables →
Actions → Variables) from the Terraform outputs:

| Repo variable | Terraform output |
| --- | --- |
| `AWS_DOCS_DEPLOY_ROLE_ARN` | `gha_docs_deploy_role_arn` |
| `DOCS_S3_BUCKET` | `s3_bucket` |
| `DOCS_CF_DISTRIBUTION_ID` | `cloudfront_distribution_id` |
| `AWS_REGION` | already set for the MCP deploy (`us-east-1`) |

The first deploy can also be done by hand:

```bash
cd docs && npm ci && npm run build
aws s3 sync out "s3://$(terraform -chdir=../infra-docs output -raw s3_bucket)" --delete --profile alex-salisol
aws cloudfront create-invalidation \
  --distribution-id "$(terraform -chdir=../infra-docs output -raw cloudfront_distribution_id)" \
  --paths '/*' --profile alex-salisol
```
