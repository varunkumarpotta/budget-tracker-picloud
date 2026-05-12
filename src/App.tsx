import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import AddExpense from "@/pages/AddExpense";
import ExpenseHistory from "@/pages/ExpenseHistory";
import Shared from "@/pages/Shared";
import Analytics from "@/pages/Analytics";
import Cards from "@/pages/Cards";
import Reports from "@/pages/Reports";
import Categories from "@/pages/Categories";
import Notifications from "@/pages/Notifications";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />

        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="expenses/new" element={<AddExpense />} />
          <Route path="expenses" element={<ExpenseHistory />} />
          <Route path="shared" element={<Shared />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="cards" element={<Cards />} />
          <Route path="reports" element={<Reports />} />
          <Route path="categories" element={<Categories />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
