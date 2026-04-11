-- Migration: Add sale_identifier column to sales table
-- Purpose: Store human-readable sale identifier with format: YYYYMMDD_ORDERNUMBER_USERINITIAL

ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS sale_identifier VARCHAR(20);

ALTER TABLE public.sales
ALTER COLUMN sale_identifier SET DEFAULT '';

-- Create unique constraint on sale_identifier per daily_session
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'uq_sales_identifier_per_session'
		  AND conrelid = 'public.sales'::regclass
	) THEN
		ALTER TABLE public.sales
		ADD CONSTRAINT uq_sales_identifier_per_session UNIQUE (daily_session_id, sale_identifier);
	END IF;
END;
$$;

-- Update existing records with a placeholder identifier (optional, can be left empty)
UPDATE public.sales
SET sale_identifier = TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '_' || LPAD(sale_number::text, 3, '0') || '_MIGR'
WHERE sale_identifier IS NULL OR sale_identifier = '';

ALTER TABLE public.sales
ALTER COLUMN sale_identifier SET NOT NULL;
