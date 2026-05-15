CREATE TYPE IF NOT EXISTS "public"."alert_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE IF NOT EXISTS "public"."alert_type" AS ENUM('full', 'low_availability', 'offline', 'maintenance', 'info');--> statement-breakpoint
CREATE TYPE IF NOT EXISTS "public"."booking_status" AS ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE IF NOT EXISTS "public"."revenue_type" AS ENUM('booking', 'penalty', 'refund', 'adjustment');--> statement-breakpoint
CREATE TYPE IF NOT EXISTS "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE IF NOT EXISTS "public"."vehicle_type" AS ENUM('car', 'motorcycle', 'truck', 'van', 'other');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"stationId" integer,
	"type" "alert_type" DEFAULT 'info' NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text,
	"severity" "alert_severity" DEFAULT 'low' NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"stationId" integer NOT NULL,
	"userId" integer,
	"guestName" varchar(255),
	"guestEmail" varchar(320),
	"vehiclePlate" varchar(20),
	"vehicleType" "vehicle_type" DEFAULT 'car' NOT NULL,
	"startTime" bigint NOT NULL,
	"endTime" bigint NOT NULL,
	"durationHours" numeric(6, 2) NOT NULL,
	"amountDue" numeric(10, 2) NOT NULL,
	"status" "booking_status" DEFAULT 'confirmed' NOT NULL,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "parking_stations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" varchar(500) NOT NULL,
	"description" text,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"pricePerHour" numeric(8, 2) NOT NULL,
	"totalSpots" integer DEFAULT 0 NOT NULL,
	"availableSpots" integer DEFAULT 0 NOT NULL,
	"imageUrl" varchar(1000),
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "revenue_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"stationId" integer NOT NULL,
	"bookingId" integer,
	"amount" numeric(10, 2) NOT NULL,
	"type" "revenue_type" DEFAULT 'booking' NOT NULL,
	"description" varchar(500),
	"recordedAt" bigint NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
