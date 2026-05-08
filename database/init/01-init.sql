--
-- PostgreSQL database dump
--

-- Dumped from database version 16.13 (Debian 16.13-1.pgdg13+1)
-- Dumped by pg_dump version 16.10

-- Started on 2026-03-28 17:43:16 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', 'public', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS pgcrypto;

--
-- TOC entry 892 (class 1247 OID 16428)
-- Name: category_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.category_type_enum AS ENUM (
    'MAIN_DISH',
    'DRINK',
    'EXTRA',
    'SWEET'
);

--
-- TOC entry 907 (class 1247 OID 16462)
-- Name: daily_session_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.daily_session_status_enum AS ENUM (
    'OPEN',
    'CLOSED'
);


--
-- TOC entry 895 (class 1247 OID 16436)
-- Name: order_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_status_enum AS ENUM (
    'OPEN',
    'CLOSED',
    'CANCELLED'
);


--
-- TOC entry 904 (class 1247 OID 16456)
-- Name: payment_method_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_method_enum AS ENUM (
    'CASH',
    'TRANSFER'
);


--
-- TOC entry 901 (class 1247 OID 16450)
-- Name: payment_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status_enum AS ENUM (
    'PAID',
    'PENDING'
);


--
-- TOC entry 898 (class 1247 OID 16444)
-- Name: preparation_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.preparation_status_enum AS ENUM (
    'IN_PROGRESS',
    'SERVED'
);


--
-- TOC entry 889 (class 1247 OID 16423)
-- Name: role_name_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.role_name_enum AS ENUM (
    'ADMIN',
    'CASHIER'
);


--
-- TOC entry 262 (class 1255 OID 16684)
-- Name: recalculate_order_subtotal(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.recalculate_order_subtotal() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE orders
    SET subtotal = COALESCE((
        SELECT SUM(line_total)
        FROM order_items
        WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    ), 0)
    WHERE id = COALESCE(NEW.order_id, OLD.order_id);

    RETURN NULL;
END;
$$;


--
-- TOC entry 261 (class 1255 OID 16467)
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- TOC entry 263 (class 1255 OID 16688)
-- Name: validate_sale_order_closed(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_sale_order_closed() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_order_status order_status_enum;
BEGIN
    SELECT status
    INTO v_order_status
    FROM orders
    WHERE id = NEW.order_id;

    IF v_order_status IS NULL THEN
        RAISE EXCEPTION 'Order does not exist.';
    END IF;

    IF v_order_status <> 'CLOSED' THEN
        RAISE EXCEPTION 'A sale can only be created from a CLOSED order.';
    END IF;

    RETURN NEW;
END;
$$;


--
-- TOC entry 264 (class 1255 OID 16690)
-- Name: validate_sale_session_matches_order(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_sale_session_matches_order() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_daily_session_id UUID;
BEGIN
    SELECT daily_session_id
    INTO v_daily_session_id
    FROM orders
    WHERE id = NEW.order_id;

    IF v_daily_session_id <> NEW.daily_session_id THEN
        RAISE EXCEPTION 'Sale daily_session_id must match the order daily_session_id.';
    END IF;

    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 218 (class 1259 OID 16502)
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(80) NOT NULL,
    category_type public.category_type_enum NOT NULL,
    description character varying(200),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 220 (class 1259 OID 16537)
-- Name: daily_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_date date NOT NULL,
    opened_by_user_id uuid NOT NULL,
    closed_by_user_id uuid,
    status public.daily_session_status_enum DEFAULT 'OPEN'::public.daily_session_status_enum NOT NULL,
    opened_at timestamp with time zone DEFAULT now() NOT NULL,
    closed_at timestamp with time zone,
    notes character varying(250),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_daily_sessions_closed_at_valid CHECK (((closed_at IS NULL) OR (closed_at >= opened_at)))
);


--
-- TOC entry 222 (class 1259 OID 16596)
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    line_total numeric(10,2) NOT NULL,
    notes character varying(200),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    preparation_status public.preparation_status_enum DEFAULT 'IN_PROGRESS'::public.preparation_status_enum NOT NULL,
    product_name character varying(120) NOT NULL,
    product_category_name character varying(80) NOT NULL,
    CONSTRAINT chk_order_items_line_total_positive CHECK ((line_total > (0)::numeric)),
    CONSTRAINT chk_order_items_quantity_positive CHECK ((quantity > 0)),
    CONSTRAINT chk_order_items_unit_price_positive CHECK ((unit_price > (0)::numeric))
);


--
-- TOC entry 221 (class 1259 OID 16563)
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    daily_session_id uuid NOT NULL,
    created_by_user_id uuid NOT NULL,
    order_number integer NOT NULL,
    status public.order_status_enum DEFAULT 'OPEN'::public.order_status_enum NOT NULL,
    preparation_status public.preparation_status_enum DEFAULT 'IN_PROGRESS'::public.preparation_status_enum NOT NULL,
    subtotal numeric(10,2) DEFAULT 0.00 NOT NULL,
    notes character varying(250),
    closed_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_orders_cancelled_at_status CHECK (((status <> 'CANCELLED'::public.order_status_enum) OR (cancelled_at IS NOT NULL))),
    CONSTRAINT chk_orders_closed_at_status CHECK (((status <> 'CLOSED'::public.order_status_enum) OR (closed_at IS NOT NULL))),
    CONSTRAINT chk_orders_subtotal_non_negative CHECK ((subtotal >= (0)::numeric))
);


--
-- TOC entry 219 (class 1259 OID 16516)
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    name character varying(120) NOT NULL,
    description character varying(250),
    base_price numeric(10,2) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_products_base_price_positive CHECK ((base_price > (0)::numeric))
);


--
-- TOC entry 216 (class 1259 OID 16468)
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name public.role_name_enum NOT NULL,
    description character varying(150),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 224 (class 1259 OID 16660)
-- Name: sale_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sale_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    line_total numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    product_name character varying(120) DEFAULT 'TEMP_PRODUCT'::character varying NOT NULL,
    product_category_name character varying(80) DEFAULT 'TEMP_CATEGORY'::character varying NOT NULL,
    CONSTRAINT chk_sale_items_line_total_positive CHECK ((line_total > (0)::numeric)),
    CONSTRAINT chk_sale_items_quantity_positive CHECK ((quantity > 0)),
    CONSTRAINT chk_sale_items_unit_price_positive CHECK ((unit_price > (0)::numeric))
);


--
-- TOC entry 223 (class 1259 OID 16620)
-- Name: sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    daily_session_id uuid NOT NULL,
    order_id uuid NOT NULL,
    created_by_user_id uuid NOT NULL,
    sale_number integer NOT NULL,
    sale_identifier character varying(20) NOT NULL,
    payment_status public.payment_status_enum DEFAULT 'PAID'::public.payment_status_enum NOT NULL,
    payment_method public.payment_method_enum NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    total numeric(10,2) NOT NULL,
    paid_at timestamp with time zone,
    notes character varying(250),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_sales_paid_at_when_paid CHECK (((payment_status <> 'PAID'::public.payment_status_enum) OR (paid_at IS NOT NULL))),
    CONSTRAINT chk_sales_subtotal_positive CHECK ((subtotal > (0)::numeric)),
    CONSTRAINT chk_sales_total_gte_subtotal CHECK ((total >= subtotal)),
    CONSTRAINT chk_sales_total_positive CHECK ((total > (0)::numeric)),
    CONSTRAINT uq_sales_identifier_per_session UNIQUE (daily_session_id, sale_identifier)
);


--
-- TOC entry 217 (class 1259 OID 16479)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_id uuid NOT NULL,
    full_name character varying(120) NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(120),
    password_hash text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3648 (class 0 OID 16502)
-- Dependencies: 218
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.categories VALUES ('f1e80a95-3ba6-45d7-9bee-b791415dac11', 'Platos', 'MAIN_DISH', 'Platos principales del restaurante', true, '2026-03-25 01:49:15.567828+00', '2026-03-25 01:49:15.567828+00');
INSERT INTO public.categories VALUES ('a5ab0006-fe0e-4f27-9d41-eb9c7ef2fa6c', 'Bebidas', 'DRINK', 'Bebidas frías o calientes', true, '2026-03-25 01:49:15.567828+00', '2026-03-25 01:49:15.567828+00');
INSERT INTO public.categories VALUES ('3b1bec30-6daa-49f0-b57c-83e8817c4472', 'Extras', 'EXTRA', 'Complementos o agregados adicionales', true, '2026-03-25 01:49:15.567828+00', '2026-03-25 01:49:15.567828+00');
INSERT INTO public.categories VALUES ('aded9029-08d6-427a-87c9-310a9a1b2783', 'Postres', 'SWEET', 'Postres y dulces del local', true, '2026-03-25 21:45:09.085348+00', '2026-04-19 00:05:46.870394+00');

--
-- TOC entry 3649 (class 0 OID 16516)
-- Dependencies: 219
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.products VALUES ('318b6b11-82f3-4de0-97ba-9506a8892094', 'f1e80a95-3ba6-45d7-9bee-b791415dac11', 'Salchipapa', 'Papas con salchicha', 1.50, true, '2026-04-19 00:01:26.421712+00', '2026-04-19 00:01:26.421712+00');
INSERT INTO public.products VALUES ('c9f0bc75-0ad4-4d00-8ecc-e3a094aab2d4', 'f1e80a95-3ba6-45d7-9bee-b791415dac11', 'Papi pollo', 'Papas con pollo', 2.25, true, '2026-04-19 00:01:42.517548+00', '2026-04-19 00:01:42.517548+00');
INSERT INTO public.products VALUES ('5f55b4d4-de69-4796-a76a-e55325ddf29f', 'f1e80a95-3ba6-45d7-9bee-b791415dac11', 'Papi carne', 'Papas con carne', 1.80, true, '2026-04-19 00:01:56.415671+00', '2026-04-19 00:01:56.415671+00');
INSERT INTO public.products VALUES ('1d02df7a-a037-40b6-b593-7c07d3344625', 'f1e80a95-3ba6-45d7-9bee-b791415dac11', 'Papi huevo', 'Papas con huevo', 1.40, true, '2026-04-19 00:02:09.217266+00', '2026-04-19 00:02:09.217266+00');
INSERT INTO public.products VALUES ('c2e6b029-c6e4-4483-b3ad-2260814a3d19', 'f1e80a95-3ba6-45d7-9bee-b791415dac11', 'Morocho con empanada', 'Morocho acompañado de empanada', 1.25, true, '2026-04-19 00:02:23.280796+00', '2026-04-19 00:02:23.280796+00');
INSERT INTO public.products VALUES ('000fe6ac-1744-4bea-93e9-934f9db5b0ec', 'f1e80a95-3ba6-45d7-9bee-b791415dac11', 'Papa completa', 'Papas con salchicha acompañado de carne y huevo', 2.50, true, '2026-04-19 00:02:49.82078+00', '2026-04-19 00:02:49.82078+00');
INSERT INTO public.products VALUES ('bf8e4ffb-8e96-4417-ba9b-a21fcc0bda5d', 'f1e80a95-3ba6-45d7-9bee-b791415dac11', 'Super papa', 'Papas acompañadas con salchicha, pollo, carne y huevo', 3.50, true, '2026-04-19 00:03:18.612903+00', '2026-04-19 00:03:18.612903+00');
INSERT INTO public.products VALUES ('b3da23db-e88e-4517-9998-a144d34e1e6c', '3b1bec30-6daa-49f0-b57c-83e8817c4472', 'Salchicha', 'Porción adicional de salchicha', 0.60, true, '2026-04-19 00:03:44.352966+00', '2026-04-19 00:03:44.352966+00');
INSERT INTO public.products VALUES ('a0ac2ef2-d7f0-4c0c-aa0e-c5a5f9e63b7f', '3b1bec30-6daa-49f0-b57c-83e8817c4472', 'Huevo', 'Porción adicional de huevo', 0.30, true, '2026-04-19 00:03:58.106387+00', '2026-04-19 00:03:58.106387+00');
INSERT INTO public.products VALUES ('ff4e0002-4a2f-4826-8e31-791ecb2fd11d', '3b1bec30-6daa-49f0-b57c-83e8817c4472', 'Carne', 'Porción adicional de carne', 0.80, true, '2026-04-19 00:04:10.522872+00', '2026-04-19 00:04:10.522872+00');
INSERT INTO public.products VALUES ('f5043ba6-d9d6-4b6d-ae59-fe960da95218', '3b1bec30-6daa-49f0-b57c-83e8817c4472', 'Presa pollo', 'Porción adicional de pollo', 1.00, true, '2026-04-19 00:04:29.257404+00', '2026-04-19 00:04:29.257404+00');
INSERT INTO public.products VALUES ('0ca249e2-a2af-4465-9001-a91da13489f2', '3b1bec30-6daa-49f0-b57c-83e8817c4472', 'Empanada', 'Empanada adicional', 0.25, true, '2026-04-19 00:04:44.340241+00', '2026-04-19 00:04:44.340241+00');
INSERT INTO public.products VALUES ('23a7b8b8-273f-47d3-98e0-bfb214dc6ae7', '3b1bec30-6daa-49f0-b57c-83e8817c4472', 'Porción papas', 'Porción adicional de papas', 1.00, true, '2026-04-19 00:05:00.083804+00', '2026-04-19 00:05:00.083804+00');
INSERT INTO public.products VALUES ('41de290b-81b0-4f7b-a1fc-b29bee95157c', '3b1bec30-6daa-49f0-b57c-83e8817c4472', 'Vaso morocho', 'Vaso de morocho', 1.00, true, '2026-04-19 00:05:20.286122+00', '2026-04-19 00:05:20.286122+00');

--
-- TOC entry 3646 (class 0 OID 16468)
-- Dependencies: 216
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.roles VALUES ('ee075d68-da76-4b23-bb2f-a2520d1209f1', 'ADMIN', 'System administrator with full access', '2026-03-25 01:49:15.56354+00', '2026-03-25 01:49:15.56354+00');
INSERT INTO public.roles VALUES ('e2f66554-1732-4bc4-bf04-52b9739b692f', 'CASHIER', 'Cashier with access to orders and sales only', '2026-03-25 01:49:15.56354+00', '2026-03-25 01:49:15.56354+00');

--
-- TOC entry 3647 (class 0 OID 16479)
-- Dependencies: 217
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES ('ed74c33a-5cf3-495a-b6ca-40c18a77f235', 'ee075d68-da76-4b23-bb2f-a2520d1209f1', 'Administrador Inicial', 'admin', 'admin@esquinarevis.com', '$2b$10$djODe7E0eXzBk4BhEsZ3O.angK00k.j0SjG6hWtIbDm3ABwLG7a7i', true, '2026-03-25 17:38:45.056564+00', '2026-03-25 17:38:45.056564+00');
INSERT INTO public.users VALUES ('ffb30138-cdcd-4a24-bbb4-0f8f647593da', 'ee075d68-da76-4b23-bb2f-a2520d1209f1', 'Felipe Revilla', 'frevilla', 'felipe@esquinarevis.com', '$2b$10$saKxdl3M6/JXWtkZJu69P.pnNDmpONGlMrL7/V0DMaN7pJIYXZUFO', true, '2026-04-18 23:59:42.072652+00', '2026-04-18 23:59:42.072652+00');
INSERT INTO public.users VALUES ('b9ba3d1b-ea5e-45ec-952b-30d0266e1392', 'e2f66554-1732-4bc4-bf04-52b9739b692f', 'Sebastian Revilla', 'srevilla', 'sebastian@esquinarevis.com', '$2b$10$WXCM2sC2moyROLvKm.Qtxev2vMUGLO6JAtkOgT60m1Oihj8QjtnFS', true, '2026-04-19 00:00:02.709739+00', '2026-04-19 00:00:02.709739+00');


-- =====================================================
-- Compatibility block previously handled by migrations
-- Safe to run in INIT because all statements are idempotent
-- =====================================================

-- Primera Linea ejecucion
ALTER TYPE public.category_type_enum ADD VALUE IF NOT EXISTS 'SWEET';

-- Segunda Linea ejecucion
UPDATE public.categories
SET category_type = 'SWEET'
WHERE LOWER(name) IN ('postres', 'sweet')
    AND category_type <> 'SWEET';

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


--
-- TOC entry 3427 (class 2606 OID 16512)
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- TOC entry 3429 (class 2606 OID 16510)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 3440 (class 2606 OID 16547)
-- Name: daily_sessions daily_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_sessions
    ADD CONSTRAINT daily_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 3458 (class 2606 OID 16606)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3452 (class 2606 OID 16576)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 3436 (class 2606 OID 16525)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 3415 (class 2606 OID 16477)
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- TOC entry 3417 (class 2606 OID 16475)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 3475 (class 2606 OID 16670)
-- Name: sale_items sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3467 (class 2606 OID 16632)
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- TOC entry 3444 (class 2606 OID 16549)
-- Name: daily_sessions uq_daily_sessions_session_date; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_sessions
    ADD CONSTRAINT uq_daily_sessions_session_date UNIQUE (session_date);


--
-- TOC entry 3454 (class 2606 OID 16578)
-- Name: orders uq_orders_daily_session_order_number; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT uq_orders_daily_session_order_number UNIQUE (daily_session_id, order_number);


--
-- TOC entry 3438 (class 2606 OID 16527)
-- Name: products uq_products_category_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT uq_products_category_name UNIQUE (category_id, name);


--
-- TOC entry 3469 (class 2606 OID 16634)
-- Name: sales uq_sales_daily_session_sale_number; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT uq_sales_daily_session_sale_number UNIQUE (daily_session_id, sale_number);


--
-- TOC entry 3471 (class 2606 OID 16636)
-- Name: sales uq_sales_order_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT uq_sales_order_id UNIQUE (order_id);


--
-- TOC entry 3421 (class 2606 OID 16493)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3423 (class 2606 OID 16489)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3425 (class 2606 OID 16491)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 3430 (class 1259 OID 16514)
-- Name: idx_categories_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_is_active ON public.categories USING btree (is_active);


--
-- TOC entry 3431 (class 1259 OID 16513)
-- Name: idx_categories_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_type ON public.categories USING btree (category_type);


--
-- TOC entry 3441 (class 1259 OID 16560)
-- Name: idx_daily_sessions_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_sessions_date ON public.daily_sessions USING btree (session_date);


--
-- TOC entry 3442 (class 1259 OID 16561)
-- Name: idx_daily_sessions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_sessions_status ON public.daily_sessions USING btree (status);


--
-- TOC entry 3455 (class 1259 OID 16617)
-- Name: idx_order_items_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);


--
-- TOC entry 3456 (class 1259 OID 16618)
-- Name: idx_order_items_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_items_product_id ON public.order_items USING btree (product_id);


--
-- TOC entry 3445 (class 1259 OID 16593)
-- Name: idx_orders_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_created_at ON public.orders USING btree (created_at);


--
-- TOC entry 3446 (class 1259 OID 16590)
-- Name: idx_orders_created_by_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_created_by_user_id ON public.orders USING btree (created_by_user_id);


--
-- TOC entry 3447 (class 1259 OID 16589)
-- Name: idx_orders_daily_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_daily_session_id ON public.orders USING btree (daily_session_id);


--
-- TOC entry 3448 (class 1259 OID 16592)
-- Name: idx_orders_preparation_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_preparation_status ON public.orders USING btree (preparation_status);


--
-- TOC entry 3449 (class 1259 OID 16594)
-- Name: idx_orders_session_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_session_status ON public.orders USING btree (daily_session_id, status);


--
-- TOC entry 3450 (class 1259 OID 16591)
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- TOC entry 3432 (class 1259 OID 16533)
-- Name: idx_products_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_category_id ON public.products USING btree (category_id);


--
-- TOC entry 3433 (class 1259 OID 16534)
-- Name: idx_products_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_is_active ON public.products USING btree (is_active);


--
-- TOC entry 3434 (class 1259 OID 16535)
-- Name: idx_products_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_name ON public.products USING btree (name);


--
-- TOC entry 3472 (class 1259 OID 16682)
-- Name: idx_sale_items_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sale_items_product_id ON public.sale_items USING btree (product_id);


--
-- TOC entry 3473 (class 1259 OID 16681)
-- Name: idx_sale_items_sale_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sale_items_sale_id ON public.sale_items USING btree (sale_id);


--
-- TOC entry 3459 (class 1259 OID 16657)
-- Name: idx_sales_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_created_at ON public.sales USING btree (created_at);


--
-- TOC entry 3460 (class 1259 OID 16654)
-- Name: idx_sales_created_by_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_created_by_user_id ON public.sales USING btree (created_by_user_id);


--
-- TOC entry 3461 (class 1259 OID 16652)
-- Name: idx_sales_daily_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_daily_session_id ON public.sales USING btree (daily_session_id);


--
-- TOC entry 3462 (class 1259 OID 16653)
-- Name: idx_sales_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_order_id ON public.sales USING btree (order_id);


--
-- TOC entry 3463 (class 1259 OID 16656)
-- Name: idx_sales_payment_method; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_payment_method ON public.sales USING btree (payment_method);


--
-- TOC entry 3464 (class 1259 OID 16655)
-- Name: idx_sales_payment_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_payment_status ON public.sales USING btree (payment_status);


--
-- TOC entry 3465 (class 1259 OID 16658)
-- Name: idx_sales_session_payment_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_session_payment_status ON public.sales USING btree (daily_session_id, payment_status);


--
-- TOC entry 3418 (class 1259 OID 16500)
-- Name: idx_users_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_is_active ON public.users USING btree (is_active);


--
-- TOC entry 3419 (class 1259 OID 16499)
-- Name: idx_users_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role_id ON public.users USING btree (role_id);


--
-- TOC entry 3491 (class 2620 OID 16515)
-- Name: categories trg_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3493 (class 2620 OID 16562)
-- Name: daily_sessions trg_daily_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_daily_sessions_updated_at BEFORE UPDATE ON public.daily_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3495 (class 2620 OID 16619)
-- Name: order_items trg_order_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_order_items_updated_at BEFORE UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3494 (class 2620 OID 16595)
-- Name: orders trg_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3492 (class 2620 OID 16536)
-- Name: products trg_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3496 (class 2620 OID 16687)
-- Name: order_items trg_recalculate_order_subtotal_after_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_recalculate_order_subtotal_after_delete AFTER DELETE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.recalculate_order_subtotal();


--
-- TOC entry 3497 (class 2620 OID 16685)
-- Name: order_items trg_recalculate_order_subtotal_after_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_recalculate_order_subtotal_after_insert AFTER INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.recalculate_order_subtotal();


--
-- TOC entry 3498 (class 2620 OID 16686)
-- Name: order_items trg_recalculate_order_subtotal_after_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_recalculate_order_subtotal_after_update AFTER UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.recalculate_order_subtotal();


--
-- TOC entry 3489 (class 2620 OID 16478)
-- Name: roles trg_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3502 (class 2620 OID 16683)
-- Name: sale_items trg_sale_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sale_items_updated_at BEFORE UPDATE ON public.sale_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3499 (class 2620 OID 16659)
-- Name: sales trg_sales_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3490 (class 2620 OID 16501)
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3500 (class 2620 OID 16689)
-- Name: sales trg_validate_sale_order_closed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validate_sale_order_closed BEFORE INSERT OR UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.validate_sale_order_closed();


--
-- TOC entry 3501 (class 2620 OID 16691)
-- Name: sales trg_validate_sale_session_matches_order; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validate_sale_session_matches_order BEFORE INSERT OR UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.validate_sale_session_matches_order();


--
-- TOC entry 3478 (class 2606 OID 16555)
-- Name: daily_sessions fk_daily_sessions_closed_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_sessions
    ADD CONSTRAINT fk_daily_sessions_closed_by FOREIGN KEY (closed_by_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3479 (class 2606 OID 16550)
-- Name: daily_sessions fk_daily_sessions_opened_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_sessions
    ADD CONSTRAINT fk_daily_sessions_opened_by FOREIGN KEY (opened_by_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3482 (class 2606 OID 16607)
-- Name: order_items fk_order_items_order; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3483 (class 2606 OID 16612)
-- Name: order_items fk_order_items_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3480 (class 2606 OID 16584)
-- Name: orders fk_orders_created_by_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_orders_created_by_user FOREIGN KEY (created_by_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3481 (class 2606 OID 16579)
-- Name: orders fk_orders_daily_session; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_orders_daily_session FOREIGN KEY (daily_session_id) REFERENCES public.daily_sessions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3477 (class 2606 OID 16528)
-- Name: products fk_products_category; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3487 (class 2606 OID 16676)
-- Name: sale_items fk_sale_items_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT fk_sale_items_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3488 (class 2606 OID 16671)
-- Name: sale_items fk_sale_items_sale; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT fk_sale_items_sale FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3484 (class 2606 OID 16647)
-- Name: sales fk_sales_created_by_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT fk_sales_created_by_user FOREIGN KEY (created_by_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3485 (class 2606 OID 16637)
-- Name: sales fk_sales_daily_session; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT fk_sales_daily_session FOREIGN KEY (daily_session_id) REFERENCES public.daily_sessions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3486 (class 2606 OID 16642)
-- Name: sales fk_sales_order; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT fk_sales_order FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3476 (class 2606 OID 16494)
-- Name: users fk_users_role; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


-- Completed on 2026-03-28 17:43:16 UTC

--
-- PostgreSQL database dump complete
--
