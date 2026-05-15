import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  DollarSign, CalendarCheck, ParkingSquare, TrendingUp,
  TrendingDown, Users, AlertCircle, CheckCircle2, XCircle
} from "lucide-react";

const PRIMARY = "oklch(0.58 0.22 27)";
const COLORS = ["#FF5A5F", "#FF8C69", "#FFB347", "#87CEEB", "#98FB98", "#DDA0DD", "#F0E68C", "#20B2AA", "#778899", "#BC8F8F"];

function StatCard({ title, value, sub, icon: Icon, trend, color = "text-foreground" }: {
  title: string; value: string; sub?: string; icon: any; trend?: number; color?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-[oklch(0.97_0.01_27)] flex items-center justify-center">
          <Icon className="w-5 h-5 text-[oklch(0.58_0.22_27)]" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trend >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground mb-0.5">{value}</p>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl shadow-lg p-3 text-sm">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="text-xs">
          {p.name}: {p.name === "revenue" ? `$${Number(p.value).toFixed(2)}` : p.value}
        </p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [revDays, setRevDays] = useState(30);
  const utils = trpc.useUtils();

  const { data: kpis, isLoading: kpisLoading } = trpc.analytics.kpis.useQuery();
  const { data: revSeries = [], isLoading: revLoading } = trpc.analytics.revenueSeries.useQuery({ days: revDays });
  const { data: stationPerf = [], isLoading: perfLoading } = trpc.analytics.stationPerformance.useQuery();
  const { data: recentBookings = [] } = trpc.bookings.list.useQuery({ limit: 5 });
  const { data: alerts = [] } = trpc.alerts.list.useQuery({ unreadOnly: false });

  const seedBookings = trpc.bookings.seed.useMutation({
    onSuccess: () => {
      utils.analytics.kpis.invalidate();
      utils.analytics.revenueSeries.invalidate();
      utils.analytics.stationPerformance.invalidate();
      utils.bookings.list.invalidate();
      utils.alerts.list.invalidate();
    }
  });

  const markAllRead = trpc.alerts.markAllRead.useMutation({ onSuccess: () => utils.alerts.list.invalidate() });

  const pieData = stationPerf.slice(0, 6).map(s => ({ name: s.stationName.split(" ").slice(0, 2).join(" "), value: s.totalRevenue })).filter(d => d.value > 0);

  const statusColor = (status: string) => {
    const map: Record<string, string> = { confirmed: "bg-blue-100 text-blue-700", active: "bg-green-100 text-green-700", completed: "bg-gray-100 text-gray-600", cancelled: "bg-red-100 text-red-600", pending: "bg-yellow-100 text-yellow-700" };
    return map[status] ?? "bg-gray-100 text-gray-600";
  };

  const alertSeverityColor = (severity: string) => {
    const map: Record<string, string> = { critical: "text-red-600", high: "text-orange-500", medium: "text-yellow-600", low: "text-blue-500" };
    return map[severity] ?? "text-gray-500";
  };

  return (
    <div className="h-full overflow-y-auto bg-[oklch(0.98_0.005_27)]">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Overview of your parking network performance</p>
          </div>
          <div className="flex items-center gap-2">
            {recentBookings.length === 0 && (
              <button
                onClick={() => seedBookings.mutate()}
                disabled={seedBookings.isPending}
                className="px-4 py-2 text-sm font-medium bg-[oklch(0.58_0.22_27)] text-white rounded-xl hover:bg-[oklch(0.52_0.22_27)] transition-colors disabled:opacity-50"
              >
                {seedBookings.isPending ? "Seeding..." : "Load Sample Data"}
              </button>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpisLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-border h-[120px] animate-pulse" />
            ))
          ) : (
            <>
              <StatCard title="Total Revenue (30d)" value={`$${Number(kpis?.totalRevenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub="vs. prior 30 days" icon={DollarSign} trend={kpis?.revenueChange} />
              <StatCard title="Bookings (30d)" value={String(kpis?.totalBookings ?? 0)} sub="Non-cancelled reservations" icon={CalendarCheck} trend={kpis?.bookingChange} />
              <StatCard title="Active Stations" value={`${kpis?.activeStations ?? 0} / ${kpis?.totalStations ?? 0}`} sub="Operational locations" icon={ParkingSquare} />
              <StatCard title="Avg Occupancy" value={`${kpis?.avgOccupancy ?? 0}%`} sub={`${kpis?.availableSpots ?? 0} of ${kpis?.totalSpots ?? 0} spots free`} icon={Users} trend={undefined} />
            </>
          )}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Revenue area chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Revenue Over Time</h2>
                <p className="text-xs text-muted-foreground">Daily revenue from bookings</p>
              </div>
              <div className="flex gap-1">
                {[7, 14, 30, 60].map(d => (
                  <button key={d} onClick={() => setRevDays(d)} className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${revDays === d ? "bg-[oklch(0.58_0.22_27)] text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                    {d}d
                  </button>
                ))}
              </div>
            </div>
            {revLoading ? (
              <div className="h-[200px] bg-muted animate-pulse rounded-xl" />
            ) : revSeries.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No revenue data yet. Load sample data above.</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={revSeries} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF5A5F" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#FF5A5F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" name="revenue" stroke="#FF5A5F" strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Revenue by station pie */}
          <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground mb-1">Revenue by Station</h2>
            <p className="text-xs text-muted-foreground mb-4">Top 6 stations (30d)</p>
            {pieData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm text-center">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Station performance + bookings + alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Station performance table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Station Performance (30d)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Station</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Revenue</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bookings</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Occupancy</th>
                  </tr>
                </thead>
                <tbody>
                  {perfLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-border">
                        <td className="px-5 py-3"><div className="h-4 bg-muted animate-pulse rounded w-3/4" /></td>
                        <td className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded w-16 ml-auto" /></td>
                        <td className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded w-10 ml-auto" /></td>
                        <td className="px-5 py-3"><div className="h-4 bg-muted animate-pulse rounded w-12 ml-auto" /></td>
                      </tr>
                    ))
                  ) : stationPerf.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground text-sm">No data available</td></tr>
                  ) : (
                    stationPerf.map(s => (
                      <tr key={s.stationId} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-medium text-foreground text-sm truncate max-w-[200px]">{s.stationName}</p>
                          <p className="text-xs text-muted-foreground">{s.availableSpots}/{s.totalSpots} spots free</p>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">${s.totalRevenue.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{s.totalBookings}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-[oklch(0.58_0.22_27)] rounded-full" style={{ width: `${s.occupancyRate}%` }} />
                            </div>
                            <span className="text-xs font-medium text-foreground w-8 text-right">{s.occupancyRate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right column: recent bookings + alerts */}
          <div className="flex flex-col gap-4">
            {/* Recent bookings */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Recent Bookings</h2>
                <a href="/bookings" className="text-xs text-[oklch(0.58_0.22_27)] font-medium hover:underline">View all</a>
              </div>
              <div className="divide-y divide-border">
                {recentBookings.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-muted-foreground text-center">No bookings yet</p>
                ) : recentBookings.slice(0, 5).map(b => (
                  <div key={b.id} className="px-5 py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{b.guestName ?? "Guest"}</p>
                      <p className="text-xs text-muted-foreground">{b.vehiclePlate}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-none">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(b.status)}`}>{b.status}</span>
                      <span className="text-xs font-semibold text-foreground">${Number(b.amountDue).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Alerts</h2>
                {alerts.some(a => !a.isRead) && (
                  <button onClick={() => markAllRead.mutate()} className="text-xs text-[oklch(0.58_0.22_27)] font-medium hover:underline">Mark all read</button>
                )}
              </div>
              <div className="divide-y divide-border max-h-[220px] overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-muted-foreground text-center">No alerts</p>
                ) : alerts.slice(0, 6).map(a => (
                  <div key={a.id} className={`px-5 py-3 flex gap-3 ${!a.isRead ? "bg-orange-50/50" : ""}`}>
                    <AlertCircle className={`w-4 h-4 mt-0.5 flex-none ${alertSeverityColor(a.severity)}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bookings bar chart */}
        <div className="mt-4 bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-1">Daily Bookings</h2>
          <p className="text-xs text-muted-foreground mb-4">Number of bookings per day</p>
          {revSeries.length === 0 ? (
            <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={revSeries} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="bookings" name="bookings" fill="#FF5A5F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
