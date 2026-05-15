import { ParkingStation } from "../../../drizzle/schema";
import { X, MapPin, Car, DollarSign, Edit2, Navigation, ParkingSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  station: ParkingStation;
  onClose: () => void;
  onEdit?: () => void;
}

function getAvailabilityInfo(station: ParkingStation) {
  const { availableSpots, totalSpots } = station;
  if (availableSpots === 0)
    return { label: "Fully Occupied", className: "badge-unavailable", dot: "bg-[oklch(0.58_0.22_27)]", pct: 0 };
  const ratio = availableSpots / totalSpots;
  if (ratio < 0.2)
    return { label: "Limited Availability", className: "badge-limited", dot: "bg-[oklch(0.65_0.18_70)]", pct: ratio };
  return { label: "Available", className: "badge-available", dot: "bg-[oklch(0.52_0.15_145)]", pct: ratio };
}

export default function StationDetailModal({ station, onClose, onEdit }: Props) {
  const avail = getAvailabilityInfo(station);
  const price = parseFloat(String(station.pricePerHour));
  const lat = parseFloat(String(station.latitude));
  const lng = parseFloat(String(station.longitude));
  const occupancyPct = Math.round((1 - avail.pct) * 100);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        {/* Hero Image */}
        <div className="relative h-60 flex-none overflow-hidden bg-muted">
          {station.imageUrl ? (
            <img
              src={station.imageUrl}
              alt={station.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50">
              <ParkingSquare className="w-20 h-20 text-slate-200" />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white transition-all hover:scale-105"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>

          {/* Price overlay — bottom left */}
          <div className="absolute bottom-4 left-4">
            <div className="bg-white/96 backdrop-blur-md rounded-2xl px-3.5 py-2.5 shadow-lg">
              <span className="text-2xl font-bold text-foreground">${price.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground ml-1">/hour</span>
            </div>
          </div>

          {/* Availability badge — bottom right */}
          <div className={`absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ${avail.className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${avail.dot}`} />
            {avail.label}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-6 pt-5 pb-2">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-1">
              <h2 className="text-xl font-bold text-foreground leading-tight">{station.name}</h2>
            </div>
            <div className="flex items-center gap-1.5 mb-5">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <p className="text-sm text-muted-foreground">{station.address}</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-muted/40 rounded-2xl p-3.5 text-center">
                <DollarSign className="w-4 h-4 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-lg font-bold text-foreground">${price.toFixed(2)}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Per hour</p>
              </div>
              <div className="bg-muted/40 rounded-2xl p-3.5 text-center">
                <Car className="w-4 h-4 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-lg font-bold text-foreground">{station.availableSpots}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Available</p>
              </div>
              <div className="bg-muted/40 rounded-2xl p-3.5 text-center">
                <ParkingSquare className="w-4 h-4 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-lg font-bold text-foreground">{station.totalSpots}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Total spots</p>
              </div>
            </div>

            {/* Occupancy bar */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium text-foreground">Occupancy</p>
                <p className="text-xs text-muted-foreground">{occupancyPct}% full</p>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    occupancyPct >= 80
                      ? "bg-[oklch(0.58_0.22_27)]"
                      : occupancyPct >= 50
                      ? "bg-[oklch(0.65_0.18_70)]"
                      : "bg-[oklch(0.52_0.15_145)]"
                  }`}
                  style={{ width: `${occupancyPct}%` }}
                />
              </div>
            </div>

            {/* Description */}
            {station.description && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-foreground mb-2">About this parking</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{station.description}</p>
              </div>
            )}

            {/* Coordinates */}
            <div className="mb-5 p-3.5 bg-muted/40 rounded-2xl flex items-center gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Coordinates</p>
                <p className="text-sm font-mono text-foreground">{lat.toFixed(6)}, {lng.toFixed(6)}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 px-6 pb-6">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-foreground text-white text-sm font-semibold hover:bg-foreground/90 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Navigation className="w-4 h-4" />
              Get Directions
            </a>
            {onEdit && (
              <Button
                variant="outline"
                onClick={onEdit}
                className="h-12 px-5 rounded-2xl border-border text-sm font-semibold hover:border-foreground"
              >
                <Edit2 className="w-4 h-4 mr-1.5" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
