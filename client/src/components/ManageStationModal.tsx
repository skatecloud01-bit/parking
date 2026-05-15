import { useState, useEffect } from "react";
import { ParkingStation } from "../../../drizzle/schema";
import { trpc } from "@/lib/trpc";
import { X, Trash2, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  station: ParkingStation | null; // null = new
  onClose: () => void;
  onSuccess: () => void;
  onDelete: () => void;
}

interface FormData {
  name: string;
  address: string;
  description: string;
  latitude: string;
  longitude: string;
  pricePerHour: string;
  totalSpots: string;
  availableSpots: string;
  imageUrl: string;
}

function toFormData(station: ParkingStation | null): FormData {
  if (!station) {
    return {
      name: "",
      address: "",
      description: "",
      latitude: "",
      longitude: "",
      pricePerHour: "",
      totalSpots: "",
      availableSpots: "",
      imageUrl: "",
    };
  }
  return {
    name: station.name,
    address: station.address,
    description: station.description ?? "",
    latitude: String(station.latitude),
    longitude: String(station.longitude),
    pricePerHour: String(station.pricePerHour),
    totalSpots: String(station.totalSpots),
    availableSpots: String(station.availableSpots),
    imageUrl: station.imageUrl ?? "",
  };
}

export default function ManageStationModal({ station, onClose, onSuccess, onDelete }: Props) {
  const isNew = !station;
  const [form, setForm] = useState<FormData>(() => toFormData(station));
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const createMutation = trpc.parking.create.useMutation({ onSuccess });
  const updateMutation = trpc.parking.update.useMutation({ onSuccess });
  const deleteMutation = trpc.parking.delete.useMutation({ onSuccess: onDelete });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(er => ({ ...er, [field]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<FormData> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.address.trim()) errs.address = "Address is required";
    if (!form.latitude || isNaN(parseFloat(form.latitude))) errs.latitude = "Valid latitude required";
    if (!form.longitude || isNaN(parseFloat(form.longitude))) errs.longitude = "Valid longitude required";
    if (!form.pricePerHour || isNaN(parseFloat(form.pricePerHour)) || parseFloat(form.pricePerHour) < 0) errs.pricePerHour = "Valid price required";
    if (!form.totalSpots || isNaN(parseInt(form.totalSpots)) || parseInt(form.totalSpots) < 0) errs.totalSpots = "Valid number required";
    if (!form.availableSpots || isNaN(parseInt(form.availableSpots)) || parseInt(form.availableSpots) < 0) errs.availableSpots = "Valid number required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      description: form.description.trim() || undefined,
      latitude: parseFloat(form.latitude).toFixed(7),
      longitude: parseFloat(form.longitude).toFixed(7),
      pricePerHour: parseFloat(form.pricePerHour).toFixed(2),
      totalSpots: parseInt(form.totalSpots),
      availableSpots: parseInt(form.availableSpots),
      imageUrl: form.imageUrl.trim() || undefined,
      isActive: true,
    };

    if (isNew) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate({ id: station!.id, ...payload });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

        {/* Panel */}
        <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex-none flex items-center justify-between px-6 py-5 border-b border-border">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {isNew ? "Add parking station" : "Edit station"}
              </h2>
              {!isNew && (
                <p className="text-sm text-muted-foreground mt-0.5 truncate max-w-xs">{station!.name}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="px-6 py-5 space-y-5">
              {/* Name */}
              <Field label="Station name *" error={errors.name}>
                <Input
                  value={form.name}
                  onChange={set("name")}
                  placeholder="e.g. Downtown Central Parking"
                  className={errors.name ? "border-destructive" : ""}
                />
              </Field>

              {/* Address */}
              <Field label="Address *" error={errors.address}>
                <Input
                  value={form.address}
                  onChange={set("address")}
                  placeholder="e.g. 100 Main Street, New York, NY"
                  className={errors.address ? "border-destructive" : ""}
                />
              </Field>

              {/* Lat / Lng */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Latitude *" error={errors.latitude}>
                  <Input
                    value={form.latitude}
                    onChange={set("latitude")}
                    placeholder="40.7484"
                    className={errors.latitude ? "border-destructive" : ""}
                  />
                </Field>
                <Field label="Longitude *" error={errors.longitude}>
                  <Input
                    value={form.longitude}
                    onChange={set("longitude")}
                    placeholder="-73.9967"
                    className={errors.longitude ? "border-destructive" : ""}
                  />
                </Field>
              </div>

              {/* Price */}
              <Field label="Price per hour ($) *" error={errors.pricePerHour}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    value={form.pricePerHour}
                    onChange={set("pricePerHour")}
                    placeholder="8.50"
                    className={`pl-7 ${errors.pricePerHour ? "border-destructive" : ""}`}
                    type="number"
                    min="0"
                    step="0.50"
                  />
                </div>
              </Field>

              {/* Spots */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Total spots *" error={errors.totalSpots}>
                  <Input
                    value={form.totalSpots}
                    onChange={set("totalSpots")}
                    placeholder="100"
                    type="number"
                    min="0"
                    className={errors.totalSpots ? "border-destructive" : ""}
                  />
                </Field>
                <Field label="Available spots *" error={errors.availableSpots}>
                  <Input
                    value={form.availableSpots}
                    onChange={set("availableSpots")}
                    placeholder="45"
                    type="number"
                    min="0"
                    className={errors.availableSpots ? "border-destructive" : ""}
                  />
                </Field>
              </div>

              {/* Image URL */}
              <Field label="Image URL (optional)" error={errors.imageUrl}>
                <Input
                  value={form.imageUrl}
                  onChange={set("imageUrl")}
                  placeholder="https://images.unsplash.com/..."
                />
              </Field>

              {/* Description */}
              <Field label="Description (optional)">
                <Textarea
                  value={form.description}
                  onChange={set("description")}
                  placeholder="Describe the parking station, amenities, access..."
                  rows={3}
                  className="resize-none"
                />
              </Field>
            </div>

            {/* Footer */}
            <div className="flex-none flex items-center justify-between gap-3 px-6 py-5 border-t border-border bg-white">
              {!isNew && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              )}
              <div className={`flex items-center gap-3 ${isNew ? "ml-auto" : ""}`}>
                <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[oklch(0.58_0.22_27)] hover:bg-[oklch(0.50_0.20_27)] text-white rounded-xl px-6"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</>
                  ) : (
                    isNew ? "Add station" : "Save changes"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Delete confirm */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this station?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{station?.name}</strong> from the map and listing. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate({ id: station!.id })}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete station"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
