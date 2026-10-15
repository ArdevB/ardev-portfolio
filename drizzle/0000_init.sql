CREATE TABLE "github_snapshots" (
	"key" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "github_snapshots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" text DEFAULT 'github' NOT NULL,
	"repo_name" text,
	"slug" text NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"visible" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"title" text,
	"description" text,
	"cover_image" text,
	"live_url" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"repo_url" text,
	"language" text,
	"role" text,
	"year" text,
	"summary" text,
	"body" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "projects_repo_name_idx" ON "projects" USING btree ("repo_name");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");