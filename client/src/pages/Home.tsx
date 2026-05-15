import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { ParkingStation } from "../../../drizzle/schema";
import { MapPin, Search, SlidersHorizontal, Plus, Car, X, LogIn, LogOut, ParkingSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MapView } from "@/components/Map";
import StationCard from "@/components/StationCard";
import StationDetailModal from "@/components/StationDetailModal";
import ManageStationModal from "@/components/ManageStationModal";
import FilterPanel from "@/components/FilterPanel";

export interface FilterState {
  search: string;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  availableOnly: boolean;
}

export default function Home() {
  const { isAuthenticated, logout } = useAuth();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailStation, setDetailStation] = useState<ParkingStation | null>(null);
  const [manageStation, setManageStation] = useState<ParkingStation | "new" | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    minPrice: undefined,
    maxPrice: undefined,
    availableOnly: false,
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mapReady, setMapReady] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<number, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const listRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const seededRef = useRef(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 350);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const queryInput = {
    search: debouncedSearch || undefined,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    availableOnly: filters.availableOnly || undefined,
  };

  const { data: stations = [], isLoading, refetch } = trpc.parking.list.useQuery(queryInput);

  const seedMutation = trpc.parking.seed.useMutation({
    onSuccess: () => refetch(),
  });

  // Auto-seed once on first load
  useEffect(() => {
    if (!seededRef.current) {
      seededRef.current = true;
      seedMutation.mutate();
    }
  }, []);

  // Render price-bubble markers on map
  const renderMarkers = useCallback(() => {
    if (!mapRef.current || !window.google?.maps?.marker) return;

    // Clear existing markers
    markersRef.current.forEach(m => { m.map = null; });
    markersRef.current.clear();

    stations.forEach((station) => {
      const lat = parseFloat(String(station.latitude));
      const lng = parseFloat(String(station.longitude));
      if (isNaN(lat) || isNaN(lng)) return;

      const isAvailable = station.availableSpots > 0;
      const isActive = station.id === selectedId;

      const pinEl = document.createElement("div");
      pinEl.className = `price-pin${isActive ? " active" : ""}${!isAvailable ? " unavailable" : ""}`;
      pinEl.textContent = `$${parseFloat(String(station.pricePerHour)).toFixed(0)}/hr`;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current!,
        position: { lat, lng },
        title: station.name,
        content: pinEl,
      });

      marker.addListener("gmp-click", () => {
        handleSelectStation(station.id);
        const s = stations.find(st => st.id === station.id);
        if (s) setDetailStation(s);
      });

      markersRef.current.set(station.id, marker);
    });
  }, [stations, selectedId, mapReady]);

  useEffect(() => {
    renderMarkers();
  }, [renderMarkers]);

  const handleSelectStation = useCallback((id: number) => {
    setSelectedId(id);

    // Pan map to station
    const station = stations.find(s => s.id === id);
    if (station && mapRef.current) {
      const lat = parseFloat(String(station.latitude));
      const lng = parseFloat(String(station.longitude));
      mapRef.current.panTo({ lat, lng });
      mapRef.current.setZoom(15);
    }

    // Scroll sidebar to card
    setTimeout(() => {
      const cardEl = cardRefs.current.get(id);
      if (cardEl && listRef.current) {
        cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 50);
  }, [stations]);

  const handleCardClick = (station: ParkingStation) => {
    handleSelectStation(station.id);
    setDetailStation(station);
  };

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    setMapReady(true);
  };

  const handleAddStation = () => {
    if (!isAuthenticated) {
      toast.info("Please sign in to add a parking station", {
        action: { label: "Sign in", onClick: () => window.location.href = getLoginUrl() },
      });
      return;
    }
    setManageStation("new");
  };

  const activeFiltersCount = [
    filters.minPrice !== undefined,
    filters.maxPrice !== undefined,
    filters.availableOnly,
  ].filter(Boolean).length;

  const clearAllFilters = () =>
    setFilters({ search: "", minPrice: undefined, maxPrice: undefined, availableOnly: false });

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ── Top Nav ── */}
      <header className="flex-none h-[62px] border-b border-border bg-white flex items-center px-4 md:px-6 gap-3 z-30 shadow-[0_1px_3px_oklch(0_0_0/0.06)]">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-xl bg-[oklch(0.58_0.22_27)] flex items-center justify-center shadow-sm">
            <ParkingSquare className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-bold text-[17px] tracking-tight text-foreground hidden sm:block">
            ParkFinder
          </span>
        </a>

        {/* Search bar */}
        <div className="flex-1 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name or address..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="pl-9 h-10 bg-muted/40 border-border/60 rounded-full text-sm focus-visible:ring-1 focus-visible:ring-[oklch(0.58_0.22_27)] focus-visible:border-[oklch(0.58_0.22_27)]"
            />
            {filters.search && (
              <button
                onClick={() => setFilters(f => ({ ...f, search: "" }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter button */}
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-1.5 px-3.5 h-10 rounded-full border text-sm font-medium transition-all flex-shrink-0 hover:scale-[1.02] active:scale-[0.98]
            ${showFilters || activeFiltersCount > 0
              ? "border-foreground bg-foreground text-white shadow-sm"
              : "border-border bg-white text-foreground hover:border-foreground/60"
            }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[oklch(0.58_0.22_27)] text-white text-[10px] flex items-center justify-center font-bold">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Add Station + Auth */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={handleAddStation}
            className="bg-[oklch(0.58_0.22_27)] hover:bg-[oklch(0.50_0.20_27)] text-white rounded-full h-9 px-4 text-sm font-semibold hidden sm:flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Station
          </Button>
          <button
            onClick={handleAddStation}
            className="sm:hidden w-9 h-9 rounded-full bg-[oklch(0.58_0.22_27)] text-white flex items-center justify-center shadow-sm"
          >
            <Plus className="w-4 h-4" />
          </button>

          {isAuthenticated ? (
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 h-9 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/60 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign out</span>
            </button>
          ) : (
            <a
              href={getLoginUrl()}
              className="flex items-center gap-1.5 px-3 h-9 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/60 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign in</span>
            </a>
          )}
        </div>
      </header>

      {/* ── Filter Panel ── */}
      {showFilters && (
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* ── Main Split-Screen ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Sidebar ── */}
        <div className="w-full md:w-[400px] lg:w-[440px] flex-none flex flex-col bg-white border-r border-border overflow-hidden">
          {/* Sidebar header */}
          <div className="flex-none px-5 py-3.5 border-b border-border bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[14px] font-semibold text-foreground">
                  {isLoading
                    ? "Loading stations..."
                    : `${stations.length} parking station${stations.length !== 1 ? "s" : ""}`}
                </h1>
                {(debouncedSearch || activeFiltersCount > 0) && !isLoading && (
                  <p className="text-[12px] text-muted-foreground mt-0.5">Filtered results</p>
                )}
              </div>
              {(debouncedSearch || activeFiltersCount > 0) && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-[oklch(0.58_0.22_27)] font-medium hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Station list */}
          <div ref={listRef} className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <StationCardSkeleton key={i} />)
            ) : stations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Car className="w-7 h-7 text-muted-foreground/50" />
                </div>
                <p className="font-semibold text-foreground">No stations found</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
                  Try adjusting your search or filters
                </p>
                {(debouncedSearch || activeFiltersCount > 0) && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-4 text-sm text-[oklch(0.58_0.22_27)] font-medium hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              stations.map(station => (
                <div
                  key={station.id}
                  ref={el => { if (el) cardRefs.current.set(station.id, el); }}
                >
                  <StationCard
                    station={station}
                    isActive={selectedId === station.id}
                    onClick={() => handleCardClick(station)}
                    onEdit={isAuthenticated ? () => setManageStation(station) : undefined}
                  />
                </div>
              ))
            )}
            {/* Bottom padding */}
            <div className="h-4" />
          </div>
        </div>

        {/* ── Right Map ── */}
        <div className="flex-1 relative hidden md:block">
          <MapView
            className="w-full h-full"
            initialCenter={{ lat: 40.7300, lng: -73.9950 }}
            initialZoom={12}
            onMapReady={handleMapReady}
          />

          {/* Station count pill */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg px-5 py-2.5 text-[13px] font-semibold text-foreground border border-border/60 pointer-events-none flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[oklch(0.58_0.22_27)]" />
            {stations.length} station{stations.length !== 1 ? "s" : ""} on map
          </div>

          {/* Deselect hint */}
          {selectedId && (
            <button
              onClick={() => { setSelectedId(null); mapRef.current?.setZoom(12); mapRef.current?.panTo({ lat: 40.7300, lng: -73.9950 }); }}
              className="absolute top-4 right-4 bg-white rounded-full shadow-md px-3.5 py-2 text-xs font-medium text-foreground border border-border/60 flex items-center gap-1.5 hover:border-foreground/40 transition-colors"
            >
              <X className="w-3 h-3" />
              Clear selection
            </button>
          )}
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {detailStation && (
        <StationDetailModal
          station={detailStation}
          onClose={() => { setDetailStation(null); setSelectedId(null); }}
          onEdit={isAuthenticated ? () => { setManageStation(detailStation); setDetailStation(null); } : undefined}
        />
      )}

      {/* ── Manage Modal ── */}
      {manageStation !== null && (
        <ManageStationModal
          station={manageStation === "new" ? null : manageStation}
          onClose={() => setManageStation(null)}
          onSuccess={() => {
            setManageStation(null);
            refetch();
            toast.success(manageStation === "new" ? "Station added successfully!" : "Station updated!");
          }}
          onDelete={() => {
            setManageStation(null);
            setSelectedId(null);
            setDetailStation(null);
            refetch();
            toast.success("Station deleted.");
          }}
        />
      )}
    </div>
  );
}

function StationCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border overflow-hidden animate-pulse">
      <div className="aspect-[16/9] bg-muted" />
      <div className="px-4 py-3.5 space-y-2.5">
        <div className="h-4 bg-muted rounded-full w-3/4" />
        <div className="h-3 bg-muted rounded-full w-1/2" />
        <div className="h-px bg-border/50 my-1" />
        <div className="h-3 bg-muted rounded-full w-1/3" />
      </div>
    </div>
  );
}
