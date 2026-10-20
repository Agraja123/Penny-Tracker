import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";
import AppLockGate from "./components/AppLockGate";
import ReminderEngine from "./components/ReminderEngine";
import Splash from "./pages/Splash";
import Home from "./pages/Home";
import Savings from "./pages/Savings";
import Expenses from "./pages/Expenses";
import DayDetail from "./pages/DayDetail";
import Bills from "./pages/Bills";
import Planner from "./pages/Planner";
import Reminders from "./pages/Reminders";
import Settings from "./pages/Settings";
import Overview from "./pages/Overview";
import Stats from "./pages/Stats";

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-base-100">
    <span className="loading loading-spinner loading-lg text-primary" />
  </div>
);

const RequireAuth = ({ children }) => {
  const { token, checking } = useAuth();
  if (checking) return <LoadingScreen />;
  if (!token) return <Navigate to="/" replace />;
  return children;
};

const RedirectIfAuthed = ({ children }) => {
  const { token, checking } = useAuth();
  if (checking) return <LoadingScreen />;
  if (token) return <Navigate to="/home" replace />;
  return children;
};

// Everything after login: protected by the app lock, with reminders running in the background.
const AuthedLayout = () => (
  <AppLockGate>
    <ReminderEngine />
    <Outlet />
  </AppLockGate>
);

const AppRoutes = () => (
  <Routes>
    <Route
      path="/"
      element={
        <RedirectIfAuthed>
          <Splash />
        </RedirectIfAuthed>
      }
    />
    <Route
      element={
        <RequireAuth>
          <AuthedLayout />
        </RequireAuth>
      }
    >
      <Route path="/home" element={<Home />} />
      <Route path="/savings" element={<Savings />} />
      <Route path="/expenses" element={<Expenses />} />
      <Route path="/bills" element={<Bills />} />
      <Route path="/planner" element={<Planner />} />
      <Route path="/reminders" element={<Reminders />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/overview" element={<Overview />} />
      <Route path="/stats/:section" element={<Stats />} />
      <Route path="/day/:date" element={<DayDetail />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <SettingsProvider>
        <AppRoutes />
      </SettingsProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
