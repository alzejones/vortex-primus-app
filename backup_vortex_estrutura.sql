


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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."assign_default_plan"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  default_plan_id uuid;
BEGIN
  -- Buscar o plano "Teste" (gratuito) para este treinador
  SELECT id INTO default_plan_id
  FROM public.plans 
  WHERE trainer_id = NEW.id 
    AND (name = 'Teste' OR price_cents = 0)
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- Se encontrou o plano, criar a assinatura
  IF default_plan_id IS NOT NULL THEN
    INSERT INTO public.trainer_subscriptions (
      trainer_id, 
      plan_id, 
      status, 
      started_at
    ) VALUES (
      NEW.id,
      default_plan_id,
      'active',
      NOW()
    );
    
    RAISE NOTICE 'Plano padrão (%) atribuído ao treinador %', default_plan_id, NEW.id;
  ELSE
    RAISE NOTICE 'Nenhum plano padrão encontrado para o treinador %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."assign_default_plan"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  extracted_name text;
BEGIN
  -- Proteção: Alunos convidados chegam com role = 'client' no raw_user_meta_data.
  -- Não criar registro em trainers para eles.
  IF (NEW.raw_user_meta_data->>'role') = 'client' THEN
    RETURN NEW;
  END IF;

  -- Extração robusta do nome com fallbacks em cascata
  -- Ordem de prioridade: full_name > name > email_prefix > fallback_seguro
  extracted_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(trim(split_part(NEW.email, '@', 1)), ''),
    'Novo Treinador'
  );

  -- Garantir que extracted_name nunca seja NULL ou vazio
  IF extracted_name IS NULL OR extracted_name = '' THEN
    extracted_name := 'Novo Treinador';
  END IF;

  INSERT INTO public.trainers (id, user_id, name, email)
  VALUES (gen_random_uuid(), NEW.id, extracted_name, NEW.email);

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."link_client_user_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_client_id uuid;
BEGIN
  v_client_id := (NEW.raw_user_meta_data->>'client_id')::uuid;

  IF v_client_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF (NEW.raw_user_meta_data->>'role') IS DISTINCT FROM 'client' THEN
    RETURN NEW;
  END IF;

  UPDATE clients
     SET user_id = NEW.id
   WHERE id = v_client_id
     AND user_id IS NULL;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Não bloqueia a criação do usuário se o vínculo falhar.
  -- O UPDATE será retentado quando o trigger disparar novamente
  -- no UPDATE do auth.users (confirmação de e-mail).
  RAISE WARNING 'link_client_user_id: falha ao vincular client_id=% user_id=% — %',
    v_client_id, NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."link_client_user_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_meal_plans_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_meal_plans_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."anthropometry" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assessment_id" "uuid",
    "weight" numeric(5,2),
    "body_fat_percent" numeric(5,2),
    "muscle_mass_kg" numeric(5,2),
    "chest_cm" numeric(5,2),
    "waist_cm" numeric(5,2),
    "hips_cm" numeric(5,2),
    "right_arm_cm" numeric(5,2),
    "left_arm_cm" numeric(5,2),
    "right_forearm_cm" numeric(5,2),
    "left_forearm_cm" numeric(5,2),
    "right_thigh_cm" numeric(5,2),
    "left_thigh_cm" numeric(5,2),
    "right_calf_cm" numeric(5,2),
    "left_calf_cm" numeric(5,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "bmi" numeric(5,2),
    "water_percent" numeric(5,2),
    "bone_mass" numeric(5,2),
    "source" "text" DEFAULT 'manual'::"text" NOT NULL,
    "view_count" integer DEFAULT 0,
    "body_fat" numeric(5,2),
    "muscle_mass_percentage" numeric(5,2) DEFAULT 0,
    "basal_metabolic_rate" numeric(7,1),
    "body_fat_index" numeric(5,1),
    "metabolic_age" integer,
    "height" numeric,
    "waist" numeric,
    "hip" numeric,
    "chest" numeric,
    "abdomen" numeric,
    "arm_right" numeric,
    "arm_left" numeric,
    "thigh_right" numeric,
    "thigh_left" numeric,
    "calf_right" numeric,
    "calf_left" numeric
);


ALTER TABLE "public"."anthropometry" OWNER TO "postgres";


COMMENT ON COLUMN "public"."anthropometry"."bmi" IS 'Índice de Massa Corporal (IMC)';



COMMENT ON COLUMN "public"."anthropometry"."water_percent" IS 'Percentual de água corporal';



COMMENT ON COLUMN "public"."anthropometry"."bone_mass" IS 'Massa óssea em kg';



COMMENT ON COLUMN "public"."anthropometry"."source" IS 'Origem dos dados: manual, ble_trainer, ble_client';



CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trainer_id" "uuid",
    "client_id" "uuid",
    "appointment_date" "date" NOT NULL,
    "appointment_time" time without time zone NOT NULL,
    "whatsapp_sent" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "types" "text"[] DEFAULT '{}'::"text"[],
    "notes" "text",
    "status" "text" DEFAULT 'scheduled'::"text"
);


ALTER TABLE "public"."appointments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trainer_id" "uuid",
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "birth_date" "date",
    "gender" "text",
    "height_cm" numeric(5,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "objective" "text",
    "activity_level" "text",
    "food_restrictions" "text",
    "observation" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "clients_gender_check" CHECK (("gender" = ANY (ARRAY['M'::"text", 'F'::"text"])))
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


COMMENT ON COLUMN "public"."clients"."trainer_id" IS 'FK nullable para trainers. NULL = aluno sem treinador (ex: conta convidada cujo trainer foi deletado). ON DELETE SET NULL.';



CREATE TABLE IF NOT EXISTS "public"."conditioning_assessments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assessment_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."conditioning_assessments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conditioning_tests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conditioning_assessment_id" "uuid",
    "test_name" "text" NOT NULL,
    "result_value" numeric,
    "result_unit" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."conditioning_tests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."diet_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "food_restrictions" "text"[],
    "preferred_foods" "text"[],
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."diet_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."foods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text",
    "energy_kcal" numeric(8,2),
    "protein_g" numeric(8,2),
    "carb_g" numeric(8,2),
    "fat_g" numeric(8,2),
    "fiber_g" numeric(8,2),
    "sodium_mg" numeric(8,2),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."foods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meal_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid",
    "meal_type" "text" NOT NULL,
    "logged_at" timestamp with time zone DEFAULT "now"(),
    "notes" "text",
    "photo_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "meal_log_meal_type_check" CHECK (("meal_type" = ANY (ARRAY['breakfast'::"text", 'morning_snack'::"text", 'lunch'::"text", 'afternoon_snack'::"text", 'dinner'::"text", 'evening_snack'::"text"])))
);


ALTER TABLE "public"."meal_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meal_log_foods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "meal_log_id" "uuid" NOT NULL,
    "food_id" "uuid",
    "name" "text" NOT NULL,
    "quantity_grams" numeric(7,1),
    "calories" numeric(7,1),
    "protein" numeric(5,1),
    "carbs" numeric(5,1),
    "fat" numeric(5,1),
    "order_index" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."meal_log_foods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meal_plan_foods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "meal_id" "uuid",
    "food_id" "uuid",
    "quantity_g" numeric(8,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "supplement_id" "uuid"
);


ALTER TABLE "public"."meal_plan_foods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meal_plan_meals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "meal_plan_id" "uuid",
    "meal_type" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "target_calories" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "meal_plan_meals_meal_type_check" CHECK (("meal_type" = ANY (ARRAY['breakfast'::"text", 'morning_snack'::"text", 'lunch'::"text", 'afternoon_snack'::"text", 'dinner'::"text", 'evening_snack'::"text"])))
);


ALTER TABLE "public"."meal_plan_meals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meal_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid",
    "trainer_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "start_date" "date",
    "end_date" "date",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "meal_plans_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."meal_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."physical_assessments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid",
    "trainer_id" "uuid",
    "assessment_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "date" "date" DEFAULT CURRENT_DATE,
    "assessor_name" "text"
);


ALTER TABLE "public"."physical_assessments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trainer_id" "uuid",
    "name" "text" NOT NULL,
    "price_cents" integer DEFAULT 0 NOT NULL,
    "max_clients" integer,
    "features" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."supplements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "brand" "text" DEFAULT 'Herbalife'::"text" NOT NULL,
    "sku" "text",
    "name" "text" NOT NULL,
    "serving_size_g" numeric NOT NULL,
    "calories" numeric,
    "protein_g" numeric,
    "carbs_g" numeric,
    "fat_g" numeric,
    "fiber_g" numeric,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."supplements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."supported_scales" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "brand" "text" NOT NULL,
    "model" "text" NOT NULL,
    "ble_name" "text",
    "protocol" "text" NOT NULL,
    "metrics" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "connection_type" "text" DEFAULT 'ble_web'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."supported_scales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trainer_scales" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trainer_id" "uuid" NOT NULL,
    "supported_scale_id" "uuid" NOT NULL,
    "nickname" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."trainer_scales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trainer_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trainer_id" "uuid",
    "plan_id" "uuid",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "stripe_subscription_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT false
);


ALTER TABLE "public"."trainer_subscriptions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."trainer_subscriptions"."trainer_id" IS 'FK para trainers com ON DELETE CASCADE. A assinatura é removida junto com o trainer.';



CREATE TABLE IF NOT EXISTS "public"."trainers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."trainers" OWNER TO "postgres";


ALTER TABLE ONLY "public"."anthropometry"
    ADD CONSTRAINT "anthropometry_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conditioning_assessments"
    ADD CONSTRAINT "conditioning_assessments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conditioning_tests"
    ADD CONSTRAINT "conditioning_tests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."diet_preferences"
    ADD CONSTRAINT "diet_preferences_client_id_unique" UNIQUE ("client_id");



ALTER TABLE ONLY "public"."diet_preferences"
    ADD CONSTRAINT "diet_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."foods"
    ADD CONSTRAINT "foods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meal_log_foods"
    ADD CONSTRAINT "meal_log_foods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meal_log"
    ADD CONSTRAINT "meal_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meal_plan_foods"
    ADD CONSTRAINT "meal_plan_foods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meal_plan_meals"
    ADD CONSTRAINT "meal_plan_meals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meal_plans"
    ADD CONSTRAINT "meal_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."physical_assessments"
    ADD CONSTRAINT "physical_assessments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supplements"
    ADD CONSTRAINT "supplements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supported_scales"
    ADD CONSTRAINT "supported_scales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trainer_scales"
    ADD CONSTRAINT "trainer_scales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trainer_subscriptions"
    ADD CONSTRAINT "trainer_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trainer_subscriptions"
    ADD CONSTRAINT "trainer_subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."trainers"
    ADD CONSTRAINT "trainers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."trainers"
    ADD CONSTRAINT "trainers_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "clients_user_id_unique" ON "public"."clients" USING "btree" ("user_id") WHERE ("user_id" IS NOT NULL);



CREATE INDEX "foods_name_idx" ON "public"."foods" USING "gin" ("to_tsvector"('"portuguese"'::"regconfig", "name"));



CREATE INDEX "idx_anthropometry_assessment_id" ON "public"."anthropometry" USING "btree" ("assessment_id");



CREATE INDEX "idx_anthropometry_view_count" ON "public"."anthropometry" USING "btree" ("view_count");



CREATE INDEX "idx_clients_is_active" ON "public"."clients" USING "btree" ("is_active");



CREATE INDEX "idx_clients_trainer_id" ON "public"."clients" USING "btree" ("trainer_id");



CREATE INDEX "idx_meal_log_client_id" ON "public"."meal_log" USING "btree" ("client_id");



CREATE INDEX "idx_meal_plan_foods_meal_id" ON "public"."meal_plan_foods" USING "btree" ("meal_id");



CREATE INDEX "idx_meal_plan_meals_plan_id" ON "public"."meal_plan_meals" USING "btree" ("meal_plan_id");



CREATE INDEX "idx_meal_plans_client_id" ON "public"."meal_plans" USING "btree" ("client_id");



CREATE INDEX "idx_meal_plans_trainer_id" ON "public"."meal_plans" USING "btree" ("trainer_id");



CREATE INDEX "idx_physical_assessments_client_id" ON "public"."physical_assessments" USING "btree" ("client_id");



CREATE INDEX "idx_physical_assessments_trainer_id" ON "public"."physical_assessments" USING "btree" ("trainer_id");



CREATE INDEX "idx_trainer_subscriptions_is_active" ON "public"."trainer_subscriptions" USING "btree" ("is_active");



CREATE INDEX "idx_trainers_user_id" ON "public"."trainers" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "on_trainer_created_assign_plan" AFTER INSERT ON "public"."trainers" FOR EACH ROW EXECUTE FUNCTION "public"."assign_default_plan"();



CREATE OR REPLACE TRIGGER "trg_meal_plans_updated_at" BEFORE UPDATE ON "public"."meal_plans" FOR EACH ROW EXECUTE FUNCTION "public"."update_meal_plans_updated_at"();



ALTER TABLE ONLY "public"."anthropometry"
    ADD CONSTRAINT "anthropometry_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."physical_assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conditioning_assessments"
    ADD CONSTRAINT "conditioning_assessments_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."physical_assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conditioning_tests"
    ADD CONSTRAINT "conditioning_tests_conditioning_assessment_id_fkey" FOREIGN KEY ("conditioning_assessment_id") REFERENCES "public"."conditioning_assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diet_preferences"
    ADD CONSTRAINT "diet_preferences_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meal_log"
    ADD CONSTRAINT "meal_log_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meal_log_foods"
    ADD CONSTRAINT "meal_log_foods_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."meal_log_foods"
    ADD CONSTRAINT "meal_log_foods_meal_log_id_fkey" FOREIGN KEY ("meal_log_id") REFERENCES "public"."meal_log"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meal_plan_foods"
    ADD CONSTRAINT "meal_plan_foods_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meal_plan_foods"
    ADD CONSTRAINT "meal_plan_foods_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "public"."meal_plan_meals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meal_plan_foods"
    ADD CONSTRAINT "meal_plan_foods_supplement_id_fkey" FOREIGN KEY ("supplement_id") REFERENCES "public"."supplements"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."meal_plan_meals"
    ADD CONSTRAINT "meal_plan_meals_meal_plan_id_fkey" FOREIGN KEY ("meal_plan_id") REFERENCES "public"."meal_plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meal_plans"
    ADD CONSTRAINT "meal_plans_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meal_plans"
    ADD CONSTRAINT "meal_plans_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."physical_assessments"
    ADD CONSTRAINT "physical_assessments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."physical_assessments"
    ADD CONSTRAINT "physical_assessments_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trainer_scales"
    ADD CONSTRAINT "trainer_scales_supported_scale_id_fkey" FOREIGN KEY ("supported_scale_id") REFERENCES "public"."supported_scales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trainer_scales"
    ADD CONSTRAINT "trainer_scales_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trainer_subscriptions"
    ADD CONSTRAINT "trainer_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trainer_subscriptions"
    ADD CONSTRAINT "trainer_subscriptions_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trainers"
    ADD CONSTRAINT "trainers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Leitura_Publica_Clients_Evolution" ON "public"."clients" FOR SELECT USING (true);



ALTER TABLE "public"."anthropometry" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "anthropometry_insert_policy" ON "public"."anthropometry" FOR INSERT WITH CHECK (true);



CREATE POLICY "anthropometry_update_policy" ON "public"."anthropometry" FOR UPDATE USING (true);



ALTER TABLE "public"."appointments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_all_diet_preferences" ON "public"."diet_preferences" USING (("client_id" IN ( SELECT "clients"."id"
   FROM "public"."clients"
  WHERE ("clients"."user_id" = "auth"."uid"())))) WITH CHECK (("client_id" IN ( SELECT "clients"."id"
   FROM "public"."clients"
  WHERE ("clients"."user_id" = "auth"."uid"()))));



CREATE POLICY "client_delete_meal_plans" ON "public"."meal_plans" FOR DELETE USING (("client_id" IN ( SELECT "clients"."id"
   FROM "public"."clients"
  WHERE ("clients"."user_id" = "auth"."uid"()))));



CREATE POLICY "client_insert_meal_plans" ON "public"."meal_plans" FOR INSERT WITH CHECK ((("client_id" IN ( SELECT "clients"."id"
   FROM "public"."clients"
  WHERE ("clients"."user_id" = "auth"."uid"()))) AND ("trainer_id" IN ( SELECT "clients"."trainer_id"
   FROM "public"."clients"
  WHERE (("clients"."user_id" = "auth"."uid"()) AND ("clients"."trainer_id" IS NOT NULL))))));



CREATE POLICY "client_own_meal_log" ON "public"."meal_log" USING (("client_id" IN ( SELECT "clients"."id"
   FROM "public"."clients"
  WHERE ("clients"."user_id" = "auth"."uid"())))) WITH CHECK (("client_id" IN ( SELECT "clients"."id"
   FROM "public"."clients"
  WHERE ("clients"."user_id" = "auth"."uid"()))));



CREATE POLICY "client_own_meal_log_foods" ON "public"."meal_log_foods" USING (("meal_log_id" IN ( SELECT "ml"."id"
   FROM ("public"."meal_log" "ml"
     JOIN "public"."clients" "c" ON (("ml"."client_id" = "c"."id")))
  WHERE ("c"."user_id" = "auth"."uid"())))) WITH CHECK (("meal_log_id" IN ( SELECT "ml"."id"
   FROM ("public"."meal_log" "ml"
     JOIN "public"."clients" "c" ON (("ml"."client_id" = "c"."id")))
  WHERE ("c"."user_id" = "auth"."uid"()))));



CREATE POLICY "client_select_meal_plan_foods" ON "public"."meal_plan_foods" FOR SELECT USING (("meal_id" IN ( SELECT "mpm"."id"
   FROM (("public"."meal_plan_meals" "mpm"
     JOIN "public"."meal_plans" "mp" ON (("mp"."id" = "mpm"."meal_plan_id")))
     JOIN "public"."clients" "c" ON (("c"."id" = "mp"."client_id")))
  WHERE ("c"."user_id" = "auth"."uid"()))));



CREATE POLICY "client_select_meal_plan_meals" ON "public"."meal_plan_meals" FOR SELECT USING (("meal_plan_id" IN ( SELECT "mp"."id"
   FROM ("public"."meal_plans" "mp"
     JOIN "public"."clients" "c" ON (("c"."id" = "mp"."client_id")))
  WHERE ("c"."user_id" = "auth"."uid"()))));



CREATE POLICY "client_select_meal_plans" ON "public"."meal_plans" FOR SELECT USING (("client_id" IN ( SELECT "clients"."id"
   FROM "public"."clients"
  WHERE ("clients"."user_id" = "auth"."uid"()))));



CREATE POLICY "client_select_own_record" ON "public"."clients" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "client_self_link_on_invite" ON "public"."clients" FOR UPDATE USING (("user_id" IS NULL)) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "client_update_meal_plans" ON "public"."meal_plans" FOR UPDATE USING (("client_id" IN ( SELECT "clients"."id"
   FROM "public"."clients"
  WHERE ("clients"."user_id" = "auth"."uid"())))) WITH CHECK (("client_id" IN ( SELECT "clients"."id"
   FROM "public"."clients"
  WHERE ("clients"."user_id" = "auth"."uid"()))));



CREATE POLICY "client_write_meal_plan_foods" ON "public"."meal_plan_foods" USING (("meal_id" IN ( SELECT "mpm"."id"
   FROM (("public"."meal_plan_meals" "mpm"
     JOIN "public"."meal_plans" "mp" ON (("mp"."id" = "mpm"."meal_plan_id")))
     JOIN "public"."clients" "c" ON (("c"."id" = "mp"."client_id")))
  WHERE ("c"."user_id" = "auth"."uid"())))) WITH CHECK (("meal_id" IN ( SELECT "mpm"."id"
   FROM (("public"."meal_plan_meals" "mpm"
     JOIN "public"."meal_plans" "mp" ON (("mp"."id" = "mpm"."meal_plan_id")))
     JOIN "public"."clients" "c" ON (("c"."id" = "mp"."client_id")))
  WHERE ("c"."user_id" = "auth"."uid"()))));



CREATE POLICY "client_write_meal_plan_meals" ON "public"."meal_plan_meals" USING (("meal_plan_id" IN ( SELECT "mp"."id"
   FROM ("public"."meal_plans" "mp"
     JOIN "public"."clients" "c" ON (("c"."id" = "mp"."client_id")))
  WHERE ("c"."user_id" = "auth"."uid"())))) WITH CHECK (("meal_plan_id" IN ( SELECT "mp"."id"
   FROM ("public"."meal_plans" "mp"
     JOIN "public"."clients" "c" ON (("c"."id" = "mp"."client_id")))
  WHERE ("c"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clients_trainer_access" ON "public"."clients" USING (("trainer_id" IN ( SELECT "trainers"."id"
   FROM "public"."trainers"
  WHERE ("trainers"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."conditioning_assessments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conditioning_assessments_trainer_access" ON "public"."conditioning_assessments" USING (("assessment_id" IN ( SELECT "pa"."id"
   FROM ("public"."physical_assessments" "pa"
     JOIN "public"."trainers" "t" ON (("t"."id" = "pa"."trainer_id")))
  WHERE ("t"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."conditioning_tests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conditioning_tests_trainer_access" ON "public"."conditioning_tests" USING (("conditioning_assessment_id" IN ( SELECT "ca"."id"
   FROM (("public"."conditioning_assessments" "ca"
     JOIN "public"."physical_assessments" "pa" ON (("pa"."id" = "ca"."assessment_id")))
     JOIN "public"."trainers" "t" ON (("t"."id" = "pa"."trainer_id")))
  WHERE ("t"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."diet_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."foods" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "foods_public_read" ON "public"."foods" FOR SELECT USING (true);



ALTER TABLE "public"."meal_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meal_log_foods" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "meal_log_trainer_access" ON "public"."meal_log" USING (("client_id" IN ( SELECT "c"."id"
   FROM ("public"."clients" "c"
     JOIN "public"."trainers" "t" ON (("t"."id" = "c"."trainer_id")))
  WHERE ("t"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."meal_plan_foods" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "meal_plan_foods_trainer_access" ON "public"."meal_plan_foods" USING (("meal_id" IN ( SELECT "mpm"."id"
   FROM (("public"."meal_plan_meals" "mpm"
     JOIN "public"."meal_plans" "mp" ON (("mp"."id" = "mpm"."meal_plan_id")))
     JOIN "public"."trainers" "t" ON (("t"."id" = "mp"."trainer_id")))
  WHERE ("t"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."meal_plan_meals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "meal_plan_meals_trainer_access" ON "public"."meal_plan_meals" USING (("meal_plan_id" IN ( SELECT "mp"."id"
   FROM ("public"."meal_plans" "mp"
     JOIN "public"."trainers" "t" ON (("t"."id" = "mp"."trainer_id")))
  WHERE ("t"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."meal_plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "meal_plans_trainer_access" ON "public"."meal_plans" USING (("trainer_id" IN ( SELECT "trainers"."id"
   FROM "public"."trainers"
  WHERE ("trainers"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."physical_assessments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "physical_assessments_insert_policy" ON "public"."physical_assessments" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "plans_trainer_access" ON "public"."plans" USING (("trainer_id" IN ( SELECT "trainers"."id"
   FROM "public"."trainers"
  WHERE ("trainers"."user_id" = "auth"."uid"()))));



CREATE POLICY "public_read_anthropometry" ON "public"."anthropometry" FOR SELECT USING (true);



CREATE POLICY "public_read_appointments" ON "public"."appointments" FOR SELECT USING (true);



CREATE POLICY "public_read_clients" ON "public"."clients" FOR SELECT USING (true);



CREATE POLICY "public_read_physical_assessments" ON "public"."physical_assessments" FOR SELECT USING (true);



CREATE POLICY "public_select_foods" ON "public"."foods" FOR SELECT USING (true);



ALTER TABLE "public"."supplements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "supplements_select" ON "public"."supplements" FOR SELECT USING (true);



ALTER TABLE "public"."supported_scales" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "supported_scales_select_for_authenticated" ON "public"."supported_scales" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "trainer_all_anthropometry" ON "public"."anthropometry" USING (("assessment_id" IN ( SELECT "physical_assessments"."id"
   FROM "public"."physical_assessments"
  WHERE ("physical_assessments"."trainer_id" IN ( SELECT "trainers"."id"
           FROM "public"."trainers"
          WHERE ("trainers"."user_id" = "auth"."uid"())))))) WITH CHECK (("assessment_id" IN ( SELECT "physical_assessments"."id"
   FROM "public"."physical_assessments"
  WHERE ("physical_assessments"."trainer_id" IN ( SELECT "trainers"."id"
           FROM "public"."trainers"
          WHERE ("trainers"."user_id" = "auth"."uid"()))))));



CREATE POLICY "trainer_all_meal_plan_foods" ON "public"."meal_plan_foods" USING (("meal_id" IN ( SELECT "mpm"."id"
   FROM (("public"."meal_plan_meals" "mpm"
     JOIN "public"."meal_plans" "mp" ON (("mp"."id" = "mpm"."meal_plan_id")))
     JOIN "public"."trainers" "t" ON (("t"."id" = "mp"."trainer_id")))
  WHERE ("t"."user_id" = "auth"."uid"())))) WITH CHECK (("meal_id" IN ( SELECT "mpm"."id"
   FROM (("public"."meal_plan_meals" "mpm"
     JOIN "public"."meal_plans" "mp" ON (("mp"."id" = "mpm"."meal_plan_id")))
     JOIN "public"."trainers" "t" ON (("t"."id" = "mp"."trainer_id")))
  WHERE ("t"."user_id" = "auth"."uid"()))));



CREATE POLICY "trainer_all_meal_plan_meals" ON "public"."meal_plan_meals" USING (("meal_plan_id" IN ( SELECT "mp"."id"
   FROM ("public"."meal_plans" "mp"
     JOIN "public"."trainers" "t" ON (("t"."id" = "mp"."trainer_id")))
  WHERE ("t"."user_id" = "auth"."uid"())))) WITH CHECK (("meal_plan_id" IN ( SELECT "mp"."id"
   FROM ("public"."meal_plans" "mp"
     JOIN "public"."trainers" "t" ON (("t"."id" = "mp"."trainer_id")))
  WHERE ("t"."user_id" = "auth"."uid"()))));



CREATE POLICY "trainer_all_meal_plans" ON "public"."meal_plans" USING (("trainer_id" IN ( SELECT "trainers"."id"
   FROM "public"."trainers"
  WHERE ("trainers"."user_id" = "auth"."uid"())))) WITH CHECK (("trainer_id" IN ( SELECT "trainers"."id"
   FROM "public"."trainers"
  WHERE ("trainers"."user_id" = "auth"."uid"()))));



CREATE POLICY "trainer_all_physical_assessments" ON "public"."physical_assessments" USING (("trainer_id" IN ( SELECT "trainers"."id"
   FROM "public"."trainers"
  WHERE ("trainers"."user_id" = "auth"."uid"())))) WITH CHECK (("trainer_id" IN ( SELECT "trainers"."id"
   FROM "public"."trainers"
  WHERE ("trainers"."user_id" = "auth"."uid"()))));



CREATE POLICY "trainer_full_access_appointments" ON "public"."appointments" USING (("trainer_id" IN ( SELECT "trainers"."id"
   FROM "public"."trainers"
  WHERE ("trainers"."user_id" = "auth"."uid"())))) WITH CHECK (("trainer_id" IN ( SELECT "trainers"."id"
   FROM "public"."trainers"
  WHERE ("trainers"."user_id" = "auth"."uid"()))));



CREATE POLICY "trainer_read_client_meal_log" ON "public"."meal_log" FOR SELECT USING (("client_id" IN ( SELECT "c"."id"
   FROM ("public"."clients" "c"
     JOIN "public"."trainers" "t" ON (("c"."trainer_id" = "t"."id")))
  WHERE ("t"."user_id" = "auth"."uid"()))));



CREATE POLICY "trainer_read_client_meal_log_foods" ON "public"."meal_log_foods" FOR SELECT USING (("meal_log_id" IN ( SELECT "ml"."id"
   FROM (("public"."meal_log" "ml"
     JOIN "public"."clients" "c" ON (("ml"."client_id" = "c"."id")))
     JOIN "public"."trainers" "t" ON (("c"."trainer_id" = "t"."id")))
  WHERE ("t"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."trainer_scales" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trainer_scales_crud_own_only" ON "public"."trainer_scales" TO "authenticated" USING (("trainer_id" IN ( SELECT "trainers"."id"
   FROM "public"."trainers"
  WHERE ("trainers"."user_id" = "auth"."uid"()))));



CREATE POLICY "trainer_select_diet_preferences" ON "public"."diet_preferences" FOR SELECT USING (("client_id" IN ( SELECT "c"."id"
   FROM ("public"."clients" "c"
     JOIN "public"."trainers" "t" ON (("t"."id" = "c"."trainer_id")))
  WHERE ("t"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."trainer_subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trainer_subscriptions_own_access" ON "public"."trainer_subscriptions" USING (("trainer_id" IN ( SELECT "trainers"."id"
   FROM "public"."trainers"
  WHERE ("trainers"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."trainers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trainers_own_record" ON "public"."trainers" USING (("user_id" = "auth"."uid"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."assign_default_plan"() TO "anon";
GRANT ALL ON FUNCTION "public"."assign_default_plan"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_default_plan"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."link_client_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."link_client_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."link_client_user_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_meal_plans_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_meal_plans_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_meal_plans_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."anthropometry" TO "anon";
GRANT ALL ON TABLE "public"."anthropometry" TO "authenticated";
GRANT ALL ON TABLE "public"."anthropometry" TO "service_role";



GRANT ALL ON TABLE "public"."appointments" TO "anon";
GRANT ALL ON TABLE "public"."appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT UPDATE("user_id") ON TABLE "public"."clients" TO "postgres";



GRANT ALL ON TABLE "public"."conditioning_assessments" TO "anon";
GRANT ALL ON TABLE "public"."conditioning_assessments" TO "authenticated";
GRANT ALL ON TABLE "public"."conditioning_assessments" TO "service_role";



GRANT ALL ON TABLE "public"."conditioning_tests" TO "anon";
GRANT ALL ON TABLE "public"."conditioning_tests" TO "authenticated";
GRANT ALL ON TABLE "public"."conditioning_tests" TO "service_role";



GRANT ALL ON TABLE "public"."diet_preferences" TO "anon";
GRANT ALL ON TABLE "public"."diet_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."diet_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."foods" TO "anon";
GRANT ALL ON TABLE "public"."foods" TO "authenticated";
GRANT ALL ON TABLE "public"."foods" TO "service_role";



GRANT ALL ON TABLE "public"."meal_log" TO "anon";
GRANT ALL ON TABLE "public"."meal_log" TO "authenticated";
GRANT ALL ON TABLE "public"."meal_log" TO "service_role";



GRANT ALL ON TABLE "public"."meal_log_foods" TO "anon";
GRANT ALL ON TABLE "public"."meal_log_foods" TO "authenticated";
GRANT ALL ON TABLE "public"."meal_log_foods" TO "service_role";



GRANT ALL ON TABLE "public"."meal_plan_foods" TO "anon";
GRANT ALL ON TABLE "public"."meal_plan_foods" TO "authenticated";
GRANT ALL ON TABLE "public"."meal_plan_foods" TO "service_role";



GRANT ALL ON TABLE "public"."meal_plan_meals" TO "anon";
GRANT ALL ON TABLE "public"."meal_plan_meals" TO "authenticated";
GRANT ALL ON TABLE "public"."meal_plan_meals" TO "service_role";



GRANT ALL ON TABLE "public"."meal_plans" TO "anon";
GRANT ALL ON TABLE "public"."meal_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."meal_plans" TO "service_role";



GRANT ALL ON TABLE "public"."physical_assessments" TO "anon";
GRANT ALL ON TABLE "public"."physical_assessments" TO "authenticated";
GRANT ALL ON TABLE "public"."physical_assessments" TO "service_role";



GRANT ALL ON TABLE "public"."plans" TO "anon";
GRANT ALL ON TABLE "public"."plans" TO "authenticated";
GRANT ALL ON TABLE "public"."plans" TO "service_role";



GRANT ALL ON TABLE "public"."supplements" TO "anon";
GRANT ALL ON TABLE "public"."supplements" TO "authenticated";
GRANT ALL ON TABLE "public"."supplements" TO "service_role";



GRANT ALL ON TABLE "public"."supported_scales" TO "anon";
GRANT ALL ON TABLE "public"."supported_scales" TO "authenticated";
GRANT ALL ON TABLE "public"."supported_scales" TO "service_role";



GRANT ALL ON TABLE "public"."trainer_scales" TO "anon";
GRANT ALL ON TABLE "public"."trainer_scales" TO "authenticated";
GRANT ALL ON TABLE "public"."trainer_scales" TO "service_role";



GRANT ALL ON TABLE "public"."trainer_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."trainer_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."trainer_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."trainers" TO "anon";
GRANT ALL ON TABLE "public"."trainers" TO "authenticated";
GRANT ALL ON TABLE "public"."trainers" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































