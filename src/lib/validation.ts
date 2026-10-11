import { z } from 'zod';
import { PRIORITIES } from './types';

const MAX_CELL_LENGTH = 50000;

export const keywordCreateSchema = z.object({
  keyword: z.string().min(1, 'Keyword is required').max(500, 'Keyword too long'),
  volume: z.number().int().min(0, 'Volume must be 0 or greater'),
  category: z.string().min(1, 'Category is required'),
  status: z.string().optional(),
  priority: z.enum(PRIORITIES).optional(),
  target_url: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  assigned_to: z.string().optional(),
  content: z.string().max(MAX_CELL_LENGTH, `Content must be under ${MAX_CELL_LENGTH} characters`).optional(),
  meta_title: z.string().max(500, 'Meta title too long').optional(),
  meta_description: z.string().max(1000, 'Meta description too long').optional(),
  notes: z.string().max(MAX_CELL_LENGTH, `Notes must be under ${MAX_CELL_LENGTH} characters`).optional(),
});

export const keywordUpdateSchema = z.object({
  id: z.string().uuid('Invalid keyword ID'),
  keyword: z.string().min(1, 'Keyword is required').max(500, 'Keyword too long').optional(),
  volume: z.number().int().min(0, 'Volume must be 0 or greater').optional(),
  category: z.string().min(1, 'Category is required').optional(),
  status: z.string().optional(),
  priority: z.enum(PRIORITIES).optional(),
  target_url: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  assigned_to: z.string().optional(),
  content: z.string().max(MAX_CELL_LENGTH, `Content must be under ${MAX_CELL_LENGTH} characters`).optional(),
  meta_title: z.string().max(500, 'Meta title too long').optional(),
  meta_description: z.string().max(1000, 'Meta description too long').optional(),
  notes: z.string().max(MAX_CELL_LENGTH, `Notes must be under ${MAX_CELL_LENGTH} characters`).optional(),
});

export const keywordDeleteSchema = z.object({
  id: z.string().uuid('Invalid keyword ID'),
});

export const bulkActionSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one keyword must be selected'),
  action: z.enum(['delete', 'update']),
  field: z.string().optional(),
  value: z.string().optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});
