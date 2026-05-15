import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Search, Plus, Car,
  X, Loader2, CalendarCheck
} from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS = ["all", "confirmed", "active", "completed", "cancelled", "pending"];

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  active: "bg-green-100 text-green-700 border-green-200",
  completed: "bg-gray-100 text-gray-600 border-gray-200",
  cancelled: "bg-red-100 text-red-600 border-red-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

function BookingFormModal({ stations, onClose, onCreated }: { stations: any[]; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    stationId: stations[0]?.id ?? 0,
    guestName: "",
    guestEmail: "",
    vehiclePlate: "",
    vehicleType: "car" as const,
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 2 * 3600000).toISOString().slice(0, 16),
    notes: "",
  });

  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Booking created! Amount: $${Number(data.amountDue).toFixed(2)}`);
      onCreated();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const station = stations.find(s => s.id === Number(form.stationId));
  const startMs = new Date(form.startDate).getTime();
  const endMs = new Date(form.endDate).getTime();
  const durationHrs = Math.max(0, (endMs - startMs) / 3600000);
  const estimate = station ? (parseFloat(station.pricePerHour) * durationHrs).toFixed(2) : "0.00";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guestName || !form.vehiclePlate) return toast.error("Name and plate are required");
    if (endMs <= startMs) return toast.error("End time must be after start time");
    createBooking.mutate({
      stationId: Number(form.stationId),
      guestName: form.guestName,
      guestEmail: form.guestEmail || undefined,
      vehiclePlate: form.vehiclePlate,
      vehicleType: form.vehicleType,
      startTime: startMs,
      endTime: endMs,
      notes: form.notes || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">New Booking</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Station</label>
            <select value={form.stationId} onChange={e => setForm(f => ({ ...f, stationId: Number(e.target.value) }))} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.58_0.22_27)]/30 focus:border-[oklch(0.58_0.22_27)] bg-white">
              {stations.map(s => <option key={s.id} value={s.id}>{s.name} — ${s.pricePerHour}/hr</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Guest Name *</label>
              <input value={form.guestName} onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))} placeholder="John Doe" className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.58_0.22_27)]/30 focus:border-[oklch(0.58_0.22_27)]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input value={form.guestEmail} onChange={e => setForm(f => ({ ...f, guestEmail: e.target.value }))} type="email" placeholder="john@example.com" className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.58_0.22_27)]/30 focus:border-[oklch(0.58_0.22_27)]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Vehicle Plate *</label>
              <input value={form.vehiclePlate} onChange={e => setForm(f => ({ ...f, vehiclePlate: e.target.value.toUpperCase() }))} placeholder="ABC-1234" className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.58_0.22_27)]/30 focus:border-[oklch(0.58_0.22_27)]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Vehicle Type</label>
              <select value={form.vehicleType} onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value as any }))} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.58_0.22_27)]/30 focus:border-[oklch(0.58_0.22_27)] bg-white">
                {["car", "motorcycle", "truck", "van", "other"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Start Time *</label>
              <input type="datetime-local" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.58_0.22_27)]/30 focus:border-[oklch(0.58_0.22_27)]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">End Time *</label>
              <input type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.58_0.22_27)]/30 focus:border-[oklch(0.58_0.22_27)]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special instructions..." rows={2} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.58_0.22_27)]/30 focus:border-[oklch(0.58_0.22_27)] resize-none" />
          </div>

          {/* Estimate */}
          <div className="bg-[oklch(0.97_0.01_27)] rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Duration: {durationHrs.toFixed(1)} hrs</p>
              <p className="text-xs text-muted-foreground">Rate: ${station?.pricePerHour ?? 0}/hr</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Estimated total</p>
              <p className="text-xl font-bold text-[oklch(0.58_0.22_27)]">${estimate}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={createBooking.isPending} className="flex-1 py-2.5 bg-[oklch(0.58_0.22_27)] text-white rounded-xl text-sm font-medium hover:bg-[oklch(0.52_0.22_27)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {createBooking.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Bookings() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: bookings = [], isLoading } = trpc.bookings.list.useQuery({ limit: 200 });
  const { data: stations = [] } = trpc.parking.list.useQuery({});

  const updateStatus = trpc.bookings.updateStatus.useMutation({
    onSuccess: () => {
      utils.bookings.list.invalidate();
      utils.analytics.kpis.invalidate();
      toast.success("Booking status updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (b.guestName?.toLowerCase().includes(q) || b.guestEmail?.toLowerCase().includes(q) || b.vehiclePlate?.toLowerCase().includes(q));
      }
      return true;
    });
  }, [bookings, statusFilter, search]);

  const stationName = (id: number) => stations.find(s => s.id === id)?.name ?? `Station #${id}`;

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: bookings.length };
    bookings.forEach(b => { c[b.status] = (c[b.status] ?? 0) + 1; });
    return c;
  }, [bookings]);

  return (
    <div className="h-full overflow-y-auto bg-[oklch(0.98_0.005_27)]">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{bookings.length} total reservations</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[oklch(0.58_0.22_27)] text-white rounded-xl text-sm font-medium hover:bg-[oklch(0.52_0.22_27)] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Booking
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, plate..."
              className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.58_0.22_27)]/30 focus:border-[oklch(0.58_0.22_27)] bg-white"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 text-xs font-medium rounded-xl border transition-colors ${statusFilter === s ? "bg-[oklch(0.58_0.22_27)] text-white border-[oklch(0.58_0.22_27)]" : "bg-white text-muted-foreground border-border hover:bg-muted"}`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
                {counts[s] !== undefined && <span className="ml-1 opacity-70">({counts[s]})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Guest</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Station</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vehicle</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Duration</th>
                  <th className="text-right px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-5 py-4"><div className="h-4 bg-muted animate-pulse rounded" /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                      <CalendarCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>No bookings found</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(b => (
                    <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-foreground">{b.guestName ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{b.guestEmail ?? ""}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm text-foreground truncate max-w-[160px]">{stationName(b.stationId)}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="font-mono text-xs font-medium text-foreground">{b.vehiclePlate}</span>
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">{b.vehicleType}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm text-foreground">{Number(b.durationHours).toFixed(1)}h</p>
                        <p className="text-xs text-muted-foreground">{new Date(b.startTime).toLocaleDateString()}</p>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-semibold text-foreground">${Number(b.amountDue).toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[b.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isAuthenticated && b.status !== "cancelled" && b.status !== "completed" && (
                          <div className="flex items-center justify-end gap-1.5">
                            {b.status === "confirmed" && (
                              <button
                                onClick={() => updateStatus.mutate({ id: b.id, status: "active" })}
                                className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                              >
                                Activate
                              </button>
                            )}
                            {b.status === "active" && (
                              <button
                                onClick={() => updateStatus.mutate({ id: b.id, status: "completed" })}
                                className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                Complete
                              </button>
                            )}
                            <button
                              onClick={() => { if (confirm("Cancel this booking?")) updateStatus.mutate({ id: b.id, status: "cancelled" }); }}
                              className="px-2.5 py-1 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && <BookingFormModal stations={stations} onClose={() => setShowForm(false)} onCreated={() => utils.bookings.list.invalidate()} />}
    </div>
  );
}
