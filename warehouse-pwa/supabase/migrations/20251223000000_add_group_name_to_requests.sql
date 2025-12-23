-- Add optional group_name field to requests for grouping by client/order
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS group_name TEXT;
