import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "./components/AppLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Bookings from "./pages/Bookings";
import Stations from "./pages/Stations";
import Reports from "./pages/Reports";
import AlertsPage from "./pages/AlertsPage";
import Settings from "./pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route>
        <AppLayout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/bookings" component={Bookings} />
            <Route path="/stations" component={Stations} />
            <Route path="/reports" component={Reports} />
            <Route path="/alerts" component={AlertsPage} />
            <Route path="/settings" component={Settings} />
            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
