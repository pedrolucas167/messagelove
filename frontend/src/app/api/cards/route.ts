import { NextRequest, NextResponse } from "next/server";
import { listCardsForUser, createCard } from "@/server/services/card-service";
import { extractTokenFromHeader, requireUserId } from "@/server/utils/auth";
import { verifyToken } from "@/server/services/auth-service";

export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request);
    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const payload = verifyToken(token);
    const cards = await listCardsForUser(payload.userId);
    return NextResponse.json(cards);
  } catch (error) {
    console.error("GET /api/cards", error);
    return NextResponse.json({ error: "Erro ao buscar cartões" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = requireUserId(request);
    const formData = await request.formData();
    const de = String(formData.get("de") ?? "");
    const para = String(formData.get("para") ?? "");
    const mensagem = String(formData.get("mensagem") ?? "");
    const youtubeVideoId = formData.get("youtubeVideoId");
    const youtubeStartTimeRaw = formData.get("youtubeStartTime");
    const audioDurationRaw = formData.get("audioDuration");
    
    // Handle photo upload
    const fileEntry = formData.get("foto");
    let uploadFile = null;
    if (fileEntry && typeof fileEntry === "object" && "arrayBuffer" in fileEntry) {
      const typedFile = fileEntry as File;
      uploadFile = {
        buffer: Buffer.from(await typedFile.arrayBuffer()),
        mimetype: typedFile.type,
        originalName: typedFile.name,
      };
    }
    
    // Handle audio upload
    const audioEntry = formData.get("audio");
    let audioFile = null;
    if (audioEntry && typeof audioEntry === "object" && "arrayBuffer" in audioEntry) {
      const typedAudio = audioEntry as File;
      audioFile = {
        buffer: Buffer.from(await typedAudio.arrayBuffer()),
        mimetype: typedAudio.type,
        originalName: typedAudio.name,
      };
    }

    const card = await createCard(
      {
        userId,
        de,
        para,
        mensagem,
        youtubeVideoId: youtubeVideoId ? String(youtubeVideoId) : null,
        youtubeStartTime: youtubeStartTimeRaw ? Number(youtubeStartTimeRaw) : null,
        audioDuration: audioDurationRaw ? Number(audioDurationRaw) : null,
      },
      uploadFile,
      audioFile
    );

    return NextResponse.json({ id: card.id, message: "Cartão criado com sucesso!" }, { status: 201 });
  } catch (error) {
    console.error("POST /api/cards", error);
    const message = error instanceof Error ? error.message : "Erro ao criar cartão";
    const status = message.includes("obrigatórios") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
