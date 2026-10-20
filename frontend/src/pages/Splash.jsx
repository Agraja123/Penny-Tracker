import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";

// PIN input: 4 separate boxes that behave like one 4-digit field.
const PinBoxes = ({ value, onChange, autoFocus }) => {
  const refs = useRef([]);

  const setDigit = (i, digit) => {
    const chars = value.split("");
    chars[i] = digit;
    onChange(chars.join("").slice(0, 4));
    if (digit && i < 3) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          autoFocus={autoFocus && i === 0}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => setDigit(i, e.target.value.replace(/[^0-9]/g, ""))}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-14 h-14 text-center text-2xl font-bold rounded-2xl border-2 border-base-300 bg-base-200 focus:border-primary outline-none"
        />
      ))}
    </div>
  );
};

const Splash = () => {
  const [phase, setPhase] = useState("intro"); // intro -> auth
  const [step, setStep] = useState("username"); // username -> create-pin -> confirm-pin -> login-pin
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { checkUsername, register, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setPhase("auth"), 1300);
    return () => clearTimeout(t);
  }, []);

  const handleUsernameContinue = async () => {
    setError("");
    const clean = username.trim();
    if (clean.length < 2) {
      setError("Username should be at least 2 characters");
      return;
    }
    setLoading(true);
    const res = await checkUsername(clean);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setStep(res.exists ? "login-pin" : "create-pin");
  };

  const handleCreatePinContinue = () => {
    setError("");
    if (pin.length !== 4) {
      setError("Enter a 4-digit PIN");
      return;
    }
    setStep("confirm-pin");
  };

  const handleRegister = async () => {
    setError("");
    if (confirmPin.length !== 4) {
      setError("Re-enter your 4-digit PIN");
      return;
    }
    if (confirmPin !== pin) {
      setError("PINs don't match - try again");
      setConfirmPin("");
      return;
    }
    setLoading(true);
    const res = await register(username.trim(), pin);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    navigate("/home", { replace: true });
  };

  const handleLogin = async () => {
    setError("");
    if (pin.length !== 4) {
      setError("Enter your 4-digit PIN");
      return;
    }
    setLoading(true);
    const res = await login(username.trim(), pin);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      setPin("");
      return;
    }
    navigate("/home", { replace: true });
  };

  const goBack = () => {
    setError("");
    if (step === "create-pin" || step === "login-pin") {
      setStep("username");
      setPin("");
    } else if (step === "confirm-pin") {
      setStep("create-pin");
      setConfirmPin("");
    }
  };

  return (
    <div className="app-shell-backdrop min-h-screen flex justify-center">
      <div className="app-shell-frame w-full bg-base-100 min-h-screen relative overflow-hidden flex flex-col">
        {/* Logo + name block: centered at first, slides up to the header */}
        <div
          className={`flex flex-col items-center transition-all duration-[900ms] ease-out ${
            phase === "intro" ? "justify-center flex-1" : "pt-10 pb-6"
          }`}
        >
          <div className={phase === "intro" ? "animate-coin-spin" : ""} style={{ perspective: 400 }}>
            <Logo size={phase === "intro" ? 88 : 52} className="transition-all duration-[900ms] ease-out drop-shadow-sm" />
          </div>
          <h1
            className={`font-display font-extrabold text-base-content transition-all duration-[900ms] ease-out ${
              phase === "intro" ? "text-3xl mt-4" : "text-xl mt-2"
            }`}
          >
            Penny Tracker
          </h1>
          {phase === "intro" && (
            <p className="text-base-content/50 text-sm mt-2 font-medium">save a little, every day</p>
          )}
        </div>

        {/* Auth card fades/slides in once the intro settles at the top */}
        <div
          className={`flex-1 flex flex-col justify-center px-6 transition-all duration-700 ${
            phase === "auth" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          <div className="bg-base-200/60 rounded-3xl p-6 border border-base-300">
            {step === "username" && (
              <>
                <h2 className="font-display font-bold text-lg text-center">Welcome</h2>
                <p className="text-sm text-base-content/60 text-center mt-1 mb-5">
                  Enter a username to create or open your account
                </p>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUsernameContinue()}
                  placeholder="Username"
                  autoFocus
                  className="input input-bordered w-full bg-base-100 text-center text-lg font-semibold"
                />
                {error && <p className="text-error text-sm font-medium text-center mt-3">{error}</p>}
                <button
                  onClick={handleUsernameContinue}
                  disabled={loading}
                  className="btn btn-primary w-full mt-5"
                >
                  {loading ? <span className="loading loading-spinner loading-sm" /> : "Continue"}
                </button>
              </>
            )}

            {step === "create-pin" && (
              <>
                <h2 className="font-display font-bold text-lg text-center">Create your PIN</h2>
                <p className="text-sm text-base-content/60 text-center mt-1 mb-5">
                  Choose a 4-digit PIN, {username}
                </p>
                <PinBoxes value={pin} onChange={setPin} autoFocus />
                {error && <p className="text-error text-sm font-medium text-center mt-3">{error}</p>}
                <button onClick={handleCreatePinContinue} className="btn btn-primary w-full mt-5">
                  Continue
                </button>
                <button onClick={goBack} className="btn btn-ghost btn-sm w-full mt-2">
                  Back
                </button>
              </>
            )}

            {step === "confirm-pin" && (
              <>
                <h2 className="font-display font-bold text-lg text-center">Confirm your PIN</h2>
                <p className="text-sm text-base-content/60 text-center mt-1 mb-5">Enter it once more</p>
                <PinBoxes value={confirmPin} onChange={setConfirmPin} autoFocus />
                {error && <p className="text-error text-sm font-medium text-center mt-3">{error}</p>}
                <button onClick={handleRegister} disabled={loading} className="btn btn-primary w-full mt-5">
                  {loading ? <span className="loading loading-spinner loading-sm" /> : "Create account"}
                </button>
                <button onClick={goBack} className="btn btn-ghost btn-sm w-full mt-2">
                  Back
                </button>
              </>
            )}

            {step === "login-pin" && (
              <>
                <h2 className="font-display font-bold text-lg text-center">Welcome back, {username}</h2>
                <p className="text-sm text-base-content/60 text-center mt-1 mb-5">Enter your 4-digit PIN</p>
                <PinBoxes value={pin} onChange={setPin} autoFocus />
                {error && <p className="text-error text-sm font-medium text-center mt-3">{error}</p>}
                <button onClick={handleLogin} disabled={loading} className="btn btn-primary w-full mt-5">
                  {loading ? <span className="loading loading-spinner loading-sm" /> : "Unlock"}
                </button>
                <button onClick={goBack} className="btn btn-ghost btn-sm w-full mt-2">
                  Not you?
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Splash;
