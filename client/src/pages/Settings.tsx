import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { User, Shield, Bell, Map, Info, LogIn, LogOut } from "lucide-react";

export default function Settings() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="h-full overflow-y-auto bg-[oklch(0.98_0.005_27)]">
      <div className="max-w-2xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your account and preferences</p>
        </div>

        {/* Account */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <User className="w-4.5 h-4.5 text-[oklch(0.58_0.22_27)]" />
              Account
            </h2>
          </div>
          <div className="p-5">
            {isAuthenticated ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[oklch(0.97_0.01_27)] flex items-center justify-center">
                    <User className="w-7 h-7 text-[oklch(0.58_0.22_27)]" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{user?.name ?? "User"}</p>
                    <p className="text-sm text-muted-foreground">{user?.email ?? "No email"}</p>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${user?.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                      <Shield className="w-3 h-3" />
                      {user?.role ?? "user"}
                    </span>
                  </div>
                </div>
                <button onClick={() => logout()} className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Not signed in</p>
                  <p className="text-sm text-muted-foreground">Sign in to manage stations and bookings</p>
                </div>
                <a href={getLoginUrl()} className="flex items-center gap-2 px-4 py-2.5 bg-[oklch(0.58_0.22_27)] text-white rounded-xl text-sm font-medium hover:bg-[oklch(0.52_0.22_27)] transition-colors">
                  <LogIn className="w-4 h-4" />
                  Sign in
                </a>
              </div>
            )}
          </div>
        </div>

        {/* App info */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Info className="w-4.5 h-4.5 text-[oklch(0.58_0.22_27)]" />
              About ParkFinder
            </h2>
          </div>
          <div className="p-5 space-y-3 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Version</span>
              <span className="font-medium text-foreground">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Map Provider</span>
              <span className="font-medium text-foreground">Google Maps</span>
            </div>
            <div className="flex justify-between">
              <span>Database</span>
              <span className="font-medium text-foreground">MySQL / TiDB</span>
            </div>
            <div className="flex justify-between">
              <span>Stack</span>
              <span className="font-medium text-foreground">React 19 + tRPC + Drizzle</span>
            </div>
          </div>
        </div>

        {/* Features overview */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Map className="w-4.5 h-4.5 text-[oklch(0.58_0.22_27)]" />
              Features
            </h2>
          </div>
          <div className="p-5">
            <ul className="space-y-2.5 text-sm">
              {[
                "Interactive Google Maps with price-bubble markers",
                "Airbnb-style split-screen listing + map view",
                "Full CRUD parking station management",
                "Booking & reservation system with status tracking",
                "Analytics dashboard with KPI cards and charts",
                "Revenue time-series and station performance reports",
                "CSV export for revenue and bookings data",
                "Operational alerts with severity levels",
                "Responsive design with collapsible sidebar",
                "Auth-gated management (sign in required to edit)",
              ].map(f => (
                <li key={f} className="flex items-start gap-2 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.58_0.22_27)] mt-1.5 flex-none" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
