import { z } from "zod";

export const usuarioResponseSchema = z.object({
  id: z.number().int().positive(),
  correo: z.string().email().max(160),

  nombre: z.string().max(120).nullable().optional(),
  apellido: z.string().max(160).nullable().optional(),
  telefono: z.string().regex(/^\d{10}$/).nullable().optional(),

  validado: z.boolean(),

  createdAt: z.string().datetime(), 
  updatedAt: z.string().datetime(),
}).strict();

export type UsuarioResponse = z.infer<typeof usuarioResponseSchema>;
