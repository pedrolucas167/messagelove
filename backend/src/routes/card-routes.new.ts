/**
 * Card Routes - REST Level 2 Maturity
 * 
 * REST Level 2 Principles Applied:
 * - Recursos: /cards (coleção) e /cards/:id (item)
 * - Verbos HTTP semânticos: GET, POST, PUT, DELETE
 * - Status codes apropriados: 200, 201, 204, 400, 401, 404
 * - Content negotiation: application/json
 */

import { Router, RequestHandler } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { authenticate, optionalAuth } from '../middlewares/auth.new';
import { validate, getValidatedData } from '../middlewares/validation';
import { asyncHandler } from '../middlewares/error-handler.new';
import { cardService } from '../services/card.service.new';
import { CreateCardSchema, UpdateCardSchema, CardIdSchema, toCardResponseDTO } from '../dtos/card.dto';
import { Result } from '../core/types/result';
import { logger } from '../config/logger';

const router = Router();

// Multer config para uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 16 * 1024 * 1024 }, // 16MB
});

const uploadFields = upload.fields([
  { name: 'foto', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
]);

// Query params schema
const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.enum(['createdAt', 'updatedAt']).default('createdAt'),
  orderDirection: z.enum(['ASC', 'DESC']).default('DESC'),
});

/**
 * GET /cards
 * Lista todos os cards do usuário autenticado
 * 
 * Response: 200 OK
 * {
 *   success: true,
 *   data: CardResponseDTO[],
 *   meta: { page, limit, total, totalPages }
 * }
 */
router.get(
  '/',
  authenticate,
  validate({ query: ListQuerySchema }),
  asyncHandler(async (req, res) => {
    const { query } = getValidatedData<unknown, unknown, z.infer<typeof ListQuerySchema>>(req);
    const userId = req.userId!;

    const result = await cardService.listByUser(userId, {
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
      orderBy: query.orderBy,
      orderDirection: query.orderDirection,
    });

    if (!result.success) {
      return res.status(result.error.statusCode).json(result.error.toJSON());
    }

    const countResult = await cardService.countByUser(userId);
    const total = Result.isOk(countResult) ? countResult.data : 0;

    return res.status(200).json({
      success: true,
      data: result.data.map(toCardResponseDTO),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  })
);

/**
 * GET /cards/:id
 * Busca um card por ID (público para visualização)
 * 
 * Response: 200 OK | 404 Not Found
 */
router.get(
  '/:id',
  optionalAuth,
  validate({ params: CardIdSchema }),
  asyncHandler(async (req, res) => {
    const { params } = getValidatedData<unknown, z.infer<typeof CardIdSchema>>(req);

    const result = await cardService.findById(params.id);

    if (!result.success) {
      return res.status(result.error.statusCode).json(result.error.toJSON());
    }

    return res.status(200).json({
      success: true,
      data: toCardResponseDTO(result.data),
    });
  })
);

/**
 * POST /cards
 * Cria um novo card
 * 
 * Request: multipart/form-data (para foto e áudio)
 * Response: 201 Created | 400 Bad Request | 401 Unauthorized
 */
router.post(
  '/',
  authenticate,
  uploadFields as unknown as RequestHandler,
  validate({ body: CreateCardSchema }),
  asyncHandler(async (req, res) => {
    const { body } = getValidatedData<z.infer<typeof CreateCardSchema>>(req);
    const userId = req.userId!;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const photoFile = files?.foto?.[0];
    const audioFile = files?.audio?.[0];

    const result = await cardService.create(
      userId,
      body,
      photoFile
        ? { buffer: photoFile.buffer, mimetype: photoFile.mimetype, originalName: photoFile.originalname }
        : null,
      audioFile
        ? { buffer: audioFile.buffer, mimetype: audioFile.mimetype, originalName: audioFile.originalname }
        : null
    );

    if (!result.success) {
      return res.status(result.error.statusCode).json(result.error.toJSON());
    }

    logger.info('Card criado via API', { cardId: result.data.id, userId });

    // 201 Created com Location header (REST Level 2)
    return res
      .status(201)
      .location(`/api/cards/${result.data.id}`)
      .json({
        success: true,
        data: toCardResponseDTO(result.data),
      });
  })
);

/**
 * PUT /cards/:id
 * Atualiza um card existente (substituição completa)
 * 
 * Response: 200 OK | 400 Bad Request | 401 Unauthorized | 404 Not Found
 */
router.put(
  '/:id',
  authenticate,
  upload.single('foto') as unknown as RequestHandler,
  validate({
    params: CardIdSchema,
    body: UpdateCardSchema,
  }),
  asyncHandler(async (req, res) => {
    const { params, body } = getValidatedData<
      z.infer<typeof UpdateCardSchema>,
      z.infer<typeof CardIdSchema>
    >(req);
    const userId = req.userId!;

    const result = await cardService.update(
      params.id,
      userId,
      body,
      req.file
        ? { buffer: req.file.buffer, mimetype: req.file.mimetype, originalName: req.file.originalname }
        : null
    );

    if (!result.success) {
      return res.status(result.error.statusCode).json(result.error.toJSON());
    }

    logger.info('Card atualizado via API', { cardId: params.id, userId });

    return res.status(200).json({
      success: true,
      data: toCardResponseDTO(result.data),
    });
  })
);

/**
 * PATCH /cards/:id
 * Atualização parcial de um card
 * 
 * Response: 200 OK | 400 Bad Request | 401 Unauthorized | 404 Not Found
 */
router.patch(
  '/:id',
  authenticate,
  upload.single('foto') as unknown as RequestHandler,
  validate({
    params: CardIdSchema,
    body: UpdateCardSchema.partial(),
  }),
  asyncHandler(async (req, res) => {
    const { params, body } = getValidatedData<
      Partial<z.infer<typeof UpdateCardSchema>>,
      z.infer<typeof CardIdSchema>
    >(req);
    const userId = req.userId!;

    const result = await cardService.update(
      params.id,
      userId,
      body,
      req.file
        ? { buffer: req.file.buffer, mimetype: req.file.mimetype, originalName: req.file.originalname }
        : null
    );

    if (!result.success) {
      return res.status(result.error.statusCode).json(result.error.toJSON());
    }

    return res.status(200).json({
      success: true,
      data: toCardResponseDTO(result.data),
    });
  })
);

/**
 * DELETE /cards/:id
 * Remove um card
 * 
 * Response: 204 No Content | 401 Unauthorized | 404 Not Found
 */
router.delete(
  '/:id',
  authenticate,
  validate({ params: CardIdSchema }),
  asyncHandler(async (req, res) => {
    const { params } = getValidatedData<unknown, z.infer<typeof CardIdSchema>>(req);
    const userId = req.userId!;

    const result = await cardService.delete(params.id, userId);

    if (!result.success) {
      return res.status(result.error.statusCode).json(result.error.toJSON());
    }

    logger.info('Card deletado via API', { cardId: params.id, userId });

    // 204 No Content (REST Level 2)
    return res.status(204).send();
  })
);

export const cardRouter = router;
