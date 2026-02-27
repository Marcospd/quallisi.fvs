CREATE TABLE "diary_equipment_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diary_id" uuid NOT NULL,
	"description" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "diary_labor_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diary_id" uuid NOT NULL,
	"role" varchar(100) NOT NULL,
	"quantity" integer NOT NULL,
	"hours" numeric(5, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "diary_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diary_id" uuid NOT NULL,
	"origin" varchar(20) NOT NULL,
	"text" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "diary_service_releases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diary_id" uuid NOT NULL,
	"stage" varchar(20) NOT NULL,
	"signed_by" uuid,
	"notes" text,
	"signed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "diary_releases_diary_stage_uniq" UNIQUE("diary_id","stage")
);
--> statement-breakpoint
CREATE TABLE "diary_services_executed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diary_id" uuid NOT NULL,
	"description" text NOT NULL,
	"service_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "site_diaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"entry_date" date NOT NULL,
	"order_number" varchar(50),
	"contractor_name" varchar(255),
	"network_diagram_ref" varchar(100),
	"engineer_name" varchar(255),
	"foreman_name" varchar(255),
	"weather_condition" varchar(20) DEFAULT 'NONE' NOT NULL,
	"work_suspended" boolean DEFAULT false NOT NULL,
	"total_hours" numeric(5, 2),
	"status" varchar(30) DEFAULT 'DRAFT' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "site_diaries_project_date_uniq" UNIQUE("project_id","entry_date")
);
--> statement-breakpoint
ALTER TABLE "diary_equipment_entries" ADD CONSTRAINT "diary_equipment_entries_diary_id_site_diaries_id_fk" FOREIGN KEY ("diary_id") REFERENCES "public"."site_diaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_labor_entries" ADD CONSTRAINT "diary_labor_entries_diary_id_site_diaries_id_fk" FOREIGN KEY ("diary_id") REFERENCES "public"."site_diaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_observations" ADD CONSTRAINT "diary_observations_diary_id_site_diaries_id_fk" FOREIGN KEY ("diary_id") REFERENCES "public"."site_diaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_observations" ADD CONSTRAINT "diary_observations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_service_releases" ADD CONSTRAINT "diary_service_releases_diary_id_site_diaries_id_fk" FOREIGN KEY ("diary_id") REFERENCES "public"."site_diaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_service_releases" ADD CONSTRAINT "diary_service_releases_signed_by_users_id_fk" FOREIGN KEY ("signed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_services_executed" ADD CONSTRAINT "diary_services_executed_diary_id_site_diaries_id_fk" FOREIGN KEY ("diary_id") REFERENCES "public"."site_diaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_services_executed" ADD CONSTRAINT "diary_services_executed_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_diaries" ADD CONSTRAINT "site_diaries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_diaries" ADD CONSTRAINT "site_diaries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "diary_equipment_diary_idx" ON "diary_equipment_entries" USING btree ("diary_id");--> statement-breakpoint
CREATE INDEX "diary_labor_diary_idx" ON "diary_labor_entries" USING btree ("diary_id");--> statement-breakpoint
CREATE INDEX "diary_observations_diary_idx" ON "diary_observations" USING btree ("diary_id");--> statement-breakpoint
CREATE INDEX "diary_releases_diary_idx" ON "diary_service_releases" USING btree ("diary_id");--> statement-breakpoint
CREATE INDEX "diary_services_diary_idx" ON "diary_services_executed" USING btree ("diary_id");--> statement-breakpoint
CREATE INDEX "site_diaries_project_idx" ON "site_diaries" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "site_diaries_date_idx" ON "site_diaries" USING btree ("entry_date");--> statement-breakpoint
CREATE INDEX "site_diaries_status_idx" ON "site_diaries" USING btree ("status");