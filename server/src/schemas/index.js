import { z } from 'zod';

export const IdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const SearchQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
});

export const LoginSchema = z.object({
  username: z.string().trim().min(3).max(80),
  password: z.string().min(6).max(200),
});

export const ClienteCreateSchema = z.object({
  nombre: z.string().trim().min(2).max(160),
  cedula: z.string().trim().min(5).max(20).regex(/^[0-9A-Za-z.\-]+$/, 'cédula inválida'),
  telefono: z.string().trim().max(40).optional().default(''),
  email: z.string().trim().email().max(160).optional().or(z.literal('')).transform(v => v || ''),
  direccion: z.string().trim().max(255).optional().default(''),
});

export const ClienteUpdateSchema = ClienteCreateSchema.partial();

const placaRegex = /^[A-Z]{3}[0-9]{3}$/;

export const VehiculoCreateSchema = z.object({
  clienteId: z.coerce.number().int().positive(),
  placa: z.string().trim().toUpperCase().regex(placaRegex, 'placa debe tener formato AAA000'),
  marca: z.string().trim().min(1).max(80),
  linea: z.string().trim().max(80).optional().default(''),
  modelo: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1),
  color: z.string().trim().max(40).optional().default(''),
  clase: z.string().trim().max(40).optional().default(''),
  tipoVehiculo: z.enum(['liviano', 'moto', 'pesado']).optional().default('liviano'),
  cilindraje: z.coerce.number().int().min(0).max(20000).optional().default(0),
  combustible: z.string().trim().max(40).optional().default('Gasolina'),
  kilometraje: z.coerce.number().int().min(0).max(9_999_999).optional().default(0),
  soatVence: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha debe ser YYYY-MM-DD').optional().nullable(),
  tecnomecanicaVence: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha debe ser YYYY-MM-DD').optional().nullable(),
});

export const VehiculoUpdateSchema = VehiculoCreateSchema.partial();

export const PolizaCreateSchema = z.object({
  vehiculoId: z.coerce.number().int().positive(),
  tipo: z.enum(['soat', 'todo_riesgo']),
  aseguradora: z.string().trim().min(2).max(80),
  numero: z.string().trim().max(80).optional().default(''),
  inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  prima: z.coerce.number().positive().max(100_000_000),
}).refine(d => new Date(d.fin) > new Date(d.inicio), {
  message: 'fin debe ser posterior a inicio',
  path: ['fin'],
});

export const CitaCreateSchema = z.object({
  vehiculoId: z.coerce.number().int().positive(),
  servicioId: z.string().trim().min(1).max(40),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora: z.string().regex(/^\d{2}:\d{2}$/),
  tecnico: z.string().trim().max(120).optional().default('Por asignar'),
  obs: z.string().trim().max(500).optional().default(''),
});

export const CitaUpdateSchema = z.object({
  vehiculoId: z.coerce.number().int().positive().optional(),
  servicioId: z.string().trim().min(1).max(40).optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hora: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  estado: z.enum(['agendada', 'en proceso', 'completada', 'cancelada']).optional(),
  tecnico: z.string().trim().max(120).optional(),
  obs: z.string().trim().max(500).optional(),
});

export const TramiteCreateSchema = z.object({
  clienteId: z.coerce.number().int().positive(),
  vehiculoId: z.coerce.number().int().positive().optional().nullable(),
  tipo: z.string().trim().min(2).max(160),
  descripcion: z.string().trim().max(2000).optional().default(''),
  documentos: z.array(z.string().trim().min(1).max(200)).max(50).optional().default([]),
  gestor: z.string().trim().max(120).optional().default('admin'),
});

export const TramiteUpdateSchema = z.object({
  clienteId: z.coerce.number().int().positive().optional(),
  vehiculoId: z.coerce.number().int().positive().optional().nullable(),
  tipo: z.string().trim().min(2).max(160).optional(),
  descripcion: z.string().trim().max(2000).optional(),
  documentos: z.array(z.string().trim().min(1).max(200)).max(50).optional(),
  gestor: z.string().trim().max(120).optional(),
  estado: z.enum(['recibido', 'en proceso', 'radicado', 'finalizado', 'rechazado']).optional(),
});

export const PagoCreateSchema = z.object({
  polizaId: z.coerce.number().int().positive().optional().nullable(),
  clienteId: z.coerce.number().int().positive(),
  monto: z.coerce.number().positive().max(100_000_000),
  metodo: z.enum(['pse', 'tarjeta', 'efectivo', 'transferencia', 'nequi', 'daviplata']),
  ref: z.string().trim().max(120).optional().default(''),
});

const checkEstado = z.enum(['ok', 'fail', 'na']);

export const InspeccionCreateSchema = z.object({
  vehiculoId: z.coerce.number().int().positive(),
  tecnico: z.string().trim().max(120).optional().default('admin'),
  resultado: z.enum(['aprobado', 'rechazado']).optional(),
  items: z.record(z.string().min(1).max(60), checkEstado).refine(o => Object.keys(o).length > 0, {
    message: 'items no puede estar vacío',
  }),
  obs: z.string().trim().max(2000).optional().default(''),
});

export const InspeccionQuerySchema = z.object({
  vehiculoId: z.coerce.number().int().positive().optional(),
});

export const CotizarItemSchema = z.object({
  servicioId: z.string().trim().min(1).max(40),
  cantidad: z.coerce.number().int().positive().max(100).optional().default(1),
});

export const CotizarSchema = z.object({
  items: z.array(CotizarItemSchema).min(1).max(50),
  descuentoPct: z.coerce.number().min(0).max(100).optional().default(0),
});

export const RecordatorioCreateSchema = z.object({
  placa: z.string().trim().min(5).max(8).regex(/^[A-Z0-9-]+$/i, 'Placa solo letras, números y guiones'),
  nombre: z.string().trim().min(2).max(120),
  cedula: z.string().trim().min(5).max(20).regex(/^[0-9]+$/, 'Cédula solo dígitos'),
  celular: z.string().trim().min(7).max(15).regex(/^[0-9+]+$/, 'Celular solo dígitos y +'),
});
