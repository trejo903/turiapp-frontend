import { z } from "zod";

export const sitioSchema = z
  .object({
    id: z.number().int().positive(),

    nombre: z.string().min(1).max(120),
    img: z.string().min(1).max(512),

    telefono: z.string().min(1).max(20),
    estado: z.string().min(1).max(100),
    municipio: z.string().min(1).max(100),
    cp: z.string().min(1).max(5),
    fraccionamiento: z.string().min(1).max(120),
    calle: z.string().min(1).max(120),

    // decimal -> puede venir string
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),

    categoriaId: z.number().int(),

    // decimales -> pueden venir string
    porcentajeTuringApp: z.coerce.number().default(0),
    porcentajeCostoTransporteTuringApp: z.coerce.number().default(0),
    porcentajeCostoEmpresa: z.coerce.number().default(0),

    // 👇 relaciones (solo si tu backend las manda)
    // imagenes: z.array(z.any()).optional(),
    // opiniones: z.array(z.any()).optional(),
    // favoritos: z.array(z.any()).optional(),
    // categoria: z.any().optional(),
  })
  .strict();

export type Sitio = z.infer<typeof sitioSchema>;
