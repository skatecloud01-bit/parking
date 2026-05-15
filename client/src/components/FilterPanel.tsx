import { FilterState } from "@/pages/Home";
import { X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onClose: () => void;
}

const PRICE_PRESETS = [
  { label: "Under $5", min: undefined, max: 5 },
  { label: "$5–$10", min: 5, max: 10 },
  { label: "$10–$15", min: 10, max: 15 },
  { label: "$15+", min: 15, max: undefined },
];

export default function FilterPanel({ filters, onChange, onClose }: Props) {
  const activePreset = PRICE_PRESETS.find(
    p => p.min === filters.minPrice && p.max === filters.maxPrice
  );

  const applyPreset = (preset: typeof PRICE_PRESETS[0]) => {
    if (activePreset?.label === preset.label) {
      onChange({ ...filters, minPrice: undefined, maxPrice: undefined });
    } else {
      onChange({ ...filters, minPrice: preset.min, maxPrice: preset.max });
    }
  };

  return (
    <div className="flex-none border-b border-border bg-white px-4 md:px-6 py-4 shadow-sm z-20">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Filter stations</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Price range presets */}
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2">Price per hour</p>
            <div className="flex flex-wrap gap-2">
              {PRICE_PRESETS.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                    ${activePreset?.label === preset.label
                      ? "bg-foreground text-white border-foreground"
                      : "bg-white text-foreground border-border hover:border-foreground"
                    }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-10 bg-border" />

          {/* Custom price range */}
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2">Custom range</p>
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice ?? ""}
                  onChange={e => onChange({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-20 pl-5 pr-2 py-1.5 text-xs border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-[oklch(0.58_0.22_27)]"
                  min={0}
                />
              </div>
              <span className="text-xs text-muted-foreground">to</span>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice ?? ""}
                  onChange={e => onChange({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-20 pl-5 pr-2 py-1.5 text-xs border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-[oklch(0.58_0.22_27)]"
                  min={0}
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-10 bg-border" />

          {/* Availability toggle */}
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2">Availability</p>
            <div className="flex items-center gap-2">
              <Switch
                id="available-only"
                checked={filters.availableOnly}
                onCheckedChange={v => onChange({ ...filters, availableOnly: v })}
                className="data-[state=checked]:bg-[oklch(0.58_0.22_27)]"
              />
              <Label htmlFor="available-only" className="text-xs font-medium cursor-pointer">
                Available only
              </Label>
            </div>
          </div>

          {/* Clear */}
          <button
            onClick={() => onChange({ search: filters.search, minPrice: undefined, maxPrice: undefined, availableOnly: false })}
            className="ml-auto text-xs text-[oklch(0.58_0.22_27)] font-medium hover:underline"
          >
            Clear filters
          </button>
        </div>
      </div>
    </div>
  );
}
