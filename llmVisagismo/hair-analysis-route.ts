/**
 * Espejo AI — Endpoint de análisis capilar
 * Stack: Fastify + TypeScript + sharp + file-type + zod
 *
 * Flujo:
 *  1. Recibe la imagen (multipart)
 *  2. Valida tipo real de archivo (magic bytes), tamaño y dimensiones
 *  3. Re-codifica con sharp -> elimina EXIF, payloads esteganográficos, polyglots
 *  4. Envía al agente de análisis (modelo con visión) -> valida JSON de salida
 *  5. Si el usuario elige una recomendación, llama al agente de edición de imagen
 *
 * Requiere: npm i fastify @fastify/multipart sharp file-type zod
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";
import { z } from "zod";
import { randomUUID } from "crypto";

// ---------- Config ----------
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_DIMENSION = 4096; // px
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const ANALYSIS_SYSTEM_PROMPT = `__PEGAR_AQUI_EL_PROMPT_DEL_AGENTE_DE_ANALISIS__`; // ver prompts.md

// ---------- Schema de validación de la respuesta del modelo ----------
const RecomendacionSchema = z.object({
  nombre_corte: z.string().min(1).max(120),
  justificacion_visagista: z.string().min(1).max(600),
  mantenimiento: z.string().min(1).max(300),
});

const AnalysisSchema = z.union([
  z.object({
    forma_rostro: z.string().min(1).max(60),
    tipo_cabello: z.string().min(1).max(60),
    tono_piel: z.string().min(1).max(60),
    recomendaciones: z.array(RecomendacionSchema).min(1).max(5),
    prompt_edicion_imagen: z.string().min(1).max(500),
  }),
  z.object({ error: z.string() }),
]);

// ---------- Rate limiting simple en memoria (usar Redis en producción) ----------
const requestLog = new Map<string, number[]>();
const RATE_LIMIT = 10; // requests
const RATE_WINDOW_MS = 60 * 1000; // por minuto

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(key) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS
  );
  timestamps.push(now);
  requestLog.set(key, timestamps);
  return timestamps.length > RATE_LIMIT;
}

// ---------- Sanitización y re-codificación de la imagen ----------
async function sanitizeImage(buffer: Buffer): Promise<Buffer> {
  // 1. Verifica el tipo REAL por contenido, no por extensión ni Content-Type del request
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !ALLOWED_MIME.has(detected.mime)) {
    throw new Error("Tipo de archivo no permitido o no reconocido.");
  }

  // 2. Verifica dimensiones antes de procesar (evita decompression bombs)
  const metadata = await sharp(buffer).metadata();
  if (
    !metadata.width ||
    !metadata.height ||
    metadata.width > MAX_DIMENSION ||
    metadata.height > MAX_DIMENSION
  ) {
    throw new Error("Dimensiones de imagen inválidas o excesivas.");
  }

  // 3. Re-codifica desde cero: esto DESTRUYE EXIF, metadata, y cualquier
  //    payload esteganográfico o "polyglot" (archivo válido como imagen + script).
  //    Nunca reenvíes el buffer original al modelo ni lo guardes tal cual.
  const clean = await sharp(buffer)
    .rotate() // normaliza orientación según EXIF antes de eliminarlo
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();

  return clean;
}

// ---------- Handler principal ----------
export async function registerHairAnalysisRoute(app: FastifyInstance) {
  app.post(
    "/api/hair-analysis",
    async (req: FastifyRequest, reply: FastifyReply) => {
      const clientKey = req.ip; // en producción: userId autenticado, no solo IP
      if (isRateLimited(clientKey)) {
        return reply.code(429).send({ error: "Demasiadas solicitudes. Intenta más tarde." });
      }

      const file = await req.file(); // @fastify/multipart
      if (!file) {
        return reply.code(400).send({ error: "No se recibió ninguna imagen." });
      }

      const raw = await file.toBuffer();
      if (raw.byteLength > MAX_FILE_BYTES) {
        return reply.code(413).send({ error: "La imagen supera el tamaño máximo permitido (8MB)." });
      }

      let cleanImage: Buffer;
      try {
        cleanImage = await sanitizeImage(raw);
      } catch (err) {
        req.log.warn({ err }, "Imagen rechazada en sanitización");
        return reply.code(400).send({ error: "Imagen inválida o corrupta." });
      }

      // Nombre interno aleatorio; nunca usar el nombre original del usuario
      const internalId = randomUUID();

      // Opcional: escaneo antivirus antes de persistir (ej. ClamAV vía clamscan)
      // await scanWithClamAV(cleanImage);

      let modelRawOutput: string;
      try {
        modelRawOutput = await callAnalysisAgent(cleanImage);
      } catch (err) {
        req.log.error({ err }, "Fallo al llamar al agente de análisis");
        return reply.code(502).send({ error: "No se pudo procesar la imagen en este momento." });
      }

      // Nunca confíes en el output del modelo sin validar contra schema
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(stripMarkdownFences(modelRawOutput));
      } catch {
        return reply.code(502).send({ error: "Respuesta del modelo no válida." });
      }

      const validation = AnalysisSchema.safeParse(parsedJson);
      if (!validation.success) {
        req.log.warn({ issues: validation.error.issues }, "Schema inválido del modelo");
        return reply.code(502).send({ error: "Respuesta del modelo no válida." });
      }

      if ("error" in validation.data) {
        return reply.code(422).send(validation.data);
      }

      // Guarda cleanImage + internalId + validation.data en tu store (Postgres/S3)
      // asociado al perfil del cliente, aquí solo se retorna al frontend.

      return reply.send({ id: internalId, ...validation.data });
    }
  );

  // ---------- Paso 2: edición de imagen aplicando el corte elegido ----------
  app.post(
    "/api/hair-analysis/:id/apply",
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clientKey = req.ip;
      if (isRateLimited(clientKey)) {
        return reply.code(429).send({ error: "Demasiadas solicitudes. Intenta más tarde." });
      }

      const BodySchema = z.object({
        promptEdicionImagen: z.string().min(1).max(500),
      });
      const body = BodySchema.safeParse((req.body as any) ?? {});
      if (!body.success) {
        return reply.code(400).send({ error: "Datos inválidos." });
      }

      // Recupera la imagen limpia guardada por :id (no uses una nueva subida sin validar)
      // const cleanImage = await getStoredImage(req.params.id);

      try {
        const editedImageBuffer = await callImageEditAgent(
          /* cleanImage */ Buffer.alloc(0),
          body.data.promptEdicionImagen
        );
        reply.header("Content-Type", "image/jpeg");
        return reply.send(editedImageBuffer);
      } catch (err) {
        req.log.error({ err }, "Fallo al aplicar edición de imagen");
        return reply.code(502).send({ error: "No se pudo generar la imagen editada." });
      }
    }
  );
}

// ---------- Helpers ----------
function stripMarkdownFences(text: string): string {
  return text.replace(/^```json\s*|```$/g, "").trim();
}

async function callAnalysisAgent(imageBuffer: Buffer): Promise<string> {
  // Llamada al modelo con visión (Claude/GPT-4o/Gemini).
  // system: ANALYSIS_SYSTEM_PROMPT
  // input: imageBuffer en base64 como content block tipo "image"
  // Ejemplo con Anthropic SDK omitido por brevedad — reemplazar con tu cliente real.
  throw new Error("Implementar llamada real al modelo de visión");
}

async function callImageEditAgent(
  imageBuffer: Buffer,
  editPrompt: string
): Promise<Buffer> {
  // Llamada al proveedor de edición de imagen (ej. Gemini image edit).
  // Interpola editPrompt dentro de la plantilla fija de prompts.md,
  // nunca lo uses solo (siempre envuelto en las reglas de preservación de identidad).
  throw new Error("Implementar llamada real al modelo de edición de imagen");
}
