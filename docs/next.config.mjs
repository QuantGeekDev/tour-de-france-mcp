import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  // This app is a nested project inside the MCP repo; pin the workspace root
  // so Next doesn't infer it from the parent lockfile.
  turbopack: { root: import.meta.dirname },
  // Static HTML export -> uploaded to S3 and served through CloudFront.
  output: 'export',
  // Every route becomes a `<path>/index.html` folder so CloudFront can map
  // clean URLs (see the viewer-request function in infra-docs/cloudfront.tf).
  trailingSlash: true,
  // No Next.js image optimization server exists behind a static export.
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default withMDX(config);
