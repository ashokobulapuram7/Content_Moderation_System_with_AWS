# Security and backend validation guide

This repository contains the React frontend for an anonymous content-moderation demo. It does not contain the Lambda, API Gateway, S3, DynamoDB, Rekognition, or Comprehend backend implementation. The frontend safeguards in this repository improve the user experience and reduce accidental misuse, but they are not a replacement for backend validation and abuse controls.

## Public frontend configuration

Create React App embeds `REACT_APP_*` values into the static JavaScript bundle. Any visitor can view these values in browser developer tools or downloaded JavaScript files.

For this application, the following values are expected to be public API Gateway URLs, not secrets:

- `REACT_APP_AWS_API_UPLOAD_ENDPOINT`
- `REACT_APP_AWS_API_RESULTS_ENDPOINT`
- `REACT_APP_AWS_API_CONTACT_ENDPOINT`

Do not store AWS access keys, secret access keys, database passwords, private API keys, or shared authentication secrets in any `REACT_APP_*` variable. API Gateway URLs are not credentials; security must come from API Gateway, Lambda, S3, IAM, monitoring, and abuse controls.

## Anonymous access model

This demo intentionally allows anonymous use without authentication. That is acceptable for a public demo only when each anonymous endpoint has layered protections. Without identity, the backend cannot reliably prove which person owns an upload or result, so retention windows, opaque identifiers, throttling, and cost controls become especially important.

CORS is useful for limiting which browser origins can call the API from JavaScript, but CORS is not authentication. Non-browser clients can call public API Gateway endpoints directly.

## Upload Lambda validation

The upload Lambda must validate every request before writing to S3, calling Rekognition, or starting expensive work. Never trust the browser checks, `file_type`, `file_name`, `file_size`, or Base64 payload from the client.

Recommended validation:

- Require a JSON object with only the expected fields: `file_type`, `file_size`, `file_name`, and `file_content`.
- Reject missing, extra, malformed, or incorrectly typed fields.
- Enforce a maximum Base64 string length before decoding.
- Validate Base64 format and reject malformed input.
- Decode the file and enforce the decoded byte limit, currently 4 MB.
- Check file signatures/magic bytes for JPEG, PNG, and MP4 instead of trusting MIME type or extension.
- Allow only expected content types and extensions: `.jpg`, `.jpeg`, `.png`, and `.mp4`.
- Generate the S3 object key on the server using a random opaque identifier. Do not use client-supplied filenames as object keys.
- Sanitize any metadata retained from the original filename, and avoid logging file contents or full request bodies.
- Reject oversized or malformed input before S3 uploads, Rekognition calls, or database writes.

### Illustrative Node.js validation helper

The backend code is not present in this repository. The following helper is illustrative pseudocode for a Lambda-side validation layer and must be adapted, tested, and integrated in the backend repository or AWS console/IaC configuration.

```js
const crypto = require('crypto');

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_BASE64_LENGTH = Math.ceil(MAX_BYTES / 3) * 4 + 4;
const ALLOWED_EXTENSIONS = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'video/mp4': ['.mp4'],
};

function hasAllowedExtension(name, contentType) {
  const lowerName = String(name || '').toLowerCase();
  return (ALLOWED_EXTENSIONS[contentType] || []).some((ext) => lowerName.endsWith(ext));
}

function detectContentType(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png';
  }
  if (bytes.length >= 12 && bytes.toString('ascii', 4, 8) === 'ftyp') {
    return 'video/mp4';
  }
  return null;
}

function validateUploadRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Invalid request');
  }

  const allowedFields = new Set(['file_type', 'file_size', 'file_name', 'file_content']);
  for (const field of Object.keys(body)) {
    if (!allowedFields.has(field)) throw new Error('Invalid request');
  }

  if (
    typeof body.file_type !== 'string' ||
    typeof body.file_name !== 'string' ||
    typeof body.file_content !== 'string' ||
    typeof body.file_size !== 'number'
  ) {
    throw new Error('Invalid request');
  }

  if (body.file_content.length > MAX_BASE64_LENGTH || !/^[A-Za-z0-9+/]*={0,2}$/.test(body.file_content)) {
    throw new Error('Invalid file content');
  }

  const bytes = Buffer.from(body.file_content, 'base64');
  if (bytes.length === 0 || bytes.length > MAX_BYTES || body.file_size !== bytes.length) {
    throw new Error('Invalid file size');
  }

  const detectedType = detectContentType(bytes);
  if (!detectedType || detectedType !== body.file_type || !hasAllowedExtension(body.file_name, detectedType)) {
    throw new Error('Unsupported file type');
  }

  return {
    bytes,
    contentType: detectedType,
    objectKey: `uploads/${crypto.randomUUID()}`,
  };
}
```

Return safe generic 4xx responses for validation failures. Do not return stack traces, decoded content, object keys, bucket names, IAM details, or raw backend errors to the browser.

## API Gateway controls

Configure API Gateway separately from this frontend repository:

- Use stage or route throttling appropriate for upload, polling, and contact routes.
- Apply payload size limits and request validation where available.
- Consider AWS WAF rate-based rules or equivalent abuse controls for public upload and contact endpoints.
- Configure CORS only for the deployed Amplify origin where practical. Do not use CORS as an authentication or authorization control.
- Log request IDs, status codes, route names, latency, and validation outcomes, but exclude Base64 files, messages, email addresses, full request bodies, and other sensitive data from access logs.
- Return generic client-safe error messages.

## S3 and IAM controls

- Enable S3 Block Public Access for buckets that store uploads or moderation artifacts.
- Do not allow public object reads or writes.
- Use least-privilege Lambda execution roles scoped to required buckets, prefixes, DynamoDB tables, and Rekognition actions.
- Use server-side encryption for stored objects.
- Add lifecycle rules to delete uploaded files and derived results after a short retention period suitable for the demo.
- Avoid placing uploaded content in public website hosting paths.

## Results lookup risks

The results endpoint should assume that `content_id` values can be guessed, leaked, or shared. Without authentication, the backend cannot fully prevent cross-user access if another person obtains a valid ID.

Reduce exposure by:

- Generating high-entropy opaque IDs server-side.
- Avoiding sequential or meaningful identifiers.
- Storing only the minimum moderation result data needed by the demo.
- Using short retention periods for result records.
- Expiring IDs quickly and returning a generic not-found response after expiration.
- Avoiding any personally identifying information in result records.

## Contact endpoint controls

Anonymous contact forms are common spam and cost-abuse targets. The contact Lambda/API should:

- Trim and validate name, email, and message fields server-side.
- Enforce maximum lengths and reject malformed input.
- Rate-limit by IP or other available signals.
- Consider WAF, CAPTCHA, email-provider protections, or equivalent abuse controls.
- Avoid sending unescaped user input into HTML emails or dashboards.
- Avoid logging full messages or email addresses unless there is a clear retention and privacy need.

## Cost and operations controls

- Set reserved concurrency on Lambda functions to cap runaway invocation volume.
- Configure AWS Budgets and billing alerts for the AWS account used by the demo.
- Monitor CloudWatch metrics for API 4xx/5xx responses, throttles, Lambda errors, duration, concurrent executions, and unusual request volume.
- Alarm on spikes in upload, polling, contact, Rekognition, DynamoDB, and S3 usage.

## Incident response checklist

If credentials, private API keys, or sensitive data are ever exposed:

1. Rotate or revoke exposed AWS credentials immediately.
2. Disable, throttle, or restrict affected API Gateway routes while investigating.
3. Inspect CloudWatch, API Gateway, S3, DynamoDB, and billing logs for abuse.
4. Remove sensitive values from source, build settings, logs, and artifacts.
5. Review S3 public access settings and bucket policies.
6. Re-enable endpoints only after validation, logging, and rate limits are confirmed.
7. Document the incident and update this guide or backend IaC to prevent recurrence.
