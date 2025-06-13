--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES (1, 'user@example.com', 'Default User', NULL, NULL, NULL, NULL, NULL, '2025-06-07 18:51:36.614601', '2025-06-07 18:51:36.614601', false, NULL, NULL, NULL);


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: emotional_metadata; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: memory_usage; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.memory_usage VALUES (1, 0, 0, '2025-06-07 18:51:36.614601', '2025-06-07 18:51:36.614601', '2025-06-07 18:51:36.614601');


--
-- Data for Name: notes; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.notes VALUES (2, 1, 'Personal Goals', 'Focus on health, learning, and work-life balance', '2025-01-14 00:00:00');
INSERT INTO public.notes VALUES (1, 1, 'Project Planning Meeting', 'Discuss Q1 roadmap and resource allocation', '2025-01-15 00:00:00');
INSERT INTO public.notes VALUES (4, 1, 'Untitle', 'Untitle

Untitle', '2025-06-13 11:17:05.671175');


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tasks VALUES (1, 1, 'Review design mockups', 'Review the new dashboard designs from the team', 'in-progress', 'high', '2025-01-20 00:00:00', '2025-01-15 00:00:00', '2025-01-15 00:00:00', true);
INSERT INTO public.tasks VALUES (2, 1, 'Update project documentation', 'Update README and API documentation', 'todo', 'medium', '2025-01-25 00:00:00', '2025-01-14 00:00:00', '2025-01-14 00:00:00', true);


--
-- Data for Name: user_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_preferences VALUES (2, 1, 't0by', 'User', true, '2025-06-07 21:42:31.533966', '2025-06-07 21:42:31.533966', NULL, NULL, 0, 2000, 'San Francisco, CA');


--
-- Name: chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chat_messages_id_seq', 1, false);


--
-- Name: emotional_metadata_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.emotional_metadata_id_seq', 1, false);


--
-- Name: memory_usage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.memory_usage_id_seq', 1, true);


--
-- Name: notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notes_id_seq', 4, true);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tasks_id_seq', 1, false);


--
-- Name: user_preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_preferences_id_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

