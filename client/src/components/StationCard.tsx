import { ParkingStation } from "../../../drizzle/schema";
import { MapPin, Clock, Car, Edit2, ParkingSquare } from "lucide-react";

interface Props {
  station: ParkingStation;
  isActive: boolean;
  onClick: () => void;
  onEdit?: () => void;
}

function getAvailabilityInfo(station: ParkingStation) {
  const { availableSpots, totalSpots } = station;
  if (availableSpots === 0) return { label: "Full", className: "badge-unavailable" };
  const ratio = availableSpots / totalSpots;
  if (ratio < 0.2) return { label: `${availableSpots} left`, className: "badge-limited" };
  return { label: `${availableSpots} available`, className: "badge-available" };
}

export default function StationCard({ station, isActive, onClick, onEdit }: Props) {
  const avail = getAvailabilityInfo(station);
  const price = parseFloat(String(station.pricePerHour));

  return (
    <div
      className={`station-card rounded-2xl border bg-white overflow-hidden group select-none${
        isActive ? " active border-[oklch(0.58_0.22_27)]" : " border-border"
      }`}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {station.imageUrl ? (
          <img
            src={station.imageUrl}
            alt={station.name}
            className="station-img w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50">
            <ParkingSquare className="w-12 h-12 text-slate-300" />
          </div>
        )}

        {/* Gradient overlay for better badge readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

        {/* Price badge — top right */}
        <div className="absolute top-3 right-3 bg-white/96 backdrop-blur-md rounded-lg px-2.5 py-1.5 shadow-sm">
          <span className="text-[14px] font-bold text-foreground">${price.toFixed(2)}</span>
          <span className="text-[11px] text-muted-foreground">/hr</span>
        </div>

        {/* Availability badge — top left */}
        <div className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${avail.className}`}>
          {avail.label}
        </div>

        {/* Edit button — bottom right, appears on hover */}
        {onEdit && (
          <button
            onClick={e => { e.stopPropagation(); onEdit(); }}
            className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/92 backdrop-blur-sm shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:scale-105"
            title="Edit station"
          >
            <Edit2 className="w-3.5 h-3.5 text-foreground" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-3.5">
        <h3 className="font-semibold text-[14.5px] text-foreground leading-tight truncate">{station.name}</h3>
        <div className="flex items-start gap-1.5 mt-1">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-[1px]" />
          <p className="text-[12.5px] text-muted-foreground leading-snug line-clamp-1">{station.address}</p>
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[12.5px] text-muted-foreground">{station.totalSpots} spots</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[13px] font-bold text-foreground">${price.toFixed(2)}</span>
            <span className="text-[11px] text-muted-foreground">/hr</span>
          </div>
        </div>
      </div>
    </div>
  );
}
