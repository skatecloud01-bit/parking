import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Search, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, MapPin, DollarSign, Car, Loader2, X, ParkingSquare } from "lucide-react";
import { toast } from "sonner";

interface StationForm {
  name: string;
  address: string;
  description: string;
  latitude: string;
  longitude: string;
  pricePerHour: string;
  totalSpots: number;
  availableSpots: number;
  imageUrl: string;
  isActive: boolean;
}

const EMPTY_FORM: StationForm = { name: "", address: "", description: "", latitude: "", longitude: "", pricePerHour: "", totalSpots: 0, availableSpots: 0, imageUrl: "", isActive: true };

function StationFormModal({ initial, onClose, onSaved }: { initial?: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<StationForm>(initial ? {
    name: initial.name, address: initial.address, description: initial.description ?? "",
    latitude: String(initial.latitude), longitude: String(initial.longitude),
    pricePerHour: String(initial.pricePerHour), totalSpots: initial.totalSpots,
    availableSpots: initial.availableSpots, imageUrl: initial.imageUrl ?? "", isActive: initial.isActive,
  } : EMPTY_FORM);

  const createStation = trpc.parking.create.useMutation({ onSuccess: () => { toast.success("Station created"); onSaved(); onClose(); }, onError: e => toast.error(e.message) });
  const updateStation = trpc.parking.update.useMutation({ onSuccess: () => { toast.success("Station updated"); onSaved(); onClose(); }, onError: e => toast.error(e.message) });

  const isPending = createStation.isPending || updateStation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, totalSpots: Number(form.totalSpots), availableSpots: Number(form.availableSpots), imageUrl: form.imageUrl || undefined };
    if (initial) updateStation.mutate({ id: initial.id, ...payload });
    else createStation.mutate(payload);
  };

  const f = (field: keyof StationForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm(v => ({ ...v, [field]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">{initial ? "Edit Station" : "Add New Station"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Station Name *</label>
            <input required value={form.name} onChange={f("name")} placeholder="e.g. Downtown Central Parking" className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.58_0.22_27)]/30 focus:border-[oklch(0.58_0.22_27)]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Address *</label>
            <input required value={form.address} onChange={f("address")} placeholder="100 Main Street, New York, NY 10001" className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.58_0.22_27)]/30 focus:border-[oklch(0.58_0.22_27)]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
            <textarea value={form.description} onChange={f("description")} rows={2} placeholder="Brief description of the parking facility..." className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.58_0.22_27)]/30 focus:border-[oklch(0.58_0.22_27)] resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Latitude *</label>
              <input required value={form.latitude} onChange={f("latitude")} placeholder="40.7484" className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.58_0.22_27)]/30 focus:border-[oklch(0.58_0.22_27)]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Longitude *</label>
              <input required value={form.longitude} onChange={f("longitude")} placeholder="-73.9967" className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.58_0.22_27)]/30 focus:border-[oklch(0.58_0.22_27)]" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Price/Hour ($) *</label>
              <input required value={form.pricePerHour} onChange={f("pricePerHour")} placeholder="8.50" className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.58_0.22_27)]/30 focus:border-[oklch(0.58_0.22_27)]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Total Spots *</label>
              <input required type="number" min={0} value={form.totalSpots} onChange={f("totalSpots")} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.58_0.22_27)]/30 focus:border-[oklch(0.58_0.22_27)]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Available Spots</label>
              <input type="number" min={0} value={form.availableSpots} onChange={f("availableSpots")} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.58_0.22_27)]/30 focus:border-[oklch(0.58_0.22_27)]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Image URL</label>
            <input value={form.imageUrl} onChange={f("imageUrl")} placeholder="https://images.unsplash.com/..." className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.58_0.22_27)]/30 focus:border-[oklch(0.58_0.22_27)]" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-foreground">Active</label>
            <button type="button" onClick={() => setForm(v => ({ ...v, isActive: !v.isActive }))} className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? "bg-[oklch(0.58_0.22_27)]" : "bg-muted"}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-[oklch(0.58_0.22_27)] text-white rounded-xl text-sm font-medium hover:bg-[oklch(0.52_0.22_27)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {initial ? "Save Changes" : "Create Station"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Stations() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editStation, setEditStation] = useState<any>(null);
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: stations = [], isLoading } = trpc.parking.list.useQuery({ includeInactive: true });
  const { data: stationPerf = [] } = trpc.analytics.stationPerformance.useQuery();

  const deleteStation = trpc.parking.delete.useMutation({
    onSuccess: () => { utils.parking.list.invalidate(); toast.success("Station deactivated"); },
    onError: e => toast.error(e.message),
  });

  const toggleActive = trpc.parking.update.useMutation({
    onSuccess: () => { utils.parking.list.invalidate(); toast.success("Station status updated"); },
    onError: e => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    if (!search) return stations;
    const q = search.toLowerCase();
    return stations.filter(s => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q));
  }, [stations, search]);

  const perfMap = useMemo(() => {
    const m: Record<number, typeof stationPerf[0]> = {};
    stationPerf.forEach(p => { m[p.stationId] = p; });
    return m;
  }, [stationPerf]);

  const occupancyColor = (rate: number) => {
    if (rate >= 90) return "text-red-600";
    if (rate >= 70) return "text-orange-500";
    return "text-green-600";
  };

  return (
    <div className="h-full overflow-y-auto bg-[oklch(0.98_0.005_27)]">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Stations</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{stations.filter(s => s.isActive).length} active · {stations.length} total</p>
          </div>
          {isAuthenticated && (
            <button onClick={() => { setEditStation(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-[oklch(0.58_0.22_27)] text-white rounded-xl text-sm font-medium hover:bg-[oklch(0.52_0.22_27)] transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              Add Station
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-sm mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stations..." className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.58_0.22_27)]/30 focus:border-[oklch(0.58_0.22_27)] bg-white" />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-white rounded-2xl h-[280px] animate-pulse border border-border" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ParkingSquare className="w-10 h-10 mb-3 opacity-30" />
            <p>No stations found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(station => {
              const perf = perfMap[station.id];
              const occupancy = perf?.occupancyRate ?? (station.totalSpots > 0 ? Math.round(((station.totalSpots - station.availableSpots) / station.totalSpots) * 100) : 0);
              return (
                <div key={station.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-shadow hover:shadow-md ${!station.isActive ? "opacity-60" : "border-border"}`}>
                  {/* Image */}
                  <div className="relative h-40 bg-muted overflow-hidden">
                    {station.imageUrl ? (
                      <img src={station.imageUrl} alt={station.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ParkingSquare className="w-10 h-10 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${station.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {station.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-2.5 py-1 text-sm font-bold text-foreground shadow-sm">
                      ${station.pricePerHour}/hr
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground mb-0.5 truncate">{station.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                      <MapPin className="w-3 h-3 flex-none" />
                      <span className="truncate">{station.address}</span>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center bg-muted/40 rounded-lg py-2">
                        <p className="text-sm font-bold text-foreground">{station.availableSpots}</p>
                        <p className="text-[10px] text-muted-foreground">Available</p>
                      </div>
                      <div className="text-center bg-muted/40 rounded-lg py-2">
                        <p className="text-sm font-bold text-foreground">{station.totalSpots}</p>
                        <p className="text-[10px] text-muted-foreground">Total</p>
                      </div>
                      <div className="text-center bg-muted/40 rounded-lg py-2">
                        <p className={`text-sm font-bold ${occupancyColor(occupancy)}`}>{occupancy}%</p>
                        <p className="text-[10px] text-muted-foreground">Full</p>
                      </div>
                    </div>

                    {/* Occupancy bar */}
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                      <div className={`h-full rounded-full transition-all ${occupancy >= 90 ? "bg-red-500" : occupancy >= 70 ? "bg-orange-400" : "bg-green-500"}`} style={{ width: `${occupancy}%` }} />
                    </div>

                    {/* Revenue */}
                    {perf && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                        <span>30d Revenue: <span className="font-semibold text-foreground">${perf.totalRevenue.toFixed(2)}</span></span>
                        <span>Bookings: <span className="font-semibold text-foreground">{perf.totalBookings}</span></span>
                      </div>
                    )}

                    {/* Actions */}
                    {isAuthenticated && (
                      <div className="flex gap-2">
                        <button onClick={() => { setEditStation(station); setShowForm(true); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium border border-border rounded-xl hover:bg-muted transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button onClick={() => toggleActive.mutate({ id: station.id, isActive: !station.isActive })} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium border rounded-xl transition-colors ${station.isActive ? "border-orange-200 text-orange-600 hover:bg-orange-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}>
                          {station.isActive ? <ToggleLeft className="w-3.5 h-3.5" /> : <ToggleRight className="w-3.5 h-3.5" />}
                          {station.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button onClick={() => { if (confirm(`Delete "${station.name}"?`)) deleteStation.mutate({ id: station.id }); }} className="p-2 text-red-500 border border-red-100 rounded-xl hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && <StationFormModal initial={editStation} onClose={() => { setShowForm(false); setEditStation(null); }} onSaved={() => utils.parking.list.invalidate()} />}
    </div>
  );
}
