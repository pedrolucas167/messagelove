import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { env } from "../lib/env";

// Only create S3 client if credentials are provided
const hasS3Config = env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_S3_BUCKET;

const s3Client = hasS3Config 
  ? new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    })
  : null;

type UploadFile = {
  buffer: Buffer;
  mimetype: string;
  originalName?: string;
};

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_AUDIO_TYPES = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg", "audio/wav"];

export async function uploadOptimizedPhoto(file: UploadFile | null): Promise<string | null> {
  if (!file) return null;
  if (!s3Client || !hasS3Config) {
    console.warn("S3 not configured, skipping photo upload");
    return null;
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    throw new Error("Tipo de arquivo não suportado. Utilize JPEG, PNG ou WebP.");
  }

  const optimizedBuffer = await sharp(file.buffer)
    .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const key = `cards/${nanoid(16)}.webp`;
  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
    Body: optimizedBuffer,
    ContentType: "image/webp",
    ACL: "public-read",
  });

  await s3Client!.send(command);
  return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}

export async function uploadAudio(file: UploadFile | null): Promise<string | null> {
  if (!file) return null;
  if (!s3Client || !hasS3Config) {
    console.warn("S3 not configured, skipping audio upload");
    return null;
  }
  if (!ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
    throw new Error("Tipo de áudio não suportado. Utilize WebM, MP4, MP3, OGG ou WAV.");
  }

  // Determine file extension based on mimetype
  const extensions: Record<string, string> = {
    "audio/webm": "webm",
    "audio/mp4": "m4a",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
  };
  const ext = extensions[file.mimetype] || "webm";

  const key = `cards/audio/${nanoid(16)}.${ext}`;
  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read",
  });

  await s3Client.send(command);
  return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}

export async function deletePhoto(photoUrl: string | null | undefined) {
  if (!photoUrl) return;
  if (!s3Client || !hasS3Config) return;
  
  const key = photoUrl.split(".com/")[1];
  if (!key) return;

  const command = new DeleteObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
  });

  await s3Client.send(command);
}

export async function deleteAudio(audioUrl: string | null | undefined) {
  if (!audioUrl) return;
  if (!s3Client || !hasS3Config) return;
  
  const key = audioUrl.split(".com/")[1];
  if (!key) return;

  const command = new DeleteObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
  });

  await s3Client.send(command);
}
