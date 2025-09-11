import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export const sessionSchema = z.object({
  token: z.string(),
  adminId: z.string(),
  expiresAt: z.date(),
});

// User schemas
export const createUserSchema = z.object({
  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellido paterno requerido'),
  secondLastName: z.string().optional(),
  dob: z.coerce.date(),
  vigencia: z.coerce.date().optional(),
  phoneMx: z.string().regex(/^\d{10}$/, 'Teléfono debe tener 10 dígitos'),
  credencialNum: z.string().min(1, 'Número de credencial requerido'),
  gafeteNum: z.string().min(1, 'Número de gafete requerido'),
  address: z.object({
    street: z.string().min(1, 'Calle requerida'),
    exteriorNo: z.string().optional(),
    interiorNo: z.string().optional(),
    neighborhood: z.string().min(1, 'Colonia requerida'),
    city: z.string().min(1, 'Ciudad requerida'),
    municipality: z.string().min(1, 'Municipio requerido'),
    state: z.string().min(1, 'Estado requerido'),
    postalCode: z.string().regex(/^\d{5}$/, 'Código postal debe tener 5 dígitos'),
    references: z.string().optional(),
  }),
});

export const updateUserSchema = createUserSchema.partial();

export const searchUsersSchema = z.object({
  query: z.string().min(1, 'Consulta de búsqueda requerida'),
});

// Vigency schemas
export const applyVigencySchema = z.object({
  note: z.string().optional(),
});

// Settings schemas
export const updateSettingsSchema = z.object({
  ajustadorColima: z.string().min(1, 'Ajustador Colima requerido'),
  ajustadorTecoman: z.string().min(1, 'Ajustador Tecomán requerido'),
  ajustadorManzanillo: z.string().min(1, 'Ajustador Manzanillo requerido'),
});

// File upload schemas
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 2 * 1024 * 1024, 'El archivo debe ser menor a 2MB')
    .refine(
      (file) => ['image/png', 'image/jpeg'].includes(file.type),
      'Solo se permiten archivos PNG o JPEG'
    ),
});

// Response types
export type LoginRequest = z.infer<typeof loginSchema>;
export type CreateUserRequest = z.infer<typeof createUserSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
export type SearchUsersRequest = z.infer<typeof searchUsersSchema>;
export type ApplyVigencyRequest = z.infer<typeof applyVigencySchema>;
export type UpdateSettingsRequest = z.infer<typeof updateSettingsSchema>;
export type FileUploadRequest = z.infer<typeof fileUploadSchema>;
