SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict 8ebXmQVuCrizzvTGplvikgyvcaSvQOWNylMjzY4VkbW3Y8hhZApGsRU6aXDeoiB

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

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

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at", "invite_token", "referrer", "oauth_client_state_id", "linking_target_id", "email_optional") VALUES
	('b32d6ec3-a5fc-43ac-a658-6dfb3e434e61', NULL, NULL, NULL, NULL, 'google', '', '', '2026-04-29 14:15:45.061983+00', '2026-04-29 14:15:45.061983+00', 'oauth', NULL, NULL, 'https://vortex-primus.vercel.app/', NULL, NULL, false),
	('c337e2f5-9776-4a15-8b0c-d7179a1bfa6d', NULL, NULL, NULL, NULL, 'google', '', '', '2026-04-29 16:46:19.768448+00', '2026-04-29 16:46:19.768448+00', 'oauth', NULL, NULL, 'https://vortex-primus.vercel.app/', NULL, NULL, false),
	('a21061a8-3f32-4e2a-930a-bfa06141825f', NULL, NULL, NULL, NULL, 'google', '', '', '2026-05-04 02:53:13.152163+00', '2026-05-04 02:53:13.152163+00', 'oauth', NULL, NULL, 'https://vortex-primus.vercel.app/login', NULL, NULL, false);


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '478d3725-60f8-482e-9573-5836ebd457f9', 'authenticated', 'authenticated', 'wedo.transform@gmail.com', NULL, '2026-05-01 03:17:10.827991+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-05-03 13:02:48.607135+00', '{"provider": "google", "providers": ["google"]}', '{"iss": "https://accounts.google.com", "sub": "107242988239657405091", "name": "wedo transformation", "email": "wedo.transform@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocIzyqlYTMbUGOT9ThnMYDABp8Qat0eWJ1R_kJUVf9ReFwDCF-P3=s96-c", "full_name": "wedo transformation", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocIzyqlYTMbUGOT9ThnMYDABp8Qat0eWJ1R_kJUVf9ReFwDCF-P3=s96-c", "provider_id": "107242988239657405091", "email_verified": true, "phone_verified": false}', NULL, '2026-05-01 03:17:10.716387+00', '2026-05-07 13:49:46.417239+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', 'authenticated', 'authenticated', 'alzejones@gmail.com', NULL, '2026-04-29 17:37:46.934127+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-05-07 19:04:17.675417+00', '{"provider": "google", "providers": ["google"]}', '{"iss": "https://accounts.google.com", "sub": "115790890803401702915", "name": "Alzejones Dias", "email": "alzejones@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocISgn_SaSrLuE9AV45yBjqzf0lIlr4Fh0cMk3YSpCW_AMYPbimp=s96-c", "full_name": "Alzejones Dias", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocISgn_SaSrLuE9AV45yBjqzf0lIlr4Fh0cMk3YSpCW_AMYPbimp=s96-c", "provider_id": "115790890803401702915", "email_verified": true, "phone_verified": false}', NULL, '2026-04-29 17:37:46.911186+00', '2026-05-08 19:12:15.734252+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'fb20e9c6-f11d-45ea-92ff-41ca1e6e7d48', 'authenticated', 'authenticated', 'teste0333@gmail.com', '$2a$10$cbIPkz/nCacF.XCGr0/GtOU1VCA12xLKe.6ugdFWYt1PExUi5CdAC', '2026-05-02 01:00:39.468165+00', '2026-05-02 01:00:37.264428+00', '', NULL, '', NULL, '', '', NULL, '2026-05-02 01:00:39.473952+00', '{"provider": "email", "providers": ["email"]}', '{"role": "client", "client_id": "5a32bcc7-63af-46e4-8c58-7d4de030e48e", "email_verified": true}', NULL, '2026-05-02 01:00:37.266412+00', '2026-05-02 01:00:39.510314+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('fb20e9c6-f11d-45ea-92ff-41ca1e6e7d48', 'fb20e9c6-f11d-45ea-92ff-41ca1e6e7d48', '{"sub": "fb20e9c6-f11d-45ea-92ff-41ca1e6e7d48", "email": "teste0333@gmail.com", "email_verified": true, "phone_verified": false}', 'email', '2026-05-02 01:00:37.293183+00', '2026-05-02 01:00:37.293239+00', '2026-05-02 01:00:37.293239+00', '78f639b5-4310-43c9-a9b7-6051790f579c'),
	('107242988239657405091', '478d3725-60f8-482e-9573-5836ebd457f9', '{"iss": "https://accounts.google.com", "sub": "107242988239657405091", "name": "wedo transformation", "email": "wedo.transform@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocIzyqlYTMbUGOT9ThnMYDABp8Qat0eWJ1R_kJUVf9ReFwDCF-P3=s96-c", "full_name": "wedo transformation", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocIzyqlYTMbUGOT9ThnMYDABp8Qat0eWJ1R_kJUVf9ReFwDCF-P3=s96-c", "provider_id": "107242988239657405091", "email_verified": true, "phone_verified": false}', 'google', '2026-05-01 03:17:10.81633+00', '2026-05-01 03:17:10.817367+00', '2026-05-03 13:02:48.570596+00', '7c5eb244-427f-4e67-b768-dc9ee886ecfa'),
	('115790890803401702915', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', '{"iss": "https://accounts.google.com", "sub": "115790890803401702915", "name": "Alzejones Dias", "email": "alzejones@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocISgn_SaSrLuE9AV45yBjqzf0lIlr4Fh0cMk3YSpCW_AMYPbimp=s96-c", "full_name": "Alzejones Dias", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocISgn_SaSrLuE9AV45yBjqzf0lIlr4Fh0cMk3YSpCW_AMYPbimp=s96-c", "provider_id": "115790890803401702915", "email_verified": true, "phone_verified": false}', 'google', '2026-04-29 17:37:46.927609+00', '2026-04-29 17:37:46.927665+00', '2026-05-07 19:04:17.639716+00', '1cf345d0-1ab0-4962-9ab0-a4974e8cc162');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('000afc14-e4cb-4b11-9565-77f7a2a6275c', '478d3725-60f8-482e-9573-5836ebd457f9', '2026-05-01 03:17:10.836388+00', '2026-05-07 13:49:46.439007+00', NULL, 'aal1', NULL, '2026-05-07 13:49:46.438885', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36', '177.9.62.201', NULL, NULL, NULL, NULL, NULL),
	('5d6e4803-78d9-43a1-9e35-cbd83ce99a43', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', '2026-05-07 15:26:03.349088+00', '2026-05-08 18:04:42.268769+00', NULL, 'aal1', NULL, '2026-05-08 18:04:42.268659', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36', '45.225.171.166', NULL, NULL, NULL, NULL, NULL),
	('b2ea1d05-b7d1-403e-b20d-1d1c81fb4b92', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', '2026-05-07 19:04:17.677653+00', '2026-05-08 19:12:15.768196+00', NULL, 'aal1', NULL, '2026-05-08 19:12:15.768087', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '45.225.171.166', NULL, NULL, NULL, NULL, NULL),
	('908e6820-8e92-421a-b63d-7fa42989ba83', '478d3725-60f8-482e-9573-5836ebd457f9', '2026-05-03 13:02:48.610054+00', '2026-05-03 13:02:48.610054+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36', '177.9.62.201', NULL, NULL, NULL, NULL, NULL),
	('c897870f-7d01-4c4a-ae80-5fea630bec00', 'fb20e9c6-f11d-45ea-92ff-41ca1e6e7d48', '2026-05-02 01:00:39.475086+00', '2026-05-02 01:00:39.475086+00', NULL, 'aal1', NULL, NULL, 'WhatsApp/2.23.20.0', '189.63.227.117', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('5d6e4803-78d9-43a1-9e35-cbd83ce99a43', '2026-05-07 15:26:03.369384+00', '2026-05-07 15:26:03.369384+00', 'oauth', '346934ae-acd9-4bb8-9ccc-b57f6e92f3a1'),
	('b2ea1d05-b7d1-403e-b20d-1d1c81fb4b92', '2026-05-07 19:04:17.712402+00', '2026-05-07 19:04:17.712402+00', 'oauth', '36bcdff2-6ea7-44d9-9d2c-dbb121cc0b13'),
	('000afc14-e4cb-4b11-9565-77f7a2a6275c', '2026-05-01 03:17:10.881955+00', '2026-05-01 03:17:10.881955+00', 'oauth', 'e19c7236-5ef1-4a36-a7d3-5a3d53f08436'),
	('c897870f-7d01-4c4a-ae80-5fea630bec00', '2026-05-02 01:00:39.511242+00', '2026-05-02 01:00:39.511242+00', 'otp', 'adedea7f-2163-4508-980a-258a3192f401'),
	('908e6820-8e92-421a-b63d-7fa42989ba83', '2026-05-03 13:02:48.647084+00', '2026-05-03 13:02:48.647084+00', 'oauth', 'd92a998b-a735-472e-a1ab-58c37b122c11');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 18, 'roflxncoezdz', '478d3725-60f8-482e-9573-5836ebd457f9', true, '2026-05-01 03:17:10.859348+00', '2026-05-07 12:13:00.767863+00', NULL, '000afc14-e4cb-4b11-9565-77f7a2a6275c'),
	('00000000-0000-0000-0000-000000000000', 98, 'szyiuu4zfsad', '478d3725-60f8-482e-9573-5836ebd457f9', true, '2026-05-07 12:13:00.786874+00', '2026-05-07 13:49:46.391275+00', 'roflxncoezdz', '000afc14-e4cb-4b11-9565-77f7a2a6275c'),
	('00000000-0000-0000-0000-000000000000', 100, 'aqq4pi4r3pj3', '478d3725-60f8-482e-9573-5836ebd457f9', false, '2026-05-07 13:49:46.408919+00', '2026-05-07 13:49:46.408919+00', 'szyiuu4zfsad', '000afc14-e4cb-4b11-9565-77f7a2a6275c'),
	('00000000-0000-0000-0000-000000000000', 103, 'qxijeiq5pdjh', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', true, '2026-05-07 15:26:03.35967+00', '2026-05-07 16:33:13.216653+00', NULL, '5d6e4803-78d9-43a1-9e35-cbd83ce99a43'),
	('00000000-0000-0000-0000-000000000000', 104, 'aefll5b63zim', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', true, '2026-05-07 16:33:13.234867+00', '2026-05-07 18:25:27.678773+00', 'qxijeiq5pdjh', '5d6e4803-78d9-43a1-9e35-cbd83ce99a43'),
	('00000000-0000-0000-0000-000000000000', 105, 'rp6ghjvhro5j', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', true, '2026-05-07 18:25:27.703307+00', '2026-05-07 19:23:58.985895+00', 'aefll5b63zim', '5d6e4803-78d9-43a1-9e35-cbd83ce99a43'),
	('00000000-0000-0000-0000-000000000000', 26, 'r3t6oagkdnie', 'fb20e9c6-f11d-45ea-92ff-41ca1e6e7d48', false, '2026-05-02 01:00:39.481555+00', '2026-05-02 01:00:39.481555+00', NULL, 'c897870f-7d01-4c4a-ae80-5fea630bec00'),
	('00000000-0000-0000-0000-000000000000', 107, '5m3xre4x2udl', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', true, '2026-05-07 19:23:59.003344+00', '2026-05-08 18:04:42.187042+00', 'rp6ghjvhro5j', '5d6e4803-78d9-43a1-9e35-cbd83ce99a43'),
	('00000000-0000-0000-0000-000000000000', 108, 'slxigr7fufzt', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', false, '2026-05-08 18:04:42.216392+00', '2026-05-08 18:04:42.216392+00', '5m3xre4x2udl', '5d6e4803-78d9-43a1-9e35-cbd83ce99a43'),
	('00000000-0000-0000-0000-000000000000', 106, '5yrdskfzjevf', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', true, '2026-05-07 19:04:17.698243+00', '2026-05-08 19:12:15.687229+00', NULL, 'b2ea1d05-b7d1-403e-b20d-1d1c81fb4b92'),
	('00000000-0000-0000-0000-000000000000', 109, 'nyosqenqxtoo', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', false, '2026-05-08 19:12:15.714062+00', '2026-05-08 19:12:15.714062+00', '5yrdskfzjevf', 'b2ea1d05-b7d1-403e-b20d-1d1c81fb4b92'),
	('00000000-0000-0000-0000-000000000000', 43, '7b2apk5uxprg', '478d3725-60f8-482e-9573-5836ebd457f9', false, '2026-05-03 13:02:48.631056+00', '2026-05-03 13:02:48.631056+00', NULL, '908e6820-8e92-421a-b63d-7fa42989ba83');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: trainers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."trainers" ("id", "user_id", "name", "email", "phone", "created_at") VALUES
	('7357c2e4-4540-462a-99a7-cf38e55538c2', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', 'Alzejones Dias', 'alzejones@gmail.com', NULL, '2026-04-29 17:37:46.902356+00'),
	('a5816c68-bf56-40ac-9382-2bdefd30ca77', '478d3725-60f8-482e-9573-5836ebd457f9', 'Elisangela Figueiredo', 'wedo.transform@gmail.com', NULL, '2026-05-01 03:17:10.636736+00');


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."clients" ("id", "trainer_id", "name", "email", "phone", "birth_date", "gender", "height_cm", "created_at", "user_id", "objective", "activity_level", "food_restrictions", "observation", "is_active", "updated_at") VALUES
	('30776e19-8435-4335-a62f-130765e37ee6', '7357c2e4-4540-462a-99a7-cf38e55538c2', 'Teste1 banco novo', 'teste1novobanco@gmail.com', '(16) 98102-0191', '1981-09-10', 'M', 180.00, '2026-04-30 01:52:47.821847+00', NULL, 'emagrecimento', 'moderadamente_ativo', 'Lactose', 'Tudo ok', true, '2026-04-30 13:57:35.476292+00'),
	('e9c58501-0f8e-4739-b959-deac0ad0e7f4', '7357c2e4-4540-462a-99a7-cf38e55538c2', 'Aluno 2 teste', 'aluno2teste@gmail.co.', '(16) 98102-0191', '1971-09-10', 'M', 180.00, '2026-04-30 02:40:45.100649+00', NULL, 'manutencao', 'extremamente_ativo', 'Ok', 'Ok', true, '2026-04-30 13:57:35.476292+00'),
	('2ab96348-80ea-4b19-82ed-9793c34bf451', '7357c2e4-4540-462a-99a7-cf38e55538c2', 'Maria Clara Katerhine Rapelli', 'clara.rapelli@unesp.com.br', '(16) 99717-9089', '2002-08-10', 'F', 160.00, '2026-04-30 21:51:44.490528+00', NULL, 'saude', 'moderadamente_ativo', 'Estomatite, nozes em geral.', 'Objetivo: Saúde, ter o corpo ativo. Ter onde extravasar.
Não sabe
Sempre fez parte.

Não sabe sentem algo que incomoda.
Disciplina.

Trabalhar mais o conceito de disciplina.

Perna esquerda forte 
Direita resistência 

Lombar

Lesão ante- braços 

Flexibilidade do pulso, abriu 3 vezes volley.', true, '2026-04-30 21:57:55.128+00'),
	('b41324fa-005c-43fe-8a6b-3b0c13948071', '7357c2e4-4540-462a-99a7-cf38e55538c2', 'Júlio César de Paula e Silva', 'JULIORODONAVES@HOTMAIL.COM', '(16) 99149-9992', '1970-11-25', 'M', 173.00, '2026-04-30 23:42:13.312211+00', NULL, 'emagrecimento', 'levemente_ativo', NULL, 'Perder barriga e gordura visceral 
Acha que houve falta de acompanhamento.', true, '2026-04-30 23:42:13.312211+00'),
	('280ad4ba-1d6b-4c09-b55c-60799f8b802d', '7357c2e4-4540-462a-99a7-cf38e55538c2', 'Gabriela Lisboa de Sousa', 'gabrielalisboahj@gmail.com', '(16) 98102-9924', '1996-09-05', 'F', NULL, '2026-05-01 01:25:29.947901+00', NULL, NULL, NULL, NULL, NULL, true, '2026-05-01 01:25:29.947901+00'),
	('687fa21d-b623-4164-9fa5-cf0440147523', 'a5816c68-bf56-40ac-9382-2bdefd30ca77', 'Elisângela Figueiredo Pereira', 'lissasjc@gmail.coml', '(12) 97411-1724', '1983-10-13', 'F', 172.00, '2026-05-01 03:19:48.10625+00', NULL, 'hipertrofia', 'moderadamente_ativo', NULL, NULL, true, '2026-05-01 03:19:48.10625+00'),
	('5a32bcc7-63af-46e4-8c58-7d4de030e48e', '7357c2e4-4540-462a-99a7-cf38e55538c2', 'Aluno3 teste', 'teste0333@gmail.com', '(16) 98102-0191', '1971-09-10', 'M', 180.00, '2026-04-30 03:07:10.699461+00', NULL, 'hipertrofia', 'extremamente_ativo', 'Al rgoa', 'Te ata novo banco ', true, '2026-05-01 19:54:54.26+00'),
	('7cbf41ac-57e9-4fa9-9d73-4615cbbdf338', '7357c2e4-4540-462a-99a7-cf38e55538c2', 'Teste 4', 'teste4@gmail.com', '(16) 98102-0191', '1971-09-10', 'M', 180.00, '2026-05-03 21:08:29.375046+00', NULL, 'emagrecimento', 'sedentario', NULL, 'Hshsh', true, '2026-05-03 21:08:29.375046+00'),
	('9496a66b-a2a1-4252-bf05-82967d5983c9', '7357c2e4-4540-462a-99a7-cf38e55538c2', 'Teste5 okok', 'testegoog@gmail.com', '(16) 98102-0191', '1971-09-10', 'M', 180.00, '2026-05-04 17:23:20.472396+00', NULL, 'emagrecimento', 'sedentario', NULL, NULL, true, '2026-05-04 17:23:20.472396+00'),
	('587e3eef-1cea-4921-818e-ed3e1dc07c57', '7357c2e4-4540-462a-99a7-cf38e55538c2', 'Teste 5 cinco', 'teste05@gmail.com', '(16) 98102-0191', '1971-09-10', 'M', 180.00, '2026-05-05 17:46:39.589329+00', NULL, 'emagrecimento', 'sedentario', NULL, 'Teste yescsv', true, '2026-05-05 17:46:39.589329+00'),
	('b27c23ac-2982-45e4-baa8-922d4eee795e', '7357c2e4-4540-462a-99a7-cf38e55538c2', 'teste07 geral', 'teste07@gmail.com', '(16) 98102-0191', '1971-02-01', 'M', 190.00, '2026-05-06 01:49:51.287904+00', NULL, 'emagrecimento', 'levemente_ativo', NULL, NULL, true, '2026-05-06 01:49:51.287904+00'),
	('7959ff3a-81d5-46f6-9f3d-15b23ed97f93', '7357c2e4-4540-462a-99a7-cf38e55538c2', 'Maria Eduarda Soares de Azevedo', 'dudartazevedo@gmail.com', '(16) 99393-9566', '2005-05-09', 'M', 174.00, '2026-05-06 22:34:35.781915+00', NULL, 'emagrecimento', 'moderadamente_ativo', NULL, 'Mais condicionamento 
Hipo-hiper tiroidismo 
Emagrecer 
Condicionamento', true, '2026-05-06 22:34:35.781915+00');


--
-- Data for Name: physical_assessments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."physical_assessments" ("id", "client_id", "trainer_id", "assessment_date", "notes", "created_at", "date", "assessor_name") VALUES
	('a62f5a56-59be-4de5-9803-fb2f3e21de09', '5a32bcc7-63af-46e4-8c58-7d4de030e48e', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-04-30', NULL, '2026-04-30 18:36:52.142209+00', '2026-04-30', 'alzejones@gmail.com'),
	('acbb1302-666e-4cf3-babd-cef1aeb5128d', '2ab96348-80ea-4b19-82ed-9793c34bf451', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-04-30', NULL, '2026-04-30 22:03:02.139272+00', '2026-04-30', 'alzejones@gmail.com'),
	('ddf69dcc-5c29-43ba-92d9-1d16b3f4172e', 'b41324fa-005c-43fe-8a6b-3b0c13948071', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-04-30', NULL, '2026-04-30 23:44:43.611911+00', '2026-04-30', 'alzejones@gmail.com'),
	('c0ea11be-f7e0-499b-bf17-6f24fb4f607a', '687fa21d-b623-4164-9fa5-cf0440147523', 'a5816c68-bf56-40ac-9382-2bdefd30ca77', '2026-05-01', NULL, '2026-05-01 03:30:39.432428+00', '2026-05-01', 'wedo.transform@gmail.com'),
	('65a3506e-e9a5-46fe-935a-157162acae54', '687fa21d-b623-4164-9fa5-cf0440147523', 'a5816c68-bf56-40ac-9382-2bdefd30ca77', '2026-05-01', NULL, '2026-05-01 03:30:59.916808+00', '2026-05-01', 'wedo.transform@gmail.com'),
	('32a6dc5f-445f-47cc-bfdc-79e15a071a84', '687fa21d-b623-4164-9fa5-cf0440147523', 'a5816c68-bf56-40ac-9382-2bdefd30ca77', '2026-05-01', NULL, '2026-05-01 03:33:02.739432+00', '2026-05-01', 'wedo.transform@gmail.com'),
	('1e4f4beb-c5a8-41d2-b905-c7d3408b8dbf', '5a32bcc7-63af-46e4-8c58-7d4de030e48e', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-05-01', NULL, '2026-05-01 19:56:56.540172+00', '2026-05-01', 'alzejones@gmail.com'),
	('16e81021-377c-4576-9eab-cfb4218f51a3', '5a32bcc7-63af-46e4-8c58-7d4de030e48e', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-04-30', NULL, '2026-04-30 18:13:20.726474+00', '2026-04-30', 'alzejones@gmail.com'),
	('ce52e0d8-34c1-4403-ac32-0267059db6a9', '5a32bcc7-63af-46e4-8c58-7d4de030e48e', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-05-01', NULL, '2026-05-01 19:52:12.581929+00', '2026-05-01', 'alzejones@gmail.com'),
	('e61800b5-780e-4469-bf4e-01d62eacad51', '5a32bcc7-63af-46e4-8c58-7d4de030e48e', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-05-01', NULL, '2026-05-01 20:06:34.938693+00', '2026-05-01', 'alzejones@gmail.com'),
	('c014cd68-e737-41c2-a9f1-118ddef1b9a2', '5a32bcc7-63af-46e4-8c58-7d4de030e48e', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-05-01', NULL, '2026-05-01 20:50:58.333732+00', '2026-05-01', 'alzejones@gmail.com'),
	('1835455a-6146-4098-abb1-2752d40b759e', '5a32bcc7-63af-46e4-8c58-7d4de030e48e', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-05-01', NULL, '2026-05-01 21:05:32.299672+00', '2026-05-01', 'alzejones@gmail.com'),
	('638dde09-7ae6-4ba3-a5ca-19ee353f2b40', '5a32bcc7-63af-46e4-8c58-7d4de030e48e', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-05-01', NULL, '2026-05-01 21:10:44.027006+00', '2026-05-01', 'alzejones@gmail.com'),
	('15d70dba-f2d8-4911-973e-62bf8eec3e63', 'b41324fa-005c-43fe-8a6b-3b0c13948071', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-05-02', NULL, '2026-05-02 10:58:05.6534+00', '2026-05-02', 'alzejones@gmail.com'),
	('f1146f4c-fc86-407d-a183-052c62d051f3', '2ab96348-80ea-4b19-82ed-9793c34bf451', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-05-02', NULL, '2026-05-02 11:02:29.799934+00', '2026-05-02', 'alzejones@gmail.com'),
	('962048d6-5753-4aa4-b105-c4a8979fb248', '687fa21d-b623-4164-9fa5-cf0440147523', 'a5816c68-bf56-40ac-9382-2bdefd30ca77', '2026-05-03', NULL, '2026-05-03 13:36:31.251741+00', '2026-05-03', 'wedo.transform@gmail.com'),
	('c6b38302-b726-4f97-9f24-bd999f43eb6a', 'e9c58501-0f8e-4739-b959-deac0ad0e7f4', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-05-03', NULL, '2026-05-03 16:23:35.312062+00', '2026-05-03', 'alzejones@gmail.com'),
	('06381d05-03f7-4a8d-87db-9d8460965eba', '30776e19-8435-4335-a62f-130765e37ee6', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-05-03', NULL, '2026-05-03 18:03:23.73669+00', '2026-05-03', 'alzejones@gmail.com'),
	('8974380d-18cd-451b-9814-aba3afe159a1', '7cbf41ac-57e9-4fa9-9d73-4615cbbdf338', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-05-03', NULL, '2026-05-03 21:09:40.895064+00', '2026-05-03', 'alzejones@gmail.com'),
	('ad95e85a-10a9-495c-8763-796d489ff220', '9496a66b-a2a1-4252-bf05-82967d5983c9', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-05-04', NULL, '2026-05-04 17:25:35.480806+00', '2026-02-20', 'alzejones@gmail.com'),
	('f66ffc51-1b30-411d-b208-8a7bbd4fdbf3', '9496a66b-a2a1-4252-bf05-82967d5983c9', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-05-04', NULL, '2026-05-04 17:32:09.599483+00', '2026-05-04', 'alzejones@gmail.com'),
	('85302ae9-7d4f-4bdd-bd0c-2337bb789edc', '7959ff3a-81d5-46f6-9f3d-15b23ed97f93', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-05-06', NULL, '2026-05-06 22:42:32.769943+00', '2026-05-06', 'alzejones@gmail.com'),
	('1fd947f8-8377-4baa-84d8-9abef7824880', '587e3eef-1cea-4921-818e-ed3e1dc07c57', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-05-07', NULL, '2026-05-07 16:35:16.276234+00', '2026-05-07', 'alzejones@gmail.com'),
	('cdd8eaac-df81-4bfd-ae2d-937c86c80c88', '587e3eef-1cea-4921-818e-ed3e1dc07c57', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-05-05', NULL, '2026-05-05 17:48:03.351124+00', '2026-05-05', 'alzejones@gmail.com'),
	('c08ad1fd-082d-44ee-99e4-3db8d6b9d182', 'b27c23ac-2982-45e4-baa8-922d4eee795e', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-05-06', NULL, '2026-05-06 01:53:17.863337+00', '2026-01-02', 'alzejones@gmail.com'),
	('38a41cc2-955c-4f1e-bf86-fc0c58e06e0b', 'b27c23ac-2982-45e4-baa8-922d4eee795e', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-05-07', NULL, '2026-05-07 18:34:13.174399+00', '2026-01-15', 'alzejones@gmail.com'),
	('66050cab-9b3a-44bf-ae06-98ff8758f155', 'b27c23ac-2982-45e4-baa8-922d4eee795e', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-05-07', NULL, '2026-05-07 18:37:49.138289+00', '2026-01-30', 'alzejones@gmail.com'),
	('1ffd73c2-b4a1-42c1-81d5-acfb0b34c8c5', 'b27c23ac-2982-45e4-baa8-922d4eee795e', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-05-07', NULL, '2026-05-07 18:47:49.731497+00', '2026-02-15', 'alzejones@gmail.com'),
	('924559cf-67af-442d-be90-5657c75dcee7', 'b27c23ac-2982-45e4-baa8-922d4eee795e', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-05-08', NULL, '2026-05-08 18:44:23.607783+00', '2026-02-28', 'alzejones@gmail.com'),
	('65ae5268-1ebd-42c0-b842-81fa36af8c26', 'b27c23ac-2982-45e4-baa8-922d4eee795e', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-05-08', NULL, '2026-05-08 18:47:01.857906+00', '2026-03-15', 'alzejones@gmail.com'),
	('77fb6dee-5eb5-41af-8377-23dd6195b300', 'b27c23ac-2982-45e4-baa8-922d4eee795e', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-05-08', NULL, '2026-05-08 18:51:47.069631+00', '2026-03-30', 'alzejones@gmail.com'),
	('22665d3b-9cf8-4809-91e3-f0fc97b2f021', 'b27c23ac-2982-45e4-baa8-922d4eee795e', '7357c2e4-4540-462a-99a7-cf38e55538c2', '2026-05-08', NULL, '2026-05-08 18:56:48.840656+00', '2026-05-08', 'alzejones@gmail.com');


--
-- Data for Name: anthropometry; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."anthropometry" ("id", "assessment_id", "weight", "body_fat_percent", "muscle_mass_kg", "chest_cm", "waist_cm", "hips_cm", "right_arm_cm", "left_arm_cm", "right_forearm_cm", "left_forearm_cm", "right_thigh_cm", "left_thigh_cm", "right_calf_cm", "left_calf_cm", "created_at", "bmi", "water_percent", "bone_mass", "source", "view_count", "body_fat", "muscle_mass_percentage", "basal_metabolic_rate", "body_fat_index", "metabolic_age", "height", "waist", "hip", "chest", "abdomen", "arm_right", "arm_left", "thigh_right", "thigh_left", "calf_right", "calf_left") VALUES
	('daec4f2e-a519-4d4a-adae-b027c4ba9175', 'a62f5a56-59be-4de5-9803-fb2f3e21de09', 140.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-30 18:36:52.252943+00', NULL, NULL, NULL, 'manual', 0, 42.00, 19.00, 13.0, 8.0, 70, NULL, 110, 130, 150, 120, 38, 38, 65, 65, 45, 45),
	('946c11ec-1cf3-48f0-87ff-d64423c42977', 'acbb1302-666e-4cf3-babd-cef1aeb5128d', 61.60, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-30 22:03:02.452568+00', NULL, NULL, NULL, 'manual', 0, 33.20, 29.10, 1302.0, 4.0, 33, NULL, 84, 100, 91, 77.5, 28, 27.5, 57, 59.6, 29.5, 30),
	('81b3e7a0-33a1-4923-a3db-1683174eaf81', 'ddf69dcc-5c29-43ba-92d9-1d16b3f4172e', 78.70, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-30 23:44:44.062848+00', NULL, NULL, NULL, 'manual', 0, 27.50, 32.40, 1670.0, 12.0, 55, NULL, 104, 92.5, 102, 101, 33.5, 32.5, 58, 56, 33, 33.5),
	('208f85f9-6a21-4e62-9f2b-2c03e8b6d81c', '1e4f4beb-c5a8-41d2-b905-c7d3408b8dbf', 90.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-01 19:56:56.729353+00', NULL, NULL, NULL, 'manual', 0, 25.00, 38.00, 1900.0, 5.0, 50, NULL, 80, 95, 110, 90, 35, 33, 68, 70, 47, 45),
	('ee2a3820-6bc5-4897-9824-9d1599758654', '16e81021-377c-4576-9eab-cfb4218f51a3', 130.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-30 18:13:20.996201+00', NULL, NULL, NULL, 'manual', 0, 45.00, 20.00, 1100.0, 120.0, 70, NULL, 110, 100, 140, 120, 35, 35, 70, 70, 40, 40),
	('f0541d65-09eb-449e-897d-a44385ede31d', 'ce52e0d8-34c1-4403-ac32-0267059db6a9', 100.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-01 19:52:12.718075+00', NULL, NULL, NULL, 'manual', 0, 28.00, 34.60, 1860.0, 4.0, 60, NULL, 90, 100, 90, 85, 23, 25, 62, 65, 32, 35),
	('ed200841-cddb-476a-a7a9-ca8a9329e931', '962048d6-5753-4aa4-b105-c4a8979fb248', 84.40, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-03 13:36:31.408112+00', NULL, NULL, NULL, 'manual', 0, 34.30, 26.30, 1548.0, 2.0, 47, NULL, 82.5, 116, 94.5, 98.5, NULL, NULL, NULL, NULL, NULL, NULL),
	('2425da29-836c-49d3-a1dc-4ae6cd4d9337', 'c6b38302-b726-4f97-9f24-bd999f43eb6a', 100.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-03 16:23:35.655637+00', NULL, NULL, NULL, 'manual', 0, 30.00, 25.00, 1200.0, 12.0, 65, NULL, 130, 140, 120, 110, 30, 27, 77, 75, 48, 45),
	('ca4b095b-194e-4053-913a-14691325955c', '06381d05-03f7-4a8d-87db-9d8460965eba', 120.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-03 18:03:23.905186+00', NULL, NULL, NULL, 'manual', 0, 35.00, 25.00, 1100.0, 13.0, 70, NULL, 110, 130, 125, 120, 32, 30, 83, 80, 55, 50),
	('ef45d9a9-cda6-41e7-9145-3ccd32a891c1', '8974380d-18cd-451b-9814-aba3afe159a1', 120.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-03 21:09:41.082447+00', NULL, NULL, NULL, 'manual', 0, 35.00, 23.00, 1100.0, 10.0, 70, NULL, 125, 130, 140, 120, 32, 30, 83, 80, 47, 45),
	('8ae7ed7c-cc79-4177-9f36-b0cd01c088f9', 'ad95e85a-10a9-495c-8763-796d489ff220', 120.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-04 17:25:35.762361+00', NULL, NULL, NULL, 'manual', 0, 35.00, 25.00, 1100.0, 11.0, 60, NULL, 100, 130, 120, 110, 30, 27, 93, 90, 53, 50),
	('4f23e9ba-f1c5-4e54-a8d2-41b2d9035068', 'f66ffc51-1b30-411d-b208-8a7bbd4fdbf3', 110.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-04 17:32:09.913411+00', NULL, NULL, NULL, 'manual', 0, 33.00, 35.00, 1200.0, 10.0, 65, NULL, 115, 120, 100, 110, 32, 30, 82, 80, 52, 50),
	('582192d1-e6e9-4ace-ae94-645cfb263ea8', '85302ae9-7d4f-4bdd-bd0c-2337bb789edc', 75.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-06 22:42:33.197048+00', NULL, NULL, NULL, 'manual', 0, 40.80, 24.60, 1498.0, 4.0, 30, NULL, 97.5, 108.5, 95, 82, 27.5, 27, 64.5, 62, 37.5, 37),
	('17dffaa4-68a2-483b-8a92-ee9c8ad105f6', '1fd947f8-8377-4baa-84d8-9abef7824880', 100.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-07 16:35:16.55445+00', NULL, NULL, NULL, 'manual', 0, 35.00, 25.00, 1100.0, 9.0, 75, NULL, 100, 120, 120, 110, 30, 28, 80, 78, 40, 38),
	('bb473e8e-84cd-494a-8d52-adc9b058d110', 'cdd8eaac-df81-4bfd-ae2d-937c86c80c88', 90.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-05 17:48:03.450241+00', NULL, NULL, NULL, 'manual', 0, 32.00, 25.00, 1000.0, 10.0, 70, NULL, 120, 135, 140, 130, 40, 38, 92, 90, 58, 55),
	('494971c3-0c74-429a-a88a-95d5a71aac0f', 'c08ad1fd-082d-44ee-99e4-3db8d6b9d182', 110.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-06 01:53:18.089855+00', NULL, NULL, NULL, 'manual', 0, 40.00, 28.00, 1000.0, 10.0, 60, NULL, 115, 130, 120, 110, 30, 28, 77, 75, 47, 45),
	('cc7edcb5-e46f-494e-aec4-dade516e3834', '38a41cc2-955c-4f1e-bf86-fc0c58e06e0b', 105.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-07 18:34:13.625072+00', NULL, NULL, NULL, 'manual', 0, 42.00, 25.00, 1100.0, 11.0, 70, NULL, 110, 115, 105, 100, 28, 26, 88, 86, 38, 36),
	('1a91f843-768c-4ee3-aea6-885d94099af4', '66050cab-9b3a-44bf-ae06-98ff8758f155', 100.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-07 18:37:49.270896+00', NULL, NULL, NULL, 'manual', 0, 39.00, 31.00, 1150.0, 9.0, 65, NULL, 98, 105, 100, 95, 29, 29, 79, 79, 39, 39),
	('f15969cd-0998-4ba8-9680-fa57876aaa9b', '1ffd73c2-b4a1-42c1-81d5-acfb0b34c8c5', 95.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-07 18:47:49.832055+00', NULL, NULL, NULL, 'manual', 0, 37.00, 35.00, 1400.0, 8.0, 60, NULL, 98, 105, 95, 95, 26, 26, 72, 75, 38, 38),
	('bbe62bda-c875-42c3-9f30-436b09f3384a', '924559cf-67af-442d-be90-5657c75dcee7', 90.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-08 18:44:23.792778+00', NULL, NULL, NULL, 'manual', 0, 38.00, 32.00, 1400.0, 9.0, 65, NULL, 98, 110, 102, 95, 30, 30, 75, 75, 40, 40),
	('a3931f4a-890c-4569-a9db-33637ef50692', '65ae5268-1ebd-42c0-b842-81fa36af8c26', 85.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-08 18:47:02.039004+00', NULL, NULL, NULL, 'manual', 0, 34.00, 39.00, 1500.0, 7.0, 60, NULL, 95, 100, 95, 90, 27, 27, 70, 70, 38, 38),
	('5622ec98-ace9-4f1b-99d1-675d66752836', '77fb6dee-5eb5-41af-8377-23dd6195b300', 80.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-08 18:51:47.329602+00', NULL, NULL, NULL, 'manual', 0, 29.00, 38.00, 1600.0, 5.0, 50, NULL, 90, 105, 100, 85, 28, 28, 79, 79, 39, 39),
	('dfbb7d4c-7c0c-4b8f-acf0-2e7e3a86c8f7', '22665d3b-9cf8-4809-91e3-f0fc97b2f021', 82.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-08 18:56:48.926339+00', NULL, NULL, NULL, 'manual', 0, 25.00, 40.00, 1700.0, 5.0, 50, NULL, 80, 95, 100, 85, 30, 30, 80, 80, 40, 40);


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."appointments" ("id", "trainer_id", "client_id", "appointment_date", "appointment_time", "whatsapp_sent", "created_at", "types", "notes", "status") VALUES
	('3a84a30d-d959-4136-b4c0-63fdfb7e711e', '7357c2e4-4540-462a-99a7-cf38e55538c2', 'e9c58501-0f8e-4739-b959-deac0ad0e7f4', '2026-05-03', '11:00:00', false, '2026-05-01 19:34:30.393813+00', '{Condicionamento}', '', 'scheduled'),
	('ea9ce148-c0bd-4027-8a03-1a99f9cf8fb2', '7357c2e4-4540-462a-99a7-cf38e55538c2', '5a32bcc7-63af-46e4-8c58-7d4de030e48e', '2026-05-04', '09:00:00', false, '2026-05-01 19:35:05.913573+00', '{Comp.Corporal,Condicionamento}', '', 'scheduled'),
	('652f34c9-4988-48a0-b44e-f722857a2631', '7357c2e4-4540-462a-99a7-cf38e55538c2', '30776e19-8435-4335-a62f-130765e37ee6', '2026-05-02', '07:00:00', true, '2026-05-01 19:33:50.395674+00', '{Comp.Corporal}', '', 'scheduled'),
	('c74eab36-6079-43de-86ff-b5183d30481a', '7357c2e4-4540-462a-99a7-cf38e55538c2', 'b27c23ac-2982-45e4-baa8-922d4eee795e', '2026-05-08', '09:00:00', false, '2026-05-06 01:50:42.869658+00', '{Comp.Corporal,Condicionamento}', '', 'scheduled');


--
-- Data for Name: assessment_photos; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."assessment_photos" ("id", "assessment_id", "trainer_id", "client_id", "storage_path", "label", "created_at") VALUES
	('c0eba357-fb42-4535-ad2e-138c2baca409', '1fd947f8-8377-4baa-84d8-9abef7824880', '7357c2e4-4540-462a-99a7-cf38e55538c2', '587e3eef-1cea-4921-818e-ed3e1dc07c57', '7357c2e4-4540-462a-99a7-cf38e55538c2/587e3eef-1cea-4921-818e-ed3e1dc07c57/1fd947f8-8377-4baa-84d8-9abef7824880/1778171716298_zk2wbu.jpg', 'outro', '2026-05-07 16:35:17.2166+00'),
	('0fc3fbc4-9e20-4261-afe4-52c5a2e8224c', '1fd947f8-8377-4baa-84d8-9abef7824880', '7357c2e4-4540-462a-99a7-cf38e55538c2', '587e3eef-1cea-4921-818e-ed3e1dc07c57', '7357c2e4-4540-462a-99a7-cf38e55538c2/587e3eef-1cea-4921-818e-ed3e1dc07c57/1fd947f8-8377-4baa-84d8-9abef7824880/1778171716942_sddus6.jpg', 'outro', '2026-05-07 16:35:17.633572+00'),
	('4ccc4cf1-d322-41e0-9431-7067ecbd999a', 'cdd8eaac-df81-4bfd-ae2d-937c86c80c88', '7357c2e4-4540-462a-99a7-cf38e55538c2', '587e3eef-1cea-4921-818e-ed3e1dc07c57', '7357c2e4-4540-462a-99a7-cf38e55538c2/587e3eef-1cea-4921-818e-ed3e1dc07c57/cdd8eaac-df81-4bfd-ae2d-937c86c80c88/1778171928772_5w0lwn.jpg', 'outro', '2026-05-07 16:38:49.678907+00'),
	('1124cf7d-9d3c-401d-9ee8-a9d631513fbc', 'cdd8eaac-df81-4bfd-ae2d-937c86c80c88', '7357c2e4-4540-462a-99a7-cf38e55538c2', '587e3eef-1cea-4921-818e-ed3e1dc07c57', '7357c2e4-4540-462a-99a7-cf38e55538c2/587e3eef-1cea-4921-818e-ed3e1dc07c57/cdd8eaac-df81-4bfd-ae2d-937c86c80c88/1778171929395_suhvgh.jpg', 'outro', '2026-05-07 16:38:50.01402+00'),
	('a2d0998e-22c6-4083-a8fc-af38e9a962a9', '66050cab-9b3a-44bf-ae06-98ff8758f155', '7357c2e4-4540-462a-99a7-cf38e55538c2', 'b27c23ac-2982-45e4-baa8-922d4eee795e', '7357c2e4-4540-462a-99a7-cf38e55538c2/b27c23ac-2982-45e4-baa8-922d4eee795e/66050cab-9b3a-44bf-ae06-98ff8758f155/1778179068982_un5zof.jpg', 'outro', '2026-05-07 18:37:49.984284+00'),
	('12283b3b-ce2c-406d-a3be-7a1500b7671f', '66050cab-9b3a-44bf-ae06-98ff8758f155', '7357c2e4-4540-462a-99a7-cf38e55538c2', 'b27c23ac-2982-45e4-baa8-922d4eee795e', '7357c2e4-4540-462a-99a7-cf38e55538c2/b27c23ac-2982-45e4-baa8-922d4eee795e/66050cab-9b3a-44bf-ae06-98ff8758f155/1778179069655_4d4isf.jpg', 'outro', '2026-05-07 18:37:50.344832+00'),
	('e3894fd0-00ea-4e2c-8d5f-9b0fc24a7ff0', '66050cab-9b3a-44bf-ae06-98ff8758f155', '7357c2e4-4540-462a-99a7-cf38e55538c2', 'b27c23ac-2982-45e4-baa8-922d4eee795e', '7357c2e4-4540-462a-99a7-cf38e55538c2/b27c23ac-2982-45e4-baa8-922d4eee795e/66050cab-9b3a-44bf-ae06-98ff8758f155/1778179070017_8abzoq.jpg', 'outro', '2026-05-07 18:37:50.713867+00'),
	('3f647726-533e-4cd2-a0af-4dcc1b354aaa', '1ffd73c2-b4a1-42c1-81d5-acfb0b34c8c5', '7357c2e4-4540-462a-99a7-cf38e55538c2', 'b27c23ac-2982-45e4-baa8-922d4eee795e', '7357c2e4-4540-462a-99a7-cf38e55538c2/b27c23ac-2982-45e4-baa8-922d4eee795e/1ffd73c2-b4a1-42c1-81d5-acfb0b34c8c5/1778179792769_pd31mp.jpg', 'outro', '2026-05-07 18:49:53.809594+00'),
	('5389032b-e642-4003-88dc-6f69c8a9d877', '1ffd73c2-b4a1-42c1-81d5-acfb0b34c8c5', '7357c2e4-4540-462a-99a7-cf38e55538c2', 'b27c23ac-2982-45e4-baa8-922d4eee795e', '7357c2e4-4540-462a-99a7-cf38e55538c2/b27c23ac-2982-45e4-baa8-922d4eee795e/1ffd73c2-b4a1-42c1-81d5-acfb0b34c8c5/1778179793481_g1ykw7.jpg', 'outro', '2026-05-07 18:49:54.110865+00'),
	('e772ca87-c22d-4e1e-a8cb-20771898d87c', '1ffd73c2-b4a1-42c1-81d5-acfb0b34c8c5', '7357c2e4-4540-462a-99a7-cf38e55538c2', 'b27c23ac-2982-45e4-baa8-922d4eee795e', '7357c2e4-4540-462a-99a7-cf38e55538c2/b27c23ac-2982-45e4-baa8-922d4eee795e/1ffd73c2-b4a1-42c1-81d5-acfb0b34c8c5/1778179793780_xxugci.jpg', 'outro', '2026-05-07 18:49:54.546959+00');


--
-- Data for Name: conditioning_assessments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: conditioning_tests; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."conditioning_tests" ("id", "assessment_id", "result_value", "result_unit", "notes", "created_at") VALUES
	('3e3b47ea-b123-4f0e-8185-6671cd6157f9', '638dde09-7ae6-4ba3-a5ca-19ee353f2b40', NULL, NULL, NULL, '2026-05-01 21:10:44.356923+00'),
	('7fab6de1-3356-40a8-83ee-abf748de4c21', '15d70dba-f2d8-4911-973e-62bf8eec3e63', NULL, NULL, NULL, '2026-05-02 10:58:05.889175+00'),
	('bfae0055-0fc1-4d18-93fa-623158259a85', 'f1146f4c-fc86-407d-a183-052c62d051f3', NULL, NULL, NULL, '2026-05-02 11:02:30.003831+00'),
	('62fb11dd-9fbb-41c1-b43a-ec93949ebf36', '85302ae9-7d4f-4bdd-bd0c-2337bb789edc', NULL, NULL, NULL, '2026-05-06 23:16:55.107804+00');


--
-- Data for Name: diet_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: endurance_tests; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."endurance_tests" ("id", "conditioning_test_id", "test_type", "distance_m", "time_seconds", "repetitions") VALUES
	('bc0c4323-1b83-4d8f-95b6-798e51e8509c', '3e3b47ea-b123-4f0e-8185-6671cd6157f9', 'Burpees ', NULL, NULL, '25'),
	('dbaeebef-780b-4dea-b304-48b6ee42f9a1', '3e3b47ea-b123-4f0e-8185-6671cd6157f9', 'Corrida', 400, 120, NULL),
	('96277f35-47f4-45b2-bab0-7c5a93fbaa96', '3e3b47ea-b123-4f0e-8185-6671cd6157f9', 'Agachamentos ', NULL, NULL, '50'),
	('e7da4f9a-9609-4fd3-8521-e81072b6b719', '7fab6de1-3356-40a8-83ee-abf748de4c21', 'Agachamentos ', NULL, NULL, '30'),
	('781d7045-d548-48e7-a470-52e7c8c338d4', '7fab6de1-3356-40a8-83ee-abf748de4c21', 'Burpee ', NULL, NULL, '5'),
	('f4d92b80-edc0-4377-8b5d-db73ad798776', '7fab6de1-3356-40a8-83ee-abf748de4c21', 'Corrida', 400, 201, NULL),
	('1128d235-6652-4167-ab58-79df0f797d58', '62fb11dd-9fbb-41c1-b43a-ec93949ebf36', 'Agachamentos ', NULL, NULL, '35'),
	('041490f5-34ca-4880-b62d-ac765a8af400', '62fb11dd-9fbb-41c1-b43a-ec93949ebf36', 'Burpees ', NULL, NULL, '7'),
	('dda80c72-d640-43cb-b19b-1f4e3712d9cd', '62fb11dd-9fbb-41c1-b43a-ec93949ebf36', 'Abdominais ', NULL, NULL, '25');


--
-- Data for Name: foods; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."foods" ("id", "name", "category", "energy_kcal", "protein", "carbs", "fat", "fiber_g", "sodium_mg", "created_at") VALUES
	('23892526-c44a-4670-859a-70692e073602', 'Arroz, integral, cozido', 'Cereais e derivados', 123.53, 2.59, 25.81, 1.00, 2.75, 1.24, '2026-05-02 14:17:58.686292+00'),
	('5a9c39ad-9e79-41cd-968d-0458689c8932', 'Arroz, integral, cru', 'Cereais e derivados', 359.68, 7.32, 77.45, 1.86, 4.82, 1.65, '2026-05-02 14:17:58.686292+00'),
	('585f20d5-b23c-447d-8323-d1a82bd0b97f', 'Arroz, tipo 1, cozido', 'Cereais e derivados', 128.26, 2.52, 28.06, 0.23, 1.56, 1.20, '2026-05-02 14:17:58.686292+00'),
	('737d483e-fe21-4a89-9d85-0226313de57b', 'Arroz, tipo 1, cru', 'Cereais e derivados', 357.79, 7.16, 78.76, 0.34, 1.64, 1.02, '2026-05-02 14:17:58.686292+00'),
	('ff988530-4b45-479b-80c4-c81b0cb3edba', 'Arroz, tipo 2, cozido', 'Cereais e derivados', 130.12, 2.57, 28.19, 0.36, 1.07, 1.96, '2026-05-02 14:17:58.686292+00'),
	('ed623568-d0a9-4407-a13c-1673b4898d77', 'Arroz, tipo 2, cru', 'Cereais e derivados', 358.12, 7.24, 78.88, 0.28, 1.72, 0.57, '2026-05-02 14:17:58.686292+00'),
	('5fd5b556-135f-4488-8be3-9f72ce5f5f16', 'Aveia, flocos, crua', 'Cereais e derivados', 393.82, 13.92, 66.64, 8.50, 9.13, 4.63, '2026-05-02 14:17:58.686292+00'),
	('c30d058e-f5d0-4f67-a49e-35f0e2e5c482', 'Biscoito, doce, maisena', 'Cereais e derivados', 442.82, 8.07, 75.23, 11.97, 2.10, 352.03, '2026-05-02 14:17:58.686292+00'),
	('44e47522-4e55-4891-ab2e-0644a8623fed', 'Biscoito, doce, recheado com chocolate', 'Cereais e derivados', 471.82, 6.40, 70.55, 19.58, 2.96, 239.20, '2026-05-02 14:17:58.686292+00'),
	('c1a7d13a-3ca3-4268-905c-106a020a9d24', 'Biscoito, doce, recheado com morango', 'Cereais e derivados', 471.17, 5.72, 71.01, 19.57, 1.53, 229.82, '2026-05-02 14:17:58.686292+00'),
	('52086c74-e38d-42de-ae1f-46672e67975c', 'Biscoito, doce, wafer, recheado de chocolate', 'Cereais e derivados', 502.46, 5.56, 67.54, 24.67, 1.80, 137.24, '2026-05-02 14:17:58.686292+00'),
	('0fd7596f-17af-4ce2-8316-13d5dba4b4ef', 'Biscoito, doce, wafer, recheado de morango', 'Cereais e derivados', 513.45, 4.52, 67.35, 26.40, 0.82, 119.90, '2026-05-02 14:17:58.686292+00'),
	('fc1ae5f6-17f1-4328-9fb0-83e2908f938f', 'Biscoito, salgado, cream cracker', 'Cereais e derivados', 431.73, 10.06, 68.73, 14.44, 2.51, 854.36, '2026-05-02 14:17:58.686292+00'),
	('b5eee9ef-b8ca-40ba-9e94-244b8f86095f', 'Bolo, mistura para', 'Cereais e derivados', 418.63, 6.16, 84.71, 6.13, 1.70, 462.88, '2026-05-02 14:17:58.686292+00'),
	('3bf9fec2-fc40-4dff-be99-d6c3f4d3046e', 'Bolo, pronto, aipim', 'Cereais e derivados', 323.85, 4.42, 47.86, 12.75, 0.69, 111.01, '2026-05-02 14:17:58.686292+00'),
	('a83855d5-f266-4789-888c-722ef0749581', 'Bolo, pronto, chocolate', 'Cereais e derivados', 410.01, 6.22, 54.72, 18.47, 1.43, 283.30, '2026-05-02 14:17:58.686292+00'),
	('335b0027-4044-45eb-8fb5-13326b1e7f46', 'Bolo, pronto, coco', 'Cereais e derivados', 333.44, 5.67, 52.28, 11.30, 1.06, 190.34, '2026-05-02 14:17:58.686292+00'),
	('757f91ad-8052-455f-b909-76c4c7357a9c', 'Bolo, pronto, milho', 'Cereais e derivados', 311.39, 4.80, 45.11, 12.42, 0.71, 133.81, '2026-05-02 14:17:58.686292+00'),
	('dccf24dd-abf4-4e12-bdbf-66551594a17b', 'Canjica, branca, crua', 'Cereais e derivados', 357.60, 7.20, 78.06, 0.97, 5.50, 0.79, '2026-05-02 14:17:58.686292+00'),
	('1fb1be33-2205-4a74-b24a-18165aa468ec', 'Canjica, com leite integral', 'Cereais e derivados', 112.46, 2.36, 23.63, 1.24, 1.22, 27.59, '2026-05-02 14:17:58.686292+00'),
	('5c10cf51-04b1-44eb-9065-66b6e4bed424', 'Cereais, milho, flocos, com sal', 'Cereais e derivados', 369.60, 7.29, 80.84, 1.60, 5.29, 271.74, '2026-05-02 14:17:58.686292+00'),
	('1baab801-9545-4c14-8242-c0ed71417d26', 'Cereais, milho, flocos, sem sal', 'Cereais e derivados', 363.34, 6.88, 80.45, 1.18, 1.84, 30.97, '2026-05-02 14:17:58.686292+00'),
	('9b75831d-bb5d-4cb0-8736-67f7b203d7e0', 'Cereais, mingau, milho, infantil', 'Cereais e derivados', 394.43, 6.43, 87.27, 1.09, 3.21, 399.40, '2026-05-02 14:17:58.686292+00'),
	('e8aabeb1-0a31-432f-b72f-7733f03f502d', 'Cereais, mistura para vitamina, trigo, cevada e aveia', 'Cereais e derivados', 381.13, 8.90, 81.62, 2.12, 4.98, 1163.26, '2026-05-02 14:17:58.686292+00'),
	('049595f7-d9f2-49dc-90d5-8a5629a368c4', 'Cereal matinal, milho', 'Cereais e derivados', 365.35, 7.16, 83.82, 0.96, 4.12, 654.54, '2026-05-02 14:17:58.686292+00'),
	('905ae7a6-ef5a-4869-b28d-b18c5c61476d', 'Cereal matinal, milho, açúcar', 'Cereais e derivados', 376.56, 4.74, 88.84, 0.67, 2.11, 405.31, '2026-05-02 14:17:58.686292+00'),
	('d6b912a0-03e9-4d61-9617-6f30db54f478', 'Creme de arroz, pó', 'Cereais e derivados', 386.00, 7.03, 83.87, 1.23, 1.07, 1.03, '2026-05-02 14:17:58.686292+00'),
	('9de26a7f-6ee6-4501-929a-61e970054301', 'Creme de milho, pó', 'Cereais e derivados', 333.03, 4.82, 86.15, 1.64, 3.72, 593.79, '2026-05-02 14:17:58.686292+00'),
	('13466237-f13c-42bd-9d7b-8f1b7bec1fb3', 'Curau, milho verde', 'Cereais e derivados', 78.43, 2.36, 13.94, 1.64, 0.46, 20.51, '2026-05-02 14:17:58.686292+00'),
	('734bb6e5-a5a5-4c28-9bec-457d14cfa584', 'Curau, milho verde, mistura para', 'Cereais e derivados', 402.29, 2.22, 79.82, 13.37, 2.52, 222.93, '2026-05-02 14:17:58.686292+00'),
	('7468bac7-5b78-4cf7-96c6-cfa9f4cd96c8', 'Farinha, de arroz, enriquecida', 'Cereais e derivados', 363.06, 1.27, 85.50, 0.30, 0.58, 17.10, '2026-05-02 14:17:58.686292+00'),
	('5f0e96c8-b9d2-4245-96b2-cc5dfa9c0339', 'Farinha, de centeio, integral', 'Cereais e derivados', 335.78, 12.52, 73.30, 1.75, 15.48, 41.38, '2026-05-02 14:17:58.686292+00'),
	('529e8002-6129-4c47-9d35-4961c66d8640', 'Farinha, de milho, amarela', 'Cereais e derivados', 350.59, 7.19, 79.08, 1.47, 5.49, 44.93, '2026-05-02 14:17:58.686292+00'),
	('9068bb91-764f-4f6c-a1f5-8689978e7bc2', 'Farinha, de rosca', 'Cereais e derivados', 370.58, 11.38, 75.79, 1.46, 4.82, 332.50, '2026-05-02 14:17:58.686292+00'),
	('6f63c22e-41b4-4e1c-bac6-9506cd99f7bd', 'Farinha, de trigo', 'Cereais e derivados', 360.47, 9.79, 75.09, 1.37, 2.35, 0.74, '2026-05-02 14:17:58.686292+00'),
	('a153e5b8-8d77-47fa-8510-32d7f4cc6ec7', 'Farinha, láctea, de cereais', 'Cereais e derivados', 414.85, 11.88, 77.77, 5.79, 1.94, 125.07, '2026-05-02 14:17:58.686292+00'),
	('c4c15c2f-c7d4-4b5a-bdc8-b07766dfc7de', 'Lasanha, massa fresca, cozida', 'Cereais e derivados', 163.76, 5.81, 32.52, 1.16, 1.64, 206.77, '2026-05-02 14:17:58.686292+00'),
	('fdf88dad-2904-4def-aff1-3610a93bd957', 'Lasanha, massa fresca, crua', 'Cereais e derivados', 220.31, 7.01, 45.06, 1.34, 1.61, 666.71, '2026-05-02 14:17:58.686292+00'),
	('8ce602b9-ca72-4a72-95d3-4e0befeddf11', 'Macarrão, instantâneo', 'Cereais e derivados', 435.86, 8.79, 62.43, 17.24, 5.61, 1515.53, '2026-05-02 14:17:58.686292+00'),
	('807fbff6-b4e7-4ccb-b714-635a0108ca58', 'Macarrão, trigo, cru', 'Cereais e derivados', 371.12, 10.00, 77.94, 1.30, 2.93, 7.17, '2026-05-02 14:17:58.686292+00'),
	('3a28d325-860f-477c-a34f-7a47e0e66355', 'Macarrão, trigo, cru, com ovos', 'Cereais e derivados', 370.57, 10.32, 76.62, 1.97, 2.30, 14.74, '2026-05-02 14:17:58.686292+00'),
	('d7e8e2bf-32b6-4c46-9e23-6379e22ea5fc', 'Milho, amido, cru', 'Cereais e derivados', 361.37, 0.60, 87.15, NULL, 0.74, 8.08, '2026-05-02 14:17:58.686292+00'),
	('ead81e94-ca71-41ca-b065-61c534f65f1e', 'Milho, fubá, cru', 'Cereais e derivados', 353.48, 7.21, 78.87, 1.90, 4.71, NULL, '2026-05-02 14:17:58.686292+00'),
	('fac85572-2fc9-48df-88b0-14fe9a0995bb', 'Milho, verde, cru', 'Cereais e derivados', 138.17, 6.59, 28.56, 0.61, 3.92, 1.12, '2026-05-02 14:17:58.686292+00'),
	('8b7fea1b-14e4-4f99-be93-847d12453916', 'Milho, verde, enlatado, drenado', 'Cereais e derivados', 97.56, 3.23, 17.14, 2.35, 4.64, 260.35, '2026-05-02 14:17:58.686292+00'),
	('cea9dfdb-66c4-4428-b8cf-664a910b76cd', 'Mingau tradicional, pó', 'Cereais e derivados', 373.42, 0.58, 89.34, 0.37, 0.88, 14.86, '2026-05-02 14:17:58.686292+00'),
	('bdfd1152-6b85-42f8-9a4f-46d683088e3c', 'Pamonha, barra para cozimento, pré-cozida', 'Cereais e derivados', 171.22, 2.55, 30.68, 4.85, 2.37, 131.99, '2026-05-02 14:17:58.686292+00'),
	('12b67178-eba2-42fc-86ad-89b9bec41c6c', 'Pão, aveia, forma', 'Cereais e derivados', 343.09, 12.35, 59.57, 5.69, 5.98, 605.76, '2026-05-02 14:17:58.686292+00'),
	('14f158fc-e7dc-43dd-b068-fb3f02b70db3', 'Pão, de soja', 'Cereais e derivados', 308.73, 11.34, 56.51, 3.58, 5.71, 662.54, '2026-05-02 14:17:58.686292+00'),
	('82940f29-d265-4d32-be49-f5798887c5ca', 'Pão, glúten, forma', 'Cereais e derivados', 252.99, 11.95, 44.12, 2.73, 2.48, 22.05, '2026-05-02 14:17:58.686292+00'),
	('d7eb921a-be63-4b85-8a09-bb4357edc23f', 'Pão, milho, forma', 'Cereais e derivados', 292.01, 8.30, 56.40, 3.11, 4.30, 506.64, '2026-05-02 14:17:58.686292+00'),
	('b0ab3632-6177-4895-88fb-b36443c8050b', 'Pão, trigo, forma, integral', 'Cereais e derivados', 253.19, 9.43, 49.94, 3.65, 6.88, 506.10, '2026-05-02 14:17:58.686292+00'),
	('1a96bb60-a08c-4a86-b89f-c2e1a1d8a615', 'Pão, trigo, francês', 'Cereais e derivados', 299.81, 7.95, 58.65, 3.10, 2.31, 647.67, '2026-05-02 14:17:58.686292+00'),
	('6e7f2181-4943-4004-be2e-b575f888d226', 'Pão, trigo, sovado', 'Cereais e derivados', 310.96, 8.40, 61.45, 2.84, 2.43, 430.79, '2026-05-02 14:17:58.686292+00'),
	('aa38f624-2ef9-4c70-83a3-ff1d9d967b5e', 'Pastel, de carne, cru', 'Cereais e derivados', 288.70, 10.74, 42.02, 8.79, 1.04, 1309.27, '2026-05-02 14:17:58.686292+00'),
	('5ea0089c-f1dc-42c6-b78b-af1485123940', 'Pastel, de carne, frito', 'Cereais e derivados', 388.37, 10.10, 43.77, 20.14, 0.99, 1039.89, '2026-05-02 14:17:58.686292+00'),
	('dbfe1f43-687e-464e-87cb-af0fc3f8a107', 'Pastel, de queijo, cru', 'Cereais e derivados', 308.47, 9.85, 45.95, 9.63, 1.11, 984.57, '2026-05-02 14:17:58.686292+00'),
	('f09747c9-334a-4383-949e-79b47031c72d', 'Pastel, de queijo, frito', 'Cereais e derivados', 422.11, 8.71, 48.13, 22.67, 0.94, 821.38, '2026-05-02 14:17:58.686292+00'),
	('0f79b0fa-c5da-4aa8-80d9-27d28bcb01e5', 'Pastel, massa, crua', 'Cereais e derivados', 310.20, 6.90, 57.38, 5.48, 1.41, 1344.20, '2026-05-02 14:17:58.686292+00'),
	('6b0c177d-8f23-45e2-b9e4-4903d335d767', 'Pastel, massa, frita', 'Cereais e derivados', 569.67, 6.02, 49.34, 40.86, 1.31, 1174.67, '2026-05-02 14:17:58.686292+00'),
	('96e289f1-d902-4839-ae1c-8449ca0886dd', 'Pipoca, com óleo de soja, sem sal', 'Cereais e derivados', 448.33, 9.93, 70.31, 15.94, 14.34, 4.32, '2026-05-02 14:17:58.686292+00'),
	('3185aea8-c491-40e9-b70c-fb0ee4e4597a', 'Polenta, pré-cozida', 'Cereais e derivados', 102.74, 2.29, 23.31, 0.30, 2.40, 441.89, '2026-05-02 14:17:58.686292+00'),
	('dadac24a-f48c-4fd3-be9c-8276e2c9f337', 'Torrada, pão francês', 'Cereais e derivados', 377.42, 10.52, 74.56, 3.30, 3.40, 829.49, '2026-05-02 14:17:58.686292+00'),
	('4d1881b9-e3ef-4b84-a192-8a9dd0e2f429', 'Abóbora, cabotian, cozida', 'Verduras, hortaliças e derivados', 48.04, 1.44, 10.76, 0.73, 2.46, 1.45, '2026-05-02 14:17:58.686292+00'),
	('fa71bdde-b028-48f2-a349-9ed5cf3316b0', 'Abóbora, cabotian, crua', 'Verduras, hortaliças e derivados', 38.60, 1.75, 8.36, 0.54, 2.17, NULL, '2026-05-02 14:17:58.686292+00'),
	('8198a3c6-c70c-4759-ac99-19835b402ce7', 'Abóbora, menina brasileira, crua', 'Verduras, hortaliças e derivados', 13.61, 0.61, 3.30, NULL, 1.17, NULL, '2026-05-02 14:17:58.686292+00'),
	('04b598f4-456b-4406-ac5c-994715284225', 'Abóbora, moranga, crua', 'Verduras, hortaliças e derivados', 12.36, 0.96, 2.67, 0.06, 1.70, NULL, '2026-05-02 14:17:58.686292+00'),
	('d8fad980-dc64-4e16-b33b-53767717001a', 'Abóbora, moranga, refogada', 'Verduras, hortaliças e derivados', 29.00, 0.39, 5.98, 0.80, 1.55, 3.03, '2026-05-02 14:17:58.686292+00'),
	('e5f45ee3-90fe-455e-8c9f-1307f53542d0', 'Abóbora, pescoço, crua', 'Verduras, hortaliças e derivados', 24.47, 0.67, 6.12, 0.12, 2.30, 0.75, '2026-05-02 14:17:58.686292+00'),
	('407ab8ef-e1e6-4978-bc4c-b075489a9f54', 'Abobrinha, italiana, cozida', 'Verduras, hortaliças e derivados', 15.04, 1.13, 2.98, 0.20, 1.59, 0.83, '2026-05-02 14:17:58.686292+00'),
	('634fa1d2-f7f5-40da-b558-c5bffc1deb40', 'Abobrinha, italiana, crua', 'Verduras, hortaliças e derivados', 19.28, 1.14, 4.29, 0.14, 1.35, NULL, '2026-05-02 14:17:58.686292+00'),
	('e6d2a865-c913-48d7-988e-8a502bf2510e', 'Abobrinha, italiana, refogada', 'Verduras, hortaliças e derivados', 24.43, 1.07, 4.19, 0.82, 1.38, 2.21, '2026-05-02 14:17:58.686292+00'),
	('cf1dda96-caf5-4202-a9bc-2c29ed7d1fca', 'Abobrinha, paulista, crua', 'Verduras, hortaliças e derivados', 30.81, 0.64, 7.87, 0.14, 2.61, 0.50, '2026-05-02 14:17:58.686292+00'),
	('4ff621bc-3dab-4443-8a67-d34fd89d94c9', 'Acelga, crua', 'Verduras, hortaliças e derivados', 20.94, 1.44, 4.63, 0.11, 1.12, 1.18, '2026-05-02 14:17:58.686292+00'),
	('a57a0238-11c3-43d8-be92-85698d5fa41a', 'Agrião, cru', 'Verduras, hortaliças e derivados', 16.58, 2.69, 2.25, 0.24, 2.14, 7.46, '2026-05-02 14:17:58.686292+00'),
	('87a631bc-b1ee-4900-8f55-a8bf16d7c275', 'Aipo, cru', 'Verduras, hortaliças e derivados', 19.09, 0.76, 4.27, 0.07, 0.96, 9.52, '2026-05-02 14:17:58.686292+00'),
	('ec07505a-963b-4c6f-9881-b9d82f4b92b6', 'Alface, americana, crua', 'Verduras, hortaliças e derivados', 8.79, 0.61, 1.75, 0.13, 1.02, 7.31, '2026-05-02 14:17:58.686292+00'),
	('3129d908-9fb8-4444-b894-9aaaa8c023eb', 'Alface, crespa, crua', 'Verduras, hortaliças e derivados', 10.68, 1.35, 1.70, 0.16, 1.83, 3.38, '2026-05-02 14:17:58.686292+00'),
	('6f353bfe-53a1-4fed-97e9-9149526c3a0f', 'Alface, lisa, crua', 'Verduras, hortaliças e derivados', 13.82, 1.69, 2.43, 0.12, 2.33, 4.23, '2026-05-02 14:17:58.686292+00'),
	('20609f55-51b4-4f75-b562-7d8512fbac0a', 'Alface, roxa, crua', 'Verduras, hortaliças e derivados', 12.72, 0.91, 2.49, 0.19, 2.01, 7.12, '2026-05-02 14:17:58.686292+00'),
	('ecbebdb5-7343-4f7c-88c8-873812490fa8', 'Alfavaca, crua', 'Verduras, hortaliças e derivados', 29.18, 2.66, 5.24, 0.48, 4.14, 4.55, '2026-05-02 14:17:58.686292+00'),
	('683b017a-5ca9-4767-8521-3bc707ce5d21', 'Alho, cru', 'Verduras, hortaliças e derivados', 113.13, 7.01, 23.91, 0.22, 4.32, 5.36, '2026-05-02 14:17:58.686292+00'),
	('3d22995c-5d7d-4110-a793-f01710931e04', 'Alho-poró, cru', 'Verduras, hortaliças e derivados', 31.51, 1.41, 6.88, 0.14, 2.51, 1.76, '2026-05-02 14:17:58.686292+00'),
	('1d6dde0a-a404-4c3f-9d24-3bbd6102b935', 'Almeirão, cru', 'Verduras, hortaliças e derivados', 18.03, 1.77, 3.34, 0.22, 2.59, 2.35, '2026-05-02 14:17:58.686292+00'),
	('e3341cd6-26e9-4d84-a5d2-fc2aaabc19b4', 'Almeirão, refogado', 'Verduras, hortaliças e derivados', 65.08, 1.70, 5.70, 4.85, 3.43, 14.52, '2026-05-02 14:17:58.686292+00'),
	('98498fa0-02da-406f-84c8-2602aefb8144', 'Batata, baroa, cozida', 'Verduras, hortaliças e derivados', 80.12, 0.85, 18.95, 0.17, 1.76, 2.10, '2026-05-02 14:17:58.686292+00'),
	('bbe666f6-cd14-4e5d-b02b-8dde03eea474', 'Batata, baroa, crua', 'Verduras, hortaliças e derivados', 100.98, 1.05, 23.98, 0.17, 2.06, NULL, '2026-05-02 14:17:58.686292+00'),
	('e5d2c015-9cb2-4c2a-9767-a291862e8102', 'Batata, doce, cozida', 'Verduras, hortaliças e derivados', 76.76, 0.64, 18.42, 0.09, 2.21, 2.70, '2026-05-02 14:17:58.686292+00'),
	('e4e5c58d-7fdd-4ac5-bb55-667d4ee54288', 'Batata, doce, crua', 'Verduras, hortaliças e derivados', 118.24, 1.26, 28.20, 0.13, 2.57, 8.77, '2026-05-02 14:17:58.686292+00'),
	('06c3daf2-ba52-44f6-80e1-9fab5169ed64', 'Batata, frita, tipo chips, industrializada', 'Verduras, hortaliças e derivados', 542.73, 5.58, 51.22, 36.62, 2.46, 607.40, '2026-05-02 14:17:58.686292+00'),
	('36f789ba-71bc-46a9-81dd-8ca3e40d9078', 'Batata, inglesa, cozida', 'Verduras, hortaliças e derivados', 51.59, 1.16, 11.94, NULL, 1.34, 2.29, '2026-05-02 14:17:58.686292+00'),
	('c9bd7907-e71f-4163-a939-c80a08281ba0', 'Batata, inglesa, crua', 'Verduras, hortaliças e derivados', 64.37, 1.77, 14.69, NULL, 1.16, NULL, '2026-05-02 14:17:58.686292+00'),
	('49791074-6f28-4133-acdb-c62167c5eab6', 'Batata, inglesa, frita', 'Verduras, hortaliças e derivados', 267.16, 4.97, 35.64, 13.11, 8.06, 1.91, '2026-05-02 14:17:58.686292+00'),
	('658315bf-a672-48e1-a754-1d2633ee5564', 'Batata, inglesa, sauté', 'Verduras, hortaliças e derivados', 67.89, 1.29, 14.09, 0.90, 1.38, 8.18, '2026-05-02 14:17:58.686292+00'),
	('1a8c2be8-aa9d-409b-a00d-b2c14ea86fff', 'Berinjela, cozida', 'Verduras, hortaliças e derivados', 18.85, 0.68, 4.47, 0.15, 2.52, 1.33, '2026-05-02 14:17:58.686292+00'),
	('591638bf-6090-4255-b2a7-ebb9c1739276', 'Berinjela, crua', 'Verduras, hortaliças e derivados', 19.63, 1.22, 4.43, 0.10, 2.87, NULL, '2026-05-02 14:17:58.686292+00'),
	('ba2b6fe2-8a26-412d-b764-66e7232d9589', 'Beterraba, cozida', 'Verduras, hortaliças e derivados', 32.15, 1.29, 7.23, 0.09, 1.88, 22.76, '2026-05-02 14:17:58.686292+00'),
	('1c4f6043-a20b-4a39-be1f-a97d986a6ccd', 'Beterraba, crua', 'Verduras, hortaliças e derivados', 48.83, 1.95, 11.11, 0.09, 3.37, 9.72, '2026-05-02 14:17:58.686292+00'),
	('b4b1a728-9416-4fab-be0e-93380cdb64fe', 'Biscoito, polvilho doce', 'Verduras, hortaliças e derivados', 437.55, 1.29, 80.54, 12.25, 1.16, 97.80, '2026-05-02 14:17:58.686292+00'),
	('b643fb83-2fed-4856-9ff2-ae4033c7ef40', 'Brócolis, cozido', 'Verduras, hortaliças e derivados', 24.64, 2.13, 4.37, 0.46, 3.42, 2.12, '2026-05-02 14:17:58.686292+00'),
	('c53454d8-70c7-46fb-b77b-52b1cd10d60b', 'Brócolis, cru', 'Verduras, hortaliças e derivados', 25.50, 3.64, 4.03, 0.27, 2.88, 3.33, '2026-05-02 14:17:58.686292+00'),
	('41eb5aa4-5147-4120-beb5-9d695c055156', 'Cará, cozido', 'Verduras, hortaliças e derivados', 77.58, 1.53, 18.85, 0.11, 2.63, 1.01, '2026-05-02 14:17:58.686292+00'),
	('66d6118e-843f-48c6-9a9e-f3a4fd57f04f', 'Cará, cru', 'Verduras, hortaliças e derivados', 95.63, 2.28, 22.95, 0.14, 7.27, NULL, '2026-05-02 14:17:58.686292+00'),
	('ab7e3a11-4e6e-4c07-86f5-11d839466c2f', 'Caruru, cru', 'Verduras, hortaliças e derivados', 34.03, 3.20, 5.97, 0.59, 4.47, 13.67, '2026-05-02 14:17:58.686292+00'),
	('9a363940-7140-48e2-a2ec-768788bf89a5', 'Catalonha, crua', 'Verduras, hortaliças e derivados', 23.89, 1.87, 4.75, 0.28, 2.05, 9.39, '2026-05-02 14:17:58.686292+00'),
	('1158c89e-a7c1-4d18-aacd-c6a44468aee2', 'Catalonha, refogada', 'Verduras, hortaliças e derivados', 63.45, 1.95, 4.81, 4.81, 3.65, 24.72, '2026-05-02 14:17:58.686292+00'),
	('e9ca3003-bdbd-4635-87e6-24cf128d70fb', 'Cebola, crua', 'Verduras, hortaliças e derivados', 39.42, 1.71, 8.85, 0.08, 2.19, 0.60, '2026-05-02 14:17:58.686292+00'),
	('5817268e-4eff-4ac0-b8b7-d3b832b59db1', 'Cebolinha, crua', 'Verduras, hortaliças e derivados', 19.52, 1.87, 3.37, 0.35, 3.55, 1.60, '2026-05-02 14:17:58.686292+00'),
	('7a5fb607-6bb5-4706-98ae-a10defefab1d', 'Cenoura, cozida', 'Verduras, hortaliças e derivados', 29.86, 0.85, 6.69, 0.22, 2.63, 7.88, '2026-05-02 14:17:58.686292+00'),
	('928bba54-33c3-4654-ada0-c136bfeecae2', 'Cenoura, crua', 'Verduras, hortaliças e derivados', 34.14, 1.32, 7.66, 0.17, 3.18, 3.33, '2026-05-02 14:17:58.686292+00'),
	('3cd43b2f-7707-4640-8482-917293ef2c72', 'Chicória, crua', 'Verduras, hortaliças e derivados', 13.84, 1.14, 2.85, 0.14, 2.20, 13.52, '2026-05-02 14:17:58.686292+00'),
	('9a458114-7a84-4d72-9263-c0fcfca33d97', 'Chuchu, cozido', 'Verduras, hortaliças e derivados', 18.54, 0.41, 4.79, NULL, 1.04, 1.81, '2026-05-02 14:17:58.686292+00'),
	('63d47ce1-b31a-4502-b93f-6762848fc75f', 'Chuchu, cru', 'Verduras, hortaliças e derivados', 16.98, 0.70, 4.14, 0.06, 1.28, NULL, '2026-05-02 14:17:58.686292+00'),
	('8aa01a7a-79ad-4ed5-93c2-c52d3ee540b5', 'Coentro, folhas desidratadas', 'Verduras, hortaliças e derivados', 309.07, 20.88, 47.96, 10.39, 37.29, 18.26, '2026-05-02 14:17:58.686292+00'),
	('655108e1-d100-49e5-b7ae-00601fb03c81', 'Couve, manteiga, crua', 'Verduras, hortaliças e derivados', 27.06, 2.87, 4.33, 0.55, 3.12, 6.17, '2026-05-02 14:17:58.686292+00'),
	('3d732e72-5140-44f5-ab54-0ef206bce402', 'Couve, manteiga, refogada', 'Verduras, hortaliças e derivados', 90.34, 1.67, 8.71, 6.59, 5.74, 11.45, '2026-05-02 14:17:58.686292+00'),
	('80c1e9d7-8f05-49ba-b638-aed6b45b45dc', 'Couve-flor, crua', 'Verduras, hortaliças e derivados', 22.56, 1.91, 4.52, 0.21, 2.35, 3.44, '2026-05-02 14:17:58.686292+00'),
	('39654721-1e11-45df-922a-d7380d98e3ed', 'Couve-flor, cozida', 'Verduras, hortaliças e derivados', 19.11, 1.24, 3.88, 0.27, 2.13, 1.79, '2026-05-02 14:17:58.686292+00'),
	('bc4bdbea-136f-4050-86cf-c6bd18a1e355', 'Espinafre, Nova Zelândia, cru', 'Verduras, hortaliças e derivados', 16.10, 2.00, 2.57, 0.24, 2.10, 17.09, '2026-05-02 14:17:58.686292+00'),
	('eb39eacb-a77f-4fa9-a7ff-d39382426a5d', 'Espinafre, Nova Zelândia, refogado', 'Verduras, hortaliças e derivados', 67.25, 2.72, 4.24, 5.43, 2.52, 47.02, '2026-05-02 14:17:58.686292+00'),
	('9aa9e871-9485-43ac-b5b5-c007f4dd6119', 'Farinha, de mandioca, crua', 'Verduras, hortaliças e derivados', 360.87, 1.55, 87.90, 0.28, 6.39, 1.02, '2026-05-02 14:17:58.686292+00'),
	('68363bfe-5d8c-440d-8d26-45e0f9eed0ed', 'Farinha, de mandioca, torrada', 'Verduras, hortaliças e derivados', 365.27, 1.23, 89.19, 0.29, 6.54, 10.31, '2026-05-02 14:17:58.686292+00'),
	('a0545012-9502-4291-9342-246bdc3bf462', 'Farinha, de puba', 'Verduras, hortaliças e derivados', 360.18, 1.62, 87.29, 0.47, 4.24, 3.61, '2026-05-02 14:17:58.686292+00'),
	('376d4d8b-f8ac-4dbb-a01e-5723a1932436', 'Fécula, de mandioca', 'Verduras, hortaliças e derivados', 330.85, 0.52, 81.15, 0.28, 0.65, 2.45, '2026-05-02 14:17:58.686292+00'),
	('a5cb7053-92d8-40a9-8176-e9fa72177785', 'Feijão, broto, cru', 'Verduras, hortaliças e derivados', 38.72, 4.17, 7.76, 0.10, 1.97, 1.79, '2026-05-02 14:17:58.686292+00'),
	('b818ce59-f343-49e3-b832-839170d1f81b', 'Inhame, cru', 'Verduras, hortaliças e derivados', 96.70, 2.05, 23.23, 0.21, 1.65, NULL, '2026-05-02 14:17:58.686292+00'),
	('6298f939-bf4d-4e93-9fda-ba490d049ced', 'Jiló, cru', 'Verduras, hortaliças e derivados', 27.37, 1.40, 6.19, 0.22, 4.83, NULL, '2026-05-02 14:17:58.686292+00'),
	('d251c61f-7c38-4216-91ad-b2da57b926eb', 'Jurubeba, crua', 'Verduras, hortaliças e derivados', 125.81, 4.41, 23.06, 3.91, 23.92, 0.77, '2026-05-02 14:17:58.686292+00'),
	('59cfe73d-aba6-4d8e-a484-747ebebc3fd1', 'Mandioca, cozida', 'Verduras, hortaliças e derivados', 125.36, 0.58, 30.09, 0.30, 1.56, 0.91, '2026-05-02 14:17:58.686292+00'),
	('42eb7f83-028b-4bf5-a9cb-14d9eeb58e7b', 'Mandioca, crua', 'Verduras, hortaliças e derivados', 151.42, 1.13, 36.17, 0.30, 1.88, 2.15, '2026-05-02 14:17:58.686292+00'),
	('afcdb57b-5bb0-458e-89a2-71a1d7f95bbb', 'Mandioca, farofa, temperada', 'Verduras, hortaliças e derivados', 405.69, 2.06, 80.30, 9.12, 7.82, 574.51, '2026-05-02 14:17:58.686292+00'),
	('f8814186-f99f-4c31-b2ab-88f2736aab48', 'Mandioca, frita', 'Verduras, hortaliças e derivados', 300.06, 1.38, 50.25, 11.20, 1.87, 8.94, '2026-05-02 14:17:58.686292+00'),
	('9ab8124b-c121-4912-8153-4e75a3a800ca', 'Manjericão, cru', 'Verduras, hortaliças e derivados', 21.15, 1.99, 3.64, 0.39, 3.31, 3.89, '2026-05-02 14:17:58.686292+00'),
	('b958d8a9-c270-451e-b58e-fd775ee1031f', 'Maxixe, cru', 'Verduras, hortaliças e derivados', 13.75, 1.39, 2.73, 0.07, 2.19, 10.99, '2026-05-02 14:17:58.686292+00'),
	('b65a71dd-69f7-42f2-a3c1-1974e3efcb47', 'Mostarda, folha, crua', 'Verduras, hortaliças e derivados', 18.11, 2.11, 3.24, 0.17, 1.89, 2.88, '2026-05-02 14:17:58.686292+00'),
	('8cda613c-d877-4252-a471-df7b15ce0ba1', 'Nhoque, batata, cozido', 'Verduras, hortaliças e derivados', 180.78, 5.86, 36.78, 1.94, 1.78, 7.07, '2026-05-02 14:17:58.686292+00'),
	('c777dc30-62d4-4914-a92d-70f49aa79ea5', 'Nabo, cru', 'Verduras, hortaliças e derivados', 18.19, 1.20, 4.15, 0.05, 2.64, 2.46, '2026-05-02 14:17:58.686292+00'),
	('0054f2a9-250e-46f7-af4b-7353dfc90d71', 'Palmito, Juçara, em conserva', 'Verduras, hortaliças e derivados', 23.20, 1.79, 4.33, 0.40, 3.15, 513.82, '2026-05-02 14:17:58.686292+00'),
	('8016e0a5-ca3a-4e00-874b-2ddab5264e28', 'Palmito, pupunha, em conserva', 'Verduras, hortaliças e derivados', 29.43, 2.46, 5.51, 0.45, 2.55, 562.69, '2026-05-02 14:17:58.686292+00'),
	('51c1c0f5-7126-41ce-9e08-55b7a441d95f', 'Pão, de queijo, assado', 'Verduras, hortaliças e derivados', 363.08, 5.12, 34.24, 24.57, 0.56, 773.49, '2026-05-02 14:17:58.686292+00'),
	('ae556f86-5c8d-4dc0-8660-295e8adcc8c6', 'Pão, de queijo, cru', 'Verduras, hortaliças e derivados', 294.54, 3.65, 38.51, 13.99, 0.98, 404.99, '2026-05-02 14:17:58.686292+00'),
	('5ed8f330-af32-41a9-a6e5-0728261bca76', 'Pepino, cru', 'Verduras, hortaliças e derivados', 9.53, 0.87, 2.04, NULL, 1.12, NULL, '2026-05-02 14:17:58.686292+00'),
	('21e3ee55-4803-4cc4-ace3-da9439fbfb9e', 'Pimentão, amarelo, cru', 'Verduras, hortaliças e derivados', 27.93, 1.22, 5.96, 0.44, 1.92, NULL, '2026-05-02 14:17:58.686292+00'),
	('9d0c47a8-930e-4d03-b0d2-3c5746b3a39e', 'Pimentão, verde, cru', 'Verduras, hortaliças e derivados', 21.29, 1.05, 4.89, 0.15, 2.56, NULL, '2026-05-02 14:17:58.686292+00'),
	('f2ce07a0-cf38-4a73-a943-c03acfad1139', 'Pimentão, vermelho, cru', 'Verduras, hortaliças e derivados', 23.28, 1.04, 5.47, 0.15, 1.59, NULL, '2026-05-02 14:17:58.686292+00'),
	('2e5f5333-0966-4361-b9de-46ce15907be6', 'Polvilho, doce', 'Verduras, hortaliças e derivados', 351.23, 0.43, 86.77, NULL, 0.24, 1.58, '2026-05-02 14:17:58.686292+00'),
	('8f620413-0c30-4b21-ad17-8af412dd224e', 'Quiabo, cru', 'Verduras, hortaliças e derivados', 29.94, 1.92, 6.37, 0.30, 4.55, 0.89, '2026-05-02 14:17:58.686292+00'),
	('68138f9d-ceba-4fdb-bd01-432bff687fdf', 'Rabanete, cru', 'Verduras, hortaliças e derivados', 13.74, 1.39, 2.73, 0.07, 2.19, 10.99, '2026-05-02 14:17:58.686292+00'),
	('df2e25ca-33fe-4ca5-a0ab-acec444adee8', 'Repolho, branco, cru', 'Verduras, hortaliças e derivados', 17.12, 0.88, 3.86, 0.14, 1.89, 3.64, '2026-05-02 14:17:58.686292+00'),
	('4f31f656-db07-4efc-aca0-7e5b54ad3114', 'Repolho, roxo, cru', 'Verduras, hortaliças e derivados', 30.91, 1.91, 7.20, 0.06, 1.97, 2.34, '2026-05-02 14:17:58.686292+00'),
	('bedbd8f8-4e51-4f5f-b2aa-a8def9f0470a', 'Repolho, roxo, refogado', 'Verduras, hortaliças e derivados', 41.77, 1.80, 7.56, 1.24, 1.75, 3.42, '2026-05-02 14:17:58.686292+00'),
	('cf5afbb6-ecdb-4c74-8fe3-01099622b5a4', 'Rúcula, crua', 'Verduras, hortaliças e derivados', 13.13, 1.77, 2.22, 0.11, 1.74, 9.42, '2026-05-02 14:17:58.686292+00'),
	('6655536c-3afe-4921-b04d-ef95cc87029d', 'Salsa, crua', 'Verduras, hortaliças e derivados', 33.42, 3.26, 5.71, 0.61, 1.85, 2.30, '2026-05-02 14:17:58.686292+00'),
	('61c972d0-00ae-40ab-b559-a3687cda0383', 'Seleta de legumes, enlatada', 'Verduras, hortaliças e derivados', 56.53, 3.42, 12.67, 0.35, 3.09, 398.14, '2026-05-02 14:17:58.686292+00'),
	('3e8db97c-213d-4d08-ac70-8a3b4a8987b8', 'Serralha, crua', 'Verduras, hortaliças e derivados', 30.40, 2.67, 4.95, 0.74, 3.52, 19.35, '2026-05-02 14:17:58.686292+00'),
	('779d151e-1862-4e23-83c2-3edc589a1c52', 'Taioba, crua', 'Verduras, hortaliças e derivados', 34.21, 2.90, 5.43, 0.93, 4.45, 1.16, '2026-05-02 14:17:58.686292+00'),
	('954251e9-745d-452d-b26b-03bb8e224761', 'Tomate, com semente, cru', 'Verduras, hortaliças e derivados', 15.34, 1.10, 3.14, 0.17, 1.17, 1.02, '2026-05-02 14:17:58.686292+00'),
	('7d3aecbf-dd48-4877-af90-45133719f5ba', 'Tomate, extrato', 'Verduras, hortaliças e derivados', 60.93, 2.43, 14.96, 0.19, 2.80, 497.93, '2026-05-02 14:17:58.686292+00'),
	('22508f64-6ca6-4555-91d7-ee802cc9da84', 'Tomate, molho industrializado', 'Verduras, hortaliças e derivados', 38.45, 1.38, 7.71, 0.90, 3.12, 418.28, '2026-05-02 14:17:58.686292+00'),
	('be055642-628e-4bfe-8339-df0391424cdc', 'Tomate, purê', 'Verduras, hortaliças e derivados', 27.94, 1.36, 6.89, NULL, 1.03, 103.93, '2026-05-02 14:17:58.686292+00'),
	('191a298c-a5e8-4399-b391-6bf1e34993b3', 'Tomate, salada', 'Verduras, hortaliças e derivados', 20.55, 0.81, 5.12, NULL, 2.27, 5.24, '2026-05-02 14:17:58.686292+00'),
	('3f2c6c41-dba8-4473-9a2d-9bac0fd297f5', 'Vagem, crua', 'Verduras, hortaliças e derivados', 24.90, 1.79, 5.35, 0.17, 2.38, NULL, '2026-05-02 14:17:58.686292+00'),
	('863be123-7adb-47ab-b364-0973185ba367', 'Abacate, cru', 'Frutas e derivados', 96.15, 1.24, 6.03, 8.40, 6.31, NULL, '2026-05-02 14:17:58.686292+00'),
	('811aff6e-2b57-4e23-850b-6ecf64f7b207', 'Abacaxi, cru', 'Frutas e derivados', 48.32, 0.86, 12.33, 0.12, 0.99, NULL, '2026-05-02 14:17:58.686292+00'),
	('bcd83c02-f7bc-4f77-8d6e-a52d5ed3cd46', 'Abacaxi, polpa, congelada', 'Frutas e derivados', 30.59, 0.47, 7.80, 0.11, 0.33, 1.24, '2026-05-02 14:17:58.686292+00'),
	('decc29ae-0b6d-4e3e-8d24-55aa8e19709b', 'Abiu, cru', 'Frutas e derivados', 62.42, 0.83, 14.93, 0.70, 1.70, NULL, '2026-05-02 14:17:58.686292+00'),
	('a8380229-d94d-41eb-88f6-f32b7e35bfed', 'Açaí, polpa, com xarope de guaraná e glucose', 'Frutas e derivados', 110.30, 0.72, 21.46, 3.66, 1.72, 15.10, '2026-05-02 14:17:58.686292+00'),
	('7b64e4e8-f657-4254-9417-0517d58c3596', 'Açaí, polpa, congelada', 'Frutas e derivados', 58.05, 0.80, 6.21, 3.94, 2.55, 5.18, '2026-05-02 14:17:58.686292+00'),
	('1e5edd22-b517-4be1-8bad-4471d3e65c54', 'Acerola, crua', 'Frutas e derivados', 33.46, 0.91, 7.97, 0.21, 1.51, NULL, '2026-05-02 14:17:58.686292+00'),
	('356078f1-ef1c-410c-ba8b-b6c5edf89983', 'Acerola, polpa, congelada', 'Frutas e derivados', 21.94, 0.59, 5.54, NULL, 0.70, 1.28, '2026-05-02 14:17:58.686292+00'),
	('d520dc6b-78dd-458e-b68e-b2981ead4da8', 'Ameixa, calda, enlatada', 'Frutas e derivados', 182.85, 0.41, 46.89, NULL, 0.52, 2.70, '2026-05-02 14:17:58.686292+00'),
	('22fcda24-b2a0-4b62-a78a-4876c3ef3e86', 'Ameixa, crua', 'Frutas e derivados', 52.54, 0.77, 13.85, NULL, 2.43, NULL, '2026-05-02 14:17:58.686292+00'),
	('5b745da6-2e0c-4e36-9b65-6779031bd510', 'Ameixa, em calda, enlatada, drenada', 'Frutas e derivados', 177.36, 1.03, 47.66, 0.28, 4.55, 2.79, '2026-05-02 14:17:58.686292+00'),
	('4b9812e8-aa47-4afe-baeb-21d80a95c118', 'Atemóia, crua', 'Frutas e derivados', 96.97, 0.97, 25.33, 0.30, 2.14, 0.79, '2026-05-02 14:17:58.686292+00'),
	('688355d3-0b74-4f79-91d0-6718f17d92db', 'Banana, da terra, crua', 'Frutas e derivados', 128.02, 1.43, 33.67, 0.24, 1.53, NULL, '2026-05-02 14:17:58.686292+00'),
	('2c1b7af3-bda3-4f12-8053-bbf5e8066f22', 'Banana, doce em barra', 'Frutas e derivados', 280.11, 2.17, 75.67, 0.05, 3.83, 9.88, '2026-05-02 14:17:58.686292+00'),
	('2dd22d4a-7e24-4baa-805f-91984591e352', 'Banana, figo, crua', 'Frutas e derivados', 105.08, 1.13, 27.80, 0.14, 2.80, NULL, '2026-05-02 14:17:58.686292+00'),
	('8de6dfc8-53fe-413c-8dd4-3f8f7e4e64c4', 'Banana, maçã, crua', 'Frutas e derivados', 86.81, 1.75, 22.34, 0.06, 2.59, NULL, '2026-05-02 14:17:58.686292+00'),
	('c05a83fc-93a3-42b4-a856-0fbc30038849', 'Banana, nanica, crua', 'Frutas e derivados', 91.53, 1.40, 23.85, 0.12, 1.95, NULL, '2026-05-02 14:17:58.686292+00'),
	('f57a74c0-436b-4061-80d1-8e3e296e12df', 'Banana, ouro, crua', 'Frutas e derivados', 112.37, 1.48, 29.34, 0.21, 1.95, NULL, '2026-05-02 14:17:58.686292+00'),
	('17824673-0448-4312-b921-31c3bbdf7eb1', 'Banana, pacova, crua', 'Frutas e derivados', 77.91, 1.23, 20.31, 0.08, 2.03, 0.94, '2026-05-02 14:17:58.686292+00'),
	('286e233c-8ede-4160-aafb-68cb3e198664', 'Banana, prata, crua', 'Frutas e derivados', 98.25, 1.27, 25.96, 0.07, 2.04, NULL, '2026-05-02 14:17:58.686292+00'),
	('fe130e7c-26ed-43e4-9137-08315a23f9f7', 'Cacau, cru', 'Frutas e derivados', 74.29, 0.95, 19.41, 0.14, 2.19, 0.70, '2026-05-02 14:17:58.686292+00'),
	('0041a6ba-197b-4ab7-b810-4a92b15f1e28', 'Cajá-Manga, cru', 'Frutas e derivados', 45.58, 1.28, 11.43, NULL, 2.58, 1.44, '2026-05-02 14:17:58.686292+00'),
	('79e697d1-9825-4a6c-8abe-18fec93a0108', 'Cajá, polpa, congelada', 'Frutas e derivados', 26.33, 0.59, 6.37, 0.17, 1.36, 6.95, '2026-05-02 14:17:58.686292+00'),
	('e35fef80-c42d-4bc0-ac6d-e226b172ce6a', 'Caju, cru', 'Frutas e derivados', 43.07, 0.97, 10.29, 0.33, 1.68, 2.97, '2026-05-02 14:17:58.686292+00'),
	('c1816871-9f77-4701-9960-85f965714e34', 'Caju, polpa, congelada', 'Frutas e derivados', 36.57, 0.48, 9.35, 0.15, 0.81, 4.16, '2026-05-02 14:17:58.686292+00'),
	('f054058a-097b-4bea-bfb5-1451128d2478', 'Caju, suco concentrado, envasado', 'Frutas e derivados', 45.11, 0.40, 10.73, 0.20, 0.63, 45.04, '2026-05-02 14:17:58.686292+00'),
	('bb2d8ff8-3c05-46f7-9568-75ae12e77340', 'Caqui, chocolate, cru', 'Frutas e derivados', 71.35, 0.36, 19.33, 0.07, 6.52, 2.18, '2026-05-02 14:17:58.686292+00'),
	('16f73022-1efe-43b5-b20b-96da5b7e1750', 'Carambola, crua', 'Frutas e derivados', 45.74, 0.87, 11.48, 0.18, 2.03, 4.09, '2026-05-02 14:17:58.686292+00'),
	('6f3b053a-8811-4a1d-a3b3-6c65a70e64f1', 'Ciriguela, crua', 'Frutas e derivados', 75.59, 1.40, 18.86, 0.36, 3.90, 1.68, '2026-05-02 14:17:58.686292+00'),
	('2461115a-b3f0-4a01-b4d6-761d4dcf1b00', 'Cupuaçu, cru', 'Frutas e derivados', 49.42, 1.16, 10.43, 0.95, 3.12, 3.20, '2026-05-02 14:17:58.686292+00'),
	('68f80d6d-ca7e-42e6-a144-9bc1c788c577', 'Cupuaçu, polpa, congelada', 'Frutas e derivados', 48.80, 0.84, 11.39, 0.59, 1.59, 0.69, '2026-05-02 14:17:58.686292+00'),
	('623219df-dcd9-45e6-833c-5d15f35b46bc', 'Figo, cru', 'Frutas e derivados', 41.45, 0.97, 10.25, 0.16, 1.79, NULL, '2026-05-02 14:17:58.686292+00'),
	('d67c34a6-ba33-4b67-b623-66a6a8958149', 'Figo, enlatado, em calda', 'Frutas e derivados', 184.36, 0.56, 50.34, 0.15, 1.98, 6.87, '2026-05-02 14:17:58.686292+00'),
	('afdfe7ea-69a1-4847-9fd5-000f272ab3d5', 'Fruta-pão, crua', 'Frutas e derivados', 67.05, 1.08, 17.17, 0.19, 5.55, 0.80, '2026-05-02 14:17:58.686292+00'),
	('a9022081-009a-477a-b35a-553596596c70', 'Goiaba, branca, com casca, crua', 'Frutas e derivados', 51.74, 0.90, 12.40, 0.49, 6.33, NULL, '2026-05-02 14:17:58.686292+00'),
	('25cb67f8-fead-4f10-b327-a17cb479b8b4', 'Goiaba, doce em pasta', 'Frutas e derivados', 268.96, 0.58, 74.12, 0.00, 3.73, 3.70, '2026-05-02 14:17:58.686292+00'),
	('b15a4308-3391-42cc-960f-80ece2304642', 'Goiaba, doce, cascão', 'Frutas e derivados', 285.59, 0.41, 78.70, 0.10, 4.37, 11.03, '2026-05-02 14:17:58.686292+00'),
	('371e354e-3f6a-4f32-b992-8faa016091c4', 'Goiaba, vermelha, com casca, crua', 'Frutas e derivados', 54.17, 1.09, 13.01, 0.44, 6.22, NULL, '2026-05-02 14:17:58.686292+00'),
	('14e72705-acbb-4640-8e8c-1ef27937253a', 'Graviola, crua', 'Frutas e derivados', 61.62, 0.85, 15.84, 0.21, 1.91, 4.16, '2026-05-02 14:17:58.686292+00'),
	('a9afe152-a8ad-403d-99cb-75dd6a8f4ca9', 'Graviola, polpa, congelada', 'Frutas e derivados', 38.27, 0.57, 9.78, 0.14, 1.19, 3.05, '2026-05-02 14:17:58.686292+00'),
	('3706d070-b71a-46c6-ab86-a9f0ba5d6a9f', 'Jabuticaba, crua', 'Frutas e derivados', 58.05, 0.61, 15.26, 0.13, 2.30, NULL, '2026-05-02 14:17:58.686292+00'),
	('c4d6bb17-181b-451d-9843-102c51ab7378', 'Jaca, crua', 'Frutas e derivados', 87.92, 1.40, 22.50, 0.27, 2.39, 1.80, '2026-05-02 14:17:58.686292+00'),
	('f14751b4-ee49-48a4-aaa1-73208b9f8a9b', 'Jambo, cru', 'Frutas e derivados', 26.91, 0.89, 6.49, 0.07, 5.07, 21.66, '2026-05-02 14:17:58.686292+00'),
	('ae86863e-0faa-4773-b86b-727ae93ad557', 'Jamelão, cru', 'Frutas e derivados', 41.01, 0.55, 10.63, 0.11, 1.78, 1.37, '2026-05-02 14:17:58.686292+00'),
	('f3c7c2c9-828f-4963-bfca-dbe5652bb5ca', 'Kiwi, cru', 'Frutas e derivados', 51.14, 1.34, 11.50, 0.63, 2.65, NULL, '2026-05-02 14:17:58.686292+00'),
	('e264d423-5d76-4ca9-ba62-a67e2aa185e0', 'Laranja, baía, crua', 'Frutas e derivados', 45.44, 0.98, 11.47, 0.10, 1.12, NULL, '2026-05-02 14:17:58.686292+00'),
	('3e833f08-020c-42db-8f91-e90e9e158049', 'Laranja, baía, suco', 'Frutas e derivados', 36.65, 0.65, 8.70, NULL, NULL, NULL, '2026-05-02 14:17:58.686292+00'),
	('4139c8a4-1326-439a-8908-c82fc56c972a', 'Laranja, da terra, crua', 'Frutas e derivados', 51.47, 1.08, 12.86, 0.19, 3.98, 0.83, '2026-05-02 14:17:58.686292+00'),
	('2c391532-017c-4a78-834c-b638a0579ee5', 'Laranja, da terra, suco', 'Frutas e derivados', 40.96, 0.67, 9.57, 0.14, 1.03, NULL, '2026-05-02 14:17:58.686292+00'),
	('b4bef363-1ec4-43d6-9e1a-dd856805e6f1', 'Laranja, lima, crua', 'Frutas e derivados', 45.70, 1.06, 11.53, 0.08, 1.78, 1.11, '2026-05-02 14:17:58.686292+00'),
	('5fc3fb6b-a3f7-4087-8709-97aafeb2db06', 'Laranja, lima, suco', 'Frutas e derivados', 39.34, 0.71, 9.17, 0.12, 0.42, NULL, '2026-05-02 14:17:58.686292+00'),
	('e104918c-ac4c-4d0f-9c8e-8fa1610d900d', 'Laranja, pêra, crua', 'Frutas e derivados', 36.77, 1.04, 8.95, 0.13, 0.77, NULL, '2026-05-02 14:17:58.686292+00'),
	('56978b83-d6d0-4cca-81f0-77b65093cee9', 'Laranja, pêra, suco', 'Frutas e derivados', 32.71, 0.74, 7.55, 0.07, NULL, NULL, '2026-05-02 14:17:58.686292+00'),
	('06ee9a22-f107-4495-9b08-cc994bb75f67', 'Laranja, valência, crua', 'Frutas e derivados', 46.11, 0.77, 11.72, 0.16, 1.73, 0.63, '2026-05-02 14:17:58.686292+00'),
	('4d61a3c7-c8d0-4d81-b5a1-a537b9c45cf8', 'Laranja, valência, suco', 'Frutas e derivados', 36.20, 0.48, 8.55, 0.12, 0.42, NULL, '2026-05-02 14:17:58.686292+00'),
	('7b3310ac-53fa-41e3-ad0b-e6df88f6dcda', 'Limão, cravo, suco', 'Frutas e derivados', 14.10, 0.33, 5.25, NULL, NULL, NULL, '2026-05-02 14:17:58.686292+00'),
	('e7d53752-9d61-4e4e-a3c7-613dc7d987f0', 'Limão, galego, suco', 'Frutas e derivados', 22.23, 0.57, 7.32, 0.07, NULL, NULL, '2026-05-02 14:17:58.686292+00'),
	('7de9f315-0bbf-45df-b1fe-49d1241cfa22', 'Limão, tahiti, cru', 'Frutas e derivados', 31.82, 0.94, 11.08, 0.14, 1.18, 1.25, '2026-05-02 14:17:58.686292+00'),
	('a005c811-c291-43c7-be47-5267ee453fa1', 'Maçã, Argentina, com casca, crua', 'Frutas e derivados', 62.53, 0.23, 16.59, 0.25, 2.03, 1.32, '2026-05-02 14:17:58.686292+00'),
	('28738388-e612-4d65-a087-40efd6675aee', 'Maçã, Fuji, com casca, crua', 'Frutas e derivados', 55.52, 0.29, 15.15, NULL, 1.35, NULL, '2026-05-02 14:17:58.686292+00'),
	('d2274002-82e2-424c-84b1-0dd47bf69d48', 'Macaúba, crua', 'Frutas e derivados', 404.28, 2.08, 13.95, 40.66, 13.44, 0.65, '2026-05-02 14:17:58.686292+00'),
	('d122e818-8333-4719-becc-0f6d443ccbdb', 'Mamão, doce em calda, drenado', 'Frutas e derivados', 195.63, 0.19, 54.00, 0.07, 1.31, 2.91, '2026-05-02 14:17:58.686292+00'),
	('92b9626d-4a6e-4a66-a316-11f8a1bd83d1', 'Mamão, Formosa, cru', 'Frutas e derivados', 45.34, 0.82, 11.55, 0.12, 1.81, 3.26, '2026-05-02 14:17:58.686292+00'),
	('de1562aa-0890-47a8-9960-b2f4c7089ab1', 'Mamão, Papaia, cru', 'Frutas e derivados', 40.16, 0.46, 10.44, 0.12, 1.04, 1.63, '2026-05-02 14:17:58.686292+00'),
	('c4f616b7-77da-49ad-9f19-3fd55101ac17', 'Mamão verde, doce em calda, drenado', 'Frutas e derivados', 209.38, 0.32, 57.64, 0.10, 1.23, 4.74, '2026-05-02 14:17:58.686292+00'),
	('4f27804d-ff40-490e-ab7c-5b0e881681d9', 'Manga, Haden, crua', 'Frutas e derivados', 63.50, 0.41, 16.66, 0.26, 1.58, 0.55, '2026-05-02 14:17:58.686292+00'),
	('381ee885-2fc5-48a7-81b3-8b7b8c10fad6', 'Manga, Palmer, crua', 'Frutas e derivados', 72.49, 0.41, 19.35, 0.17, 1.63, 1.86, '2026-05-02 14:17:58.686292+00'),
	('6d9e619f-0032-422c-a2db-2f2e1d77f5fe', 'Manga, polpa, congelada', 'Frutas e derivados', 48.31, 0.38, 12.52, 0.23, 1.07, 6.73, '2026-05-02 14:17:58.686292+00'),
	('c015a440-da60-4131-8992-563cc0f6b966', 'Manga, Tommy Atkins, crua', 'Frutas e derivados', 50.69, 0.86, 12.77, 0.22, 2.07, NULL, '2026-05-02 14:17:58.686292+00'),
	('b671cade-cf68-4011-a66f-4f38864356d2', 'Maracujá, cru', 'Frutas e derivados', 68.44, 1.99, 12.26, 2.10, 1.14, 1.58, '2026-05-02 14:17:58.686292+00'),
	('34769486-4a81-4114-9012-c0a3f7442b38', 'Maracujá, polpa, congelada', 'Frutas e derivados', 38.76, 0.81, 9.60, 0.18, 0.51, 8.10, '2026-05-02 14:17:58.686292+00'),
	('4aff85fa-77fe-4cf3-98a1-91a1b940ff8b', 'Maracujá, suco concentrado, envasado', 'Frutas e derivados', 41.97, 0.77, 9.64, 0.19, 0.35, 21.69, '2026-05-02 14:17:58.686292+00'),
	('a8d767d2-324a-4093-a6ab-aea4c0c5a374', 'Melancia, crua', 'Frutas e derivados', 32.61, 0.88, 8.14, NULL, 0.12, NULL, '2026-05-02 14:17:58.686292+00'),
	('f652c9ad-4cdb-4dd4-92c0-c5c372a5ab7e', 'Melão, cru', 'Frutas e derivados', 29.37, 0.68, 7.53, NULL, 0.25, 11.17, '2026-05-02 14:17:58.686292+00'),
	('24c08747-d157-4d6a-b7bf-bc031cd7f861', 'Mexerica, Murcote, crua', 'Frutas e derivados', 57.59, 0.88, 14.86, 0.13, 3.07, 1.17, '2026-05-02 14:17:58.686292+00'),
	('2f5ec259-a5a4-4b06-915a-f0f8a7a761df', 'Mexerica, Rio, crua', 'Frutas e derivados', 36.87, 0.65, 9.34, 0.13, 2.73, 1.82, '2026-05-02 14:17:58.686292+00'),
	('abd5a283-8458-4783-9a69-80122742da80', 'Morango, cru', 'Frutas e derivados', 30.15, 0.89, 6.82, 0.31, 1.72, NULL, '2026-05-02 14:17:58.686292+00'),
	('14223700-4e41-4cee-a007-1f4c91a45787', 'Nêspera, crua', 'Frutas e derivados', 42.54, 0.31, 11.53, NULL, 2.96, NULL, '2026-05-02 14:17:58.686292+00'),
	('33fe5390-6450-4052-bce4-7e7bcdc7c711', 'Pequi, cru', 'Frutas e derivados', 204.97, 2.34, 12.97, 17.97, 19.04, NULL, '2026-05-02 14:17:58.686292+00'),
	('c099430f-1435-438d-93c9-f8fc35a327b6', 'Pêra, Park, crua', 'Frutas e derivados', 60.59, 0.24, 16.07, 0.23, 2.98, 0.98, '2026-05-02 14:17:58.686292+00'),
	('6dce4731-de53-4c17-a4c0-c068dd1264ed', 'Pêra, Williams, crua', 'Frutas e derivados', 53.31, 0.57, 14.02, 0.11, 3.01, NULL, '2026-05-02 14:17:58.686292+00'),
	('5079f770-bf27-472c-bdb1-a77abf324a07', 'Pêssego, Aurora, cru', 'Frutas e derivados', 36.33, 0.83, 9.32, NULL, 1.42, NULL, '2026-05-02 14:17:58.686292+00'),
	('85804f17-5ed9-489d-bdca-0fd983bbf6b6', 'Pêssego, enlatado, em calda', 'Frutas e derivados', 63.14, 0.71, 16.88, NULL, 1.02, 3.20, '2026-05-02 14:17:58.686292+00'),
	('65a7e1ca-bd7b-4dd4-a644-a9d5f8d0026b', 'Pinha, crua', 'Frutas e derivados', 88.47, 1.49, 22.45, 0.32, 3.36, 1.34, '2026-05-02 14:17:58.686292+00'),
	('7dd62460-ec7b-450d-bbb8-cc1a958d4e9f', 'Pitanga, crua', 'Frutas e derivados', 41.42, 0.93, 10.24, 0.17, 3.24, 1.70, '2026-05-02 14:17:58.686292+00'),
	('6a659d87-aa5c-455a-8ab3-bd074f2f9ccb', 'Pitanga, polpa, congelada', 'Frutas e derivados', 19.11, 0.29, 4.76, 0.12, 0.74, 5.03, '2026-05-02 14:17:58.686292+00'),
	('da363db9-7d0d-4a34-a661-c5cbc3b26342', 'Romã, crua', 'Frutas e derivados', 55.74, 0.40, 15.11, NULL, 0.44, 0.59, '2026-05-02 14:17:58.686292+00'),
	('ab63cd36-6745-4d36-9543-6dc83ef90b8c', 'Tamarindo, cru', 'Frutas e derivados', 275.70, 3.21, 72.53, 0.46, 6.45, 0.36, '2026-05-02 14:17:58.686292+00'),
	('d529df01-b6b5-4c0c-a82b-73fca8ded3fa', 'Tangerina, Poncã, crua', 'Frutas e derivados', 37.83, 0.85, 9.61, 0.07, 0.94, NULL, '2026-05-02 14:17:58.686292+00'),
	('3e2b780e-2599-45cc-9a9c-1de32ec5e895', 'Tangerina, Poncã, suco', 'Frutas e derivados', 36.11, 0.52, 8.80, NULL, NULL, NULL, '2026-05-02 14:17:58.686292+00'),
	('03763819-1c3a-4de7-a89c-d1cb20e06faa', 'Tucumã, cru', 'Frutas e derivados', 262.02, 2.09, 26.47, 19.08, 12.65, 3.89, '2026-05-02 14:17:58.686292+00'),
	('349255fc-0357-48ce-a4c0-0854503851c4', 'Umbu, cru', 'Frutas e derivados', 37.02, 0.84, 9.40, NULL, 1.98, NULL, '2026-05-02 14:17:58.686292+00'),
	('fef231f5-5675-4c6f-b985-c75b0b90cbc7', 'Umbu, polpa, congelada', 'Frutas e derivados', 33.94, 0.51, 8.79, 0.07, 1.34, 5.77, '2026-05-02 14:17:58.686292+00'),
	('7fd5782e-cc95-494c-85ef-95c6aa708841', 'Uva, Itália, crua', 'Frutas e derivados', 52.87, 0.75, 13.57, 0.20, 0.92, NULL, '2026-05-02 14:17:58.686292+00'),
	('0c5be340-1acf-42f3-9ac9-5a263c57c73f', 'Uva, Rubi, crua', 'Frutas e derivados', 49.06, 0.61, 12.70, 0.16, 0.93, 7.92, '2026-05-02 14:17:58.686292+00'),
	('420dbca1-4e42-4b0d-9ac1-1a63a59574a2', 'Uva, suco concentrado, envasado', 'Frutas e derivados', 57.66, NULL, 14.71, NULL, 0.23, 9.58, '2026-05-02 14:17:58.686292+00'),
	('d34a9209-9f2d-4be8-a7cd-20c8a677ea9a', 'Azeite, de dendê', 'Gorduras e óleos', 884.00, NULL, NULL, 100.00, NULL, NULL, '2026-05-02 14:17:58.686292+00'),
	('ab16d5ea-068b-4cb2-97bd-eff6568b095e', 'Azeite, de oliva, extra virgem', 'Gorduras e óleos', 884.00, NULL, NULL, 100.00, NULL, NULL, '2026-05-02 14:17:58.686292+00'),
	('66857061-1d30-4dab-b6af-4c221d48b332', 'Manteiga, com sal', 'Gorduras e óleos', 725.97, 0.41, 0.06, 82.36, NULL, 578.69, '2026-05-02 14:17:58.686292+00'),
	('e92808f4-807e-4833-9075-9e1c3cb5662c', 'Manteiga, sem sal', 'Gorduras e óleos', 757.54, 0.40, 0.00, 86.04, NULL, 3.85, '2026-05-02 14:17:58.686292+00'),
	('a7e77e8a-67ec-434c-ad96-016582e05179', 'Margarina, com óleo hidrogenado, com sal (65% de lipídeos)', 'Gorduras e óleos', 596.12, NULL, 0.00, 67.43, NULL, 894.04, '2026-05-02 14:17:58.686292+00'),
	('16d252d9-9a3b-49f9-b054-63eacfe3fd58', 'Margarina, com óleo hidrogenado, sem sal (80% de lipídeos)', 'Gorduras e óleos', 722.53, NULL, 0.00, 81.73, NULL, 77.89, '2026-05-02 14:17:58.686292+00'),
	('85d7f59e-dba4-4d44-9911-2371d852dc99', 'Margarina, com óleo interesterificado, com sal (65%de lipídeos)', 'Gorduras e óleos', 594.45, NULL, 0.00, 67.25, NULL, 560.80, '2026-05-02 14:17:58.686292+00'),
	('b6053364-4e59-47a8-b9b0-98dcb11f0067', 'Margarina, com óleo interesterificado, sem sal (65% de lipídeos)', 'Gorduras e óleos', 593.14, NULL, 0.00, 67.10, NULL, 33.19, '2026-05-02 14:17:58.686292+00'),
	('de920c48-e266-428a-ba27-a1949c475a60', 'Óleo, de babaçu', 'Gorduras e óleos', 884.00, NULL, NULL, 100.00, NULL, NULL, '2026-05-02 14:17:58.686292+00'),
	('2cb60ca5-cb54-4cc3-84ec-70aebce65f20', 'Óleo, de canola', 'Gorduras e óleos', 884.00, NULL, NULL, 100.00, NULL, NULL, '2026-05-02 14:17:58.686292+00'),
	('e168d36d-f4e6-496a-b5cd-35eda750aae7', 'Óleo, de girassol', 'Gorduras e óleos', 884.00, NULL, NULL, 100.00, NULL, NULL, '2026-05-02 14:17:58.686292+00'),
	('334a9ef2-93e2-4a80-b1bd-93f1345c988d', 'Óleo, de milho', 'Gorduras e óleos', 884.00, NULL, NULL, 100.00, NULL, NULL, '2026-05-02 14:17:58.686292+00'),
	('58ae2d70-4eb8-41f6-acb7-c572a1bb210e', 'Óleo, de pequi', 'Gorduras e óleos', 884.00, NULL, NULL, 100.00, NULL, NULL, '2026-05-02 14:17:58.686292+00'),
	('37201954-7ccd-4b40-9d6d-236c2e812f95', 'Óleo, de soja', 'Gorduras e óleos', 884.00, NULL, NULL, 100.00, NULL, NULL, '2026-05-02 14:17:58.686292+00'),
	('15fd2f90-abfd-4a7e-86d5-9fb87ff39f9c', 'Abadejo, filé, congelado, assado', 'Pescados e frutos do mar', 111.62, 23.53, 0.00, 1.24, NULL, 334.39, '2026-05-02 14:17:58.686292+00'),
	('9fb40dba-ed72-4b9c-9eef-747b52002332', 'Abadejo, filé, congelado,cozido', 'Pescados e frutos do mar', 91.10, 19.35, 0.00, 0.94, NULL, 189.34, '2026-05-02 14:17:58.686292+00'),
	('a099fcb7-c590-4b14-af0c-e180e1f23df4', 'Abadejo, filé, congelado, cru', 'Pescados e frutos do mar', 59.11, 13.08, 0.00, 0.36, NULL, 78.52, '2026-05-02 14:17:58.686292+00'),
	('96ca9c32-ae03-4075-84c0-a2661c9255a7', 'Abadejo, filé, congelado, grelhado', 'Pescados e frutos do mar', 129.64, 27.61, 0.00, 1.30, NULL, 305.09, '2026-05-02 14:17:58.686292+00'),
	('ca106e5f-21de-4b92-92ba-6c540df704ba', 'Atum, conserva em óleo', 'Pescados e frutos do mar', 165.91, 26.19, 0.00, 6.00, NULL, 362.15, '2026-05-02 14:17:58.686292+00'),
	('bf500c9d-63ca-40c7-8cab-077fa07108b6', 'Atum, fresco, cru', 'Pescados e frutos do mar', 117.50, 25.68, 0.00, 0.87, NULL, 30.30, '2026-05-02 14:17:58.686292+00'),
	('8d240b78-eddb-46e3-a53f-e86e9c404596', 'Bacalhau, salgado, cru', 'Pescados e frutos do mar', 135.89, 29.04, 0.00, 1.32, NULL, 13585.06, '2026-05-02 14:17:58.686292+00'),
	('1a59bd80-99a0-4084-8218-1a9e908820f9', 'Bacalhau, salgado, refogado', 'Pescados e frutos do mar', 139.66, 23.98, 1.22, 3.61, NULL, 1256.28, '2026-05-02 14:17:58.686292+00'),
	('8a653f6d-1de3-4319-9edb-7ba02902071d', 'Cação, posta, com farinha de trigo, frita', 'Pescados e frutos do mar', 208.33, 24.95, 3.10, 9.95, 0.54, 160.03, '2026-05-02 14:17:58.686292+00'),
	('c2955457-7a09-464e-a7ed-1ccf81bda335', 'Cação, posta, cozida', 'Pescados e frutos do mar', 116.01, 25.59, 0.00, 0.75, NULL, 114.91, '2026-05-02 14:17:58.686292+00'),
	('24309126-2561-40b3-9693-1ddf652d5a86', 'Cação, posta, crua', 'Pescados e frutos do mar', 83.33, 17.85, 0.00, 0.79, NULL, 176.02, '2026-05-02 14:17:58.686292+00'),
	('3ea404ae-6c8e-4fa0-8bb4-4d3f48529b07', 'Camarão, Rio Grande, grande, cozido', 'Pescados e frutos do mar', 90.01, 18.97, 0.00, 1.00, NULL, 366.55, '2026-05-02 14:17:58.686292+00'),
	('85f48f97-5b82-4427-8f7e-03b07fd497ae', 'Camarão, Rio Grande, grande, cru', 'Pescados e frutos do mar', 47.18, 9.99, 0.00, 0.50, NULL, 201.13, '2026-05-02 14:17:58.686292+00'),
	('0a546e7a-71d8-4418-8226-e70e9f0485ff', 'Camarão, Sete Barbas, sem cabeça, com casca, frito', 'Pescados e frutos do mar', 231.25, 18.39, 2.88, 15.62, NULL, 99.06, '2026-05-02 14:17:58.686292+00'),
	('8341f64c-4fcc-4d3b-875f-abaafd761441', 'Caranguejo, cozido', 'Pescados e frutos do mar', 82.72, 18.48, 0.00, 0.42, NULL, 360.11, '2026-05-02 14:17:58.686292+00'),
	('9409e36c-d080-4575-8bb3-d00b14800c20', 'Corimba, cru', 'Pescados e frutos do mar', 128.16, 17.37, -0.03, 5.99, NULL, 47.01, '2026-05-02 14:17:58.686292+00'),
	('5d11e914-e3f4-4ee1-89a0-48c40d899d21', 'Corimbatá, assado', 'Pescados e frutos do mar', 261.45, 19.90, 0.00, 19.57, NULL, 40.43, '2026-05-02 14:17:58.686292+00'),
	('be298472-d3eb-4980-943c-1e0f3e3835c7', 'Corimbatá, cozido', 'Pescados e frutos do mar', 238.70, 20.13, 0.00, 16.93, NULL, 37.17, '2026-05-02 14:17:58.686292+00'),
	('0b1c4b3f-0e2b-4087-ac34-9b4d343f9a8f', 'Corvina de água doce, crua', 'Pescados e frutos do mar', 101.01, 18.92, 0.00, 2.24, NULL, 45.09, '2026-05-02 14:17:58.686292+00'),
	('8ce168a3-f6aa-4a26-820e-a99c618bfe3b', 'Corvina do mar, crua', 'Pescados e frutos do mar', 94.00, 18.57, 0.00, 1.58, NULL, 67.97, '2026-05-02 14:17:58.686292+00'),
	('48cf613b-d2c8-42c8-9d08-1daea9ab9d1d', 'Corvina grande, assada', 'Pescados e frutos do mar', 146.53, 26.77, 0.00, 3.57, NULL, 85.35, '2026-05-02 14:17:58.686292+00'),
	('1b20ef39-d243-41db-917d-f2cdba14c456', 'Corvina grande, cozida', 'Pescados e frutos do mar', 100.08, 23.44, 0.00, 2.56, NULL, 68.39, '2026-05-02 14:17:58.686292+00'),
	('e3ad0be1-3933-47e8-9262-1a987e1eb493', 'Dourada de água doce, fresca', 'Pescados e frutos do mar', 131.21, 18.81, 0.00, 5.64, NULL, 40.30, '2026-05-02 14:17:58.686292+00'),
	('902b7244-d061-4fd6-8de1-196b28c5015c', 'Lambari, congelado, cru', 'Pescados e frutos do mar', 130.84, 16.81, 0.00, 6.55, NULL, 47.92, '2026-05-02 14:17:58.686292+00'),
	('52ef471b-52e9-4e63-b4f3-2cc11b2063fc', 'Lambari, congelado, frito', 'Pescados e frutos do mar', 326.87, 28.43, 0.00, 22.78, NULL, 64.55, '2026-05-02 14:17:58.686292+00'),
	('0e05d623-d4ac-4304-95dc-8b9300b19bc2', 'Lambari, fresco,cru', 'Pescados e frutos do mar', 151.60, 15.65, 0.00, 9.40, NULL, 41.11, '2026-05-02 14:17:58.686292+00'),
	('5a139e6f-9041-4bb6-984b-a2f471f84430', 'Manjuba, com farinha de trigo, frita', 'Pescados e frutos do mar', 343.55, 23.45, 10.24, 22.59, 0.36, 36.52, '2026-05-02 14:17:58.686292+00'),
	('f7c5521a-ec39-42a8-9b11-3be20470b4aa', 'Manjuba, frita', 'Pescados e frutos do mar', 349.33, 30.14, 0.00, 24.46, NULL, 40.61, '2026-05-02 14:17:58.686292+00'),
	('82acac84-8383-4e4f-bc9a-dcdb398007c5', 'Merluza, filé, assado', 'Pescados e frutos do mar', 121.91, 26.60, 0.00, 0.92, NULL, 119.95, '2026-05-02 14:17:58.686292+00'),
	('c0a48fab-7060-4b14-a48f-e67068dce672', 'Merluza, filé, cru', 'Pescados e frutos do mar', 89.13, 16.61, 0.00, 2.02, NULL, 79.50, '2026-05-02 14:17:58.686292+00'),
	('e51d2bf8-1b40-4ef0-b2c0-b2b00344b21a', 'Merluza, filé, frito', 'Pescados e frutos do mar', 191.63, 26.93, 0.00, 8.50, NULL, 89.96, '2026-05-02 14:17:58.686292+00'),
	('35b6c8a8-38b1-43a0-aca1-a05660ac0e6c', 'Pescada, branca, crua', 'Pescados e frutos do mar', 110.88, 16.26, 0.00, 4.59, NULL, 76.17, '2026-05-02 14:17:58.686292+00'),
	('cb80c30a-8003-4e50-be2c-327cb6383571', 'Pescada, branca, frita', 'Pescados e frutos do mar', 223.04, 27.36, 0.00, 11.78, NULL, 107.23, '2026-05-02 14:17:58.686292+00'),
	('e517d24d-7a9a-4932-8d65-146684856565', 'Pescada, filé, com farinha de trigo, frito', 'Pescados e frutos do mar', 283.43, 21.44, 5.03, 19.12, NULL, 90.51, '2026-05-02 14:17:58.686292+00'),
	('6e12d9cb-63e7-4c89-975f-bedeee98f484', 'Pescada, filé, cru', 'Pescados e frutos do mar', 107.21, 16.65, 0.00, 4.00, NULL, 77.50, '2026-05-02 14:17:58.686292+00'),
	('2cfa999a-467a-46df-aa5d-609e6b95de7f', 'Pescada, filé, frito', 'Pescados e frutos do mar', 154.27, 28.59, 0.00, 3.57, NULL, 114.91, '2026-05-02 14:17:58.686292+00'),
	('503d5797-4f30-4136-9127-f5b026ad1f07', 'Pescada, filé, molho escabeche', 'Pescados e frutos do mar', 141.96, 11.75, 5.02, 8.02, 0.78, 51.29, '2026-05-02 14:17:58.686292+00'),
	('5754f1ea-347c-4a8e-bd62-0d813a32d6c0', 'Pescadinha, crua', 'Pescados e frutos do mar', 76.41, 15.48, 0.00, 1.14, NULL, 120.34, '2026-05-02 14:17:58.686292+00'),
	('d8d78f4e-0be5-47af-a7a5-2bfaca4cdb86', 'Pintado, assado', 'Pescados e frutos do mar', 191.56, 36.45, 0.00, 3.98, NULL, 80.95, '2026-05-02 14:17:58.686292+00'),
	('067dfbb3-81de-40f3-bcde-be86964d47ed', 'Pintado, cru', 'Pescados e frutos do mar', 91.08, 18.56, 0.00, 1.31, NULL, 43.34, '2026-05-02 14:17:58.686292+00'),
	('38ec9d2d-8de7-49ac-8f21-b61fece13810', 'Pintado, grelhado', 'Pescados e frutos do mar', 152.19, 30.80, 0.00, 2.29, NULL, 53.09, '2026-05-02 14:17:58.686292+00'),
	('7a07ac9e-f648-4acf-a450-f45de0c23075', 'Porquinho, cru', 'Pescados e frutos do mar', 93.02, 20.49, 0.00, 0.61, NULL, 66.73, '2026-05-02 14:17:58.686292+00'),
	('e038e4b1-9fa8-4427-be48-dd07018d650a', 'Salmão, filé, com pele, fresco,  grelhado', 'Pescados e frutos do mar', 228.73, 23.92, 0.00, 14.04, NULL, 85.14, '2026-05-02 14:17:58.686292+00'),
	('49ee993e-3e26-4c6d-b6a6-3cfd2c43c0ef', 'Salmão, sem pele, fresco, cru', 'Pescados e frutos do mar', 169.78, 19.25, 0.00, 9.71, NULL, 64.24, '2026-05-02 14:17:58.686292+00'),
	('ef1b7310-737e-49f1-9a5d-563b6de33918', 'Salmão, sem pele, fresco, grelhado', 'Pescados e frutos do mar', 242.71, 26.14, 0.00, 14.53, NULL, 95.81, '2026-05-02 14:17:58.686292+00'),
	('a2e355b7-2b23-4c1e-9dcb-6dcde84d352b', 'Sardinha, assada', 'Pescados e frutos do mar', 164.35, 32.18, 0.00, 2.99, NULL, 74.47, '2026-05-02 14:17:58.686292+00'),
	('b1e13ccd-9cfc-4f85-a98d-6d64cd9a1f62', 'Sardinha, conserva em óleo', 'Pescados e frutos do mar', 284.98, 15.94, 0.00, 24.05, NULL, 665.84, '2026-05-02 14:17:58.686292+00'),
	('0d400415-33f7-4dd1-9fc8-df78b7585b76', 'Sardinha, frita', 'Pescados e frutos do mar', 257.04, 33.38, 0.00, 12.69, NULL, 60.10, '2026-05-02 14:17:58.686292+00'),
	('be6a841a-5b4a-464d-a396-b55b0794f124', 'Sardinha, inteira, crua', 'Pescados e frutos do mar', 113.90, 21.08, 0.00, 2.65, NULL, 60.39, '2026-05-02 14:17:58.686292+00'),
	('bd89dbcd-4645-4c42-aa67-c2ad4736f554', 'Tucunaré, filé, congelado, cru', 'Pescados e frutos do mar', 87.69, 17.96, -0.05, 1.22, NULL, 56.55, '2026-05-02 14:17:58.686292+00'),
	('ede0295c-76e2-4268-bb6d-3ad5a2a809f1', 'Apresuntado', 'Carnes e derivados', 128.86, 13.45, 2.86, 6.69, NULL, 942.93, '2026-05-02 14:17:58.686292+00'),
	('62604ecd-bce4-49e5-85c1-7f8a96e11598', 'Caldo de carne, tablete', 'Carnes e derivados', 240.62, 7.82, 15.05, 16.57, 0.58, 22179.67, '2026-05-02 14:17:58.686292+00'),
	('2f749e99-82f2-4866-9dfe-65467feaa0bb', 'Caldo de galinha, tablete', 'Carnes e derivados', 251.45, 6.28, 10.65, 20.42, 11.81, 22299.90, '2026-05-02 14:17:58.686292+00'),
	('5401ed4f-767d-4493-a0d1-7e87cec7cee8', 'Carne, bovina, acém, moído, cozido', 'Carnes e derivados', 212.42, 26.69, 0.00, 10.92, NULL, 52.36, '2026-05-02 14:17:58.686292+00'),
	('dd87a03c-6bf8-4b0a-98e1-70b67997c930', 'Carne, bovina, acém, moído, cru', 'Carnes e derivados', 136.56, 19.42, 0.00, 5.95, NULL, 48.61, '2026-05-02 14:17:58.686292+00'),
	('f540cb83-32db-4ac7-8587-c2a105f45016', 'Carne, bovina, acém, sem gordura, cozido', 'Carnes e derivados', 214.61, 27.27, 0.00, 10.88, NULL, 56.17, '2026-05-02 14:17:58.686292+00'),
	('524855c6-ce45-4e56-8811-9ccdfb757828', 'Carne, bovina, acém, sem gordura, cru', 'Carnes e derivados', 144.03, 20.82, 0.00, 6.11, NULL, 49.85, '2026-05-02 14:17:58.686292+00'),
	('2770d482-37fe-48e9-b3fb-a7a716026530', 'Carne, bovina, almôndegas, cruas', 'Carnes e derivados', 189.26, 12.31, 9.79, 11.20, NULL, 621.25, '2026-05-02 14:17:58.686292+00'),
	('002ded6b-00b3-47b7-8c1f-a3c72030b4e5', 'Carne, bovina, almôndegas, fritas', 'Carnes e derivados', 271.81, 18.16, 14.29, 15.78, NULL, 1030.26, '2026-05-02 14:17:58.686292+00'),
	('79e6299d-7342-4067-bfc7-63ffaf4cf784', 'Carne, bovina, bucho, cozido', 'Carnes e derivados', 133.02, 21.64, 0.00, 4.50, NULL, 38.20, '2026-05-02 14:17:58.686292+00'),
	('cb5dc069-5c15-49a0-a0c0-4d386e8ca5d7', 'Carne, bovina, bucho, cru', 'Carnes e derivados', 137.30, 20.53, 0.00, 5.50, NULL, 45.00, '2026-05-02 14:17:58.686292+00'),
	('e1822fe4-dd6a-4617-b860-a459340027a3', 'Carne, bovina, capa de contra-filé, com gordura, crua', 'Carnes e derivados', 216.91, 19.20, 0.00, 14.96, NULL, 57.54, '2026-05-02 14:17:58.686292+00'),
	('b7564432-a805-4eb3-b98a-3cb25e2283ba', 'Carne, bovina, capa de contra-filé, com gordura, grelhada', 'Carnes e derivados', 311.70, 30.69, 0.00, 20.03, NULL, 80.51, '2026-05-02 14:17:58.686292+00'),
	('a207d454-f75f-4b05-b6d4-e506c997a130', 'Carne, bovina, capa de contra-filé, sem gordura, crua', 'Carnes e derivados', 131.06, 21.54, 0.00, 4.33, NULL, 79.17, '2026-05-02 14:17:58.686292+00'),
	('7bc629e0-7d72-4ac4-8128-290252a4229b', 'Carne, bovina, capa de contra-filé, sem gordura, grelhada', 'Carnes e derivados', 239.44, 35.06, -0.01, 9.95, NULL, 82.75, '2026-05-02 14:17:58.686292+00'),
	('dde199e6-e45c-4d72-bbbe-5411535e5edf', 'Carne, bovina, charque, cozido', 'Carnes e derivados', 262.78, 36.36, 0.00, 11.92, NULL, 1442.70, '2026-05-02 14:17:58.686292+00'),
	('c7de407c-139f-4c2b-bcaa-03442ff0b42b', 'Carne, bovina, charque, cru', 'Carnes e derivados', 248.86, 22.71, 0.00, 16.84, NULL, 5875.03, '2026-05-02 14:17:58.686292+00'),
	('cb084426-a2c8-40e4-ae68-ec10e0837982', 'Carne, bovina, contra-filé, à milanesa', 'Carnes e derivados', 351.59, 20.61, 12.17, 24.00, 0.37, 77.09, '2026-05-02 14:17:58.686292+00'),
	('afa4a3e9-8674-44a1-94e5-530f0cff98f7', 'Carne, bovina, contra-filé de costela, cru', 'Carnes e derivados', 202.44, 19.80, 0.00, 13.07, NULL, 38.52, '2026-05-02 14:17:58.686292+00'),
	('f04739b8-9c73-4c63-8d19-b52be0be8cbf', 'Carne, bovina, contra-filé de costela, grelhado', 'Carnes e derivados', 274.91, 29.88, 0.00, 16.33, NULL, 50.88, '2026-05-02 14:17:58.686292+00'),
	('b85b7cf9-30f2-4099-ab35-1cedc4b0dd69', 'Carne, bovina, contra-filé, com gordura, cru', 'Carnes e derivados', 205.86, 21.15, 0.00, 12.81, NULL, 44.13, '2026-05-02 14:17:58.686292+00'),
	('5fecdabd-a4d3-4eca-8daf-c2f02e41e2c4', 'Carne, bovina, contra-filé, com gordura, grelhado', 'Carnes e derivados', 278.05, 32.40, 0.00, 15.49, NULL, 57.07, '2026-05-02 14:17:58.686292+00'),
	('3de6bc14-5856-4c50-85ae-03096e857eaf', 'Carne, bovina, contra-filé, sem gordura, cru', 'Carnes e derivados', 156.62, 24.00, 0.00, 6.00, NULL, 52.89, '2026-05-02 14:17:58.686292+00'),
	('fb2d5c43-aa5e-4a55-93ab-bbbbbe1288f0', 'Carne, bovina, contra-filé, sem gordura, grelhado', 'Carnes e derivados', 193.69, 35.88, 0.00, 4.49, NULL, 57.51, '2026-05-02 14:17:58.686292+00'),
	('4b5624dd-20ee-487d-b8a8-f15ece408160', 'Carne, bovina, costela, assada', 'Carnes e derivados', 373.04, 28.81, 0.00, 27.72, NULL, 91.86, '2026-05-02 14:17:58.686292+00'),
	('63858b70-e35d-4e5b-be01-dbdc4159b121', 'Carne, bovina, costela, crua', 'Carnes e derivados', 357.72, 16.71, 0.00, 31.75, NULL, 70.00, '2026-05-02 14:17:58.686292+00'),
	('7fac3525-4099-4a5e-a12f-97ca9d748038', 'Carne, bovina, coxão duro, sem gordura, cozido', 'Carnes e derivados', 216.62, 31.88, 0.00, 8.92, NULL, 41.10, '2026-05-02 14:17:58.686292+00'),
	('b8751155-349a-4759-b85d-1c4fbf182798', 'Carne, bovina, coxão duro, sem gordura, cru', 'Carnes e derivados', 147.97, 21.51, 0.00, 6.22, NULL, 48.55, '2026-05-02 14:17:58.686292+00'),
	('8796bc8b-8ab1-4613-bd31-77122e5ff0d6', 'Carne, bovina, coxão mole, sem gordura, cozido', 'Carnes e derivados', 218.68, 32.38, 0.00, 8.91, NULL, 43.50, '2026-05-02 14:17:58.686292+00'),
	('0236ad90-e78e-4129-9f2b-be9b10268a78', 'Carne, bovina, coxão mole, sem gordura, cru', 'Carnes e derivados', 169.07, 21.23, 0.00, 8.69, NULL, 60.53, '2026-05-02 14:17:58.686292+00'),
	('ddb982c5-f48a-44c9-bd14-444c11584006', 'Carne, bovina, cupim, assado', 'Carnes e derivados', 330.10, 28.63, 0.00, 23.04, NULL, 71.59, '2026-05-02 14:17:58.686292+00'),
	('82c2ad82-dd8b-4a59-bc4f-2157e9044acc', 'Carne, bovina, cupim, cru', 'Carnes e derivados', 221.40, 19.54, 0.00, 15.30, NULL, 46.86, '2026-05-02 14:17:58.686292+00'),
	('ccbf1826-625d-464b-9318-5b08ad309218', 'Carne, bovina, fígado, cru', 'Carnes e derivados', 141.05, 20.71, 1.11, 5.36, NULL, 75.92, '2026-05-02 14:17:58.686292+00'),
	('6d060533-9cd2-45c8-bb9a-1de82e77c0c5', 'Carne, bovina, fígado, grelhado', 'Carnes e derivados', 225.03, 29.86, 4.20, 9.01, NULL, 82.19, '2026-05-02 14:17:58.686292+00'),
	('dd0e9cda-9dab-4a1d-80fa-498917adf545', 'Carne, bovina, filé mingnon, sem gordura, cru', 'Carnes e derivados', 142.86, 21.60, 0.00, 5.61, NULL, 48.86, '2026-05-02 14:17:58.686292+00'),
	('ecee2762-d26a-4b13-879e-0258e897039d', 'Carne, bovina, filé mingnon, sem gordura, grelhado', 'Carnes e derivados', 219.70, 32.80, 0.00, 8.83, NULL, 57.91, '2026-05-02 14:17:58.686292+00'),
	('68b65bf5-b2b3-41d9-acb8-cdb806e02dc9', 'Carne, bovina, flanco, sem gordura, cozido', 'Carnes e derivados', 195.58, 29.38, 0.00, 7.77, NULL, 41.68, '2026-05-02 14:17:58.686292+00'),
	('b279aaa4-0d44-4fb1-b7a5-8dae6ac46cf3', 'Carne, bovina, flanco, sem gordura, cru', 'Carnes e derivados', 141.46, 20.00, 0.00, 6.22, NULL, 54.22, '2026-05-02 14:17:58.686292+00'),
	('a6c00466-40c3-4f59-ad4c-6a0400d26b08', 'Carne, bovina, fraldinha, com gordura, cozida', 'Carnes e derivados', 338.45, 24.24, 0.00, 26.05, NULL, 38.78, '2026-05-02 14:17:58.686292+00'),
	('59b62cc5-0d5f-40c7-8c74-94836b3d2a3b', 'Carne, bovina, fraldinha, com gordura, crua', 'Carnes e derivados', 220.72, 17.58, 0.00, 16.15, NULL, 51.20, '2026-05-02 14:17:58.686292+00'),
	('dc6d8ce7-b1d3-4ac0-85da-4ed24b896768', 'Carne, bovina, lagarto, cozido', 'Carnes e derivados', 222.47, 32.86, 0.00, 9.11, NULL, 47.54, '2026-05-02 14:17:58.686292+00'),
	('a40ad733-8227-4ecc-95d7-b2bb895a3918', 'Carne, bovina, lagarto, cru', 'Carnes e derivados', 134.86, 20.54, 0.00, 5.23, NULL, 53.56, '2026-05-02 14:17:58.686292+00'),
	('d35aff62-e8fc-4913-9945-2f030990ce04', 'Carne, bovina, língua, cozida', 'Carnes e derivados', 314.90, 21.37, 0.00, 24.80, NULL, 59.06, '2026-05-02 14:17:58.686292+00'),
	('b642a390-10a6-48d4-ab54-952d3875fb2a', 'Carne, bovina, língua, crua', 'Carnes e derivados', 215.25, 17.09, 0.00, 15.77, NULL, 73.05, '2026-05-02 14:17:58.686292+00'),
	('f7d75a4e-1afa-40ba-b17e-0dd320ff3737', 'Carne, bovina, maminha, crua', 'Carnes e derivados', 152.77, 20.93, 0.00, 7.03, NULL, 37.42, '2026-05-02 14:17:58.686292+00'),
	('874338d6-5332-4117-bd8f-957de4eaffb5', 'Carne, bovina, maminha, grelhada', 'Carnes e derivados', 153.09, 30.74, 0.00, 2.42, NULL, 58.12, '2026-05-02 14:17:58.686292+00'),
	('217c1c8e-9c0c-42ff-8cd7-b8f2128181f8', 'Carne, bovina, miolo de alcatra, sem gordura, cru', 'Carnes e derivados', 162.87, 21.61, 0.00, 7.83, NULL, 43.05, '2026-05-02 14:17:58.686292+00'),
	('ccdd5c74-c719-4106-b010-bbd68de240d4', 'Carne, bovina, miolo de alcatra, sem gordura, grelhado', 'Carnes e derivados', 241.36, 31.93, 0.00, 11.64, NULL, 51.62, '2026-05-02 14:17:58.686292+00'),
	('6fdaaa84-96c1-4d1e-bda0-adfd081771e1', 'Carne, bovina, músculo, sem gordura, cozido', 'Carnes e derivados', 193.80, 31.23, 0.00, 6.70, NULL, 61.79, '2026-05-02 14:17:58.686292+00'),
	('073d9351-06d5-490b-aac2-a433dc38922f', 'Carne, bovina, músculo, sem gordura, cru', 'Carnes e derivados', 141.58, 21.56, 0.00, 5.49, NULL, 66.08, '2026-05-02 14:17:58.686292+00'),
	('6fd9a841-ec97-4931-9693-2c87494a46e8', 'Carne, bovina, paleta, com gordura, crua', 'Carnes e derivados', 158.71, 21.41, 0.00, 7.46, NULL, 64.90, '2026-05-02 14:17:58.686292+00'),
	('4e1b6157-1d40-4f21-9f82-4f562c020ef2', 'Carne, bovina, paleta, sem gordura, cozida', 'Carnes e derivados', 193.65, 29.72, 0.00, 7.40, NULL, 57.62, '2026-05-02 14:17:58.686292+00'),
	('0d4254a7-e049-48ce-a3ff-0099c4f45ebc', 'Carne, bovina, paleta, sem gordura, crua', 'Carnes e derivados', 140.94, 21.03, 0.00, 5.67, NULL, 65.86, '2026-05-02 14:17:58.686292+00'),
	('9a756ffe-2ec8-4c21-b395-a717e2eda973', 'Carne, bovina, patinho, sem gordura, cru', 'Carnes e derivados', 133.47, 21.72, 0.00, 4.51, NULL, 49.13, '2026-05-02 14:17:58.686292+00'),
	('60d500af-f981-444a-a261-ff349dc5ee44', 'Carne, bovina, patinho, sem gordura, grelhado', 'Carnes e derivados', 219.26, 35.90, 0.00, 7.31, NULL, 60.29, '2026-05-02 14:17:58.686292+00'),
	('6cafc1fa-ea56-46c8-8762-1e6cc2d205ef', 'Carne, bovina, peito, sem gordura, cozido', 'Carnes e derivados', 338.47, 22.25, 0.00, 26.99, NULL, 55.71, '2026-05-02 14:17:58.686292+00'),
	('5b6ded01-6ff8-4a13-8091-0f3b8707c0c8', 'Carne, bovina, peito, sem gordura, cru', 'Carnes e derivados', 259.28, 17.56, 0.00, 20.43, NULL, 63.76, '2026-05-02 14:17:58.686292+00'),
	('7e967df8-5cea-4ca2-89d0-52436cbdec01', 'Carne, bovina, picanha, com gordura, crua', 'Carnes e derivados', 212.88, 18.82, 0.00, 14.69, NULL, 37.62, '2026-05-02 14:17:58.686292+00'),
	('d5fc4b48-9866-443d-bf04-6c226d0a088c', 'Carne, bovina, picanha, com gordura, grelhada', 'Carnes e derivados', 288.77, 26.42, 0.00, 19.51, NULL, 60.00, '2026-05-02 14:17:58.686292+00'),
	('fbcab39e-4b3c-4a1a-86d4-934e29e27bfd', 'Carne, bovina, picanha, sem gordura, crua', 'Carnes e derivados', 133.52, 21.25, 0.00, 4.74, NULL, 61.15, '2026-05-02 14:17:58.686292+00'),
	('dd0becd9-79e0-462b-88c1-d7d9cc89d647', 'Carne, bovina, picanha, sem gordura, grelhada', 'Carnes e derivados', 238.47, 31.91, 0.00, 11.33, NULL, 60.66, '2026-05-02 14:17:58.686292+00'),
	('725a72e5-0238-4908-ad13-30b5c6510a25', 'Carne, bovina, seca, cozida', 'Carnes e derivados', 312.80, 26.93, 0.00, 21.93, NULL, 1943.18, '2026-05-02 14:17:58.686292+00'),
	('d450bd0d-59a0-4509-a0fc-a1055908de34', 'Carne, bovina, seca, crua', 'Carnes e derivados', 312.75, 19.66, 0.00, 25.37, NULL, 4439.55, '2026-05-02 14:17:58.686292+00'),
	('be00a094-dbd5-4b55-8016-6fb14aee1801', 'Coxinha de frango, frita', 'Carnes e derivados', 283.05, 9.61, 34.52, 11.84, 4.97, 532.13, '2026-05-02 14:17:58.686292+00'),
	('554d1868-f25b-4e14-8aef-36097fedc099', 'Croquete, de carne, cru', 'Carnes e derivados', 245.77, 12.04, 13.95, 15.56, NULL, 710.64, '2026-05-02 14:17:58.686292+00'),
	('3059aa45-6eb5-4618-a42e-3ab7b86abddd', 'Croquete, de carne, frito', 'Carnes e derivados', 346.74, 16.86, 18.15, 22.67, NULL, 916.41, '2026-05-02 14:17:58.686292+00'),
	('ca1bbe46-f5b2-4d07-bd44-7c93771ceab9', 'Empada de frango, pré-cozida, assada', 'Carnes e derivados', 358.19, 6.94, 47.49, 15.61, 2.16, 524.93, '2026-05-02 14:17:58.686292+00'),
	('c6b88ab7-0ff6-4189-a18f-03e068c5661d', 'Empada, de frango, pré-cozida', 'Carnes e derivados', 377.48, 7.34, 35.53, 22.89, 2.22, 770.73, '2026-05-02 14:17:58.686292+00'),
	('8fb39ee7-0c80-471f-bff3-211e836929f8', 'Frango, asa, com pele, crua', 'Carnes e derivados', 213.19, 18.10, 0.00, 15.07, NULL, 96.30, '2026-05-02 14:17:58.686292+00'),
	('dc2a8bd4-9d24-4da8-811b-ee152c95b1a2', 'Frango, caipira, inteiro, com pele, cozido', 'Carnes e derivados', 242.89, 23.88, 0.00, 15.62, NULL, 56.09, '2026-05-02 14:17:58.686292+00'),
	('126db8c5-0eb6-4637-9b38-c21e077a1f96', 'Frango, caipira, inteiro, sem pele, cozido', 'Carnes e derivados', 195.76, 29.58, 0.00, 7.70, NULL, 53.24, '2026-05-02 14:17:58.686292+00'),
	('57b33120-96be-4a24-aca0-3255b8de50f5', 'Frango, coração, cru', 'Carnes e derivados', 221.50, 12.58, 0.00, 18.60, NULL, 95.06, '2026-05-02 14:17:58.686292+00'),
	('f1a8814b-3127-4057-84c7-d0cbe31faaae', 'Frango, coração, grelhado', 'Carnes e derivados', 207.27, 22.44, 0.61, 12.10, NULL, 128.24, '2026-05-02 14:17:58.686292+00'),
	('6e288a79-6d62-42ba-ac91-f1b4449a08f2', 'Frango, coxa, com pele, assada', 'Carnes e derivados', 215.12, 28.49, 0.06, 10.36, NULL, 94.84, '2026-05-02 14:17:58.686292+00'),
	('ffdc09c9-20a2-4f60-b7a3-157c92adb535', 'Frango, coxa, com pele, crua', 'Carnes e derivados', 161.47, 17.09, 0.00, 9.81, NULL, 94.96, '2026-05-02 14:17:58.686292+00'),
	('78f42538-b5df-4013-8c1b-32e7ec6e2239', 'Frango, coxa, sem pele, cozida', 'Carnes e derivados', 167.43, 26.86, 0.00, 5.85, NULL, 64.34, '2026-05-02 14:17:58.686292+00'),
	('7afd616b-f331-4253-8e3a-2e9b62765105', 'Frango, coxa, sem pele, crua', 'Carnes e derivados', 119.95, 17.81, 0.02, 4.86, NULL, 98.37, '2026-05-02 14:17:58.686292+00'),
	('65139b17-87f1-4727-ab3f-6d548dc04ce7', 'Frango, fígado, cru', 'Carnes e derivados', 106.48, 17.59, -0.02, 3.49, NULL, 82.43, '2026-05-02 14:17:58.686292+00'),
	('2afc01bd-2fca-4088-8a12-d161cf85cff0', 'Frango, filé, à milanesa', 'Carnes e derivados', 220.87, 28.46, 7.51, 7.79, 1.13, 122.33, '2026-05-02 14:17:58.686292+00'),
	('e7f319b4-dfcd-4da6-883a-f8c2d2f924d0', 'Frango, inteiro, com pele, cru', 'Carnes e derivados', 226.32, 16.44, 0.00, 17.31, NULL, 62.88, '2026-05-02 14:17:58.686292+00'),
	('434ec03d-57e5-4d5e-9e03-894799b980a7', 'Frango, inteiro, sem pele, assado', 'Carnes e derivados', 187.34, 28.03, 0.00, 7.50, NULL, 70.27, '2026-05-02 14:17:58.686292+00'),
	('93d7eec6-9587-4d19-b4fd-fab38f77f815', 'Frango, inteiro, sem pele, cozido', 'Carnes e derivados', 170.39, 24.99, 0.00, 7.06, NULL, 50.89, '2026-05-02 14:17:58.686292+00'),
	('4788e164-cd46-4177-bf65-ed02d637e6b4', 'Frango, inteiro, sem pele, cru', 'Carnes e derivados', 129.10, 20.59, 0.00, 4.57, NULL, 72.96, '2026-05-02 14:17:58.686292+00'),
	('bc37d8c9-65b0-4613-bced-dd63ae46f2e7', 'Frango, peito, com pele, assado', 'Carnes e derivados', 211.68, 33.42, 0.00, 7.65, NULL, 55.70, '2026-05-02 14:17:58.686292+00'),
	('5e3f6c46-bc4c-4afe-8c7c-ebf82a0d443a', 'Frango, peito, com pele, cru', 'Carnes e derivados', 149.47, 20.78, 0.00, 6.73, NULL, 62.31, '2026-05-02 14:17:58.686292+00'),
	('26bd27e8-679b-4de0-bd03-87ee78f1213a', 'Frango, peito, sem pele, cozido', 'Carnes e derivados', 162.87, 31.47, 0.00, 3.16, NULL, 36.17, '2026-05-02 14:17:58.686292+00'),
	('7fcf726c-009c-4111-85b6-a907c9e9757e', 'Frango, peito, sem pele, cru', 'Carnes e derivados', 119.16, 21.53, 0.00, 3.02, NULL, 56.14, '2026-05-02 14:17:58.686292+00'),
	('459cd1ed-8246-41d2-97c4-7c4c02d43a7e', 'Frango, peito, sem pele, grelhado', 'Carnes e derivados', 159.19, 32.03, 0.00, 2.48, NULL, 50.25, '2026-05-02 14:17:58.686292+00'),
	('71965750-8ae4-4c0a-999d-c27e6c913df7', 'Frango, sobrecoxa, com pele, assada', 'Carnes e derivados', 259.60, 28.70, 0.00, 15.19, NULL, 95.94, '2026-05-02 14:17:58.686292+00'),
	('73ab0868-d8db-4651-b94c-20e256423a0a', 'Frango, sobrecoxa, com pele, crua', 'Carnes e derivados', 254.53, 15.46, 0.00, 20.90, NULL, 68.27, '2026-05-02 14:17:58.686292+00'),
	('81bc6d08-4a8f-447c-a34d-a9d9d25df10e', 'Frango, sobrecoxa, sem pele, assada', 'Carnes e derivados', 232.88, 29.18, 0.00, 12.01, NULL, 106.08, '2026-05-02 14:17:58.686292+00'),
	('db3e654e-b1db-4846-b324-f522962b8fb6', 'Frango, sobrecoxa, sem pele, crua', 'Carnes e derivados', 161.80, 17.57, 0.00, 9.62, NULL, 79.75, '2026-05-02 14:17:58.686292+00'),
	('b66f1e2b-9b72-4028-be97-9682c8534452', 'Hambúrguer, bovino, cru', 'Carnes e derivados', 214.84, 13.16, 4.15, 16.18, NULL, 869.46, '2026-05-02 14:17:58.686292+00'),
	('8dd7fa4b-e900-427a-a983-d57617cca000', 'Hambúrguer, bovino, frito', 'Carnes e derivados', 258.28, 19.97, 6.32, 17.01, NULL, 1251.80, '2026-05-02 14:17:58.686292+00'),
	('95a2cb4b-742c-4b5a-8b61-5460270e0212', 'Hambúrguer, bovino, grelhado', 'Carnes e derivados', 209.83, 13.16, 11.33, 12.43, NULL, 1090.33, '2026-05-02 14:17:58.686292+00'),
	('5d486bdd-4cca-40f6-a4c4-2cfcd718106b', 'Lingüiça, frango, crua', 'Carnes e derivados', 218.11, 14.24, 0.00, 17.44, NULL, 1125.81, '2026-05-02 14:17:58.686292+00'),
	('3734a011-88d4-41a0-ad9f-28006ab01657', 'Lingüiça, frango, frita', 'Carnes e derivados', 245.46, 18.32, 0.00, 18.54, NULL, 1373.89, '2026-05-02 14:17:58.686292+00'),
	('97a52107-665d-47d9-848e-a310de25dfe3', 'Lingüiça, frango, grelhada', 'Carnes e derivados', 243.66, 18.19, 0.00, 18.40, NULL, 1351.49, '2026-05-02 14:17:58.686292+00'),
	('e2fcb44e-5b7c-4f5b-ac72-9b6ad5166f8c', 'Lingüiça, porco, crua', 'Carnes e derivados', 227.20, 16.06, 0.00, 17.58, NULL, 1175.72, '2026-05-02 14:17:58.686292+00'),
	('25fc3bd4-2112-4923-9226-450fdcd82e05', 'Lingüiça, porco, frita', 'Carnes e derivados', 279.54, 20.45, 0.00, 21.31, NULL, 1431.59, '2026-05-02 14:17:58.686292+00'),
	('2185f348-e4b6-4400-8b59-b09c2396ef89', 'Lingüiça, porco, grelhada', 'Carnes e derivados', 296.49, 23.17, 0.00, 21.90, NULL, 1455.86, '2026-05-02 14:17:58.686292+00'),
	('5757f360-4ebc-423d-a91d-277fc1387af7', 'Mortadela', 'Carnes e derivados', 268.82, 11.95, 5.82, 21.65, NULL, 1212.17, '2026-05-02 14:17:58.686292+00'),
	('0e7bebae-d013-4c22-9461-ce5971d2ed57', 'Peru, congelado, assado', 'Carnes e derivados', 163.07, 26.20, 0.00, 5.68, NULL, 627.88, '2026-05-02 14:17:58.686292+00'),
	('1e771951-a561-45ce-bdd1-1fefe3940d83', 'Peru, congelado, cru', 'Carnes e derivados', 93.72, 18.08, 0.00, 1.83, NULL, 710.68, '2026-05-02 14:17:58.686292+00'),
	('f752a1d8-923d-43b4-8c17-10035f602a6e', 'Porco, bisteca, crua', 'Carnes e derivados', 164.12, 21.50, 0.00, 8.02, NULL, 54.29, '2026-05-02 14:17:58.686292+00'),
	('2527ce47-6839-47bf-b943-e4b7c27c2b64', 'Porco, bisteca, frita', 'Carnes e derivados', 311.17, 33.75, 0.00, 18.52, NULL, 63.03, '2026-05-02 14:17:58.686292+00'),
	('a56b25ed-ae0b-4c9f-9e3a-80fff4ce37a2', 'Porco, bisteca, grelhada', 'Carnes e derivados', 280.08, 28.89, 0.00, 17.38, NULL, 51.45, '2026-05-02 14:17:58.686292+00'),
	('9d74a068-d4fe-4502-affb-9283b9ec13d0', 'Porco, costela, assada', 'Carnes e derivados', 402.17, 30.22, 0.00, 30.28, NULL, 62.68, '2026-05-02 14:17:58.686292+00'),
	('53e23922-6e82-426f-b51b-125046d39595', 'Porco, costela, crua', 'Carnes e derivados', 255.61, 18.00, 0.00, 19.82, NULL, 87.98, '2026-05-02 14:17:58.686292+00'),
	('a47830dd-4ffb-480a-b494-77b8c992fe63', 'Porco, lombo, assado', 'Carnes e derivados', 210.23, 35.73, 0.00, 6.40, NULL, 38.92, '2026-05-02 14:17:58.686292+00'),
	('52d68581-bc58-4c1c-b581-5d6b27651422', 'Porco, lombo, cru', 'Carnes e derivados', 175.63, 22.60, 0.00, 8.77, NULL, 53.07, '2026-05-02 14:17:58.686292+00'),
	('1bb3f0bd-7ba4-42e7-8a83-fca8472b0bd4', 'Porco, orelha, salgada, crua', 'Carnes e derivados', 258.49, 18.52, 0.00, 19.89, NULL, 615.60, '2026-05-02 14:17:58.686292+00'),
	('621225f8-d9b6-4623-9112-5341d50c30c8', 'Porco, pernil, assado', 'Carnes e derivados', 262.26, 32.13, 0.00, 13.86, NULL, 62.41, '2026-05-02 14:17:58.686292+00'),
	('ac2f87fd-9702-433b-bbc8-acc1f1fb9ab0', 'Porco, pernil, cru', 'Carnes e derivados', 186.06, 20.13, 0.00, 11.10, NULL, 101.89, '2026-05-02 14:17:58.686292+00'),
	('d6620df6-3dd2-49b8-a62c-db3b8d929c73', 'Porco, rabo, salgado, cru', 'Carnes e derivados', 377.42, 15.58, 0.00, 34.47, NULL, 1157.67, '2026-05-02 14:17:58.686292+00'),
	('57a91dd3-6f31-4d03-9456-8a8f85cf8949', 'Presunto, com capa de gordura', 'Carnes e derivados', 127.85, 14.37, 1.40, 6.77, NULL, 1020.77, '2026-05-02 14:17:58.686292+00'),
	('780c157a-5fa2-469b-bd20-473580b4f993', 'Presunto, sem capa de gordura', 'Carnes e derivados', 93.74, 14.29, 2.15, 2.71, NULL, 1039.19, '2026-05-02 14:17:58.686292+00'),
	('116dd762-dbd9-4db8-b85b-e76589f4e03c', 'Quibe, assado', 'Carnes e derivados', 136.23, 14.59, 12.86, 2.68, 1.90, 39.89, '2026-05-02 14:17:58.686292+00'),
	('9db6a641-bce9-48a8-9524-77c7b02b4f2c', 'Quibe, cru', 'Carnes e derivados', 109.49, 12.35, 10.77, 1.67, 1.65, 38.77, '2026-05-02 14:17:58.686292+00'),
	('62738f9e-bafe-4ed9-9fcf-2279168bfdd5', 'Quibe, frito', 'Carnes e derivados', 253.83, 14.89, 12.34, 15.80, NULL, 835.83, '2026-05-02 14:17:58.686292+00'),
	('9839c6e7-6c0e-4433-b09b-e9a6afd4b4e7', 'Salame', 'Carnes e derivados', 397.84, 25.81, 2.91, 30.64, NULL, 1574.17, '2026-05-02 14:17:58.686292+00'),
	('a98b75f9-9301-47a6-bbb4-5b482801b72c', 'Toucinho, cru', 'Carnes e derivados', 592.53, 11.48, 0.00, 60.26, NULL, 49.59, '2026-05-02 14:17:58.686292+00'),
	('5872917e-dd91-4948-83f0-1ac5fb0c7b1e', 'Toucinho, frito', 'Carnes e derivados', 696.56, 27.28, 0.00, 64.31, NULL, 124.85, '2026-05-02 14:17:58.686292+00'),
	('974b34e4-6dae-4bbc-b1da-0b766abb69c1', 'Bebida láctea, pêssego', 'Leite e derivados', 55.16, 2.13, 7.57, 1.91, 0.29, 46.26, '2026-05-02 14:17:58.686292+00'),
	('7811f79f-4620-4a39-8c64-55e5806547a9', 'Creme de Leite', 'Leite e derivados', 221.48, 1.51, 4.51, 22.48, NULL, 51.72, '2026-05-02 14:17:58.686292+00'),
	('ea1b8434-c0ca-465a-b57f-456346396f11', 'Iogurte, natural', 'Leite e derivados', 51.49, 4.06, 1.92, 3.04, NULL, 51.62, '2026-05-02 14:17:58.686292+00'),
	('0b64c6bf-6eb5-4e0c-b55c-067b062850d1', 'Iogurte, natural, desnatado', 'Leite e derivados', 41.49, 3.83, 5.77, 0.32, NULL, 59.64, '2026-05-02 14:17:58.686292+00'),
	('8971ac7f-b579-4788-9f43-4c6b2b750a1e', 'Iogurte, sabor abacaxi', 'Leite e derivados', NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-02 14:17:58.686292+00'),
	('a864712c-49e9-460e-906b-9bb2b3414565', 'Iogurte, sabor morango', 'Leite e derivados', 69.57, 2.71, 9.69, 2.33, 0.22, 37.66, '2026-05-02 14:17:58.686292+00'),
	('f5efb15c-2ddf-456e-a9ca-9b65cc2c1a91', 'Iogurte, sabor pêssego', 'Leite e derivados', 67.85, 2.53, 9.43, 2.34, 0.72, 36.96, '2026-05-02 14:17:58.686292+00'),
	('bd4e0e85-710e-4728-80de-55497646f192', 'Leite, condensado', 'Leite e derivados', 312.57, 7.67, 57.00, 6.74, NULL, 93.80, '2026-05-02 14:17:58.686292+00'),
	('1a48dc6b-2794-4141-a8cf-fbc497c2255a', 'Leite, de cabra', 'Leite e derivados', 66.42, 3.07, 5.25, 3.75, NULL, 73.95, '2026-05-02 14:17:58.686292+00'),
	('9b03167e-b4ac-4357-9281-e7504422360d', 'Leite, de vaca, achocolatado', 'Leite e derivados', 82.82, 2.10, 14.16, 2.17, 0.65, 71.74, '2026-05-02 14:17:58.686292+00'),
	('17b2033b-c020-439d-ad0a-596e437e8be0', 'Leite, de vaca, desnatado, pó', 'Leite e derivados', 361.61, 34.69, 53.04, 0.93, NULL, 431.67, '2026-05-02 14:17:58.686292+00'),
	('c5437207-ad16-463d-84aa-685dad1e6c38', 'Leite, de vaca, desnatado, UHT', 'Leite e derivados', NULL, NULL, NULL, NULL, NULL, 51.14, '2026-05-02 14:17:58.686292+00'),
	('68b72b27-6f9d-4562-b3a2-5da5809c2e00', 'Leite, de vaca, integral', 'Leite e derivados', NULL, NULL, NULL, NULL, NULL, 63.76, '2026-05-02 14:17:58.686292+00'),
	('01967fe0-defc-423a-97fb-02bf4e0229b7', 'Leite, de vaca, integral, pó', 'Leite e derivados', 496.65, 25.42, 39.18, 26.90, NULL, 323.20, '2026-05-02 14:17:58.686292+00'),
	('790bcaca-8ef4-4b44-b779-df0144830b31', 'Leite, fermentado', 'Leite e derivados', 69.62, 1.89, 15.67, 0.10, NULL, 33.43, '2026-05-02 14:17:58.686292+00'),
	('a51e8c38-4e87-4134-ae96-1e55d027892c', 'Queijo, minas, frescal', 'Leite e derivados', 264.27, 17.41, 3.24, 20.18, NULL, 31.23, '2026-05-02 14:17:58.686292+00'),
	('8309592e-998d-4d9b-b333-b9585e70cf7a', 'Queijo, minas, meia cura', 'Leite e derivados', 320.72, 21.21, 3.57, 24.61, NULL, 501.17, '2026-05-02 14:17:58.686292+00'),
	('17263bcc-b4ec-4af0-a546-7bfff3499157', 'Queijo, mozarela', 'Leite e derivados', 329.87, 22.65, 3.05, 25.18, NULL, 581.36, '2026-05-02 14:17:58.686292+00'),
	('1f076181-e67a-4a64-881b-a4765e4eab7f', 'Queijo, parmesão', 'Leite e derivados', 452.96, 35.55, 1.66, 33.53, NULL, 1844.08, '2026-05-02 14:17:58.686292+00'),
	('80c91e59-b707-43b8-b185-248d780ffc5a', 'Queijo, pasteurizado', 'Leite e derivados', 303.08, 9.36, 5.68, 27.44, NULL, 780.43, '2026-05-02 14:17:58.686292+00'),
	('70453dec-b5b3-4a28-8a78-9542d3748db2', 'Queijo, petit suisse, morango', 'Leite e derivados', 121.11, 5.79, 18.46, 2.84, NULL, 412.47, '2026-05-02 14:17:58.686292+00'),
	('f04b746d-0834-46d3-8a3e-7dbb1b9971e9', 'Queijo, prato', 'Leite e derivados', 359.88, 22.66, 1.88, 29.11, NULL, 579.77, '2026-05-02 14:17:58.686292+00'),
	('2c0d464c-9223-4da3-a3cd-ec082be27b41', 'Maria mole', 'Leite e derivados', 256.58, 9.63, 2.43, 23.44, NULL, 557.92, '2026-05-02 14:17:58.686292+00'),
	('76584a2c-844f-4475-a6d4-359f392bcd27', 'Queijo, ricota', 'Leite e derivados', 139.73, 12.60, 3.79, 8.11, NULL, 282.58, '2026-05-02 14:17:58.686292+00'),
	('98a0c814-6e83-428a-83c7-3b6f4609b494', 'Bebida isotônica, sabores variados', 'Bebidas (alcoólicas e não alcoólicas)', 25.61, 0.00, 6.40, 0.00, NULL, 44.08, '2026-05-02 14:17:58.686292+00'),
	('5df0004c-36e9-4094-af14-ca8a4b1a5020', 'Café, infusão 10%', 'Bebidas (alcoólicas e não alcoólicas)', 9.07, 0.71, 1.48, 0.07, NULL, 1.03, '2026-05-02 14:17:58.686292+00'),
	('916e623b-ce52-4f59-887a-0fc844e1bb7f', 'Cana, aguardente 1', 'Bebidas (alcoólicas e não alcoólicas)', 215.66, NULL, NULL, NULL, NULL, 3.15, '2026-05-02 14:17:58.686292+00'),
	('93ff34de-439f-4813-a2fd-30b86c60dc2f', 'Cana, caldo de', 'Bebidas (alcoólicas e não alcoólicas)', 65.34, NULL, 18.15, NULL, 0.14, NULL, '2026-05-02 14:17:58.686292+00'),
	('bcdd161b-c449-4132-9b3d-b1ee4fbaf998', 'Cerveja, pilsen 2', 'Bebidas (alcoólicas e não alcoólicas)', 40.72, 0.56, 3.32, NULL, NULL, 4.23, '2026-05-02 14:17:58.686292+00'),
	('5352316e-e2e7-4bf6-a680-d4bf69237636', 'Chá, erva-doce, infusão 5%', 'Bebidas (alcoólicas e não alcoólicas)', 1.40, 0.00, 0.39, 0.00, NULL, 0.63, '2026-05-02 14:17:58.686292+00'),
	('7c8e4723-ba9f-4582-b2a6-affaf319be3d', 'Chá, mate, infusão 5%', 'Bebidas (alcoólicas e não alcoólicas)', 2.73, 0.00, 0.64, 0.05, NULL, NULL, '2026-05-02 14:17:58.686292+00'),
	('87fe5f2e-768b-422e-9b7e-7a4489bb31c4', 'Chá, preto, infusão 5%', 'Bebidas (alcoólicas e não alcoólicas)', 2.25, 0.00, 0.63, 0.00, NULL, NULL, '2026-05-02 14:17:58.686292+00'),
	('e5b5f3a3-62ad-4e82-b772-957fedc9fc70', 'Coco, água de', 'Bebidas (alcoólicas e não alcoólicas)', 21.51, 0.00, 5.28, 0.00, 0.13, 1.78, '2026-05-02 14:17:58.686292+00'),
	('84753076-c19f-40fa-9cda-84e839ca14f9', 'Refrigerante, tipo água tônica', 'Bebidas (alcoólicas e não alcoólicas)', 30.78, 0.00, 7.95, 0.00, NULL, 8.29, '2026-05-02 14:17:58.686292+00'),
	('5f3df6ac-58e3-4e18-a7d4-41c5412fef6e', 'Refrigerante, tipo cola', 'Bebidas (alcoólicas e não alcoólicas)', 33.51, 0.00, 8.66, 0.00, NULL, 7.12, '2026-05-02 14:17:58.686292+00'),
	('4dbc588d-6cf0-41f7-85e8-5b42358be923', 'Refrigerante, tipo guaraná', 'Bebidas (alcoólicas e não alcoólicas)', 38.70, 0.00, 10.00, 0.00, NULL, 9.01, '2026-05-02 14:17:58.686292+00'),
	('3e1781d4-7731-488b-97be-de323963f630', 'Refrigerante, tipo laranja', 'Bebidas (alcoólicas e não alcoólicas)', 45.63, 0.00, 11.79, 0.00, NULL, 9.27, '2026-05-02 14:17:58.686292+00'),
	('6e30b0ea-e5b5-4036-a32e-ed8071d5fb3b', 'Refrigerante, tipo limão', 'Bebidas (alcoólicas e não alcoólicas)', 39.72, 0.00, 10.26, 0.00, NULL, 8.80, '2026-05-02 14:17:58.686292+00'),
	('bd79cfe2-cad0-484d-80d4-0657b50f1a34', 'Omelete, de queijo', 'Ovos e derivados', 268.01, 15.57, 0.44, 22.01, NULL, 216.05, '2026-05-02 14:17:58.686292+00'),
	('9dbf8010-6415-4225-854c-cd403b08553b', 'Ovo, de codorna, inteiro, cru', 'Ovos e derivados', 176.89, 13.69, 0.77, 12.68, NULL, 128.99, '2026-05-02 14:17:58.686292+00'),
	('b077604b-96f3-4020-8a34-de1881ff52cf', 'Ovo, de galinha, clara, cozida/10minutos', 'Ovos e derivados', 59.44, 13.45, 0.00, 0.09, NULL, 180.54, '2026-05-02 14:17:58.686292+00'),
	('d779dd60-6e47-4976-8ecf-59be0f34c2b1', 'Ovo, de galinha, gema, cozida/10minutos', 'Ovos e derivados', 352.67, 15.90, 1.56, 30.78, NULL, 44.91, '2026-05-02 14:17:58.686292+00'),
	('bcf2da8b-3422-4e39-865e-0a44851d9779', 'Ovo, de galinha, inteiro, cozido/10minutos', 'Ovos e derivados', 145.70, 13.29, 0.61, 9.48, NULL, 145.90, '2026-05-02 14:17:58.686292+00'),
	('f06e9009-ce69-4ae4-a364-8e0f435228d3', 'Ovo, de galinha, inteiro, cru', 'Ovos e derivados', 143.11, 13.03, 1.64, 8.90, NULL, 167.91, '2026-05-02 14:17:58.686292+00'),
	('4fdd3cef-25d5-4fc1-aec6-cff58dc7ab59', 'Ovo, de galinha, inteiro, frito', 'Ovos e derivados', 240.19, 15.62, 1.19, 18.59, NULL, 166.11, '2026-05-02 14:17:58.686292+00'),
	('e4e96a67-6776-4597-a27a-adc00488f56e', 'Achocolatado, pó', 'Produtos açucarados', 401.02, 4.20, 91.18, 2.17, 3.89, 64.79, '2026-05-02 14:17:58.686292+00'),
	('fb6ec2da-abb7-47d8-ae09-35cf2d394563', 'Açúcar, cristal', 'Produtos açucarados', 386.85, 0.32, 99.61, NULL, NULL, NULL, '2026-05-02 14:17:58.686292+00'),
	('984aadcf-4f91-462e-9d6e-85721f85bc0c', 'Açúcar, mascavo', 'Produtos açucarados', 368.55, 0.76, 94.45, 0.09, NULL, 25.20, '2026-05-02 14:17:58.686292+00'),
	('77c3621f-8d0a-4b93-a75a-2a56ef026cf6', 'Açúcar, refinado', 'Produtos açucarados', 386.57, 0.32, 99.54, NULL, NULL, 12.16, '2026-05-02 14:17:58.686292+00'),
	('5adb59db-0ed5-4627-b805-12198b1aa4a7', 'Chocolate, ao leite', 'Produtos açucarados', 539.59, 7.22, 59.58, 30.27, 2.17, 77.10, '2026-05-02 14:17:58.686292+00'),
	('f4041ba8-c7b0-4fb0-8269-04ded39e4cb4', 'Chocolate, ao leite, com castanha do Pará', 'Produtos açucarados', 558.88, 7.41, 55.38, 34.19, 2.46, 64.05, '2026-05-02 14:17:58.686292+00'),
	('4ac74752-641b-478b-bafe-a27d790152fb', 'Chocolate, ao leite, dietético', 'Produtos açucarados', 556.82, 6.90, 56.32, 33.77, 2.85, 84.71, '2026-05-02 14:17:58.686292+00'),
	('5b5df0e9-dd88-4ea4-8ea1-af527e9ddd42', 'Chocolate, meio amargo', 'Produtos açucarados', 474.92, 4.86, 62.42, 29.86, 4.94, 8.87, '2026-05-02 14:17:58.686292+00'),
	('0eda74b1-d7d5-4f45-9d13-d2fc5ad94a76', 'Cocada branca', 'Produtos açucarados', 448.85, 1.12, 81.38, 13.59, 3.57, 28.99, '2026-05-02 14:17:58.686292+00'),
	('a01a08f6-0cb0-4ab8-9198-568b3a084282', 'Doce, de abóbora, cremoso', 'Produtos açucarados', 198.94, 0.92, 54.61, 0.21, 2.28, NULL, '2026-05-02 14:17:58.686292+00'),
	('c21386e7-beb7-46db-ba43-e5d9992903f0', 'Doce, de leite, cremoso', 'Produtos açucarados', 306.31, 5.48, 59.49, 5.99, NULL, 120.09, '2026-05-02 14:17:58.686292+00'),
	('5019281d-36be-4b93-b513-066fafb8fdc8', 'Geléia, mocotó, natural', 'Produtos açucarados', 106.09, 2.13, 24.23, 0.07, NULL, 42.68, '2026-05-02 14:17:58.686292+00'),
	('dbe5a289-003c-4ec4-8c92-bb7b54cd4f5d', 'Glicose de milho', 'Produtos açucarados', 292.12, 0.00, 79.38, 0.00, NULL, 58.93, '2026-05-02 14:17:58.686292+00'),
	('23332181-8ce4-4a60-8a2e-cc90e3d71d90', 'Maria mole', 'Produtos açucarados', 301.24, 3.81, 73.55, 0.19, 0.67, 15.31, '2026-05-02 14:17:58.686292+00'),
	('29c75e96-8f83-45b7-8b45-dbb887dbbf2c', 'Maria mole, coco queimado', 'Produtos açucarados', 306.63, 3.93, 75.06, 0.09, 0.64, 14.29, '2026-05-02 14:17:58.686292+00'),
	('6c6bc95f-25e5-42a0-a336-cf49c0cf9098', 'Marmelada', 'Produtos açucarados', 257.24, 0.40, 70.76, 0.14, 4.07, 10.88, '2026-05-02 14:17:58.686292+00'),
	('b9a20262-2a1b-47f8-a1d5-f8e830ead6de', 'Mel, de abelha', 'Produtos açucarados', 309.24, 0.00, 84.03, 0.00, NULL, 6.04, '2026-05-02 14:17:58.686292+00'),
	('6a74ea34-e94a-407f-aae1-70385ddbed81', 'Melado', 'Produtos açucarados', 296.51, 0.00, 76.62, 0.00, NULL, 4.01, '2026-05-02 14:17:58.686292+00'),
	('72f23c65-2aa7-4c5a-a798-8b7a73cf9d40', 'Quindim', 'Produtos açucarados', 411.35, 4.74, 46.30, 24.43, 3.22, 27.37, '2026-05-02 14:17:58.686292+00'),
	('05451efd-f19d-487f-9d3b-68ec8746a108', 'Rapadura', 'Produtos açucarados', 351.96, 0.99, 90.79, 0.07, NULL, 21.71, '2026-05-02 14:17:58.686292+00'),
	('4ddf2bf7-a46c-417b-bb98-19b242188b1a', 'Café, pó, torrado', 'Miscelâneas', 418.62, 14.70, 65.75, 11.95, 51.23, 1.13, '2026-05-02 14:17:58.686292+00'),
	('9f405a2e-4bd7-4f1c-9947-b600c65d9051', 'Capuccino, pó', 'Miscelâneas', 417.41, 11.31, 73.61, 8.63, 2.44, 382.29, '2026-05-02 14:17:58.686292+00'),
	('b14a271c-711c-4b7b-b9dc-9de022a63827', 'Fermento em pó, químico', 'Miscelâneas', 89.72, 0.48, 43.91, 0.07, NULL, 10052.41, '2026-05-02 14:17:58.686292+00'),
	('bdbbd4a2-4968-4066-93cc-50e812dfc9e4', 'Fermento, biológico, levedura, tablete', 'Miscelâneas', 89.79, 16.96, 7.70, 1.52, 4.17, 39.61, '2026-05-02 14:17:58.686292+00'),
	('1151665d-04bf-4e26-bff7-068ecfce1420', 'Gelatina, sabores variados, pó', 'Miscelâneas', 380.22, 8.89, 89.22, NULL, NULL, 234.92, '2026-05-02 14:17:58.686292+00'),
	('4503c8e3-d0f2-4f3d-9f89-d86b0233694d', 'Sal, dietético', 'Miscelâneas', NULL, NULL, NULL, NULL, NULL, 23431.52, '2026-05-02 14:17:58.686292+00'),
	('b48434e8-d818-4a6d-b8bd-2752da0b2827', 'Sal, grosso', 'Miscelâneas', NULL, NULL, NULL, NULL, NULL, 39943.20, '2026-05-02 14:17:58.686292+00'),
	('549dfcd6-09ef-4e0f-ba84-7e01ab60b347', 'Shoyu', 'Miscelâneas', 60.93, 3.31, 11.65, 0.33, NULL, 5024.21, '2026-05-02 14:17:58.686292+00'),
	('cbe97bdb-f3e1-4dba-9268-5eb6ec8481df', 'Tempero a base de sal', 'Miscelâneas', 21.33, 2.67, 2.07, 0.26, 0.56, 32560.00, '2026-05-02 14:17:58.686292+00'),
	('116755a1-aed4-43bb-942b-5c0124eb5a98', 'Azeitona, preta, conserva', 'Outros alimentos industrializados', 194.15, 1.16, 5.54, 20.35, 4.56, 1566.66, '2026-05-02 14:17:58.686292+00'),
	('5a713df3-7a24-40dc-a70f-94433d67faa7', 'Azeitona, verde, conserva', 'Outros alimentos industrializados', 136.94, 0.95, 4.10, 14.22, 3.85, 1347.18, '2026-05-02 14:17:58.686292+00'),
	('2044e2a9-13b9-468d-886c-db6bd3371ab2', 'Chantilly, spray, com gordura vegetal', 'Outros alimentos industrializados', 314.96, 0.53, 16.86, 27.27, NULL, 109.70, '2026-05-02 14:17:58.686292+00'),
	('3389786b-24cb-4bbe-8acf-8dce99236494', 'Leite, de coco', 'Outros alimentos industrializados', 166.16, 1.01, 2.19, 18.36, 0.68, 44.29, '2026-05-02 14:17:58.686292+00'),
	('2df728e2-85cc-4f24-8a19-b0319903fbec', 'Maionese, tradicional com ovos', 'Outros alimentos industrializados', 302.15, 0.58, 7.90, 30.50, NULL, 786.83, '2026-05-02 14:17:58.686292+00'),
	('812cebb6-a1b4-4da3-8edb-4482101ee7c9', 'Acarajé', 'Alimentos preparados', 289.21, 8.35, 19.11, 19.93, 9.36, 304.89, '2026-05-02 14:17:58.686292+00'),
	('39f2a7bb-bb05-482e-ac50-b0ac91bd4297', 'Arroz carreteiro', 'Alimentos preparados', 153.77, 10.83, 11.58, 7.12, 1.50, 1621.73, '2026-05-02 14:17:58.686292+00'),
	('5a953ab9-d616-42ce-a735-372f35f4e036', 'Baião de dois, arroz e feijão-de-corda', 'Alimentos preparados', 135.68, 6.24, 20.42, 3.23, 5.07, 93.30, '2026-05-02 14:17:58.686292+00'),
	('51571b99-bf4b-4077-a96d-4063245cffcf', 'Barreado', 'Alimentos preparados', 164.98, 18.27, 0.24, 9.53, 0.15, 47.63, '2026-05-02 14:17:58.686292+00'),
	('d8a1a397-9b5a-4644-aa9e-1e173934c128', 'Bife à cavalo, com contra filé', 'Alimentos preparados', 291.23, 23.66, 0.00, 21.15, NULL, 82.87, '2026-05-02 14:17:58.686292+00'),
	('9582fad5-55e0-4123-8e18-2551f6f206d8', 'Bolinho de arroz', 'Alimentos preparados', 273.51, 8.04, 41.68, 8.29, 2.74, 58.86, '2026-05-02 14:17:58.686292+00'),
	('908114ce-7e05-4fec-9aaf-f206e0ad2d84', 'Camarão à baiana', 'Alimentos preparados', 100.78, 7.94, 3.17, 5.97, 0.39, 84.79, '2026-05-02 14:17:58.686292+00'),
	('a41cf8e1-6b4f-4e98-8f4b-b0f09a344b25', 'Charuto, de repolho', 'Alimentos preparados', 78.23, 6.78, 10.13, 1.12, 1.46, 12.10, '2026-05-02 14:17:58.686292+00'),
	('c2d35997-380b-41f7-bff4-af2f672759b6', 'Cuscuz, de milho, cozido com sal', 'Alimentos preparados', 113.46, 2.16, 25.28, 0.68, 2.05, 247.67, '2026-05-02 14:17:58.686292+00'),
	('7f3095a8-a783-4293-8586-203e763f6122', 'Cuscuz, paulista', 'Alimentos preparados', 142.12, 2.56, 22.51, 4.65, 2.43, 235.71, '2026-05-02 14:17:58.686292+00'),
	('4dd135af-4200-4c76-acf4-d1d114facbc7', 'Cuxá, molho', 'Alimentos preparados', 80.09, 5.64, 5.74, 3.59, 3.02, 1344.29, '2026-05-02 14:17:58.686292+00'),
	('bef9e8cf-32a3-45b5-8afc-272e8ab3c1aa', 'Dobradinha', 'Alimentos preparados', 124.50, 19.77, 0.00, 4.44, NULL, 28.77, '2026-05-02 14:17:58.686292+00'),
	('4e0f7fd2-8fd9-492a-8900-f56eb0bb8413', 'Estrogonofe de carne', 'Alimentos preparados', 173.14, 15.03, 2.98, 10.80, NULL, 122.85, '2026-05-02 14:17:58.686292+00'),
	('1a5b3c8a-2824-4c22-b945-b284ad13f6c5', 'Estrogonofe de frango', 'Alimentos preparados', 156.81, 17.55, 2.59, 7.96, NULL, 99.46, '2026-05-02 14:17:58.686292+00'),
	('f6c9147c-6d63-405b-89f1-6e3a66d5e1fa', 'Feijão tropeiro mineiro', 'Alimentos preparados', 151.56, 10.17, 19.58, 6.79, 3.57, 365.07, '2026-05-02 14:17:58.686292+00'),
	('2d164ed2-8dbb-4806-a99a-bad6e5dd7c82', 'Feijoada', 'Alimentos preparados', 116.93, 8.67, 11.64, 6.48, 5.09, 278.22, '2026-05-02 14:17:58.686292+00'),
	('495eb31f-c510-4d31-a73d-9283e7054dd7', 'Frango, com açafrão', 'Alimentos preparados', 112.78, 9.70, 4.06, 6.17, 0.22, 28.81, '2026-05-02 14:17:58.686292+00'),
	('8ac13e3c-fa2e-46ed-ac80-870cf2b56f34', 'Macarrão, molho bolognesa', 'Alimentos preparados', 119.53, 4.93, 22.52, 0.89, 0.78, 8.94, '2026-05-02 14:17:58.686292+00'),
	('82ea449d-a441-4b51-ac26-3354552faf15', 'Maniçoba', 'Alimentos preparados', 134.22, 9.96, 3.42, 8.70, 2.16, 406.70, '2026-05-02 14:17:58.686292+00'),
	('a0f213ab-7dcd-4912-b70b-caed97e332ef', 'Quibebe', 'Alimentos preparados', 86.35, 8.56, 6.64, 2.67, 1.67, 246.61, '2026-05-02 14:17:58.686292+00'),
	('b570997e-99d8-4418-a9fa-a01fee68b739', 'Salada, de legumes, com maionese', 'Alimentos preparados', 96.10, 1.05, 8.92, 7.04, 2.22, 228.43, '2026-05-02 14:17:58.686292+00'),
	('b21f5e0a-eff0-4651-8da7-717e57608ddd', 'Salada, de legumes, cozida no vapor', 'Alimentos preparados', 35.41, 2.01, 7.09, 0.31, 2.51, 2.51, '2026-05-02 14:17:58.686292+00'),
	('2c7eb484-cb02-43a4-b184-58c4961ba519', 'Salpicão, de frango', 'Alimentos preparados', 147.86, 13.93, 4.57, 7.84, 0.41, 248.35, '2026-05-02 14:17:58.686292+00'),
	('aa01ded6-ef57-42d9-93af-2830292f7f09', 'Sarapatel', 'Alimentos preparados', 122.98, 18.47, 1.09, 4.42, NULL, 215.62, '2026-05-02 14:17:58.686292+00'),
	('45e53b9d-0809-4450-a5e6-cc506c2d8430', 'Tabule', 'Alimentos preparados', 57.45, 2.05, 10.58, 1.21, 2.08, 1.19, '2026-05-02 14:17:58.686292+00'),
	('bd3d57e4-3370-4e1d-ac4d-2f8d918cae20', 'Tacacá', 'Alimentos preparados', 46.89, 6.96, 3.39, 0.36, 0.21, 1349.06, '2026-05-02 14:17:58.686292+00'),
	('181befcf-eb0f-4e88-82c7-209adac0296c', 'Tapioca, com manteiga', 'Alimentos preparados', 347.83, 0.09, 63.59, 10.91, NULL, 157.52, '2026-05-02 14:17:58.686292+00'),
	('30022561-8479-444c-93c8-a2757709b56e', 'Tucupi, com pimenta-de-cheiro', 'Alimentos preparados', 27.18, 2.06, 4.74, 0.28, 0.23, 5.13, '2026-05-02 14:17:58.686292+00'),
	('5a3d55ac-bbd4-476d-8b93-981ba7a3dc7f', 'Vaca atolada', 'Alimentos preparados', 144.90, 5.12, 10.06, 9.32, 2.34, 25.63, '2026-05-02 14:17:58.686292+00'),
	('682bd517-8993-4be7-aba1-464acf226b0e', 'Vatapá', 'Alimentos preparados', 254.89, 6.00, 9.75, 23.23, 1.70, 879.85, '2026-05-02 14:17:58.686292+00'),
	('8db24a8b-68e1-41b3-9a32-fca0d204ed29', 'Virado à paulista', 'Alimentos preparados', 306.95, 10.18, 14.11, 25.59, 2.16, 345.53, '2026-05-02 14:17:58.686292+00'),
	('372bd76c-8331-472c-a30d-9b4cbec32643', 'Yakisoba', 'Alimentos preparados', 112.80, 7.52, 18.25, 2.61, 1.06, 793.76, '2026-05-02 14:17:58.686292+00'),
	('4cbf561c-aadb-4826-9534-d6ee01d95fb2', 'Amendoim, grão, cru', 'Leguminosas e derivados', 544.05, 27.19, 20.31, 43.85, 8.04, NULL, '2026-05-02 14:17:58.686292+00'),
	('6e320415-4ed9-43a2-8f23-d443f7dc3207', 'Amendoim, torrado, salgado', 'Leguminosas e derivados', 605.78, 22.48, 18.70, 53.96, 7.76, 375.73, '2026-05-02 14:17:58.686292+00'),
	('e94fa430-3575-492b-a2aa-21ab8bfa6c88', 'Ervilha, em vagem', 'Leguminosas e derivados', 88.09, 7.45, 14.23, 0.47, 9.72, NULL, '2026-05-02 14:17:58.686292+00'),
	('84d19b5a-ea5d-4180-96b8-7edadb36d3d7', 'Ervilha, enlatada, drenada', 'Leguminosas e derivados', 73.84, 4.60, 13.44, 0.38, 5.08, 372.11, '2026-05-02 14:17:58.686292+00'),
	('04f0fad6-603f-424a-b271-0722f0abb7f8', 'Feijão, carioca, cozido', 'Leguminosas e derivados', 76.42, 4.78, 13.59, 0.54, 8.51, 1.76, '2026-05-02 14:17:58.686292+00'),
	('39e5d648-2ecb-4e95-9b48-e61ef0614d82', 'Feijão, carioca, cru', 'Leguminosas e derivados', 329.03, 19.98, 61.22, 1.26, 18.42, NULL, '2026-05-02 14:17:58.686292+00'),
	('9ad33199-aede-4eb5-ac04-c61e2868fba5', 'Feijão, fradinho, cozido', 'Leguminosas e derivados', 78.01, 5.09, 13.50, 0.64, 7.47, 0.98, '2026-05-02 14:17:58.686292+00'),
	('76b0f9be-1324-49f4-ab43-577569e0c119', 'Feijão, fradinho, cru', 'Leguminosas e derivados', 339.16, 20.21, 61.24, 2.37, 23.59, 10.31, '2026-05-02 14:17:58.686292+00'),
	('0ba7b5ca-a81b-426e-b012-6ecd20902fa8', 'Feijão, jalo, cozido', 'Leguminosas e derivados', 92.74, 6.14, 16.50, 0.51, 13.87, 0.52, '2026-05-02 14:17:58.686292+00'),
	('8ae2a2ee-a19f-4a5d-8936-6a3a57a1c02e', 'Feijão, jalo, cru', 'Leguminosas e derivados', 327.91, 20.10, 61.48, 0.95, 30.32, 24.58, '2026-05-02 14:17:58.686292+00'),
	('36bcb471-ff03-4fbf-8292-e724070d7ea2', 'Feijão, preto, cozido', 'Leguminosas e derivados', 77.03, 4.48, 14.01, 0.54, 8.40, 1.85, '2026-05-02 14:17:58.686292+00'),
	('8e9aec29-0509-4a0f-9d75-8ff064e54454', 'Feijão, preto, cru', 'Leguminosas e derivados', 323.57, 21.34, 58.75, 1.24, 21.83, NULL, '2026-05-02 14:17:58.686292+00'),
	('717a9131-142d-4f27-99d3-6cb338ea34ad', 'Feijão, rajado, cozido', 'Leguminosas e derivados', 84.70, 5.54, 15.27, 0.40, 9.32, 0.69, '2026-05-02 14:17:58.686292+00'),
	('80c18513-5c5a-4d12-adcb-9499843e8450', 'Feijão, rajado, cru', 'Leguminosas e derivados', 325.84, 17.27, 62.93, 1.17, 24.01, 13.65, '2026-05-02 14:17:58.686292+00'),
	('e45fa6b8-b222-430b-815c-52cc93326004', 'Feijão, rosinha, cozido', 'Leguminosas e derivados', 67.87, 4.54, 11.82, 0.48, 4.76, 2.08, '2026-05-02 14:17:58.686292+00'),
	('8ad91972-92fa-4c41-a0de-e7c2fa70a2b3', 'Feijão, rosinha, cru', 'Leguminosas e derivados', 336.96, 20.92, 62.22, 1.33, 20.63, 24.11, '2026-05-02 14:17:58.686292+00'),
	('ce835ba9-6ca8-47b4-8ef7-bfbaeb78eea0', 'Feijão, roxo, cozido', 'Leguminosas e derivados', 76.89, 5.72, 12.91, 0.54, 11.51, 1.46, '2026-05-02 14:17:58.686292+00'),
	('3e6d4153-731e-4388-bd40-8f775dc3263f', 'Feijão, roxo, cru', 'Leguminosas e derivados', 331.41, 22.17, 59.99, 1.24, 33.84, 9.76, '2026-05-02 14:17:58.686292+00'),
	('06f7c3ec-af76-469a-afa6-b3921ac506f6', 'Grão-de-bico, cru', 'Leguminosas e derivados', 354.70, 21.23, 57.88, 5.43, 12.36, 5.19, '2026-05-02 14:17:58.686292+00'),
	('03d35162-b3dc-4e08-8ddd-9132e12522a5', 'Guandu, cru', 'Leguminosas e derivados', 344.13, 18.96, 64.00, 2.13, 21.31, 1.62, '2026-05-02 14:17:58.686292+00'),
	('47c99490-98d0-4835-817d-1798d0397884', 'Lentilha, cozida', 'Leguminosas e derivados', 92.64, 6.31, 16.30, 0.52, 7.86, 1.18, '2026-05-02 14:17:58.686292+00'),
	('770fe717-4622-41e1-a366-3c02ebc8573e', 'Lentilha, crua', 'Leguminosas e derivados', 339.14, 23.15, 62.00, 0.77, 16.94, NULL, '2026-05-02 14:17:58.686292+00'),
	('3c060ff2-23c7-46e0-b5f4-352e7ec609b7', 'Paçoca, amendoim', 'Leguminosas e derivados', 486.93, 16.00, 52.38, 26.08, 7.32, 166.84, '2026-05-02 14:17:58.686292+00'),
	('bc3e0209-a68d-417c-91e0-4c83058c0b21', 'Pé-de-moleque, amendoim', 'Leguminosas e derivados', 503.19, 13.16, 54.73, 28.05, 3.39, 16.35, '2026-05-02 14:17:58.686292+00'),
	('2d446929-ec41-49c8-9b90-39855decc7bf', 'Soja, farinha', 'Leguminosas e derivados', 403.96, 36.03, 38.44, 14.63, 20.18, 5.75, '2026-05-02 14:17:58.686292+00'),
	('d5d4193b-fd16-428a-a19d-651a431fa8ea', 'Soja, extrato solúvel, natural, fluido', 'Leguminosas e derivados', 39.10, 2.38, 4.28, 1.61, 0.37, 56.53, '2026-05-02 14:17:58.686292+00'),
	('a7e23448-9d80-4fdd-96fc-a87103840006', 'Soja, extrato solúvel, pó', 'Leguminosas e derivados', 458.90, 35.69, 28.48, 26.18, 7.31, 83.47, '2026-05-02 14:17:58.686292+00'),
	('3f9a187b-2484-40af-be91-ff4a1f061ea7', 'Soja, queijo (tofu)', 'Leguminosas e derivados', 64.49, 6.55, 2.13, 3.95, 0.75, 1.21, '2026-05-02 14:17:58.686292+00'),
	('84ab95b8-df4b-4da2-af27-0eecca60d2f7', 'Tremoço, cru', 'Leguminosas e derivados', 381.28, 33.58, 43.79, 10.34, 32.31, 3.29, '2026-05-02 14:17:58.686292+00'),
	('b98142c8-4b72-4923-8f30-874949e7f261', 'Tremoço, em conserva', 'Leguminosas e derivados', 120.64, 11.11, 12.39, 3.78, 14.44, 1808.76, '2026-05-02 14:17:58.686292+00'),
	('76f88d34-7f9f-4e12-86da-9fc575c74bd7', 'Amêndoa, torrada, salgada', 'Nozes e sementes', 580.75, 18.55, 29.55, 47.32, 11.64, 278.52, '2026-05-02 14:17:58.686292+00'),
	('872728e5-2f2a-46a2-bba1-080789f37609', 'Castanha-de-caju, torrada, salgada', 'Nozes e sementes', 570.17, 18.51, 29.13, 46.28, 3.66, 125.00, '2026-05-02 14:17:58.686292+00'),
	('a52f8359-659f-456b-9546-f01625043e42', 'Castanha-do-Brasil, crua', 'Nozes e sementes', 642.96, 14.54, 15.08, 63.46, 7.93, 0.65, '2026-05-02 14:17:58.686292+00'),
	('5809ed27-d198-40e5-bb72-118925ef1653', 'Coco, cru', 'Nozes e sementes', 406.49, 3.69, 10.40, 41.98, 5.38, 15.32, '2026-05-02 14:17:58.686292+00'),
	('7e7a7fe9-7693-4cf9-b40c-a74366640c2f', 'Coco, verde, cru', 'Nozes e sementes', NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-02 14:17:58.686292+00'),
	('b258c215-9c84-4d35-9df6-f9e889fe6534', 'Farinha, de mesocarpo de babaçu, crua', 'Nozes e sementes', 328.77, 1.41, 79.17, 0.20, 17.86, 12.46, '2026-05-02 14:17:58.686292+00'),
	('7719293e-966d-47a2-b096-8224b5e81aea', 'Gergelim, semente', 'Nozes e sementes', 583.55, 21.16, 21.62, 50.43, 11.87, 2.58, '2026-05-02 14:17:58.686292+00'),
	('51c9d5f8-8361-4bc9-9230-f391fe3d803c', 'Linhaça, semente', 'Nozes e sementes', 495.10, 14.08, 43.31, 32.25, 33.50, 8.67, '2026-05-02 14:17:58.686292+00'),
	('69cabb72-84d8-4abe-a25b-1a5d722c7fc2', 'Pinhão, cozido', 'Nozes e sementes', 174.37, 2.98, 43.92, 0.75, 15.60, 0.86, '2026-05-02 14:17:58.686292+00'),
	('29833fef-3b2c-46f1-9cd0-c4048ba1c726', 'Pupunha, cozida', 'Nozes e sementes', 218.53, 2.52, 29.57, 12.76, 4.25, 0.91, '2026-05-02 14:17:58.686292+00'),
	('56d9df78-eb95-4585-87e3-1f975587f922', 'Noz, crua', 'Nozes e sementes', 620.06, 13.97, 18.36, 59.36, 7.25, 4.57, '2026-05-02 14:17:58.686292+00');


--
-- Data for Name: meal_log; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: meal_log_foods; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: meal_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."meal_plans" ("id", "client_id", "trainer_id", "name", "description", "start_date", "end_date", "status", "created_at", "is_active", "notes", "title", "objective", "meals_per_day", "updated_at") VALUES
	('a639bc4c-37a5-4cfd-9896-35253343b53d', 'b27c23ac-2982-45e4-baa8-922d4eee795e', '7357c2e4-4540-462a-99a7-cf38e55538c2', NULL, NULL, NULL, NULL, 'active', '2026-05-06 18:52:21.419727+00', true, NULL, 'Plano Alimentar', NULL, NULL, '2026-05-06 18:52:21.419727+00');


--
-- Data for Name: meal_plan_meals; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."meal_plan_meals" ("id", "meal_plan_id", "meal_type", "name", "description", "target_calories", "created_at", "order_index", "time_suggestion", "updated_at") VALUES
	('ef67a65f-1150-48c6-ae51-f4feb1f55e98', 'a639bc4c-37a5-4cfd-9896-35253343b53d', NULL, 'Refeição 1', NULL, NULL, '2026-05-06 18:52:21.546408+00', 0, NULL, '2026-05-06 18:52:21.546408+00');


--
-- Data for Name: supplements; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."supplements" ("id", "brand", "sku", "name", "serving_size_g", "calories", "protein_g", "carbs_g", "fat_g", "fiber_g", "notes", "created_at") VALUES
	('89607987-be92-4b7d-8235-8b8aa3772262', 'Herbalife', '1445', '24 Hours - CR7 Drive 810g', 27, 100, 0, 26, 0, NULL, 'Suplemento Esportivo - 810g', '2026-05-06 18:02:20.164941+00'),
	('070d2bc7-b135-4a7b-ba0d-11d55f9ceda9', 'Herbalife', '146K', '24 Hours - Glutamina 150g', 5, 0, NULL, 0, 0, NULL, 'Suplemento Esportivo - 150g', '2026-05-06 18:02:20.164941+00'),
	('b1c56eff-9a70-4f66-a465-b01fbeb91f0f', 'Herbalife', '148K', '24 Hours - BCAA 5:1:1 120 tabletes', 6.0, 20, 6.0, 0, 0, NULL, 'Suplemento Esportivo - BCAA na proporção 5:1:1', '2026-05-06 18:02:20.164941+00'),
	('01f66258-d84d-47a4-8fa2-6691660c4d9c', 'Herbalife', '325K', '24 Hours - Creatina Premium 150g', 3.0, 0, 0, 0, 0, NULL, 'Suplemento Esportivo - 150g', '2026-05-06 18:02:20.164941+00'),
	('ebdd92a0-17a9-4eb6-8720-e2d8f135655b', 'Herbalife', '1417', '24 Hours - Tri-Core Protein Blend Chocolate 1010g', 30.0, 120, 25.0, 3.0, 1.0, 1.0, 'Proteína - Sabor Chocolate - 1010g', '2026-05-06 18:02:20.164941+00'),
	('a24be260-1dac-4d09-8bce-6299925c0617', 'Herbalife', '147K', '24 Hours - Whey Protein 3W 510g', 34, 128, 25, 3.3, 1.6, NULL, 'Proteína - 510g - Whey Isolado, Whey Concentrado, Whey Hidrolisado', '2026-05-06 18:02:20.164941+00'),
	('a71c8b2b-0b73-4245-8721-b6f14d69df2a', 'Herbalife', '191K', '24 Hours - Whey Protein 3W Baunilha 510g', 25.0, 100, 20.0, 2.0, 1.0, NULL, 'Proteína - Sabor Baunilha - 510g', '2026-05-06 18:02:20.164941+00'),
	('a2ac20e8-5bca-4cd0-a16e-a36673fa9591', 'Herbalife', 'H276', 'Acesso Virtual de Início ao programa Cliente Premium', 1.0, NULL, NULL, NULL, NULL, NULL, 'Acesso Virtual', '2026-05-06 18:02:20.164941+00'),
	('98eacd84-4f38-45d8-b87c-a2d105dd0eb6', 'Herbalife', '0031', 'Barra de Proteína Citrus Lemon (7 unidades)', 25.0, 140, 10.0, 15.0, 5.0, 3.0, 'Proteína - Sabor Citrus Lemon - 7 unidades', '2026-05-06 18:02:20.164941+00'),
	('10ef552a-7de2-4030-a9b9-a3010d63c4cd', 'Herbalife', '214K', 'Barra de Proteína Vanilla Almond (7 unidades)', 25.0, 140, 10.0, 15.0, 5.0, 3.0, 'Proteína - Sabor Vanilla Almond - 7 unidades', '2026-05-06 18:02:20.164941+00'),
	('51854919-7606-48db-948b-c861b9e849ce', 'Herbalife', '1923', 'Beauty Booster Frutas Vermelhas 240g', 8.0, NULL, NULL, NULL, NULL, NULL, 'Vitaminas - Sabor Frutas Vermelhas - 240g', '2026-05-06 18:02:20.164941+00'),
	('7ce1feed-43e0-4a28-96c8-bc50edeb3a7f', 'Herbalife', '498K', 'Fiber Concentrate Manga 450ml', 15.0, NULL, NULL, NULL, NULL, NULL, 'Fibra - Sabor Manga - 450ml', '2026-05-06 18:02:20.164941+00'),
	('a121031e-f343-43c2-8925-1c9ecf3803bd', 'Herbalife', '496K', 'Fiber Concentrate Uva 450ml', 15.0, NULL, NULL, NULL, NULL, NULL, 'Fibra - Sabor Uva - 450ml', '2026-05-06 18:02:20.164941+00'),
	('3a061a07-129c-4a28-8f20-5fad08e3ec75', 'Herbalife', '0927', 'Fiber Powder 275g', 10.0, 25, 0, 6.0, 0, 5.0, 'Fibra - 275g', '2026-05-06 18:02:20.164941+00'),
	('be476d48-bf19-4381-bdba-c3a1ecd8f346', 'Herbalife', '061K', 'Herbal Concentrate Canela 102g', 1.8, 6, 0, 1.0, 0, NULL, 'Termogênico - Sabor Canela - 102g', '2026-05-06 18:02:20.164941+00'),
	('1d04a9e6-23d0-4d36-8316-52101a27fb4a', 'Herbalife', '062K', 'Herbal Concentrate Laranja e Especiarias 102g', 1.8, 6, 0, 1.0, 0, NULL, 'Termogênico - Sabor Laranja e Especiarias - 102g', '2026-05-06 18:02:20.164941+00'),
	('5a7770ca-d392-4ccd-9a2b-34773faf65b9', 'Herbalife', '063K', 'Herbal Concentrate Limão 51g', 1.8, 6, 0, 1.0, 0, NULL, 'Termogênico - Sabor Limão - 51g', '2026-05-06 18:02:20.164941+00'),
	('d0295773-4f2e-4ed0-b3fa-2415adcdfbd2', 'Herbalife', '059K', 'Herbal Concentrate Original 102g', 1.8, 6, 0, 1.0, 0, NULL, 'Termogênico - 102g', '2026-05-06 18:02:20.164941+00'),
	('1f6db705-e557-4242-a435-80551f140dcd', 'Herbalife', '004K', 'Herbal Concentrate Original 357g', 1.8, 6, 0, 1.0, 0, NULL, 'Termogênico - 357g', '2026-05-06 18:02:20.164941+00'),
	('fd7f3ad0-162d-4108-8ae0-912ab6973e95', 'Herbalife', '060K', 'Herbal Concentrate Original 51g', 1.8, 6, 0, 1.0, 0, NULL, 'Termogênico - 51g', '2026-05-06 18:03:05.262689+00'),
	('46b5e760-994d-41b0-96fe-bfd48d8c9436', 'Herbalife', '0065', 'Herbalifeline 90 cápsulas', 2.0, NULL, NULL, NULL, NULL, NULL, 'Vitaminas - 90 cápsulas', '2026-05-06 18:03:05.262689+00'),
	('7346948b-98a3-44f5-a5c9-eb735189713f', 'Herbalife', 'H386', 'Kit Início Herbalife', 1.0, NULL, NULL, NULL, NULL, NULL, 'Kit', '2026-05-06 18:03:05.262689+00'),
	('132d18cf-6b35-4253-9edf-f3ef37503b05', 'Herbalife', 'H393', 'Kit Início Herbalife (conversão)', 1.0, NULL, NULL, NULL, NULL, NULL, 'Kit', '2026-05-06 18:03:05.262689+00'),
	('38998e56-e0fa-437d-86e1-c0a8b1c491b9', 'Herbalife', 'H387', 'Kit Início Herbalife (online)', 1.0, NULL, NULL, NULL, NULL, NULL, 'Kit', '2026-05-06 18:03:05.262689+00'),
	('dde98562-c802-4eac-8ce1-d2d72bf74354', 'Herbalife', '190K', 'Liftoff Amora Intenso (15 sachês)', 2.5, 10, 0, 2.0, 0, NULL, 'Termogênico - Sabor Amora Intenso - 15 sachês', '2026-05-06 18:03:05.262689+00'),
	('0a277f2b-5ee4-4540-b98e-49dca5d8ec25', 'Herbalife', '317K', 'Liftoff Limão Siciliano (15 sachês)', 2.5, 10, 0, 2.0, 0, NULL, 'Termogênico - Sabor Limão Siciliano - 15 sachês', '2026-05-06 18:03:05.262689+00'),
	('27367881-448f-4ffe-ae7f-70c0e08c6eff', 'Herbalife', '3122', 'Multivitaminas e Minerais 90 tabletes', 1.0, NULL, NULL, NULL, NULL, NULL, 'Vitaminas - 90 tabletes', '2026-05-06 18:03:05.262689+00'),
	('6cb2fbf2-2dce-4f24-a9da-5e11289d0a50', 'Herbalife', '056K', 'NRG Guaraná Tropical 100g', 2.0, 8, 0, 2.0, 0, NULL, 'Termogênico - Sabor Guaraná Tropical - 100g', '2026-05-06 18:03:05.262689+00'),
	('bbbc3da7-bca1-48c0-8b78-59d341a8e568', 'Herbalife', '003K', 'NRG Guaraná Tropical 330g', 2.0, 8, 0, 2.0, 0, NULL, 'Termogênico - Sabor Guaraná Tropical - 330g', '2026-05-06 18:03:05.262689+00'),
	('d502e3a8-7174-4cce-b3bf-83d792d66e92', 'Herbalife', '057K', 'NRG Original 100g', 2.0, 8, 0, 2.0, 0, NULL, 'Termogênico - 100g', '2026-05-06 18:03:05.262689+00'),
	('721eee3b-5818-4344-bd7a-929cfecef2aa', 'Herbalife', '058K', 'NRG Original 60g', 2.0, 8, 0, 2.0, 0, NULL, 'Termogênico - 60g', '2026-05-06 18:03:05.262689+00'),
	('776ed93b-5117-4590-8e1c-ef5bc649c5c5', 'Herbalife', '306B', 'NutreV 672g (10 pacotes)', 25.0, NULL, NULL, NULL, NULL, NULL, 'Refeição - 10 pacotes', '2026-05-06 18:03:05.262689+00'),
	('a8ef9831-d74d-4de6-92f8-916f33bd1b50', 'Herbalife', '0931', 'Nutri Soup Creme Verde 416g', 20.0, NULL, NULL, NULL, NULL, NULL, 'Refeição - Sabor Creme Verde - 416g', '2026-05-06 18:03:05.262689+00'),
	('b62faeca-7c35-4c72-bd5b-b5fb52c72031', 'Herbalife', '395K', 'Nutri Soup Frango com Legumes 416g', 20.0, NULL, NULL, NULL, NULL, NULL, 'Refeição - Sabor Frango com Legumes - 416g', '2026-05-06 18:03:05.262689+00'),
	('4163d571-3960-453e-af0c-52ceb1617fb3', 'Herbalife', '040K', 'Protein Crunch 150g', 25.0, 120, 12.0, 8.0, 4.0, 2.0, 'Proteína - 150g', '2026-05-06 18:03:05.262689+00'),
	('3871685c-350d-4110-9a6f-bd5dac30d2ac', 'Herbalife', '535K', 'Protein Ice Cream (Gelato Proteico) Baunilha', 60.0, NULL, NULL, NULL, NULL, NULL, 'Suplemento Esportivo - Sabor Baunilha', '2026-05-06 18:03:05.262689+00'),
	('f465a8ad-5942-4639-b2fe-416e87ea127b', 'Herbalife', '534K', 'Protein Ice Cream (Gelato Proteico) Chocolate', 60.0, NULL, NULL, NULL, NULL, NULL, 'Suplemento Esportivo - Sabor Chocolate', '2026-05-06 18:03:48.857081+00'),
	('f3dcdf5e-13e8-44c0-806e-6e4cca9738e4', 'Herbalife', '0242', 'Protein Powder 240g', 6.0, 20, 5.0, 0, 0, NULL, 'Proteína - 240g', '2026-05-06 18:03:48.857081+00'),
	('7fa89e48-abbd-47b7-9e01-d61c4deb867b', 'Herbalife', '0246', 'Protein Powder 480g', 6.0, 20, 5.0, 0, 0, NULL, 'Proteína - 480g', '2026-05-06 18:03:48.857081+00'),
	('2adbd72e-2d57-46f1-a259-afedb6cef727', 'Herbalife', '326K', 'Shake Banana Caramelizada 550g', 26.0, 210, 9.0, 23.0, 4.7, 3.0, 'Shake - Sabor Banana Caramelizada - 550g', '2026-05-06 18:03:48.857081+00'),
	('49172630-960f-4e83-8b32-b367bb206f77', 'Herbalife', '2129', 'Shake Baunilha Cremoso 2080g', 26.0, 210, 9.0, 23.0, 4.7, 3.0, 'Shake - Sabor Baunilha Cremoso - 2080g', '2026-05-06 18:03:48.857081+00'),
	('78d5b197-b647-4349-931b-040399fed27b', 'Herbalife', '0951', 'Shake Baunilha Cremoso 550g', 26.0, 210, 9.0, 23.0, 4.7, 3.0, 'Shake - Sabor Baunilha Cremoso - 550g', '2026-05-06 18:03:48.857081+00'),
	('e49a6fa1-8ce6-46ea-8e51-078d8b755138', 'Herbalife', '023K', 'Shake Café Cremoso 550g', 26.0, 210, 9.0, 23.0, 4.7, 3.0, 'Shake - Sabor Café Cremoso - 550g', '2026-05-06 18:03:48.857081+00'),
	('1dd1c817-5677-4a27-aee9-bf02eafb9276', 'Herbalife', '387K', 'Shake Chocolate Sensation 1976g', 26.0, 210, 9.0, 23.0, 4.7, 3.0, 'Shake - Sabor Chocolate Sensation - 1976g', '2026-05-06 18:03:48.857081+00'),
	('dca75d4f-ebc0-4f29-ab4d-af18f65303fe', 'Herbalife', '3144', 'Shake Chocolate Sensation 550g', 26.0, 210, 9.0, 23.0, 4.7, 3.0, 'Shake - Sabor Chocolate Sensation - 550g', '2026-05-06 18:03:48.857081+00'),
	('b1b0d2fe-cc3f-4284-9978-6737f496b842', 'Herbalife', '0930', 'Shake Coco 550g', 26.0, 210, 9.0, 23.0, 4.7, 3.0, 'Shake - Sabor Coco - 550g', '2026-05-06 18:03:48.857081+00'),
	('1a5dbd0c-72af-48f6-9f50-2883dd164b8b', 'Herbalife', '295K', 'Shake Cookies & Cream 550g', 26.0, 210, 9.0, 23.0, 4.7, 3.0, 'Shake - Sabor Cookies & Cream - 550g', '2026-05-06 18:03:48.857081+00'),
	('2f7f1801-0bfa-4c69-903d-4170ee915dce', 'Herbalife', '2122', 'Shake Doce de Leite 2080g', 26.0, 210, 9.0, 23.0, 4.7, 3.0, 'Shake - Sabor Doce de Leite - 2080g', '2026-05-06 18:03:48.857081+00'),
	('6ce75443-e183-408c-a480-a9f1741b3167', 'Herbalife', '0940', 'Shake Doce de Leite 550g', 26.0, 210, 9.0, 23.0, 4.7, 3.0, 'Shake - Sabor Doce de Leite - 550g', '2026-05-06 18:03:48.857081+00'),
	('79f5e456-5fe1-4a39-9608-7c97e7564848', 'Herbalife', '249K', 'Shake Frapê de Abacaxi 550g', 26.0, 210, 9.0, 23.0, 4.7, 3.0, 'Shake - Sabor Frapê de Abacaxi - 550g', '2026-05-06 18:03:48.857081+00'),
	('7fc3173e-5009-42fd-a90c-b49a4b1130c0', 'Herbalife', '1446', 'Shake Morango Cremoso 2080g', 26.0, 210, 9.0, 23.0, 4.7, 3.0, 'Shake - Sabor Morango Cremoso - 2080g', '2026-05-06 18:03:48.857081+00'),
	('98087780-d555-42b1-b67c-b19a0ffb7582', 'Herbalife', '0953', 'Shake Morango Cremoso 550g', 26.0, 210, 9.0, 23.0, 4.7, 3.0, 'Shake - Sabor Morango Cremoso - 550g', '2026-05-06 18:03:48.857081+00'),
	('cca80650-cd5d-47e5-9738-97db14fc706e', 'Herbalife', '447K', 'Shake Pistache 550g', 26.0, 210, 9.0, 23.0, 4.7, 3.0, 'Shake - Sabor Pistache - 550g', '2026-05-06 18:03:48.857081+00'),
	('e0f73d69-1e50-420c-b8d0-c668f82cfdc8', 'Herbalife', '371K', 'Liftoff Abacaxi (15 sachês)', 5, 15, 0, 4, 0, NULL, 'Termogênico - Sabor Abacaxi - 15 sachês - Rico em Vitamina C , Vitaminas complexo B , Potássio, Taurina e Cafeína', '2026-05-06 18:03:05.262689+00'),
	('e3c4c610-8793-45e4-b5da-6b38f1227e5d', 'Herbalife', '223K', 'OnActive Drink Chocolate 264g', 24, 82, NULL, 6.5, 2.2, 2.5, 'Refeição - Sabor Chocolate - 264g Rico em Vitaminas e Minerais', '2026-05-06 18:03:05.262689+00'),
	('229ef441-b75f-41a7-ba03-4e4e198c36d0', 'Herbalife', '1639', 'NutreV 672g', 25, NULL, NULL, NULL, NULL, NULL, 'Refeição - 672g', '2026-05-06 18:03:05.262689+00'),
	('456ff2ef-a589-42eb-97f7-253d1e2a958e', 'Herbalife', '0948', 'Shake Sachê Baunilha Cremoso (7 unidades)', 26.0, 210, 9.0, 23.0, 4.7, 3.0, 'Shake - Sabor Baunilha Cremoso - 7 unidades', '2026-05-06 18:03:48.857081+00'),
	('0b195a81-03cb-4236-b28c-921bf1a8ecd5', 'Herbalife', '439K', 'Shake Torta de Limão 550g', 26.0, 210, 9.0, 23.0, 4.7, 3.0, 'Shake - Sabor Torta de Limão - 550g', '2026-05-06 18:03:48.857081+00'),
	('ad5c1560-3688-4a2e-a412-809da8441e99', 'Herbalife', '318K', 'Shape Control 30 cápsulas', 2.0, NULL, NULL, NULL, NULL, NULL, 'Controle de Peso - 30 cápsulas', '2026-05-06 18:03:48.857081+00'),
	('eccaaa7a-ed20-4a21-9dbf-ed53572d00b3', 'Herbalife', '0766', 'Skin - Cleanser Facial Cítrico 150ml', 5.0, NULL, NULL, NULL, NULL, NULL, 'Cuidados com a Pele - Sabor Cítrico - 150ml', '2026-05-06 18:04:22.146664+00'),
	('9d321b8b-399b-4fbd-a0a9-621952cd818b', 'Herbalife', '0770', 'Skin - Gel Firmador para os Olhos 15ml', 1.0, NULL, NULL, NULL, NULL, NULL, 'Cuidados com a Pele - 15ml', '2026-05-06 18:04:22.146664+00'),
	('8bd894ce-0cf1-465e-946c-5e921635e7a3', 'Herbalife', '0773', 'Skin - Máscara Purificante de Argila 120ml', 10.0, NULL, NULL, NULL, NULL, NULL, 'Cuidados com a Pele - 120ml', '2026-05-06 18:04:22.146664+00'),
	('deb1d0cb-527f-46f4-9d4d-86015c377064', 'Herbalife', '0768', 'Skin - Sérum Facial Redutor de Linhas 30ml', 2.0, NULL, NULL, NULL, NULL, NULL, 'Cuidados com a Pele - 30ml', '2026-05-06 18:04:22.146664+00'),
	('9b79d49a-64a2-45b4-a892-a5d03ad6475f', 'Herbalife', '0431', 'Soft Green - Creme Hidratante para o Corpo Chá Verde 200g', 10.0, NULL, NULL, NULL, NULL, NULL, 'Higiene Pessoal - Sabor Chá Verde - 200g', '2026-05-06 18:04:22.146664+00'),
	('13ec9600-0bc0-4da1-ad35-093b61f43247', 'Herbalife', '0563', 'Soft Green - Desodorante Antitranspirante Roll-On Chá Verde 50ml', 1.0, NULL, NULL, NULL, NULL, NULL, 'Higiene Pessoal - Sabor Chá Verde - 50ml', '2026-05-06 18:04:22.146664+00'),
	('a17efd64-c4b6-4b0a-9670-def903d9680a', 'Herbalife', '0411', 'Soft Green - Sabonete em Barra Chá Verde 90g', 5.0, NULL, NULL, NULL, NULL, NULL, 'Higiene Pessoal - Sabor Chá Verde - 90g', '2026-05-06 18:04:22.146664+00'),
	('04f7270c-f53e-474f-871a-6125c4f7f214', 'Herbalife', '0408', 'Soft Green - Sabonete Líquido para as mãos Chá Verde 250ml', 2.0, NULL, NULL, NULL, NULL, NULL, 'Higiene Pessoal - Sabor Chá Verde - 250ml', '2026-05-06 18:04:22.146664+00'),
	('f23d78e6-a148-4e74-a29c-8c33d34bd0ac', 'Herbalife', '445K', 'Sopa Snack Proteica Creme de Cebola (7 sachês)', 15.0, NULL, NULL, NULL, NULL, NULL, 'Refeição - Sabor Creme de Cebola - 7 sachês', '2026-05-06 18:04:22.146664+00'),
	('0f47dc87-b1b8-429f-b3ac-699f9e7fcb3b', 'Herbalife', '448K', 'Sopa Snack Proteica Frango com Legumes (7 sachês)', 15.0, NULL, NULL, NULL, NULL, NULL, 'Refeição - Sabor Frango com Legumes - 7 sachês', '2026-05-06 18:04:22.146664+00'),
	('cc061ca1-3ac4-4211-9aa5-f2909d973abe', 'Herbalife', '0020', 'Xtra-Cal 60 tabletes', 2.0, NULL, NULL, NULL, NULL, NULL, 'Vitaminas - 60 tabletes', '2026-05-06 18:04:22.146664+00'),
	('5fdf402c-69bf-49f8-8815-df4fd49a2c44', 'Herbalife', '497K', 'Fiber Concentrate Immune Limão e Mel 450ml', 30, 23, NULL, 3.3, 0, 6.3, 'Fibra - Sabor Limão e Mel - 450ml - Rico em vitamina C, Selênio e Zinco', '2026-05-06 18:02:20.164941+00');


--
-- Data for Name: meal_plan_foods; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."meal_plan_foods" ("id", "meal_id", "food_id", "quantity_g", "created_at", "supplement_id", "name", "quantity", "calories", "protein", "carbs", "fat", "order_index", "updated_at") VALUES
	('192269de-df6f-4999-915b-f5d87599394e', 'ef67a65f-1150-48c6-ae51-f4feb1f55e98', NULL, NULL, '2026-05-06 18:52:21.646507+00', '6ce75443-e183-408c-a480-a9f1741b3167', 'Shake Doce de Leite 550g', '100g', 210, 9, 23, 4.7, 0, '2026-05-06 18:52:21.646507+00');


--
-- Data for Name: mobility_tests; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."mobility_tests" ("id", "conditioning_test_id", "test_name", "notes") VALUES
	('b77aaa53-b6c6-47a6-9052-97ae93bc7229', '3e3b47ea-b123-4f0e-8185-6671cd6157f9', 'Agachamento ', 'Abaixo da cintura '),
	('dbf0eb70-101c-4ce4-a32d-24c40f958974', '3e3b47ea-b123-4f0e-8185-6671cd6157f9', 'Rack Front ', 'Cotovelo baixo'),
	('f6d28dab-7e65-468d-ab92-d19b22dcf529', '3e3b47ea-b123-4f0e-8185-6671cd6157f9', 'Shoulder Press ', 'Desalinhado do trapézio '),
	('2eac71f8-1a8d-41e4-9ad0-ef8fc16974b8', '7fab6de1-3356-40a8-83ee-abf748de4c21', 'Front Rack ', 'Barra Sem Tq Ombro '),
	('a3b689b4-812d-4190-b14d-995d0638d3ff', '7fab6de1-3356-40a8-83ee-abf748de4c21', 'Shoulder Press', 'Desalinhado'),
	('5998795c-82db-486d-9a6b-3a2fe6dbcd04', '7fab6de1-3356-40a8-83ee-abf748de4c21', 'Agachamentos ', 'Acima do Joelho'),
	('3ddb3179-8c2d-468d-b8dc-8d4c8f8e7fbb', '62fb11dd-9fbb-41c1-b43a-ec93949ebf36', 'Front Rack ', 'Ok'),
	('1dff7b07-ad2b-44ba-a850-e5569e2c64dc', '62fb11dd-9fbb-41c1-b43a-ec93949ebf36', 'Shoulder Press ', 'Ok'),
	('ba2f503d-1826-406d-a991-34b3cc02bc70', '62fb11dd-9fbb-41c1-b43a-ec93949ebf36', 'Agachamento ', 'Altura do joelho');


--
-- Data for Name: plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."plans" ("id", "trainer_id", "name", "price_cents", "max_clients", "features", "created_at", "price_monthly") VALUES
	('9d8a50e0-007a-4e5f-ab1c-3641629204a7', '7357c2e4-4540-462a-99a7-cf38e55538c2', 'Teste', 0, 50, '[]', '2026-04-29 19:01:07.787767+00', 0.00),
	('bbd394d2-34d6-44b5-a131-1efd5c02af46', '7357c2e4-4540-462a-99a7-cf38e55538c2', 'Iniciando', 2990, 99, '[]', '2026-04-29 19:01:07.787767+00', 29.90),
	('9958fea0-d6d7-4c2f-acf0-aee92a6bbfb4', '7357c2e4-4540-462a-99a7-cf38e55538c2', 'Escalando', 3990, 299, '[]', '2026-04-29 19:01:07.787767+00', 39.90),
	('aef822a6-1bec-4f75-bcb7-94b4adab340f', '7357c2e4-4540-462a-99a7-cf38e55538c2', 'Livre', 5990, 99999, '[]', '2026-04-29 19:01:07.787767+00', 59.90);


--
-- Data for Name: strength_tests; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."strength_tests" ("id", "conditioning_test_id", "exercise_name", "load_kg", "repetitions") VALUES
	('ac3e67b6-6980-4085-a0bd-59b35bcc9ad3', '3e3b47ea-b123-4f0e-8185-6671cd6157f9', 'Biceps', 16, '10'),
	('502d1a3a-3b02-4509-b74c-e9239a81da6f', '3e3b47ea-b123-4f0e-8185-6671cd6157f9', 'Supino ', 20, '15'),
	('e9ce88fb-e296-4207-9dfe-1d0a0d0011f5', '3e3b47ea-b123-4f0e-8185-6671cd6157f9', 'Flexões ', NULL, '15'),
	('fe9920fd-239e-4bee-91b9-d1faa50a44d7', '7fab6de1-3356-40a8-83ee-abf748de4c21', 'Biceps', 16, '25'),
	('4207a1f8-910a-467d-a18c-17fb0ee2b8e6', '7fab6de1-3356-40a8-83ee-abf748de4c21', 'Flexão ', NULL, '21'),
	('fcdffc0f-3812-44e4-91e8-edcf152d2c4c', '7fab6de1-3356-40a8-83ee-abf748de4c21', 'Back Squat ', 20, '20'),
	('7c12a033-0c0c-4d26-9dd4-54148f22f2ad', '7fab6de1-3356-40a8-83ee-abf748de4c21', 'Supino', 24, '25'),
	('8ca8f7c5-2131-4007-a7d4-574945336106', '7fab6de1-3356-40a8-83ee-abf748de4c21', '', NULL, NULL),
	('ecdbe503-b138-4bcd-aec4-8f7c98a021ab', 'bfae0055-0fc1-4d18-93fa-623158259a85', 'Biceps', 12, '13'),
	('154b114c-3480-4e0c-a53e-781712d297bb', 'bfae0055-0fc1-4d18-93fa-623158259a85', 'Back Squat', 20, '42'),
	('2c40d9be-0268-48ac-8bc2-c7f170a7023b', 'bfae0055-0fc1-4d18-93fa-623158259a85', 'Supino', 16, '15'),
	('503ed312-873d-4e3f-95e6-93104e806d4d', 'bfae0055-0fc1-4d18-93fa-623158259a85', 'Flexão ', NULL, '19'),
	('9f190610-fad9-486c-912c-1935d832f968', '62fb11dd-9fbb-41c1-b43a-ec93949ebf36', 'Biceps', 12, '9'),
	('6d5f6bac-fc9d-458f-9d62-2a8c819f401f', '62fb11dd-9fbb-41c1-b43a-ec93949ebf36', 'Back Squat ', 16, '22'),
	('62bcbbb8-848f-42e1-9ce9-1bec94a8c6ea', '62fb11dd-9fbb-41c1-b43a-ec93949ebf36', 'Flexão Joelho ', NULL, '12'),
	('3869946a-35a0-4626-a063-1c05e4fec223', '62fb11dd-9fbb-41c1-b43a-ec93949ebf36', 'Barra pendurada ', NULL, '20"'),
	('7e218464-5f6d-49b2-943e-947a09df206a', '62fb11dd-9fbb-41c1-b43a-ec93949ebf36', 'Supino', 16, '15');


--
-- Data for Name: supported_scales; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."supported_scales" ("id", "brand", "model", "ble_name", "protocol", "metrics", "connection_type", "is_active", "created_at") VALUES
	('5c04b6aa-b519-4b0a-b24d-d73e8e738c96', 'Xiaomi', 'Mi Body Composition Scale 2', 'MIBCS', 'xiaomi_v2', '["weight", "fat_percent", "muscle_mass", "water_percent", "bone_mass", "bmr", "visceral_fat", "bmi", "metabolic_age"]', 'ble_web', true, '2026-04-28 13:51:04.78547+00'),
	('cb8d5184-af09-4ba8-96ec-b715d97937a3', 'Original Line', 'Chipsea/OKOK', 'Chipsea-BLE', 'chipsea_okok', '["weight", "fat_percent", "muscle_mass", "water_percent", "bone_mass", "bmr", "visceral_fat", "bmi"]', 'ble_web', true, '2026-04-28 13:51:04.78547+00'),
	('688c83a1-01a9-4954-bea2-1ba5eff6918c', 'Techline', 'TEC-BF01 (Fitdays)', '', 'fitdays', '["weight", "fat_percent", "muscle_mass", "water_percent", "bone_mass", "bmr", "visceral_fat", "bmi", "metabolic_age"]', 'ble_web', true, '2026-04-28 13:51:04.78547+00'),
	('ae577205-483c-428a-9678-acdfdf9fa93a', 'Manual', 'Entrada Manual', '', 'manual', '[]', 'manual', true, '2026-04-28 13:51:04.78547+00');


--
-- Data for Name: trainer_scales; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."trainer_scales" ("id", "trainer_id", "supported_scale_id", "nickname", "is_active", "created_at") VALUES
	('beb8528f-6317-4425-b351-b173c969c62d', 'a5816c68-bf56-40ac-9382-2bdefd30ca77', 'cb8d5184-af09-4ba8-96ec-b715d97937a3', 'Bioimpedanciometria', true, '2026-05-01 03:18:29.190307+00'),
	('dda41649-0332-44e7-b565-8b70615efff6', '7357c2e4-4540-462a-99a7-cf38e55538c2', 'cb8d5184-af09-4ba8-96ec-b715d97937a3', 'Teste', true, '2026-05-02 20:48:09.317903+00'),
	('a6e7cafb-8e52-4ba2-9dd1-b718aad9cc99', '7357c2e4-4540-462a-99a7-cf38e55538c2', '688c83a1-01a9-4954-bea2-1ba5eff6918c', 'Balança 3', true, '2026-05-02 23:40:59.517908+00');


--
-- Data for Name: trainer_subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."trainer_subscriptions" ("id", "trainer_id", "plan_id", "status", "started_at", "expires_at", "stripe_subscription_id", "created_at", "is_active", "start_date") VALUES
	('ed2f870f-f7bf-463c-af7c-173fed217d62', '7357c2e4-4540-462a-99a7-cf38e55538c2', '9d8a50e0-007a-4e5f-ab1c-3641629204a7', 'active', '2026-04-29 19:01:07.787767+00', NULL, NULL, '2026-04-29 19:01:07.787767+00', false, '2026-04-29');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('assessment-photos', 'assessment-photos', NULL, '2026-05-07 14:21:28.703365+00', '2026-05-07 14:21:28.703365+00', false, false, 5242880, '{image/jpeg,image/png,image/webp}', NULL, 'STANDARD');


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata") VALUES
	('47a526d4-d6b9-443b-89cc-14c77213715b', 'assessment-photos', '7357c2e4-4540-462a-99a7-cf38e55538c2/587e3eef-1cea-4921-818e-ed3e1dc07c57/1fd947f8-8377-4baa-84d8-9abef7824880/1778171716298_zk2wbu.jpg', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', '2026-05-07 16:35:17.002164+00', '2026-05-07 16:35:17.002164+00', '2026-05-07 16:35:17.002164+00', '{"eTag": "\"22093d55c4619751b496fdc71850052f\"", "size": 127446, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-07T16:35:17.000Z", "contentLength": 127446, "httpStatusCode": 200}', 'c9e2d991-6b34-4e01-88d3-11af0da18819', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', '{}'),
	('87a3ed26-f550-4ab9-8079-6d11fc29db3b', 'assessment-photos', '7357c2e4-4540-462a-99a7-cf38e55538c2/587e3eef-1cea-4921-818e-ed3e1dc07c57/1fd947f8-8377-4baa-84d8-9abef7824880/1778171716942_sddus6.jpg', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', '2026-05-07 16:35:17.475534+00', '2026-05-07 16:35:17.475534+00', '2026-05-07 16:35:17.475534+00', '{"eTag": "\"20b7a45787db247882ad54420a444f1d\"", "size": 130644, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-07T16:35:18.000Z", "contentLength": 130644, "httpStatusCode": 200}', 'a6ed769f-0f99-4b9b-acc8-e8ffc8ff3b22', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', '{}'),
	('5403290a-0a51-48d8-8b66-dcd1dbd2dd57', 'assessment-photos', '7357c2e4-4540-462a-99a7-cf38e55538c2/587e3eef-1cea-4921-818e-ed3e1dc07c57/cdd8eaac-df81-4bfd-ae2d-937c86c80c88/1778171928772_5w0lwn.jpg', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', '2026-05-07 16:38:49.508603+00', '2026-05-07 16:38:49.508603+00', '2026-05-07 16:38:49.508603+00', '{"eTag": "\"ed8bf145712f831e4d21d64521be3ae0\"", "size": 229820, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-07T16:38:50.000Z", "contentLength": 229820, "httpStatusCode": 200}', 'f17d9853-7074-42a8-8d49-7aaff8d540eb', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', '{}'),
	('ad052a59-eed1-4de9-ab1a-1c1716459c84', 'assessment-photos', '7357c2e4-4540-462a-99a7-cf38e55538c2/587e3eef-1cea-4921-818e-ed3e1dc07c57/cdd8eaac-df81-4bfd-ae2d-937c86c80c88/1778171929395_suhvgh.jpg', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', '2026-05-07 16:38:49.907284+00', '2026-05-07 16:38:49.907284+00', '2026-05-07 16:38:49.907284+00', '{"eTag": "\"f66a9ffa569039e6ed5ab5a79ea357c3\"", "size": 145779, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-07T16:38:50.000Z", "contentLength": 145779, "httpStatusCode": 200}', '1dd6456e-f5fb-41b4-b882-fcde8b61ad0e', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', '{}'),
	('d496667c-3d00-4157-ba54-34a577c72120', 'assessment-photos', '7357c2e4-4540-462a-99a7-cf38e55538c2/b27c23ac-2982-45e4-baa8-922d4eee795e/66050cab-9b3a-44bf-ae06-98ff8758f155/1778179068982_un5zof.jpg', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', '2026-05-07 18:37:49.739274+00', '2026-05-07 18:37:49.739274+00', '2026-05-07 18:37:49.739274+00', '{"eTag": "\"f66a9ffa569039e6ed5ab5a79ea357c3\"", "size": 145779, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-07T18:37:50.000Z", "contentLength": 145779, "httpStatusCode": 200}', '6f0c5ffc-1ce1-4c25-95e9-9525cf116e31', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', '{}'),
	('daece9a6-c03e-443f-b98a-68820c4a26fa', 'assessment-photos', '7357c2e4-4540-462a-99a7-cf38e55538c2/b27c23ac-2982-45e4-baa8-922d4eee795e/66050cab-9b3a-44bf-ae06-98ff8758f155/1778179069655_4d4isf.jpg', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', '2026-05-07 18:37:50.199976+00', '2026-05-07 18:37:50.199976+00', '2026-05-07 18:37:50.199976+00', '{"eTag": "\"22093d55c4619751b496fdc71850052f\"", "size": 127446, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-07T18:37:51.000Z", "contentLength": 127446, "httpStatusCode": 200}', '1cfcb55a-0a3c-422d-a7a1-a4e0f2ec1a0d', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', '{}'),
	('e0e412ba-9519-4031-ba04-b528d263eef0', 'assessment-photos', '7357c2e4-4540-462a-99a7-cf38e55538c2/b27c23ac-2982-45e4-baa8-922d4eee795e/66050cab-9b3a-44bf-ae06-98ff8758f155/1778179070017_8abzoq.jpg', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', '2026-05-07 18:37:50.598388+00', '2026-05-07 18:37:50.598388+00', '2026-05-07 18:37:50.598388+00', '{"eTag": "\"ae0d3a2f36c8c6ece13a55bd5035e675\"", "size": 253882, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-07T18:37:51.000Z", "contentLength": 253882, "httpStatusCode": 200}', '4df09e53-159b-4ae6-b85c-9ce6ce5e77b0', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', '{}'),
	('c475839c-d3cd-49b0-b05e-896283c4f998', 'assessment-photos', '7357c2e4-4540-462a-99a7-cf38e55538c2/b27c23ac-2982-45e4-baa8-922d4eee795e/1ffd73c2-b4a1-42c1-81d5-acfb0b34c8c5/1778179792769_pd31mp.jpg', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', '2026-05-07 18:49:53.632862+00', '2026-05-07 18:49:53.632862+00', '2026-05-07 18:49:53.632862+00', '{"eTag": "\"22093d55c4619751b496fdc71850052f\"", "size": 127446, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-07T18:49:54.000Z", "contentLength": 127446, "httpStatusCode": 200}', '4ebb4a29-0692-4a7e-bddf-0cbe1ee6ff7d', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', '{}'),
	('a6807624-527c-492e-b529-a9766f5403ce', 'assessment-photos', '7357c2e4-4540-462a-99a7-cf38e55538c2/b27c23ac-2982-45e4-baa8-922d4eee795e/1ffd73c2-b4a1-42c1-81d5-acfb0b34c8c5/1778179793481_g1ykw7.jpg', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', '2026-05-07 18:49:54.017765+00', '2026-05-07 18:49:54.017765+00', '2026-05-07 18:49:54.017765+00', '{"eTag": "\"9aa52b409ad8a204eba39595e9a3f1e9\"", "size": 247492, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-07T18:49:54.000Z", "contentLength": 247492, "httpStatusCode": 200}', '37af6048-4f9d-42a0-b73c-cf53c196aac9', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', '{}'),
	('f7683547-d364-410d-be48-30eba8ba6222', 'assessment-photos', '7357c2e4-4540-462a-99a7-cf38e55538c2/b27c23ac-2982-45e4-baa8-922d4eee795e/1ffd73c2-b4a1-42c1-81d5-acfb0b34c8c5/1778179793780_xxugci.jpg', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', '2026-05-07 18:49:54.428119+00', '2026-05-07 18:49:54.428119+00', '2026-05-07 18:49:54.428119+00', '{"eTag": "\"e157ee4207972f050fe3ec95ebcc64a7\"", "size": 167906, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-07T18:49:55.000Z", "contentLength": 167906, "httpStatusCode": 200}', 'ea8dab9d-bb38-4ab4-a1a4-0b58ca6dd7be', '2829d6c6-b437-4cdc-8e50-a399fb79c52e', '{}');


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 109, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict 8ebXmQVuCrizzvTGplvikgyvcaSvQOWNylMjzY4VkbW3Y8hhZApGsRU6aXDeoiB

RESET ALL;
