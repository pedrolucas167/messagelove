import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { env } from "../lib/env";

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

type UploadFile = {
  buffer: Buffer;
  mimetype: string;
  originalName?: string;
};

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadOptimizedPhoto(file: UploadFile | null): Promise<string | null> {
  if (!file) return null;
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
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

  await s3Client.send(command);
  return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}

export async function deletePhoto(photoUrl: string | null | undefined) {
  if (!photoUrl) return;
  const key = photoUrl.split(".com/")[1];
  if (!key) return;

  const command = new DeleteObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
  });

  await s3Client.send(command);
}
