import { ensureDatabaseConnection } from "@/server/db";
import { getCardModel } from "@/server/db/models/card";
import { uploadOptimizedPhoto, deletePhoto, uploadAudio, deleteAudio } from "./s3-service";

export type CardPayload = {
  userId: string;
  de: string;
  para: string;
  mensagem: string;
  youtubeVideoId?: string | null;
  youtubeStartTime?: number | null;
  spotifyUri?: string | null;
  musicType?: string | null;
  relationshipDate?: Date | null;
  audioDuration?: number | null;
};

export type UploadableFile = {
  buffer: Buffer;
  mimetype: string;
  originalName?: string;
} | null;

export async function listCardsForUser(userId: string) {
  await ensureDatabaseConnection();
  const Card = getCardModel();
  return Card.findAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
  });
}

export async function createCard(
  payload: CardPayload, 
  photoFile: UploadableFile,
  audioFile: UploadableFile = null
) {
  if (!payload.userId) throw new Error("ID do usuário é obrigatório.");
  if (!payload.de || !payload.para || !payload.mensagem) {
    throw new Error("Campos de, para e mensagem são obrigatórios.");
  }

  await ensureDatabaseConnection();
  const Card = getCardModel();

  const fotoUrl = await uploadOptimizedPhoto(photoFile);
  const audioUrl = await uploadAudio(audioFile);
  
  const card = await Card.create({
    userId: payload.userId,
    de: payload.de.trim(),
    para: payload.para.trim(),
    mensagem: payload.mensagem.trim(),
    fotoUrl,
    youtubeVideoId: payload.youtubeVideoId || null,
    youtubeStartTime: payload.youtubeStartTime ?? null,
    spotifyUri: payload.spotifyUri || null,
    musicType: payload.musicType || null,
    relationshipDate: payload.relationshipDate || null,
    audioUrl,
    audioDuration: payload.audioDuration ?? null,
  });

  return card;
}

export async function getCardById(id: string, userId?: string) {
  await ensureDatabaseConnection();
  const Card = getCardModel();
  const where = userId ? { id, userId } : { id };
  return Card.findOne({ where });
}

export async function updateCard(
  id: string,
  userId: string,
  payload: Partial<CardPayload>,
  file: UploadableFile
) {
  await ensureDatabaseConnection();
  const Card = getCardModel();
  const card = await Card.findOne({ where: { id, userId } });
  if (!card) {
    throw new Error("Cartão não encontrado.");
  }

  let fotoUrl = card.fotoUrl;
  if (file) {
    if (fotoUrl) {
      await deletePhoto(fotoUrl);
    }
    fotoUrl = await uploadOptimizedPhoto(file);
  }

  await card.update({
    de: payload.de ?? card.de,
    para: payload.para ?? card.para,
    mensagem: payload.mensagem ?? card.mensagem,
    youtubeVideoId: payload.youtubeVideoId ?? card.youtubeVideoId,
    youtubeStartTime: payload.youtubeStartTime ?? card.youtubeStartTime,
    fotoUrl,
  });

  return card;
}

export async function deleteCard(id: string, userId: string) {
  await ensureDatabaseConnection();
  const Card = getCardModel();
  const card = await Card.findOne({ where: { id, userId } });
  if (!card) {
    throw new Error("Cartão não encontrado.");
  }

  if (card.fotoUrl) {
    await deletePhoto(card.fotoUrl);
  }
  
  if (card.audioUrl) {
    await deleteAudio(card.audioUrl);
  }

  await card.destroy();
}
