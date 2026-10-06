CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"vehicle_id" text NOT NULL,
	"customer" jsonb NOT NULL,
	"vehicle_label" text NOT NULL,
	"plate" text DEFAULT '' NOT NULL,
	"vin" text DEFAULT '' NOT NULL,
	"mileage" integer,
	"jobs" jsonb NOT NULL,
	"tax_rate" double precision NOT NULL,
	"status" text NOT NULL,
	"created_at" text NOT NULL,
	"paid_at" text,
	CONSTRAINT "invoices_number_unique" UNIQUE("number")
);
--> statement-breakpoint
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"vehicle_id" text NOT NULL,
	"title" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"technician" text DEFAULT '' NOT NULL,
	"mileage" integer,
	"status" text NOT NULL,
	"items" jsonb NOT NULL,
	"created_at" text NOT NULL,
	"completed_at" text,
	"invoice_id" text,
	"parts_status" text,
	"parts_vendor_id" text,
	"parts_note" text DEFAULT '' NOT NULL,
	"parts_updated_at" text
);
--> statement-breakpoint
ALTER TABLE "jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" text PRIMARY KEY NOT NULL,
	"plate" text DEFAULT '' NOT NULL,
	"plate_state" text DEFAULT '' NOT NULL,
	"vin" text DEFAULT '' NOT NULL,
	"year" text DEFAULT '' NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"trim" text DEFAULT '' NOT NULL,
	"color" text DEFAULT '' NOT NULL,
	"mileage" integer,
	"customer_name" text NOT NULL,
	"customer_phone" text DEFAULT '' NOT NULL,
	"customer_email" text DEFAULT '' NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vehicles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"website" text NOT NULL,
	"search_url" text DEFAULT '' NOT NULL,
	"account_number" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"contact_name" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vendors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invoices_vehicle_idx" ON "invoices" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "jobs_vehicle_idx" ON "jobs" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "jobs_invoice_idx" ON "jobs" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "jobs_parts_status_idx" ON "jobs" USING btree ("parts_status");--> statement-breakpoint
CREATE INDEX "vehicles_plate_idx" ON "vehicles" USING btree ("plate");--> statement-breakpoint
CREATE INDEX "vehicles_vin_idx" ON "vehicles" USING btree ("vin");