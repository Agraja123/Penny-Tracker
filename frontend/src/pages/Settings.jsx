import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell";
import RupeeInput from "../components/RupeeInput";
import IncomeManager from "../components/IncomeManager";
import Sheet, { Field } from "../components/Sheet";
import { useToast } from "../hooks/useToast";
import { useSettings, THEMES } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import client, { extractError } from "../api/client";

const Section = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="text-xs font-bold text-base-content/50 uppercase tracking-wider">{title}</h2>
    {children}
  </section>
);

const Row = ({ title, hint, children }) => (
  <div className="flex items-center justify-between gap-3 bg-base-200 rounded-2xl px-4 py-3">
    <div className="min-w-0">
      <p className="font-semibold">{title}</p>
      {hint && <p className="text-xs text-base-content/50 mt-0.5">{hint}</p>}
    </div>
    {children}
  </div>
);

const TIMEOUTS = [
  { value: 0, label: "Whenever I leave the app" },
  { value: 1, label: "After 1 minute" },
  { value: 5, label: "After 5 minutes" },
  { value: 15, label: "After 15 minutes" },
];

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [toast, flash] = useToast();

  const [salary, setSalary] = useState("");
  const [salaryDay, setSalaryDay] = useState("1");
  const [pinOpen, setPinOpen] = useState(false);
  const [pins, setPins] = useState({ current: "", next: "", confirm: "" });
  const [pinError, setPinError] = useState("");

  useEffect(() => {
    setSalary(settings.salary ? String(settings.salary) : "");
    setSalaryDay(String(settings.salaryDay || 1));
  }, [settings.salary, settings.salaryDay]);

  const run = async (patch, okMsg) => {
    const res = await updateSettings(patch);
    flash(res.ok ? okMsg : res.error);
  };

  const saveSalary = () =>
    run(
      { salary: parseInt(salary, 10) || 0, salaryDay: Math.min(31, Math.max(1, parseInt(salaryDay, 10) || 1)) },
      "Salary saved"
    );

  const changePin = async () => {
    if (!/^\d{4}$/.test(pins.next)) return setPinError("New PIN must be exactly 4 digits");
    if (pins.next !== pins.confirm) return setPinError("The new PINs don't match");
    try {
      await client.post("/settings/change-pin", { currentPin: pins.current, newPin: pins.next });
      setPinOpen(false);
      setPins({ current: "", next: "", confirm: "" });
      setPinError("");
      flash("PIN changed");
    } catch (error) {
      setPinError(extractError(error));
    }
  };

  const pinInput = (key, placeholder) => (
    <input
      type="password"
      inputMode="numeric"
      maxLength={4}
      value={pins[key]}
      onChange={(e) => setPins({ ...pins, [key]: e.target.value.replace(/[^0-9]/g, "") })}
      placeholder={placeholder}
      className="input input-bordered w-full bg-base-200 tracking-[0.5em]"
    />
  );

  return (
    <PageShell title="Settings">
      <div className="px-5 pb-16 space-y-8">
        <Section title="Salary & income">
          <div className="bg-base-200 rounded-2xl p-4 space-y-3">
            <p className="text-xs text-base-content/60">
              Your monthly salary is the base for the overall analysis on the home screen.
            </p>
            <Field label="Monthly salary">
              <RupeeInput value={salary} onChange={setSalary} placeholder="25000" />
            </Field>
            <Field label="Credited on day of month">
              <input
                type="text"
                inputMode="numeric"
                value={salaryDay}
                onChange={(e) => setSalaryDay(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
                className="input input-bordered w-full bg-base-100"
              />
            </Field>
            <button onClick={saveSalary} className="btn btn-primary btn-sm w-full">
              Save salary
            </button>
          </div>
          <IncomeManager />
        </Section>

        <Section title="Appearance">
          <div className="grid grid-cols-2 gap-3">
            {THEMES.map((t) => (
              <button
                key={t.key}
                onClick={() => run({ theme: t.key }, `${t.label} theme on`)}
                className={`rounded-2xl p-3 border-2 text-left ${settings.theme === t.key ? "border-primary" : "border-base-300"} bg-base-200`}
              >
                <div className="flex gap-1.5 mb-2">
                  {t.swatch.map((c) => (
                    <span key={c} className="w-6 h-6 rounded-full border border-black/10" style={{ background: c }} />
                  ))}
                </div>
                <p className="text-sm font-semibold">
                  {t.label} {settings.theme === t.key && "✓"}
                </p>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Privacy & security">
          <Row title="App lock" hint="Ask for your PIN when opening the app">
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={settings.appLock.enabled}
              onChange={(e) => run({ appLock: { enabled: e.target.checked } }, e.target.checked ? "App lock on" : "App lock off")}
            />
          </Row>
          {settings.appLock.enabled && (
            <>
              <Row title="Lock">
                <select
                  value={settings.appLock.timeoutMinutes}
                  onChange={(e) => run({ appLock: { timeoutMinutes: Number(e.target.value) } }, "Saved")}
                  className="select select-bordered select-sm bg-base-100 max-w-[190px]"
                >
                  {TIMEOUTS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </Row>
              <button onClick={() => window.dispatchEvent(new Event("penny:lock"))} className="btn btn-outline btn-sm w-full">
                🔒 Lock now
              </button>
            </>
          )}
          <button onClick={() => setPinOpen(true)} className="btn btn-outline btn-sm w-full">
            Change PIN
          </button>
        </Section>

        <Section title="Notifications">
          <button onClick={() => navigate("/reminders")} className="btn btn-outline btn-sm w-full">
            ⏰ Manage reminders
          </button>
        </Section>

        <Section title="Account">
          <Row title={`Signed in as ${user?.username}`} hint="Log in with the same username and PIN on any device">
            <button onClick={logout} className="btn btn-error btn-outline btn-sm">
              Log out
            </button>
          </Row>
        </Section>
      </div>

      {toast}
      <Sheet open={pinOpen} title="Change PIN" onClose={() => { setPinOpen(false); setPinError(""); }} onSave={changePin} error={pinError}>
        <Field label="Current PIN">{pinInput("current", "••••")}</Field>
        <Field label="New PIN">{pinInput("next", "••••")}</Field>
        <Field label="Confirm new PIN">{pinInput("confirm", "••••")}</Field>
      </Sheet>
    </PageShell>
  );
};

export default Settings;
