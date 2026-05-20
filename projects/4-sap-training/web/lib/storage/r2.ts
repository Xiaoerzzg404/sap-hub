import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Server-only R2 helpers. Do not import this module from client components:
// - each recording is capped at 10 MB by API validation and signed PUT metadata
// - presigned PUT URLs expire in 5 minutes
// - presigned GET URLs expire in 10 minutes
// - the bucket must stay private with no anonymous read access
export const MAX_RECORDING_BYTES = 10 * 1024 * 1024;
export const PRESIGNED_PUT_EXPIRES_IN_SEC = 5 * 60;
export const PRESIGNED_GET_EXPIRES_IN_SEC = 10 * 60;

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET = process.env.R2_BUCKET_NAME;

if (!ACCOUNT_ID || !ACCESS_KEY || !SECRET_KEY || !BUCKET) {
  console.warn("R2 credentials missing in .env.local; uploads will fail at runtime");
}

export const r2BucketName = BUCKET ?? "";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: ACCOUNT_ID ? `https://${ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined,
  credentials: {
    accessKeyId: ACCESS_KEY ?? "",
    secretAccessKey: SECRET_KEY ?? ""
  }
});

export function recordingKey(userId: string, lessonId: string, recordingId: string, ext = "webm") {
  return `audio/${userId}/${lessonId}/${recordingId}.${ext}`;
}

export async function getPresignedPutUrl(
  key: string,
  contentType: string,
  contentLength: number,
  expiresIn = PRESIGNED_PUT_EXPIRES_IN_SEC
) {
  if (contentLength <= 0 || contentLength > MAX_RECORDING_BYTES) {
    throw new Error("recording size out of range");
  }

  const command = new PutObjectCommand({
    Bucket: r2BucketName,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength
  });
  return getSignedUrl(r2Client, command, { expiresIn: Math.min(expiresIn, PRESIGNED_PUT_EXPIRES_IN_SEC) });
}

export async function getPresignedGetUrl(key: string, expiresIn = PRESIGNED_GET_EXPIRES_IN_SEC) {
  const command = new GetObjectCommand({ Bucket: r2BucketName, Key: key });
  return getSignedUrl(r2Client, command, { expiresIn: Math.min(expiresIn, PRESIGNED_GET_EXPIRES_IN_SEC) });
}

export async function deleteObject(key: string) {
  await r2Client.send(new DeleteObjectCommand({ Bucket: r2BucketName, Key: key }));
}
