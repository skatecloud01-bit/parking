import { and, eq, gte, lte, like, or, sql, desc, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser, users,
  parkingStations, InsertParkingStation, ParkingStation,
  bookings, InsertBooking, Booking,
  revenueEvents, InsertRevenueEvent,
  alerts, InsertAlert, Alert,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

// ─── Parking Station Helpers ──────────────────────────────────────────────────

export interface ParkingListParams {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  availableOnly?: boolean;
  includeInactive?: boolean;
}

export async function listParkingStations(params: ParkingListParams = {}): Promise<ParkingStation[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = params.includeInactive ? [] : [eq(parkingStations.isActive, true)];
  if (params.search) {
    const term = `%${params.search}%`;
    conditions.push(or(like(parkingStations.name, term), like(parkingStations.address, term), like(parkingStations.description, term))!);
  }
  if (params.minPrice !== undefined) conditions.push(gte(parkingStations.pricePerHour, String(params.minPrice)));
  if (params.maxPrice !== undefined) conditions.push(lte(parkingStations.pricePerHour, String(params.maxPrice)));
  if (params.availableOnly) conditions.push(sql`${parkingStations.availableSpots} > 0`);
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(parkingStations).where(where).orderBy(parkingStations.name);
}

export async function getParkingStationById(id: number): Promise<ParkingStation | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(parkingStations).where(eq(parkingStations.id, id)).limit(1);
  return result[0];
}

export async function createParkingStation(data: InsertParkingStation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(parkingStations).values(data).returning({ id: parkingStations.id });
  return result[0].id;
}

export async function updateParkingStation(id: number, data: Partial<InsertParkingStation>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(parkingStations).set(data).where(eq(parkingStations.id, id));
}

export async function deleteParkingStation(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(parkingStations).set({ isActive: false }).where(eq(parkingStations.id, id));
}

export async function countParkingStations(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(parkingStations).where(eq(parkingStations.isActive, true));
  return result[0]?.count ?? 0;
}

export async function seedParkingStations(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const count = await countParkingStations();
  if (count > 0) return;
  const stations: InsertParkingStation[] = [
    { name: "Downtown Central Parking", address: "100 Main Street, New York, NY 10001", description: "Premium covered parking in the heart of downtown. 24/7 security, EV charging stations available on levels 2 and 3.", latitude: "40.7484", longitude: "-73.9967", pricePerHour: "8.50", totalSpots: 250, availableSpots: 42, imageUrl: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&q=80", isActive: true },
    { name: "Midtown Express Park", address: "350 W 42nd Street, New York, NY 10036", description: "Convenient self-park facility near Times Square and the Theater District. Monthly passes available.", latitude: "40.7580", longitude: "-73.9855", pricePerHour: "12.00", totalSpots: 180, availableSpots: 0, imageUrl: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&q=80", isActive: true },
    { name: "Hudson Yards Garage", address: "500 W 30th Street, New York, NY 10001", description: "Modern multi-level garage adjacent to the Hudson Yards development. Valet available on weekends.", latitude: "40.7536", longitude: "-74.0019", pricePerHour: "10.00", totalSpots: 400, availableSpots: 115, imageUrl: "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=600&q=80", isActive: true },
    { name: "Chelsea Market Parking", address: "75 9th Avenue, New York, NY 10011", description: "Convenient parking steps from Chelsea Market and the High Line. Flat weekend rate available.", latitude: "40.7424", longitude: "-74.0048", pricePerHour: "7.00", totalSpots: 120, availableSpots: 28, imageUrl: "https://images.unsplash.com/photo-1555636222-cae831e670b3?w=600&q=80", isActive: true },
    { name: "Union Square Garage", address: "33 Union Square West, New York, NY 10003", description: "Underground parking beneath Union Square Park. Perfect for shopping and dining in the area.", latitude: "40.7359", longitude: "-73.9911", pricePerHour: "9.50", totalSpots: 200, availableSpots: 67, imageUrl: "https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?w=600&q=80", isActive: true },
    { name: "SoHo Street Level Lot", address: "180 Spring Street, New York, NY 10012", description: "Open-air parking lot in SoHo. Close to boutiques, galleries, and restaurants. Attendant on duty.", latitude: "40.7243", longitude: "-74.0018", pricePerHour: "6.00", totalSpots: 80, availableSpots: 15, imageUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&q=80", isActive: true },
    { name: "Upper East Side Parking", address: "1220 Lexington Avenue, New York, NY 10028", description: "Residential and commercial parking on the Upper East Side. Monthly rates available for residents.", latitude: "40.7772", longitude: "-73.9559", pricePerHour: "5.50", totalSpots: 150, availableSpots: 89, imageUrl: "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=600&q=80", isActive: true },
    { name: "Brooklyn Bridge Lot", address: "25 Cadman Plaza West, Brooklyn, NY 11201", description: "Scenic parking near the Brooklyn Bridge and DUMBO. Easy access to Manhattan via bridge or subway.", latitude: "40.6960", longitude: "-73.9937", pricePerHour: "4.50", totalSpots: 300, availableSpots: 142, imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80", isActive: true },
    { name: "Flatiron District Garage", address: "20 W 23rd Street, New York, NY 10010", description: "Centrally located garage near the Flatiron Building. Ideal for business and leisure visitors.", latitude: "40.7411", longitude: "-73.9897", pricePerHour: "11.00", totalSpots: 175, availableSpots: 0, imageUrl: "https://images.unsplash.com/photo-1565793979897-9a8b8e0c7e8c?w=600&q=80", isActive: true },
    { name: "Battery Park Waterfront Parking", address: "10 Battery Place, New York, NY 10004", description: "Waterfront parking near the Staten Island Ferry and Battery Park. Stunning harbor views.", latitude: "40.7033", longitude: "-74.0170", pricePerHour: "7.50", totalSpots: 220, availableSpots: 55, imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80", isActive: true },
  ];
  await db.insert(parkingStations).values(stations);
}

// ─── Bookings Helpers ─────────────────────────────────────────────────────────

export interface BookingListParams {
  stationId?: number;
  status?: string;
  search?: string;
  fromDate?: number;
  toDate?: number;
  limit?: number;
  offset?: number;
}

export async function listBookings(params: BookingListParams = {}): Promise<Booking[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (params.stationId) conditions.push(eq(bookings.stationId, params.stationId));
  if (params.status) conditions.push(eq(bookings.status, params.status as any));
  if (params.fromDate) conditions.push(gte(bookings.startTime, params.fromDate));
  if (params.toDate) conditions.push(lte(bookings.startTime, params.toDate));
  if (params.search) {
    const term = `%${params.search}%`;
    conditions.push(or(like(bookings.guestName, term), like(bookings.guestEmail, term), like(bookings.vehiclePlate, term))!);
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(bookings).where(where).orderBy(desc(bookings.createdAt)).limit(params.limit ?? 100).offset(params.offset ?? 0);
}

export async function getBookingById(id: number): Promise<Booking | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result[0];
}

export async function createBooking(data: InsertBooking): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bookings).values(data).returning({ id: bookings.id });
  const id = result[0].id;
  // Record revenue event
  await db.insert(revenueEvents).values({
    stationId: data.stationId,
    bookingId: id,
    amount: data.amountDue,
    type: "booking",
    description: `Booking #${id} - ${data.guestName ?? "Guest"}`,
    recordedAt: Date.now(),
  });
  // Decrement available spots
  await db.update(parkingStations)
    .set({ availableSpots: sql`GREATEST(0, ${parkingStations.availableSpots} - 1)` })
    .where(eq(parkingStations.id, data.stationId));
  return id;
}

export async function updateBookingStatus(id: number, status: Booking["status"]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const booking = await getBookingById(id);
  await db.update(bookings).set({ status }).where(eq(bookings.id, id));
  // Restore spot if cancelled/completed
  if ((status === "cancelled" || status === "completed") && booking && booking.status !== "cancelled" && booking.status !== "completed") {
    await db.update(parkingStations)
      .set({ availableSpots: sql`LEAST(${parkingStations.totalSpots}, ${parkingStations.availableSpots} + 1)` })
      .where(eq(parkingStations.id, booking.stationId));
  }
  // Refund revenue event if cancelled
  if (status === "cancelled" && booking) {
    await db.insert(revenueEvents).values({
      stationId: booking.stationId,
      bookingId: id,
      amount: `-${booking.amountDue}`,
      type: "refund",
      description: `Refund for cancelled booking #${id}`,
      recordedAt: Date.now(),
    });
  }
}

export async function countBookings(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(bookings).where(ne(bookings.status, "cancelled"));
  return result[0]?.count ?? 0;
}

// ─── Analytics Helpers ────────────────────────────────────────────────────────

export interface DashboardKPIs {
  totalRevenue: number;
  totalBookings: number;
  activeStations: number;
  totalStations: number;
  avgOccupancy: number;
  totalSpots: number;
  availableSpots: number;
  revenueChange: number;   // % vs prior period
  bookingChange: number;
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const db = await getDb();
  if (!db) return { totalRevenue: 0, totalBookings: 0, activeStations: 0, totalStations: 0, avgOccupancy: 0, totalSpots: 0, availableSpots: 0, revenueChange: 0, bookingChange: 0 };

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

  const [revResult] = await db.select({ total: sql<number>`COALESCE(SUM(CAST(amount AS NUMERIC(10,2))), 0)` }).from(revenueEvents).where(gte(revenueEvents.recordedAt, thirtyDaysAgo));
  const [prevRevResult] = await db.select({ total: sql<number>`COALESCE(SUM(CAST(amount AS NUMERIC(10,2))), 0)` }).from(revenueEvents).where(and(gte(revenueEvents.recordedAt, sixtyDaysAgo), lte(revenueEvents.recordedAt, thirtyDaysAgo)));

  const [bookResult] = await db.select({ count: sql<number>`count(*)` }).from(bookings).where(and(gte(bookings.createdAt, new Date(thirtyDaysAgo)), ne(bookings.status, "cancelled")));
  const [prevBookResult] = await db.select({ count: sql<number>`count(*)` }).from(bookings).where(and(gte(bookings.createdAt, new Date(sixtyDaysAgo)), lte(bookings.createdAt, new Date(thirtyDaysAgo)), ne(bookings.status, "cancelled")));

  const stationsResult = await db.select({ total: sql<number>`count(*)`, active: sql<number>`SUM(CASE WHEN ${parkingStations.isActive} THEN 1 ELSE 0 END)`, totalSpots: sql<number>`COALESCE(SUM(${parkingStations.totalSpots}), 0)`, availableSpots: sql<number>`COALESCE(SUM(${parkingStations.availableSpots}), 0)` }).from(parkingStations);

  const totalRevenue = Number(revResult?.total ?? 0);
  const prevRevenue = Number(prevRevResult?.total ?? 0);
  const totalBookings = Number(bookResult?.count ?? 0);
  const prevBookings = Number(prevBookResult?.count ?? 0);
  const totalSpots = Number(stationsResult[0]?.totalSpots ?? 0);
  const availableSpots = Number(stationsResult[0]?.availableSpots ?? 0);
  const occupiedSpots = totalSpots - availableSpots;
  const avgOccupancy = totalSpots > 0 ? Math.round((occupiedSpots / totalSpots) * 100) : 0;

  const revenueChange = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;
  const bookingChange = prevBookings > 0 ? Math.round(((totalBookings - prevBookings) / prevBookings) * 100) : 0;

  return {
    totalRevenue,
    totalBookings,
    activeStations: Number(stationsResult[0]?.active ?? 0),
    totalStations: Number(stationsResult[0]?.total ?? 0),
    avgOccupancy,
    totalSpots,
    availableSpots,
    revenueChange,
    bookingChange,
  };
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  bookings: number;
}

export async function getRevenueTimeSeries(days: number = 30): Promise<RevenueDataPoint[]> {
  const db = await getDb();
  if (!db) return [];
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const rows = await db.select({
    date: sql<string>`to_timestamp(${revenueEvents.recordedAt} / 1000.0)::date`,
    revenue: sql<number>`COALESCE(SUM(CAST(${revenueEvents.amount} AS NUMERIC(10,2))), 0)`,
    bookings: sql<number>`count(*)`,
  }).from(revenueEvents).where(and(gte(revenueEvents.recordedAt, since), eq(revenueEvents.type, "booking"))).groupBy(sql`to_timestamp(${revenueEvents.recordedAt} / 1000.0)::date`).orderBy(sql`to_timestamp(${revenueEvents.recordedAt} / 1000.0)::date`);
  return rows.map(r => ({ date: r.date, revenue: Number(r.revenue), bookings: Number(r.bookings) }));
}

export interface StationPerformance {
  stationId: number;
  stationName: string;
  totalRevenue: number;
  totalBookings: number;
  occupancyRate: number;
  availableSpots: number;
  totalSpots: number;
}

export async function getStationPerformance(): Promise<StationPerformance[]> {
  const db = await getDb();
  if (!db) return [];
  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const rows = await db.select({
    stationId: parkingStations.id,
    stationName: parkingStations.name,
    totalSpots: parkingStations.totalSpots,
    availableSpots: parkingStations.availableSpots,
    totalRevenue: sql<number>`COALESCE(SUM(CAST(re.amount AS NUMERIC(10,2))), 0)`,
    totalBookings: sql<number>`COUNT(DISTINCT b.id)`,
  }).from(parkingStations)
    .leftJoin(revenueEvents, and(eq(revenueEvents.stationId, parkingStations.id), gte(revenueEvents.recordedAt, since)))
    .leftJoin(bookings, and(eq(bookings.stationId, parkingStations.id), gte(bookings.createdAt, new Date(since)), ne(bookings.status, "cancelled")))
    .where(eq(parkingStations.isActive, true))
    .groupBy(parkingStations.id, parkingStations.name, parkingStations.totalSpots, parkingStations.availableSpots)
    .orderBy(desc(sql`COALESCE(SUM(CAST(re.amount AS NUMERIC(10,2))), 0)`));
  return rows.map(r => ({
    stationId: r.stationId,
    stationName: r.stationName,
    totalRevenue: Number(r.totalRevenue),
    totalBookings: Number(r.totalBookings),
    occupancyRate: r.totalSpots > 0 ? Math.round(((r.totalSpots - r.availableSpots) / r.totalSpots) * 100) : 0,
    availableSpots: r.availableSpots,
    totalSpots: r.totalSpots,
  }));
}

// ─── Alerts Helpers ───────────────────────────────────────────────────────────

export async function listAlerts(unreadOnly = false): Promise<Alert[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = unreadOnly ? [eq(alerts.isRead, false)] : [];
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(alerts).where(where).orderBy(desc(alerts.createdAt)).limit(50);
}

export async function createAlert(data: InsertAlert): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(alerts).values(data).returning({ id: alerts.id });
  return result[0].id;
}

export async function markAlertRead(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(alerts).set({ isRead: true }).where(eq(alerts.id, id));
}

export async function markAllAlertsRead(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(alerts).set({ isRead: true }).where(eq(alerts.isRead, false));
}

export async function seedBookingsAndRevenue(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select({ count: sql<number>`count(*)` }).from(bookings);
  if (Number(existing[0]?.count ?? 0) > 0) return;

  const stations = await listParkingStations();
  if (stations.length === 0) return;

  const names = ["Alice Johnson", "Bob Martinez", "Carol White", "David Lee", "Emma Davis", "Frank Wilson", "Grace Kim", "Henry Brown", "Iris Chen", "Jack Taylor"];
  const plates = ["ABC-1234", "XYZ-5678", "DEF-9012", "GHI-3456", "JKL-7890", "MNO-2345", "PQR-6789", "STU-0123", "VWX-4567", "YZA-8901"];
  const statuses: Booking["status"][] = ["completed", "completed", "completed", "completed", "cancelled", "confirmed", "active"];

  const bookingRows: InsertBooking[] = [];
  const revenueRows: InsertRevenueEvent[] = [];

  const now = Date.now();
  for (let i = 0; i < 120; i++) {
    const station = stations[i % stations.length];
    const daysAgo = Math.floor(Math.random() * 60);
    const startTime = now - daysAgo * 86400000 - Math.floor(Math.random() * 43200000);
    const durationHours = (Math.floor(Math.random() * 8) + 1);
    const endTime = startTime + durationHours * 3600000;
    const price = parseFloat(String(station.pricePerHour));
    const amount = (price * durationHours).toFixed(2);
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const name = names[i % names.length];
    bookingRows.push({
      stationId: station.id,
      guestName: name,
      guestEmail: `${name.toLowerCase().replace(" ", ".")}@example.com`,
      vehiclePlate: plates[i % plates.length],
      vehicleType: "car",
      startTime,
      endTime,
      durationHours: String(durationHours),
      amountDue: amount,
      status,
    });
    if (status !== "cancelled") {
      revenueRows.push({
        stationId: station.id,
        bookingId: 0, // placeholder
        amount,
        type: "booking",
        description: `Booking - ${name}`,
        recordedAt: startTime,
      });
    }
  }

  // Insert in batches
  for (let i = 0; i < bookingRows.length; i += 20) {
    await db.insert(bookings).values(bookingRows.slice(i, i + 20));
  }
  for (let i = 0; i < revenueRows.length; i += 20) {
    await db.insert(revenueEvents).values(revenueRows.slice(i, i + 20));
  }

  // Seed some alerts
  await db.insert(alerts).values([
    { stationId: stations[1]?.id, type: "full", title: "Station at full capacity", message: `${stations[1]?.name} has no available spots.`, severity: "high", isRead: false },
    { stationId: stations[3]?.id, type: "low_availability", title: "Low availability warning", message: `${stations[3]?.name} has fewer than 5 spots remaining.`, severity: "medium", isRead: false },
    { stationId: stations[8]?.id, type: "full", title: "Station at full capacity", message: `${stations[8]?.name} is fully occupied.`, severity: "high", isRead: false },
    { stationId: null, type: "info", title: "System maintenance scheduled", message: "Routine maintenance window: Sunday 2–4 AM.", severity: "low", isRead: true },
    { stationId: stations[0]?.id, type: "maintenance", title: "Level 3 elevator offline", message: "Elevator on level 3 is under repair. Expected back online in 2 hours.", severity: "medium", isRead: false },
  ]);
}
