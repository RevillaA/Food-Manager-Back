--
-- PostgreSQL database dump
--

\restrict U4W1dXQyrof3jMyxUy4LrrA8SM7pWtWGolcAdGw4ZUV22ajZPaPxgoxn0napMe7

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
INSERT INTO public.categories VALUES ('aded9029-08d6-427a-87c9-310a9a1b2783', 'Postres', 'SWEET', 'Postres y dulces del local', false, '2026-03-25 21:45:09.085348+00', '2026-03-25 21:49:36.466856+00');


--
-- TOC entry 3650 (class 0 OID 16537)
-- Dependencies: 220
-- Data for Name: daily_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.daily_sessions VALUES ('98fd26ca-d9af-4383-8df4-fafa2dde9979', '2026-03-28', 'ed74c33a-5cf3-495a-b6ca-40c18a77f235', NULL, 'OPEN', '2026-03-28 16:42:13.476926+00', NULL, NULL, '2026-03-28 16:42:13.476926+00', '2026-03-28 16:42:13.476926+00');
INSERT INTO public.daily_sessions VALUES ('557330f0-6e73-48a5-b9b2-b51985edfd8c', '2026-03-26', 'ed74c33a-5cf3-495a-b6ca-40c18a77f235', 'ed74c33a-5cf3-495a-b6ca-40c18a77f235', 'CLOSED', '2026-03-26 00:19:26.953336+00', '2026-03-28 16:44:01.35589+00', 'Auto-created when creating an order', '2026-03-26 00:19:26.953336+00', '2026-03-28 16:44:01.35589+00');


--
-- TOC entry 3652 (class 0 OID 16596)
-- Dependencies: 222
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.order_items VALUES ('fd594fcf-699b-4e75-b6df-8e9f41fc1858', '3151f9d8-4bb5-485e-bcac-118209413ffd', 'c284b510-9065-4cc1-b532-42737f695e71', 2, 0.80, 1.60, 'Fría', '2026-03-27 21:00:44.445473+00', '2026-03-27 21:00:44.445473+00', 'IN_PROGRESS', 'Agua 600 ml', 'Bebidas');
INSERT INTO public.order_items VALUES ('2ede870b-61d6-44a6-913b-5dd0ef0e6f81', '6198241e-10ab-4426-a025-72c6a1c64b77', '9fe3812d-787d-404e-b1c3-5323e3a261c9', 1, 1.50, 1.50, 'Sin hielo', '2026-03-28 16:11:38.012035+00', '2026-03-28 16:11:38.012035+00', 'IN_PROGRESS', 'Coca Cola 1 Litro', 'Bebidas');
INSERT INTO public.order_items VALUES ('b114d99c-5dab-47d3-b872-ec47c8d97ca1', '405b5756-cb61-414b-8301-cfb821467025', '9fe3812d-787d-404e-b1c3-5323e3a261c9', 7, 1.50, 10.50, 'Prueba', '2026-03-28 16:46:56.902874+00', '2026-03-28 16:46:56.902874+00', 'IN_PROGRESS', 'Coca Cola 1 Litro', 'Bebidas');
INSERT INTO public.order_items VALUES ('736850f8-ddaa-433a-9693-9e060d97f8c6', '65b91096-f688-4ba4-9afd-67dd679474ab', '9fe3812d-787d-404e-b1c3-5323e3a261c9', 7, 1.50, 10.50, 'Prueba', '2026-03-28 16:50:07.685491+00', '2026-03-28 16:50:07.685491+00', 'IN_PROGRESS', 'Coca Cola 1 Litro', 'Bebidas');
INSERT INTO public.order_items VALUES ('50999cd5-6b67-4842-a306-18963d61ff5d', '6fa141a7-c26a-4d4d-abeb-19268aae659d', '9fe3812d-787d-404e-b1c3-5323e3a261c9', 2, 1.50, 3.00, 'TEST SALES', '2026-03-28 17:18:35.040539+00', '2026-03-28 17:18:35.040539+00', 'IN_PROGRESS', 'Coca Cola 1 Litro', 'Bebidas');
INSERT INTO public.order_items VALUES ('e9dc0891-3e8f-4590-856e-dfe00849f912', '9123e70c-06d6-47bc-ae57-92c8c3d42168', '9fe3812d-787d-404e-b1c3-5323e3a261c9', 2, 1.50, 3.00, 'TEST SALES', '2026-03-28 17:26:34.137361+00', '2026-03-28 17:26:34.137361+00', 'IN_PROGRESS', 'Coca Cola 1 Litro', 'Bebidas');


--
-- TOC entry 3651 (class 0 OID 16563)
-- Dependencies: 221
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.orders VALUES ('3151f9d8-4bb5-485e-bcac-118209413ffd', '557330f0-6e73-48a5-b9b2-b51985edfd8c', 'ed74c33a-5cf3-495a-b6ca-40c18a77f235', 1, 'OPEN', 'IN_PROGRESS', 1.60, 'Pedido de mesa 1', NULL, NULL, '2026-03-26 00:19:26.953336+00', '2026-03-27 21:03:31.433492+00');
INSERT INTO public.orders VALUES ('6198241e-10ab-4426-a025-72c6a1c64b77', '557330f0-6e73-48a5-b9b2-b51985edfd8c', 'ed74c33a-5cf3-495a-b6ca-40c18a77f235', 2, 'CLOSED', 'IN_PROGRESS', 1.50, 'Pedido finalizado', '2026-03-28 16:12:32.437989+00', NULL, '2026-03-26 00:21:37.699137+00', '2026-03-28 16:12:32.437989+00');
INSERT INTO public.orders VALUES ('405b5756-cb61-414b-8301-cfb821467025', '98fd26ca-d9af-4383-8df4-fafa2dde9979', 'ed74c33a-5cf3-495a-b6ca-40c18a77f235', 1, 'CLOSED', 'IN_PROGRESS', 10.50, 'Pedido finalizado', '2026-03-28 16:47:24.930794+00', NULL, '2026-03-28 16:45:26.620077+00', '2026-03-28 16:47:24.930794+00');
INSERT INTO public.orders VALUES ('65b91096-f688-4ba4-9afd-67dd679474ab', '98fd26ca-d9af-4383-8df4-fafa2dde9979', 'ed74c33a-5cf3-495a-b6ca-40c18a77f235', 2, 'CANCELLED', 'IN_PROGRESS', 10.50, 'Pedido TEST', NULL, '2026-03-28 16:52:06.161329+00', '2026-03-28 16:49:42.49781+00', '2026-03-28 16:52:06.161329+00');
INSERT INTO public.orders VALUES ('6fa141a7-c26a-4d4d-abeb-19268aae659d', '98fd26ca-d9af-4383-8df4-fafa2dde9979', 'ed74c33a-5cf3-495a-b6ca-40c18a77f235', 3, 'CLOSED', 'IN_PROGRESS', 3.00, 'Pedido finalizado', '2026-03-28 17:21:55.545599+00', NULL, '2026-03-28 17:17:46.565741+00', '2026-03-28 17:21:55.545599+00');
INSERT INTO public.orders VALUES ('9123e70c-06d6-47bc-ae57-92c8c3d42168', '98fd26ca-d9af-4383-8df4-fafa2dde9979', 'ed74c33a-5cf3-495a-b6ca-40c18a77f235', 4, 'CLOSED', 'IN_PROGRESS', 3.00, 'Pedido finalizado', '2026-03-28 17:27:39.180909+00', NULL, '2026-03-28 17:26:26.656419+00', '2026-03-28 17:27:39.180909+00');


--
-- TOC entry 3649 (class 0 OID 16516)
-- Dependencies: 219
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.products VALUES ('9fe3812d-787d-404e-b1c3-5323e3a261c9', 'a5ab0006-fe0e-4f27-9d41-eb9c7ef2fa6c', 'Coca Cola 1 Litro', 'Bebida Coca Cola de 1 litro', 1.50, true, '2026-03-25 21:54:08.67075+00', '2026-03-25 21:54:08.67075+00');
INSERT INTO public.products VALUES ('c284b510-9065-4cc1-b532-42737f695e71', 'a5ab0006-fe0e-4f27-9d41-eb9c7ef2fa6c', 'Agua 600 ml', 'Botella de agua de 600 ml', 0.80, true, '2026-03-25 21:54:38.267177+00', '2026-03-25 21:54:38.267177+00');
INSERT INTO public.products VALUES ('3460ca1e-d1b1-49a7-9753-2e51a827158d', 'a5ab0006-fe0e-4f27-9d41-eb9c7ef2fa6c', 'Agua prueba', 'Botella de agua de 600 ml', 0.80, true, '2026-03-25 23:58:29.224793+00', '2026-03-25 23:58:29.224793+00');


--
-- TOC entry 3646 (class 0 OID 16468)
-- Dependencies: 216
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.roles VALUES ('ee075d68-da76-4b23-bb2f-a2520d1209f1', 'ADMIN', 'System administrator with full access', '2026-03-25 01:49:15.56354+00', '2026-03-25 01:49:15.56354+00');
INSERT INTO public.roles VALUES ('e2f66554-1732-4bc4-bf04-52b9739b692f', 'CASHIER', 'Cashier with access to orders and sales only', '2026-03-25 01:49:15.56354+00', '2026-03-25 01:49:15.56354+00');


--
-- TOC entry 3654 (class 0 OID 16660)
-- Dependencies: 224
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.sale_items VALUES ('bf9dc502-cbf8-4018-8881-ab2dcab1f50e', 'f965291e-be3c-4522-ac48-212d3326ba48', '9fe3812d-787d-404e-b1c3-5323e3a261c9', 2, 1.50, 3.00, '2026-03-28 17:22:05.112247+00', '2026-03-28 17:22:05.112247+00', 'Coca Cola 1 Litro', 'Bebidas');
INSERT INTO public.sale_items VALUES ('88bfde94-7c83-4fb6-a8f6-99e7fda70f83', 'acc5780e-5f20-4b75-a393-374604e1512f', '9fe3812d-787d-404e-b1c3-5323e3a261c9', 2, 1.50, 3.00, '2026-03-28 17:27:46.745862+00', '2026-03-28 17:27:46.745862+00', 'Coca Cola 1 Litro', 'Bebidas');


--
-- TOC entry 3653 (class 0 OID 16620)
-- Dependencies: 223
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.sales VALUES ('f965291e-be3c-4522-ac48-212d3326ba48', '98fd26ca-d9af-4383-8df4-fafa2dde9979', '6fa141a7-c26a-4d4d-abeb-19268aae659d', 'ed74c33a-5cf3-495a-b6ca-40c18a77f235', 1, '20260328_0001_I', 'PAID', 'CASH', 3.00, 3.00, '2026-03-28 17:22:05.119+00', 'cobro en caja', '2026-03-28 17:22:05.112247+00', '2026-03-28 17:22:05.112247+00');
INSERT INTO public.sales VALUES ('acc5780e-5f20-4b75-a393-374604e1512f', '98fd26ca-d9af-4383-8df4-fafa2dde9979', '9123e70c-06d6-47bc-ae57-92c8c3d42168', 'ed74c33a-5cf3-495a-b6ca-40c18a77f235', 2, '20260328_0002_I', 'PAID', 'CASH', 3.00, 3.00, '2026-03-28 17:27:46.749+00', 'Pago efectivo', '2026-03-28 17:27:46.745862+00', '2026-03-28 17:27:46.745862+00');


--
-- TOC entry 3647 (class 0 OID 16479)
-- Dependencies: 217
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES ('ed74c33a-5cf3-495a-b6ca-40c18a77f235', 'ee075d68-da76-4b23-bb2f-a2520d1209f1', 'Administrador Inicial', 'admin', 'admin@esquinarevis.com', '$2b$10$djODe7E0eXzBk4BhEsZ3O.angK00k.j0SjG6hWtIbDm3ABwLG7a7i', true, '2026-03-25 17:38:45.056564+00', '2026-03-25 17:38:45.056564+00');
INSERT INTO public.users VALUES ('8e444364-97a3-4e1e-bcbb-3e51236bd263', 'e2f66554-1732-4bc4-bf04-52b9739b692f', 'Cajero Editado', 'cajero', 'cajero_editado@esquinarevis.com', '$2b$10$RWQkFkm3dPimYN2uQBgHhuyawZK3KnEYr6ocuz/MnsK5t3nlXy9Ga', true, '2026-03-25 17:53:50.943922+00', '2026-03-25 21:47:51.502428+00');


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

\unrestrict U4W1dXQyrof3jMyxUy4LrrA8SM7pWtWGolcAdGw4ZUV22ajZPaPxgoxn0napMe7
