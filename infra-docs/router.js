// CloudFront viewer-request function: map clean URLs from a Next.js static
// export (output: 'export', trailingSlash: true) onto the objects in S3.
//
//   /                     -> /index.html
//   /docs/quickstart/     -> /docs/quickstart/index.html
//   /docs/quickstart      -> /docs/quickstart/index.html
//   /_next/static/app.js  -> unchanged (has a file extension)
//   /llms.txt             -> unchanged (has a file extension)
//   /api/search           -> unchanged (extensionless Orama index file)
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // The static search index is emitted as an extensionless file; serve as-is.
  if (uri === '/api/search') {
    return request;
  }

  // Directory request: append the index document.
  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
    return request;
  }

  // Clean page URL (no file extension in the last segment): serve its folder's
  // index.html so trailing-slash and non-trailing-slash forms both resolve.
  var lastSegment = uri.substring(uri.lastIndexOf('/') + 1);
  if (lastSegment.indexOf('.') === -1) {
    request.uri = uri + '/index.html';
  }

  return request;
}
