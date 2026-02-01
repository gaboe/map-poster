CREATE TABLE "osm_data_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"geofabrik_url" text NOT NULL,
	"file_size_bytes" bigint,
	"status" text DEFAULT 'pending' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"last_imported_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "osm_data_sources_code_unique" UNIQUE("code")
);
--> statement-breakpoint
INSERT INTO "osm_data_sources" (
	"id",
	"name",
	"code",
	"geofabrik_url",
	"status",
	"progress",
	"created_at",
	"updated_at"
)
VALUES
	(
		'osm_cz',
		'Czech Republic',
		'cz',
		'https://download.geofabrik.de/europe/czech-republic-latest.osm.pbf',
		'pending',
		0,
		now(),
		now()
	),
	(
		'osm_sk',
		'Slovakia',
		'sk',
		'https://download.geofabrik.de/europe/slovakia-latest.osm.pbf',
		'pending',
		0,
		now(),
		now()
	);
