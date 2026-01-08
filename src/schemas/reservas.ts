// src/schemas/reservas.ts
import { z } from "zod";
import { sitioSchema } from "./sitios.schema";
import { usuarioResponseSchema } from "./usuario";

// ✅ Acepta Date o string y SIEMPRE lo deja como string ISO (datetime)
const isoDate = z.preprocess((v) => {
  if (v instanceof Date) return v.toISOString();

  if (typeof v === "string") {
    // Si viene solo DATE (YYYY-MM-DD), conviértelo a ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      return new Date(v + "T00:00:00.000Z").toISOString();
    }
    return v; // ISO normal
  }

  return v;
}, z.string().datetime());


export const ReservaSchema = z
  .object({
    id: z.coerce.number().int().positive(),

    tipo: z.string().nullable().optional(),

    usuario_id: z.coerce.number().int().nullable().optional(),

    // tu backend a veces manda sitio_id, y tú a veces usas sitioId
    sitio_id: z.coerce.number().int().nullable().optional(),
    sitioId: z.coerce.number().int().nullable().optional(),

    usuario: usuarioResponseSchema.nullable().optional(),
    sitio: sitioSchema.nullable().optional(),

    nombre: z.string().nullable().optional(),
    telefono: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),

    transporte: z.coerce.boolean(),

    // ✅ siempre string ISO (o null/undefined)
    fecha: isoDate.nullable().optional(),
    fecha_entrada: isoDate.nullable().optional(),
    fecha_salida: isoDate.nullable().optional(),

    personas: z.coerce.number().int().nullable().optional(),
    adultos: z.coerce.number().int().nullable().optional(),
    menores: z.coerce.number().int().nullable().optional(),

    notificationId: z.string().nullable().optional(),
  })
  // ✅ normaliza sitio_id usando sitioId si hace falta
  .transform((r) => ({
    ...r,
    sitio_id: r.sitio_id ?? r.sitioId ?? null,
  }));

export type Reserva = z.infer<typeof ReservaSchema>;

export const ReservasListSchema = z.array(ReservaSchema);

export function normalizeReservasResponse(raw: unknown): Reserva[] {
  const arr = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as any).data)
      ? (raw as any).data
      : [];

  const parsed = ReservasListSchema.safeParse(arr);
  if (!parsed.success) {
    console.warn("❌ Reservas Zod error:", parsed.error.flatten());
    return [];
  }
  return parsed.data;
}
