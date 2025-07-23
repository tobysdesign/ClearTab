create table "public"."verification_tokens" (
    "identifier" text not null,
    "token" text not null,
    "expires" timestamp without time zone not null
);


CREATE UNIQUE INDEX verification_tokens_identifier_token_pk ON public.verification_tokens USING btree (identifier, token);

alter table "public"."verification_tokens" add constraint "verification_tokens_identifier_token_pk" PRIMARY KEY using index "verification_tokens_identifier_token_pk";

grant delete on table "public"."verification_tokens" to "anon";

grant insert on table "public"."verification_tokens" to "anon";

grant references on table "public"."verification_tokens" to "anon";

grant select on table "public"."verification_tokens" to "anon";

grant trigger on table "public"."verification_tokens" to "anon";

grant truncate on table "public"."verification_tokens" to "anon";

grant update on table "public"."verification_tokens" to "anon";

grant delete on table "public"."verification_tokens" to "authenticated";

grant insert on table "public"."verification_tokens" to "authenticated";

grant references on table "public"."verification_tokens" to "authenticated";

grant select on table "public"."verification_tokens" to "authenticated";

grant trigger on table "public"."verification_tokens" to "authenticated";

grant truncate on table "public"."verification_tokens" to "authenticated";

grant update on table "public"."verification_tokens" to "authenticated";

grant delete on table "public"."verification_tokens" to "service_role";

grant insert on table "public"."verification_tokens" to "service_role";

grant references on table "public"."verification_tokens" to "service_role";

grant select on table "public"."verification_tokens" to "service_role";

grant trigger on table "public"."verification_tokens" to "service_role";

grant truncate on table "public"."verification_tokens" to "service_role";

grant update on table "public"."verification_tokens" to "service_role";


