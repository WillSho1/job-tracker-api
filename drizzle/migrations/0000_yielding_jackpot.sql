CREATE TYPE "public"."application_status" AS ENUM('applied', 'interviewing', 'rejected', 'offer', 'accepted');--> statement-breakpoint
CREATE TYPE "public"."leetcode_difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"company" varchar(255) NOT NULL,
	"role" varchar(255) NOT NULL,
	"url" text,
	"status" "application_status" DEFAULT 'applied',
	"applied_date" date DEFAULT now(),
	"last_contact" date,
	"notes" text,
	"salary_range" varchar(100),
	"location" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leetcode" (
	"id" serial PRIMARY KEY NOT NULL,
	"problem_name" varchar(255) NOT NULL,
	"problem_number" integer,
	"difficulty" "leetcode_difficulty",
	"topics" text,
	"solved_date" date DEFAULT now(),
	"time_minutes" integer,
	"notes" text,
	"solution_approach" text
);
