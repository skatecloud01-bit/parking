import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Bell, CheckCircle2, AlertTriangle, AlertCircle, Info, Wrench, ParkingSquare } from "lucide-react";
import { toast } from "sonner";

const SEVERITY_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  critical: { bg: "bg-red-50 border-red-200", text: "text-red-700", icon: AlertCircle },
  high: { bg: "bg-orange-50 border-orange-200", text: "text-orange-700", icon: AlertTriangle },
  medium: { bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-700", icon: AlertTriangle },
  low: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", icon: Info },
};

const TYPE_ICONS: Record<string, any> = {
  full: ParkingSquare,
  low_availability: AlertTriangle,
  offline: AlertCircle,
  maintenance: Wrench,
  info: Info,
};

export default function AlertsPage() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: alerts = [], isLoading } = trpc.alerts.list.useQuery({});
  const markRead = trpc.alerts.markRead.useMutation({ onSuccess: () => { utils.alerts.list.invalidate(); toast.success("Marked as read"); } });
  const markAllRead = trpc.alerts.markAllRead.useMutation({ onSuccess: () => { utils.alerts.list.invalidate(); toast.success("All alerts marked as read"); } });

  const unread = alerts.filter(a => !a.isRead);

  return (
    <div className="h-full overflow-y-auto bg-[oklch(0.98_0.005_27)]">
      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Alerts</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{unread.length} unread · {alerts.length} total</p>
          </div>
          {isAuthenticated && unread.length > 0 && (
            <button onClick={() => markAllRead.mutate()} className="px-4 py-2 text-sm font-medium bg-white border border-border rounded-xl hover:bg-muted transition-colors">
              Mark all read
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl border border-border animate-pulse" />)}
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Bell className="w-10 h-10 mb-3 opacity-30" />
            <p>No alerts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => {
              const style = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.low;
              const TypeIcon = TYPE_ICONS[alert.type] ?? Info;
              return (
                <div key={alert.id} className={`rounded-2xl border p-4 flex gap-4 ${!alert.isRead ? style.bg : "bg-white border-border"} transition-colors`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-none ${!alert.isRead ? "bg-white/70" : "bg-muted"}`}>
                    <TypeIcon className={`w-4.5 h-4.5 ${!alert.isRead ? style.text : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-semibold text-sm ${!alert.isRead ? "text-foreground" : "text-muted-foreground"}`}>{alert.title}</p>
                      <div className="flex items-center gap-2 flex-none">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${!alert.isRead ? `${style.bg} ${style.text}` : "bg-muted text-muted-foreground"}`}>
                          {alert.severity}
                        </span>
                        {!alert.isRead && isAuthenticated && (
                          <button onClick={() => markRead.mutate({ id: alert.id })} className="text-muted-foreground hover:text-foreground transition-colors" title="Mark as read">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    {alert.message && <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{new Date(alert.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
