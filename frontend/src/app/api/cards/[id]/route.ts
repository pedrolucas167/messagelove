import { NextRequest, NextResponse } from "next/server";
import { deleteCard, getCardById, updateCard } from "@/server/services/card-service";
import { requireUserId } from "@/server/utils/auth";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const card = await getCardById(id);
    if (!card) {
      return NextResponse.json({ error: "Cartão não encontrado" }, { status: 404 });
    }
    return NextResponse.json(card);
  } catch (error) {
    console.error(`GET /api/cards/${params.id}`, error);
    return NextResponse.json({ error: "Erro ao buscar cartão" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId(request);
    const formData = await request.formData();
    const youtubeVideoId = formData.get("youtubeVideoId");
    const youtubeStartTimeRaw = formData.get("youtubeStartTime");
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

    const card = await updateCard(
      params.id,
      userId,
      {
        de: formData.get("de") ? String(formData.get("de")) : undefined,
        para: formData.get("para") ? String(formData.get("para")) : undefined,
        mensagem: formData.get("mensagem") ? String(formData.get("mensagem")) : undefined,
        youtubeVideoId: youtubeVideoId ? String(youtubeVideoId) : undefined,
        youtubeStartTime: youtubeStartTimeRaw ? Number(youtubeStartTimeRaw) : undefined,
      },
      uploadFile
    );

    return NextResponse.json(card);
  } catch (error) {
    console.error(`PUT /api/cards/${params.id}`, error);
    const message = error instanceof Error ? error.message : "Erro ao atualizar cartão";
    const status = message.includes("não encontrado") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId(request);
    await deleteCard(params.id, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/cards/${params.id}`, error);
    const message = error instanceof Error ? error.message : "Erro ao deletar cartão";
    const status = message.includes("não encontrado") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
