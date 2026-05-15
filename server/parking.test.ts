import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  listParkingStations: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "Test Parking",
      address: "123 Test St",
      description: "A test parking station",
      latitude: "40.7484",
      longitude: "-73.9967",
      pricePerHour: "8.50",
      totalSpots: 100,
      availableSpots: 45,
      imageUrl: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getParkingStationById: vi.fn().mockResolvedValue({
    id: 1,
    name: "Test Parking",
    address: "123 Test St",
    description: "A test parking station",
    latitude: "40.7484",
    longitude: "-73.9967",
    pricePerHour: "8.50",
    totalSpots: 100,
    availableSpots: 45,
    imageUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  createParkingStation: vi.fn().mockResolvedValue(42),
  updateParkingStation: vi.fn().mockResolvedValue(undefined),
  deleteParkingStation: vi.fn().mockResolvedValue(undefined),
  seedParkingStations: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAuthCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("parking.list", () => {
  it("returns list of parking stations for public users", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.parking.list({});
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("name");
    expect(result[0]).toHaveProperty("pricePerHour");
  });

  it("accepts filter parameters", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.parking.list({
      search: "test",
      minPrice: 5,
      maxPrice: 15,
      availableOnly: true,
    });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("parking.getById", () => {
  it("returns a single station by id", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.parking.getById({ id: 1 });
    expect(result).toBeDefined();
    expect(result?.id).toBe(1);
    expect(result?.name).toBe("Test Parking");
  });
});

describe("parking.create", () => {
  it("creates a new station when authenticated", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    const result = await caller.parking.create({
      name: "New Parking",
      address: "456 New St, New York, NY",
      latitude: "40.7500",
      longitude: "-74.0000",
      pricePerHour: "10.00",
      totalSpots: 50,
      availableSpots: 25,
      isActive: true,
    });
    expect(result).toHaveProperty("id");
    expect(result.id).toBe(42);
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(
      caller.parking.create({
        name: "New Parking",
        address: "456 New St",
        latitude: "40.7500",
        longitude: "-74.0000",
        pricePerHour: "10.00",
        totalSpots: 50,
        availableSpots: 25,
        isActive: true,
      })
    ).rejects.toThrow();
  });
});

describe("parking.update", () => {
  it("updates a station when authenticated", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    const result = await caller.parking.update({
      id: 1,
      name: "Updated Parking",
      pricePerHour: "12.00",
    });
    expect(result).toEqual({ success: true });
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(
      caller.parking.update({ id: 1, name: "Updated" })
    ).rejects.toThrow();
  });
});

describe("parking.delete", () => {
  it("soft-deletes a station when authenticated", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    const result = await caller.parking.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.parking.delete({ id: 1 })).rejects.toThrow();
  });
});

describe("parking.seed", () => {
  it("seeds the database successfully", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.parking.seed();
    expect(result).toEqual({ success: true });
  });
});
