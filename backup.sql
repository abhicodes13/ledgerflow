--
-- PostgreSQL database dump
--

\restrict FEaxkAPO1e6IGujKDCeQQNdxgpzoCzJnE2t1kTKwLhkS3wEga7GrMSbjhMSmwOQ

-- Dumped from database version 18.6 (ac70818)
-- Dumped by pg_dump version 18.6 (Debian 18.6-1.pgdg13+2)

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
-- Name: clients; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.clients (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone_number character varying(20),
    sms_opt_out boolean DEFAULT false NOT NULL,
    archived_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.clients OWNER TO neondb_owner;

--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clients_id_seq OWNER TO neondb_owner;

--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: communication_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.communication_logs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    invoice_id integer NOT NULL,
    channel character varying(10) NOT NULL,
    recipient character varying(255) NOT NULL,
    tone_tier character varying(50),
    status character varying(20) DEFAULT 'sent'::character varying NOT NULL,
    provider_message_id character varying(255),
    error text,
    dispatched_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT communication_logs_channel_check CHECK (((channel)::text = ANY (ARRAY[('email'::character varying)::text, ('sms'::character varying)::text]))),
    CONSTRAINT communication_logs_status_check CHECK (((status)::text = ANY (ARRAY[('queued'::character varying)::text, ('sent'::character varying)::text, ('delivered'::character varying)::text, ('failed'::character varying)::text])))
);


ALTER TABLE public.communication_logs OWNER TO neondb_owner;

--
-- Name: communication_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.communication_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.communication_logs_id_seq OWNER TO neondb_owner;

--
-- Name: communication_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.communication_logs_id_seq OWNED BY public.communication_logs.id;


--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.invoice_items (
    id integer NOT NULL,
    invoice_id integer NOT NULL,
    description character varying(255) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_amount_cents integer NOT NULL,
    CONSTRAINT invoice_items_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT invoice_items_unit_amount_cents_check CHECK ((unit_amount_cents >= 0))
);


ALTER TABLE public.invoice_items OWNER TO neondb_owner;

--
-- Name: invoice_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.invoice_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoice_items_id_seq OWNER TO neondb_owner;

--
-- Name: invoice_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.invoice_items_id_seq OWNED BY public.invoice_items.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    user_id integer NOT NULL,
    client_id integer NOT NULL,
    invoice_number character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    due_date date NOT NULL,
    paid_at timestamp with time zone,
    last_notified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT invoices_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('paid'::character varying)::text, ('void'::character varying)::text])))
);


ALTER TABLE public.invoices OWNER TO neondb_owner;

--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoices_id_seq OWNER TO neondb_owner;

--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: pending_actions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pending_actions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    action_type character varying(50) NOT NULL,
    payload jsonb NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:15:00'::interval) NOT NULL,
    resolved_at timestamp with time zone,
    CONSTRAINT pending_actions_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('confirmed'::character varying)::text, ('executed'::character varying)::text, ('cancelled'::character varying)::text, ('expired'::character varying)::text, ('failed'::character varying)::text])))
);


ALTER TABLE public.pending_actions OWNER TO neondb_owner;

--
-- Name: pending_actions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.pending_actions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pending_actions_id_seq OWNER TO neondb_owner;

--
-- Name: pending_actions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.pending_actions_id_seq OWNED BY public.pending_actions.id;


--
-- Name: stripe_events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stripe_events (
    event_id character varying(255) NOT NULL,
    processed_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.stripe_events OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    subscription_tier character varying(50) DEFAULT 'unpaid'::character varying NOT NULL,
    billing_status character varying(50) DEFAULT 'inactive'::character varying NOT NULL,
    invoice_seq integer DEFAULT 0 NOT NULL,
    stripe_customer_id character varying(255),
    stripe_subscription_id character varying(255),
    current_period_end timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_billing_status_check CHECK (((billing_status)::text = ANY (ARRAY[('inactive'::character varying)::text, ('active'::character varying)::text, ('past_due'::character varying)::text]))),
    CONSTRAINT users_subscription_tier_check CHECK (((subscription_tier)::text = ANY (ARRAY[('unpaid'::character varying)::text, ('MONTHLY'::character varying)::text, ('YEARLY'::character varying)::text])))
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Name: communication_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.communication_logs ALTER COLUMN id SET DEFAULT nextval('public.communication_logs_id_seq'::regclass);


--
-- Name: invoice_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoice_items ALTER COLUMN id SET DEFAULT nextval('public.invoice_items_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: pending_actions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pending_actions ALTER COLUMN id SET DEFAULT nextval('public.pending_actions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.clients (id, user_id, name, email, phone_number, sms_opt_out, archived_at, created_at, updated_at) FROM stdin;
1	1	Donika Patel	donikapatel333@gmail.com	+19088481081	f	\N	2026-11-10 18:24:34.448166+00	2026-11-10 18:24:34.448166+00
2	2	Isha Warra	donikapatel333@gmail.com	+19088481081	f	\N	2026-11-10 19:03:22.304353+00	2026-11-10 19:03:22.304353+00
3	2	bill	nill@gmail.com	\N	f	\N	2026-11-10 19:05:05.45056+00	2026-11-10 19:05:05.45056+00
4	2	polly	polly@gmail.com	\N	f	\N	2026-11-10 19:05:24.178892+00	2026-11-10 19:05:24.178892+00
5	2	abhi	alantran842@gmail.com	\N	f	\N	2026-11-10 19:08:51.051034+00	2026-11-10 19:08:51.051034+00
6	3	john doe	johndoe@gmail.con	\N	f	\N	2026-11-10 21:28:32.383403+00	2026-11-10 21:28:32.383403+00
7	3	hhh	h@g.com	\N	f	\N	2026-11-10 21:32:51.499629+00	2026-11-10 21:32:51.499629+00
8	2	Lincoln Pizza	lincoln@gmail.com	\N	f	\N	2026-11-11 19:33:03.621755+00	2026-11-11 19:33:03.621755+00
9	2	amit	abhi@gmail.com	\N	f	\N	2026-11-11 19:36:11.890604+00	2026-11-11 19:36:11.890604+00
\.


--
-- Data for Name: communication_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.communication_logs (id, user_id, invoice_id, channel, recipient, tone_tier, status, provider_message_id, error, dispatched_at) FROM stdin;
1	2	2	email	donikapatel333@gmail.com	friendly	failed	\N	Invalid `from` field. The email address needs to follow the `email@example.com` or `Name <email@example.com>` format.	2026-11-10 19:07:00.465703+00
2	2	2	email	donikapatel333@gmail.com	friendly	failed	\N	Invalid `from` field. The email address needs to follow the `email@example.com` or `Name <email@example.com>` format.	2026-11-10 19:07:11.666757+00
3	2	6	email	alantran842@gmail.com	friendly	failed	\N	Invalid `from` field. The email address needs to follow the `email@example.com` or `Name <email@example.com>` format.	2026-11-10 19:11:01.338735+00
4	2	6	email	alantran842@gmail.com	friendly	failed	\N	Invalid `from` field. The email address needs to follow the `email@example.com` or `Name <email@example.com>` format.	2026-11-10 19:11:19.589339+00
5	2	2	email	donikapatel333@gmail.com	friendly	failed	\N	Invalid `from` field. The email address needs to follow the `email@example.com` or `Name <email@example.com>` format.	2026-11-10 19:48:30.829879+00
\.


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.invoice_items (id, invoice_id, description, quantity, unit_amount_cents) FROM stdin;
1	1	Team Work	1	400000
2	2	For driving her	1	50000
3	3	jjl	1	30000
4	4	kkmk	1	900000
5	5	ijjiij	1	80000
6	5	jooojo	1	70000
7	5	kjk	1	7090000
8	6	jjj	1	90000
9	7	GAS	1	4000
10	8	test	1	9900
11	9	gg n	1	5000
12	10	gvsdgh	1	600000
13	11	hhcg	1	6000
14	12	Associate	1	60000
15	13	cleaning	1	20000
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.invoices (id, user_id, client_id, invoice_number, status, due_date, paid_at, last_notified_at, created_at, updated_at) FROM stdin;
1	1	1	INV-0001	pending	2026-11-11	\N	\N	2026-11-10 18:26:06.421742+00	2026-11-10 18:26:06.421742+00
2	2	2	INV-0001	pending	2026-11-06	\N	\N	2026-11-10 19:04:05.455479+00	2026-11-10 19:04:05.455479+00
3	2	2	INV-0002	pending	2026-11-26	\N	\N	2026-11-10 19:04:36.756921+00	2026-11-10 19:04:36.756921+00
6	2	5	INV-0005	paid	2026-11-04	2026-11-10 19:12:17.635527+00	\N	2026-11-10 19:10:50.666293+00	2026-11-10 19:12:17.635527+00
5	2	3	INV-0004	paid	2026-11-26	2026-11-10 19:13:31.08031+00	\N	2026-11-10 19:06:11.276013+00	2026-11-10 19:13:31.08031+00
7	2	2	INV-0006	pending	2026-11-10	\N	\N	2026-11-10 19:16:18.493332+00	2026-11-10 19:16:18.493332+00
4	2	4	INV-0003	paid	2026-11-08	2026-11-10 19:54:24.384996+00	\N	2026-11-10 19:05:45.164484+00	2026-11-10 19:54:24.384996+00
8	3	6	INV-0001	pending	2026-11-03	\N	\N	2026-11-10 21:30:20.36414+00	2026-11-10 21:30:20.36414+00
9	3	6	INV-0002	pending	2026-11-02	\N	\N	2026-11-10 21:32:33.894012+00	2026-11-10 21:32:33.894012+00
10	3	7	INV-0003	pending	2026-10-15	\N	\N	2026-11-10 21:33:16.397879+00	2026-11-10 21:33:16.397879+00
11	3	6	INV-0004	paid	2026-11-26	2026-11-10 21:37:09.081777+00	\N	2026-11-10 21:33:28.753606+00	2026-11-10 21:37:09.081777+00
13	2	9	INV-0008	pending	2026-11-13	\N	\N	2026-11-11 19:38:09.463489+00	2026-11-11 19:38:09.463489+00
12	2	8	INV-0007	paid	2026-11-06	2026-11-11 19:38:45.712313+00	\N	2026-11-11 19:33:43.871432+00	2026-11-11 19:38:45.712313+00
\.


--
-- Data for Name: pending_actions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pending_actions (id, user_id, action_type, payload, status, created_at, expires_at, resolved_at) FROM stdin;
1	2	send_reminders	{"channel": "email", "recipients": [{"tone": "friendly", "invoices": [{"id": 2, "due_date": "2026-11-06", "total_cents": 50000, "days_overdue": 4, "invoice_number": "INV-0001"}], "client_id": 2, "client_name": "Isha Warra", "client_email": "donikapatel333@gmail.com"}, {"tone": "friendly", "invoices": [{"id": 4, "due_date": "2026-11-08", "total_cents": 900000, "days_overdue": 2, "invoice_number": "INV-0003"}], "client_id": 4, "client_name": "polly", "client_email": "polly@gmail.com"}]}	pending	2026-11-10 19:06:20.206676+00	2026-11-10 19:21:20.206676+00	\N
2	2	send_reminders	{"channel": "email", "recipients": [{"tone": "friendly", "invoices": [{"id": 2, "due_date": "2026-11-06", "total_cents": 50000, "days_overdue": 4, "invoice_number": "INV-0001"}], "client_id": 2, "client_name": "Isha Warra", "client_email": "donikapatel333@gmail.com"}, {"tone": "friendly", "invoices": [{"id": 4, "due_date": "2026-11-08", "total_cents": 900000, "days_overdue": 2, "invoice_number": "INV-0003"}], "client_id": 4, "client_name": "polly", "client_email": "polly@gmail.com"}]}	pending	2026-11-10 19:06:47.962706+00	2026-11-10 19:21:47.962706+00	\N
3	2	send_reminders	{"channel": "email", "recipients": [{"tone": "friendly", "invoices": [{"id": 2, "due_date": "2026-11-06", "total_cents": 50000, "days_overdue": 4, "invoice_number": "INV-0001"}], "client_id": 2, "client_name": "Isha Warra", "client_email": "donikapatel333@gmail.com"}]}	pending	2026-11-10 19:06:50.193815+00	2026-11-10 19:21:50.193815+00	\N
4	2	send_reminders	{"channel": "email", "recipients": [{"tone": "friendly", "invoices": [{"id": 2, "due_date": "2026-11-06", "total_cents": 50000, "days_overdue": 4, "invoice_number": "INV-0001"}], "client_id": 2, "client_name": "Isha Warra", "client_email": "donikapatel333@gmail.com"}]}	failed	2026-11-10 19:06:58.503551+00	2026-11-10 19:21:58.503551+00	2026-11-10 19:07:00.472946+00
5	2	send_reminders	{"channel": "email", "recipients": [{"tone": "friendly", "invoices": [{"id": 2, "due_date": "2026-11-06", "total_cents": 50000, "days_overdue": 4, "invoice_number": "INV-0001"}], "client_id": 2, "client_name": "Isha Warra", "client_email": "donikapatel333@gmail.com"}]}	failed	2026-11-10 19:07:08.063277+00	2026-11-10 19:22:08.063277+00	2026-11-10 19:07:11.669335+00
6	2	send_reminders	{"channel": "email", "recipients": [{"tone": "friendly", "invoices": [{"id": 6, "due_date": "2026-11-04", "total_cents": 90000, "days_overdue": 6, "invoice_number": "INV-0005"}], "client_id": 5, "client_name": "abhi", "client_email": "alantran842@gmail.com"}]}	failed	2026-11-10 19:10:54.5281+00	2026-11-10 19:25:54.5281+00	2026-11-10 19:11:01.34127+00
7	2	send_reminders	{"channel": "email", "recipients": [{"tone": "friendly", "invoices": [{"id": 6, "due_date": "2026-11-04", "total_cents": 90000, "days_overdue": 6, "invoice_number": "INV-0005"}], "client_id": 5, "client_name": "abhi", "client_email": "alantran842@gmail.com"}]}	failed	2026-11-10 19:11:14.217235+00	2026-11-10 19:26:14.217235+00	2026-11-10 19:11:19.599214+00
8	2	send_reminders	{"channel": "email", "recipients": [{"tone": "friendly", "invoices": [{"id": 2, "due_date": "2026-11-06", "total_cents": 50000, "days_overdue": 4, "invoice_number": "INV-0001"}], "client_id": 2, "client_name": "Isha Warra", "client_email": "donikapatel333@gmail.com"}]}	pending	2026-11-10 19:48:18.544982+00	2026-11-10 20:03:18.544982+00	\N
9	2	send_reminders	{"channel": "email", "recipients": [{"tone": "friendly", "invoices": [{"id": 2, "due_date": "2026-11-06", "total_cents": 50000, "days_overdue": 4, "invoice_number": "INV-0001"}], "client_id": 2, "client_name": "Isha Warra", "client_email": "donikapatel333@gmail.com"}, {"tone": "friendly", "invoices": [{"id": 4, "due_date": "2026-11-08", "total_cents": 900000, "days_overdue": 2, "invoice_number": "INV-0003"}], "client_id": 4, "client_name": "polly", "client_email": "polly@gmail.com"}]}	pending	2026-11-10 19:48:22.26932+00	2026-11-10 20:03:22.26932+00	\N
10	2	send_reminders	{"channel": "email", "recipients": [{"tone": "friendly", "invoices": [{"id": 2, "due_date": "2026-11-06", "total_cents": 50000, "days_overdue": 4, "invoice_number": "INV-0001"}], "client_id": 2, "client_name": "Isha Warra", "client_email": "donikapatel333@gmail.com"}]}	failed	2026-11-10 19:48:29.59199+00	2026-11-10 20:03:29.59199+00	2026-11-10 19:48:30.839836+00
11	2	send_reminders	{"channel": "email", "recipients": [{"tone": "friendly", "invoices": [{"id": 2, "due_date": "2026-11-06", "total_cents": 50000, "days_overdue": 4, "invoice_number": "INV-0001"}], "client_id": 2, "client_name": "Isha Warra", "client_email": "donikapatel333@gmail.com"}]}	pending	2026-11-10 19:54:30.295292+00	2026-11-10 20:09:30.295292+00	\N
12	3	send_reminders	{"channel": "email", "recipients": [{"tone": "friendly", "invoices": [{"id": 8, "due_date": "2026-11-03", "total_cents": 9900, "days_overdue": 7, "invoice_number": "INV-0001"}], "client_id": 6, "client_name": "john doe", "client_email": "johndoe@gmail.con"}]}	pending	2026-11-10 21:31:35.893137+00	2026-11-10 21:46:35.893137+00	\N
13	3	send_reminders	{"channel": "email", "recipients": [{"tone": "friendly", "invoices": [{"id": 8, "due_date": "2026-11-03", "total_cents": 9900, "days_overdue": 7, "invoice_number": "INV-0001"}], "client_id": 6, "client_name": "john doe", "client_email": "johndoe@gmail.con"}]}	pending	2026-11-10 21:31:41.723948+00	2026-11-10 21:46:41.723948+00	\N
14	3	send_reminders	{"channel": "email", "recipients": [{"tone": "firm", "invoices": [{"id": 10, "due_date": "2026-10-15", "total_cents": 600000, "days_overdue": 26, "invoice_number": "INV-0003"}], "client_id": 7, "client_name": "hhh", "client_email": "h@g.com"}, {"tone": "firm", "invoices": [{"id": 9, "due_date": "2026-11-02", "total_cents": 5000, "days_overdue": 8, "invoice_number": "INV-0002"}, {"id": 8, "due_date": "2026-11-03", "total_cents": 9900, "days_overdue": 7, "invoice_number": "INV-0001"}], "client_id": 6, "client_name": "john doe", "client_email": "johndoe@gmail.con"}]}	pending	2026-11-10 21:34:20.328546+00	2026-11-10 21:49:20.328546+00	\N
15	3	send_reminders	{"channel": "email", "recipients": [{"tone": "firm", "invoices": [{"id": 10, "due_date": "2026-10-15", "total_cents": 600000, "days_overdue": 26, "invoice_number": "INV-0003"}], "client_id": 7, "client_name": "hhh", "client_email": "h@g.com"}]}	pending	2026-11-10 21:35:57.20337+00	2026-11-10 21:50:57.20337+00	\N
16	2	send_reminders	{"channel": "email", "recipients": [{"tone": "friendly", "invoices": [{"id": 12, "due_date": "2026-11-06", "total_cents": 60000, "days_overdue": 5, "invoice_number": "INV-0007"}], "client_id": 8, "client_name": "Lincoln Pizza", "client_email": "lincoln@gmail.com"}]}	pending	2026-11-11 19:34:18.699033+00	2026-11-11 19:49:18.699033+00	\N
17	2	send_reminders	{"channel": "email", "recipients": [{"tone": "friendly", "invoices": [{"id": 2, "due_date": "2026-11-06", "total_cents": 50000, "days_overdue": 5, "invoice_number": "INV-0001"}, {"id": 7, "due_date": "2026-11-10", "total_cents": 4000, "days_overdue": 1, "invoice_number": "INV-0006"}], "client_id": 2, "client_name": "Isha Warra", "client_email": "donikapatel333@gmail.com"}]}	pending	2026-11-11 19:39:00.607761+00	2026-11-11 19:54:00.607761+00	\N
18	2	send_reminders	{"channel": "email", "recipients": [{"tone": "friendly", "invoices": [{"id": 2, "due_date": "2026-11-06", "total_cents": 50000, "days_overdue": 5, "invoice_number": "INV-0001"}, {"id": 7, "due_date": "2026-11-10", "total_cents": 4000, "days_overdue": 1, "invoice_number": "INV-0006"}], "client_id": 2, "client_name": "Isha Warra", "client_email": "donikapatel333@gmail.com"}]}	pending	2026-11-11 19:39:33.140942+00	2026-11-11 19:54:33.140942+00	\N
19	2	send_reminders	{"channel": "email", "recipients": [{"tone": "friendly", "invoices": [{"id": 2, "due_date": "2026-11-06", "total_cents": 50000, "days_overdue": 5, "invoice_number": "INV-0001"}, {"id": 7, "due_date": "2026-11-10", "total_cents": 4000, "days_overdue": 1, "invoice_number": "INV-0006"}], "client_id": 2, "client_name": "Isha Warra", "client_email": "donikapatel333@gmail.com"}]}	pending	2026-11-11 19:39:36.696014+00	2026-11-11 19:54:36.696014+00	\N
\.


--
-- Data for Name: stripe_events; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stripe_events (event_id, processed_at) FROM stdin;
evt_1UaIv94wWZd8NZmvrXMq2fmZ	2026-11-10 18:18:35.378708+00
evt_1UaIv84wWZd8NZmvsatM1IGW	2026-11-10 18:33:19.021842+00
evt_1UaIv84wWZd8NZmvjl1JLciV	2026-11-10 18:33:54.679687+00
evt_1UaKHj4wWZd8NZmvBKBaarpJ	2026-11-10 19:00:47.717253+00
evt_1UaKHj4wWZd8NZmvIVs4xuhK	2026-11-10 19:00:47.791505+00
evt_1UaKHj4wWZd8NZmvFKAOuSxA	2026-11-10 19:00:47.88968+00
evt_1UaL4K4wWZd8NZmv5M5L0DRu	2026-11-10 19:51:00.777931+00
evt_1UaL4K4wWZd8NZmvrAsutCbB	2026-11-10 19:51:00.903364+00
evt_1UaL4K4wWZd8NZmvc4InFWKi	2026-11-10 19:51:01.251129+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, email, password_hash, subscription_tier, billing_status, invoice_seq, stripe_customer_id, stripe_subscription_id, current_period_end, created_at, updated_at) FROM stdin;
1	alan	alantran842@gmail.com	$2b$10$0Tw5aMkIYFo4ZeNiYbLOOugrxDbX7uUx3izA2SU1BcttzHYEoBAKC	MONTHLY	active	1	cus_VbVvH0oo7yhvAR	sub_1UaIv74wWZd8NZmvqgPlhfyY	2026-12-10 17:33:18+00	2026-11-10 17:31:41.748674+00	2026-11-10 18:33:54.679687+00
4	test	donikapatel118@gmail.com	$2b$10$asaKtvUgrj1g3jDrnvv4ue9m6Vpk4dfwtmWO6.5Fswva8vyC25Wkq	unpaid	inactive	0	cus_VbYCOYxLQ9TsCU	\N	\N	2026-11-10 19:52:11.038225+00	2026-11-10 19:52:55.653861+00
3	isha_warra	ishawarra@gmail.com	$2b$10$iyMR/G5amhxrIa09TFuJ2exTIby9kHXu4FSYWdQLEoE9dODkLJ89W	MONTHLY	active	4	cus_VbYAK1ujHix5iR	sub_1UaL4I4wWZd8NZmviFmXED0v	2026-12-10 19:50:54+00	2026-11-10 19:49:22.236738+00	2026-11-10 19:51:01.251129+00
5	adarsh	adarshchhettri15@gmail.com	$2b$10$UASoIvcTY3II8l67JtT13O9xiGvwugvPH/EhKB0/AoJqTRugrMwy6	unpaid	inactive	0	cus_VbuzVYGPPEMRZr	\N	\N	2026-11-11 19:24:50.505951+00	2026-11-11 19:25:42.021046+00
2	donikapatel333@gmail.com	donikapatel333@gmail.com	$2b$10$8VwI6f8UeXa7e2RTQ2kCReccVBpOGbD.dDaZluRYkBiv1MDcOZ6Zi	MONTHLY	active	8	cus_VbXLyj8EdPZhPh	sub_1UaKHh4wWZd8NZmv87EzOlZ2	2026-12-10 19:00:40+00	2026-11-10 18:54:34.555016+00	2026-11-10 19:00:47.88968+00
\.


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.clients_id_seq', 9, true);


--
-- Name: communication_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.communication_logs_id_seq', 5, true);


--
-- Name: invoice_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.invoice_items_id_seq', 15, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.invoices_id_seq', 13, true);


--
-- Name: pending_actions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.pending_actions_id_seq', 19, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


--
-- Name: clients clients_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_id_user_id_key UNIQUE (id, user_id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: clients clients_user_id_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_user_id_email_key UNIQUE (user_id, email);


--
-- Name: communication_logs communication_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.communication_logs
    ADD CONSTRAINT communication_logs_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_user_id_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_user_id_invoice_number_key UNIQUE (user_id, invoice_number);


--
-- Name: pending_actions pending_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pending_actions
    ADD CONSTRAINT pending_actions_pkey PRIMARY KEY (id);


--
-- Name: stripe_events stripe_events_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stripe_events
    ADD CONSTRAINT stripe_events_pkey PRIMARY KEY (event_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_stripe_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_stripe_customer_id_key UNIQUE (stripe_customer_id);


--
-- Name: users users_stripe_subscription_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_stripe_subscription_id_key UNIQUE (stripe_subscription_id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_clients_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_clients_user ON public.clients USING btree (user_id);


--
-- Name: idx_comm_invoice; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_comm_invoice ON public.communication_logs USING btree (invoice_id, dispatched_at DESC);


--
-- Name: idx_invoices_client; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_invoices_client ON public.invoices USING btree (client_id);


--
-- Name: idx_invoices_user_status_due; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_invoices_user_status_due ON public.invoices USING btree (user_id, status, due_date);


--
-- Name: idx_items_invoice; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_items_invoice ON public.invoice_items USING btree (invoice_id);


--
-- Name: idx_pending_user_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_pending_user_status ON public.pending_actions USING btree (user_id, status);


--
-- Name: idx_users_email_lower; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_users_email_lower ON public.users USING btree (lower((email)::text));


--
-- Name: clients clients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: communication_logs communication_logs_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.communication_logs
    ADD CONSTRAINT communication_logs_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: communication_logs communication_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.communication_logs
    ADD CONSTRAINT communication_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_client_id_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_client_id_user_id_fkey FOREIGN KEY (client_id, user_id) REFERENCES public.clients(id, user_id) ON DELETE RESTRICT;


--
-- Name: invoices invoices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: pending_actions pending_actions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pending_actions
    ADD CONSTRAINT pending_actions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT SELECT,INSERT,DELETE,TRUNCATE,MAINTAIN,UPDATE ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict FEaxkAPO1e6IGujKDCeQQNdxgpzoCzJnE2t1kTKwLhkS3wEga7GrMSbjhMSmwOQ

