import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ComposedChart, Line
} from "recharts";
import { Download, TrendingUp, DollarSign, CalendarCheck, BarChart3 } from "lucide-react";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl shadow-lg p-3 text-sm">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="text-xs">
          {p.name}: {p.name === "revenue" || p.name === "Revenue" ? `$${Number(p.value).toFixed(2)}` : p.value}
        </p>
      ))}
    </div>
  );
}

export default function Reports() {
  const [days, setDays] = useState(30);

  const { data: revSeries = [], isLoading: revLoading } = trpc.analytics.revenueSeries.useQuery({ days });
  const { data: stationPerf = [], isLoading: perfLoading } = trpc.analytics.stationPerformance.useQuery();
  const { data: kpis } = trpc.analytics.kpis.useQuery();
  const { data: bookings = [] } = trpc.bookings.list.useQuery({ limit: 500 });

  // Compute summary stats
  const totalRev = revSeries.reduce((s, r) => s + r.revenue, 0);
  const totalBooks = revSeries.reduce((s, r) => s + r.bookings, 0);
  const avgDaily = revSeries.length > 0 ? totalRev / revSeries.length : 0;
  const peakDay = revSeries.reduce((max, r) => r.revenue > max.revenue ? r : max, { date: "—", revenue: 0, bookings: 0 });

  // Vehicle type breakdown
  const vehicleTypes = bookings.reduce((acc, b) => {
    acc[b.vehicleType] = (acc[b.vehicleType] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const vehicleData = Object.entries(vehicleTypes).map(([type, count]) => ({ type: type.charAt(0).toUpperCase() + type.slice(1), count }));

  // Status breakdown
  const statusBreakdown = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Export CSV
  const exportCSV = () => {
    const rows = [["Date", "Revenue ($)", "Bookings"]];
    revSeries.forEach(r => rows.push([r.date, r.revenue.toFixed(2), String(r.bookings)]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-report-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportBookingsCSV = () => {
    const rows = [["ID", "Guest", "Email", "Station ID", "Vehicle", "Plate", "Start", "End", "Hours", "Amount", "Status"]];
    bookings.forEach(b => rows.push([
      String(b.id), b.guestName ?? "", b.guestEmail ?? "", String(b.stationId),
      b.vehicleType, b.vehiclePlate ?? "", new Date(b.startTime).toISOString(),
      new Date(b.endTime).toISOString(), String(b.durationHours), String(b.amountDue), b.status
    ]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto bg-[oklch(0.98_0.005_27)]">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Revenue analytics and performance data</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium border border-border rounded-xl hover:bg-muted transition-colors bg-white">
              <Download className="w-4 h-4" />
              Revenue CSV
            </button>
            <button onClick={exportBookingsCSV} className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium border border-border rounded-xl hover:bg-muted transition-colors bg-white">
              <Download className="w-4 h-4" />
              Bookings CSV
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Period Revenue", value: `$${totalRev.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign },
            { label: "Period Bookings", value: String(totalBooks), icon: CalendarCheck },
            { label: "Avg Daily Revenue", value: `$${avgDaily.toFixed(2)}`, icon: TrendingUp },
            { label: "Peak Day", value: peakDay.date !== "—" ? `$${peakDay.revenue.toFixed(2)}` : "—", icon: BarChart3 },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl p-5 border border-border shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-[oklch(0.97_0.01_27)] flex items-center justify-center mb-3">
                <Icon className="w-4.5 h-4.5 text-[oklch(0.58_0.22_27)]" />
              </div>
              <p className="text-xl font-bold text-foreground">{value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Date range selector */}
        <div className="flex gap-1.5 mb-5">
          {[7, 14, 30, 60, 90].map(d => (
            <button key={d} onClick={() => setDays(d)} className={`px-3.5 py-2 text-sm font-medium rounded-xl transition-colors ${days === d ? "bg-[oklch(0.58_0.22_27)] text-white" : "bg-white border border-border text-muted-foreground hover:bg-muted"}`}>
              {d}d
            </button>
          ))}
        </div>

        {/* Revenue + bookings combined chart */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm mb-4">
          <h2 className="text-base font-semibold text-foreground mb-1">Revenue & Bookings Trend</h2>
          <p className="text-xs text-muted-foreground mb-4">Daily revenue (bars) and booking count (line)</p>
          {revLoading ? (
            <div className="h-[240px] bg-muted animate-pulse rounded-xl" />
          ) : revSeries.length === 0 ? (
            <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">No data for this period. Load sample data from the Dashboard.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={revSeries} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#FF5A5F" opacity={0.8} radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="bookings" name="Bookings" stroke="#4F46E5" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Station revenue + vehicle breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Station revenue bar */}
          <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground mb-1">Revenue by Station</h2>
            <p className="text-xs text-muted-foreground mb-4">30-day comparison</p>
            {perfLoading ? (
              <div className="h-[200px] bg-muted animate-pulse rounded-xl" />
            ) : stationPerf.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stationPerf.slice(0, 8).map(s => ({ name: s.stationName.split(" ").slice(0, 2).join(" "), revenue: s.totalRevenue }))} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
                  <Bar dataKey="revenue" fill="#FF5A5F" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Vehicle type breakdown */}
          <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground mb-1">Vehicle Type Breakdown</h2>
            <p className="text-xs text-muted-foreground mb-4">All-time booking distribution</p>
            {vehicleData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={vehicleData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Bookings" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Booking status breakdown */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-4">Booking Status Breakdown</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(statusBreakdown).map(([status, count]) => {
              const pct = bookings.length > 0 ? Math.round((count / bookings.length) * 100) : 0;
              const colors: Record<string, string> = { confirmed: "bg-blue-500", active: "bg-green-500", completed: "bg-gray-400", cancelled: "bg-red-400", pending: "bg-yellow-400" };
              return (
                <div key={status} className="flex items-center gap-3 bg-muted/40 rounded-xl px-4 py-3 min-w-[140px]">
                  <div className={`w-3 h-3 rounded-full ${colors[status] ?? "bg-gray-400"}`} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{count}</p>
                    <p className="text-xs text-muted-foreground capitalize">{status} ({pct}%)</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
