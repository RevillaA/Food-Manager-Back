-- Migration: Add sale_identifier column to sales table
-- Purpose: Store human-readable sale identifier with format: YYYYMMDD_ORDERNUMBER_USERINITIAL

ALTER TABLE public.sales 
ADD COLUMN sale_identifier VARCHAR(20) NOT NULL DEFAULT '' ;

-- Create unique constraint on sale_identifier per daily_session
ALTER TABLE public.sales
ADD CONSTRAINT uq_sales_identifier_per_session UNIQUE (daily_session_id, sale_identifier);

-- Update existing records with a placeholder identifier (optional, can be left empty)
UPDATE public.sales 
SET sale_identifier = TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '_' || LPAD(sale_number::text, 3, '0') || '_MIGR'
WHERE sale_identifier = '';
