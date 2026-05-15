import {
  boolean,
  numeric,
  serial,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  bigint,
  integer,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const vehicleTypeEnum = pgEnum("vehicle_type", ["car", "motorcycle", "truck", "van", "other"]);
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "active", "completed", "cancelled"]);
export const revenueTypeEnum = pgEnum("revenue_type", ["booking", "penalty", "refund", "adjustment"]);
export const alertTypeEnum = pgEnum("alert_type", ["full", "low_availability", "offline", "maintenance", "info"]);
export const alertSeverityEnum = pgEnum("alert_severity", ["low", "medium", "high", "critical"]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const parkingStations = pgTable("parking_stations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: varchar("address", { length: 500 }).notNull(),
  description: text("description"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
  pricePerHour: numeric("pricePerHour", { precision: 8, scale: 2 }).notNull(),
  totalSpots: integer("totalSpots").notNull().default(0),
  availableSpots: integer("availableSpots").notNull().default(0),
  imageUrl: varchar("imageUrl", { length: 1000 }),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type ParkingStation = typeof parkingStations.$inferSelect;
export type InsertParkingStation = typeof parkingStations.$inferInsert;

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  stationId: integer("stationId").notNull(),
  userId: integer("userId"),
  guestName: varchar("guestName", { length: 255 }),
  guestEmail: varchar("guestEmail", { length: 320 }),
  vehiclePlate: varchar("vehiclePlate", { length: 20 }),
  vehicleType: vehicleTypeEnum("vehicleType").default("car").notNull(),
  startTime: bigint("startTime", { mode: "number" }).notNull(),
  endTime: bigint("endTime", { mode: "number" }).notNull(),
  durationHours: numeric("durationHours", { precision: 6, scale: 2 }).notNull(),
  amountDue: numeric("amountDue", { precision: 10, scale: 2 }).notNull(),
  status: bookingStatusEnum("status").default("confirmed").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

export const revenueEvents = pgTable("revenue_events", {
  id: serial("id").primaryKey(),
  stationId: integer("stationId").notNull(),
  bookingId: integer("bookingId"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  type: revenueTypeEnum("type").default("booking").notNull(),
  description: varchar("description", { length: 500 }),
  recordedAt: bigint("recordedAt", { mode: "number" }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type RevenueEvent = typeof revenueEvents.$inferSelect;
export type InsertRevenueEvent = typeof revenueEvents.$inferInsert;

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  stationId: integer("stationId"),
  type: alertTypeEnum("type").default("info").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  severity: alertSeverityEnum("severity").default("low").notNull(),
  isRead: boolean("isRead").notNull().default(false),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;
