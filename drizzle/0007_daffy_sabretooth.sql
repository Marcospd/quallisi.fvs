CREATE TABLE "measurement_additives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bulletin_id" uuid NOT NULL,
	"item_number" varchar(20) NOT NULL,
	"service_name" varchar(255) NOT NULL,
	"unit" varchar(10) NOT NULL,
	"unit_price" numeric(14, 4) NOT NULL,
	"contracted_quantity" numeric(14, 4) NOT NULL,
	"quantity_this_period" numeric(14, 4) DEFAULT '0' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "measurement_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bulletin_id" uuid NOT NULL,
	"stage" varchar(20) NOT NULL,
	"action" varchar(20) NOT NULL,
	"user_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "measurement_bulletins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"bm_number" integer NOT NULL,
	"sheet_number" integer DEFAULT 1 NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"due_date" date,
	"discount_value" numeric(14, 2) DEFAULT '0' NOT NULL,
	"observations" text,
	"status" varchar(30) DEFAULT 'DRAFT' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "measurement_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bulletin_id" uuid NOT NULL,
	"contract_item_id" uuid NOT NULL,
	"quantity_this_period" numeric(14, 4) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "measurement_items_bulletin_item_uniq" UNIQUE("bulletin_id","contract_item_id")
);
--> statement-breakpoint
ALTER TABLE "measurement_additives" ADD CONSTRAINT "measurement_additives_bulletin_id_measurement_bulletins_id_fk" FOREIGN KEY ("bulletin_id") REFERENCES "public"."measurement_bulletins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurement_approvals" ADD CONSTRAINT "measurement_approvals_bulletin_id_measurement_bulletins_id_fk" FOREIGN KEY ("bulletin_id") REFERENCES "public"."measurement_bulletins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurement_approvals" ADD CONSTRAINT "measurement_approvals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurement_bulletins" ADD CONSTRAINT "measurement_bulletins_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurement_bulletins" ADD CONSTRAINT "measurement_bulletins_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurement_items" ADD CONSTRAINT "measurement_items_bulletin_id_measurement_bulletins_id_fk" FOREIGN KEY ("bulletin_id") REFERENCES "public"."measurement_bulletins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurement_items" ADD CONSTRAINT "measurement_items_contract_item_id_contract_items_id_fk" FOREIGN KEY ("contract_item_id") REFERENCES "public"."contract_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "measurement_additives_bulletin_idx" ON "measurement_additives" USING btree ("bulletin_id");--> statement-breakpoint
CREATE INDEX "measurement_approvals_bulletin_idx" ON "measurement_approvals" USING btree ("bulletin_id");--> statement-breakpoint
CREATE INDEX "bulletins_contract_idx" ON "measurement_bulletins" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "bulletins_status_idx" ON "measurement_bulletins" USING btree ("status");--> statement-breakpoint
CREATE INDEX "measurement_items_bulletin_idx" ON "measurement_items" USING btree ("bulletin_id");