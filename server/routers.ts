import { z } from "zod";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  listParkingStations, getParkingStationById, createParkingStation,
  updateParkingStation, deleteParkingStation, seedParkingStations,
  listBookings, getBookingById, createBooking, updateBookingStatus,
  getDashboardKPIs, getRevenueTimeSeries, getStationPerformance,
  listAlerts, createAlert, markAlertRead, markAllAlertsRead,
  seedBookingsAndRevenue, listUsers,
} from "./db";

// ─── Parking Stations ─────────────────────────────────────────────────────────

const parkingStationInput = z.object({
  name: z.string().min(1).max(255),
  address: z.string().min(1).max(500),
  description: z.string().optional(),
  latitude: z.string().regex(/^-?\d+(\.\d+)?$/),
  longitude: z.string().regex(/^-?\d+(\.\d+)?$/),
  pricePerHour: z.string().regex(/^\d+(\.\d{1,2})?$/),
  totalSpots: z.number().int().min(0),
  availableSpots: z.number().int().min(0),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().optional().default(true),
});

const parkingRouter = router({
  list: publicProcedure
    .input(z.object({ search: z.string().optional(), minPrice: z.number().optional(), maxPrice: z.number().optional(), availableOnly: z.boolean().optional(), includeInactive: z.boolean().optional() }).optional())
    .query(async ({ input }) => listParkingStations(input ?? {})),

  getById: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => getParkingStationById(input.id)),

  create: protectedProcedure.input(parkingStationInput).mutation(async ({ input }) => {
    const id = await createParkingStation(input);
    return { id };
  }),

  update: protectedProcedure.input(z.object({ id: z.number().int().positive() }).merge(parkingStationInput.partial())).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await updateParkingStation(id, data);
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    await deleteParkingStation(input.id);
    return { success: true };
  }),

  seed: publicProcedure.mutation(async () => {
    await seedParkingStations();
    return { success: true };
  }),
});

// ─── Bookings ─────────────────────────────────────────────────────────────────

const bookingsRouter = router({
  list: publicProcedure
    .input(z.object({
      stationId: z.number().optional(),
      status: z.string().optional(),
      search: z.string().optional(),
      fromDate: z.number().optional(),
      toDate: z.number().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional())
    .query(async ({ input }) => listBookings(input ?? {})),

  getById: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => getBookingById(input.id)),

  create: publicProcedure.input(z.object({
    stationId: z.number().int().positive(),
    guestName: z.string().min(1).max(255),
    guestEmail: z.string().email().optional().or(z.literal("")),
    vehiclePlate: z.string().min(1).max(20),
    vehicleType: z.enum(["car", "motorcycle", "truck", "van", "other"]).default("car"),
    startTime: z.number(),
    endTime: z.number(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    const durationMs = input.endTime - input.startTime;
    const durationHours = Math.max(0.5, durationMs / 3600000);
    const station = await getParkingStationById(input.stationId);
    if (!station) throw new Error("Station not found");
    const pricePerHour = parseFloat(String(station.pricePerHour));
    const amountDue = (pricePerHour * durationHours).toFixed(2);
    const id = await createBooking({
      stationId: input.stationId,
      guestName: input.guestName,
      guestEmail: input.guestEmail || null,
      vehiclePlate: input.vehiclePlate,
      vehicleType: input.vehicleType,
      startTime: input.startTime,
      endTime: input.endTime,
      durationHours: durationHours.toFixed(2),
      amountDue,
      status: "confirmed",
      notes: input.notes || null,
    });
    return { id, amountDue };
  }),

  updateStatus: protectedProcedure.input(z.object({
    id: z.number().int().positive(),
    status: z.enum(["pending", "confirmed", "active", "completed", "cancelled"]),
  })).mutation(async ({ input }) => {
    await updateBookingStatus(input.id, input.status);
    return { success: true };
  }),

  seed: publicProcedure.mutation(async () => {
    await seedBookingsAndRevenue();
    return { success: true };
  }),
});

// ─── Analytics ────────────────────────────────────────────────────────────────

const analyticsRouter = router({
  kpis: publicProcedure.query(async () => getDashboardKPIs()),

  revenueSeries: publicProcedure
    .input(z.object({ days: z.number().min(7).max(365).default(30) }).optional())
    .query(async ({ input }) => getRevenueTimeSeries(input?.days ?? 30)),

  stationPerformance: publicProcedure.query(async () => getStationPerformance()),
});

// ─── Alerts ───────────────────────────────────────────────────────────────────

const alertsRouter = router({
  list: publicProcedure.input(z.object({ unreadOnly: z.boolean().optional() }).optional()).query(async ({ input }) => listAlerts(input?.unreadOnly)),

  create: protectedProcedure.input(z.object({
    stationId: z.number().optional(),
    type: z.enum(["full", "low_availability", "offline", "maintenance", "info"]),
    title: z.string().min(1).max(255),
    message: z.string().optional(),
    severity: z.enum(["low", "medium", "high", "critical"]).default("low"),
  })).mutation(async ({ input }) => {
    const id = await createAlert(input);
    return { id };
  }),

  markRead: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    await markAlertRead(input.id);
    return { success: true };
  }),

  markAllRead: protectedProcedure.mutation(async () => {
    await markAllAlertsRead();
    return { success: true };
  }),
});

// ─── Admin ────────────────────────────────────────────────────────────────────

const adminRouter = router({
  users: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    return listUsers();
  }),
});

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    // Client-side logout is handled by supabase.auth.signOut().
    // This endpoint exists for cache invalidation.
    logout: publicProcedure.mutation(() => ({ success: true } as const)),
  }),
  parking: parkingRouter,
  bookings: bookingsRouter,
  analytics: analyticsRouter,
  alerts: alertsRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
