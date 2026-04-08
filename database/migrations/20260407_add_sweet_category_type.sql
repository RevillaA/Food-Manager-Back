-- Primera Linea ejecucion
ALTER TYPE public.category_type_enum ADD VALUE IF NOT EXISTS 'SWEET';

-- Segunda Linea ejecucion
UPDATE public.categories
SET category_type = 'SWEET'
WHERE LOWER(name) IN ('postres', 'sweet')
  AND category_type <> 'SWEET';