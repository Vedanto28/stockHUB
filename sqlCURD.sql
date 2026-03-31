--
-- PostgreSQL database dump
--

\restrict rnZN5WBbpg9eKjRjbSzBjJcLz16uFLqtZpikCH7u8OKKIs0xvPeVNGrS7mmpJaL

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

-- Started on 2026-03-31 15:47:58

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 18924)
-- Name: stocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stocks (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    sector character varying(50),
    price numeric(10,2) NOT NULL,
    quantity integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_price CHECK ((price > (0)::numeric)),
    CONSTRAINT valid_quantity CHECK ((quantity >= 0)),
    CONSTRAINT valid_sector CHECK (((sector)::text = ANY ((ARRAY['Energy'::character varying, 'Materials'::character varying, 'Industrials'::character varying, 'Utilities'::character varying, 'Healthcare'::character varying, 'Financials'::character varying, 'Consumer Discretionary'::character varying, 'Consumer Staples'::character varying, 'Information Technology'::character varying, 'Communication Services'::character varying, 'Real Estate'::character varying])::text[])))
);


ALTER TABLE public.stocks OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 18923)
-- Name: stocks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stocks_id_seq OWNER TO postgres;

--
-- TOC entry 5017 (class 0 OID 0)
-- Dependencies: 219
-- Name: stocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stocks_id_seq OWNED BY public.stocks.id;


--
-- TOC entry 4856 (class 2604 OID 18927)
-- Name: stocks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stocks ALTER COLUMN id SET DEFAULT nextval('public.stocks_id_seq'::regclass);


--
-- TOC entry 5011 (class 0 OID 18924)
-- Dependencies: 220
-- Data for Name: stocks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stocks (id, name, sector, price, quantity, created_at) FROM stdin;
\.


--
-- TOC entry 5018 (class 0 OID 0)
-- Dependencies: 219
-- Name: stocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stocks_id_seq', 2, true);


--
-- TOC entry 4862 (class 2606 OID 18934)
-- Name: stocks stocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stocks
    ADD CONSTRAINT stocks_pkey PRIMARY KEY (id);


-- Completed on 2026-03-31 15:47:58

--
-- PostgreSQL database dump complete
--

\unrestrict rnZN5WBbpg9eKjRjbSzBjJcLz16uFLqtZpikCH7u8OKKIs0xvPeVNGrS7mmpJaL

