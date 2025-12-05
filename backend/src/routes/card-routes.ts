import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { body, param } from "express-validator";
import { authenticate } from "../middlewares/auth";
import { validateRequest } from "../middlewares/validate-request";
import {
  createCard,
  deleteCard,
  getCardById,
  listCardsForUser,
  updateCard,
} from "../services/card-service";
import { logger } from "../config/logger";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 16 * 1024 * 1024 } }); // 16MB for audio

const router = Router();

router.get("/", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cards = await listCardsForUser(req.userId!);
    return res.json(cards);
  } catch (error) {
    return next(error);
  }
});

router.get(
  "/:id",
  param("id").isUUID().withMessage("ID inválido"),
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const card = await getCardById(String(req.params.id));
      if (!card) {
        return res.status(404).json({ error: "Cartão não encontrado" });
      }
      return res.json(card);
    } catch (error) {
      return next(error);
    }
  }
);

const baseValidators = [
  body("de").trim().notEmpty().withMessage("Campo 'de' é obrigatório").isLength({ max: 120 }),
  body("para").trim().notEmpty().withMessage("Campo 'para' é obrigatório").isLength({ max: 120 }),
  body("mensagem").trim().notEmpty().withMessage("Mensagem é obrigatória"),
  body("youtubeVideoId").optional({ values: "falsy" }).isLength({ max: 32 }).withMessage("youtubeVideoId inválido"),
  body("youtubeStartTime").optional({ values: "falsy" }).isInt({ min: 0 }).withMessage("youtubeStartTime deve ser inteiro"),
  body("audioDuration").optional({ values: "falsy" }).isInt({ min: 0, max: 300 }).withMessage("Duração do áudio inválida"),
];

// Configure multer for multiple file uploads
const uploadFields = upload.fields([
  { name: "foto", maxCount: 1 },
  { name: "audio", maxCount: 1 },
]);

router.post(
  "/",
  authenticate,
  uploadFields,
  baseValidators,
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const fotoFile = files?.foto?.[0];
      const audioFile = files?.audio?.[0];
      
      const card = await createCard(
        {
          userId: req.userId!,
          de: String(req.body.de),
          para: String(req.body.para),
          mensagem: String(req.body.mensagem),
          youtubeVideoId: req.body.youtubeVideoId ? String(req.body.youtubeVideoId) : null,
          youtubeStartTime: req.body.youtubeStartTime ? Number(req.body.youtubeStartTime) : null,
          audioDuration: req.body.audioDuration ? Number(req.body.audioDuration) : null,
        },
        fotoFile
          ? { buffer: fotoFile.buffer, mimetype: fotoFile.mimetype, originalName: fotoFile.originalname }
          : null,
        audioFile
          ? { buffer: audioFile.buffer, mimetype: audioFile.mimetype, originalName: audioFile.originalname }
          : null
      );
      logger.info("Cartão criado", { cardId: card.id, userId: req.userId });
      return res.status(201).json(card);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Campos de")) {
        return res.status(400).json({ error: error.message });
      }
      return next(error);
    }
  }
);

router.put(
  "/:id",
  authenticate,
  param("id").isUUID().withMessage("ID inválido"),
  upload.single("foto"),
  baseValidators.map((rule) => rule.optional({ values: "falsy" })),
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const card = await updateCard(
        String(req.params.id),
        req.userId!,
        {
          de: req.body.de,
          para: req.body.para,
          mensagem: req.body.mensagem,
          youtubeVideoId: req.body.youtubeVideoId,
          youtubeStartTime: req.body.youtubeStartTime ? Number(req.body.youtubeStartTime) : undefined,
        },
        req.file
          ? { buffer: req.file.buffer, mimetype: req.file.mimetype, originalName: req.file.originalname }
          : null
      );
      logger.info("Cartão atualizado", { cardId: card.id, userId: req.userId });
      return res.json(card);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Cartão não encontrado")) {
        return res.status(404).json({ error: error.message });
      }
      return next(error);
    }
  }
);

router.delete(
  "/:id",
  authenticate,
  param("id").isUUID().withMessage("ID inválido"),
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteCard(String(req.params.id), req.userId!);
      logger.info("Cartão removido", { cardId: req.params.id, userId: req.userId });
      return res.json({ success: true });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Cartão não encontrado")) {
        return res.status(404).json({ error: error.message });
      }
      return next(error);
    }
  }
);

export const cardRouter = router;
