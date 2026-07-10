import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const CODE_LENGTH = 6;

export default function Login() {
  const { login, sendOtp, verifyOtp, completeRegistration, user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const codeRefs = useRef([]);
  const [mode, setMode] = useState("login");

  useEffect(() => {
    if (mode === "register") return;
    if (!authLoading && user && profile) {
      navigate(profile?.role === "owner" ? "/owner/dashboard" : "/my-bikes", {
        replace: true,
      });
    }
  }, [user, profile, authLoading, mode]);

  const [regStep, setRegStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const resetReg = () => {
    setRegStep("email");
    setEmail("");
    setCode(Array(CODE_LENGTH).fill(""));
    setName("");
    setPassword("");
    setError("");
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < CODE_LENGTH - 1) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData?.getData("text") ?? "").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    const newCode = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) newCode[i] = pasted[i];
    setCode(newCode);
    const nextIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    codeRefs.current[nextIndex]?.focus();
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendOtp(email);
      setRegStep("code");
    } catch (err) {
      setError(err.message ?? "Ocurrió un error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setError("");
    setLoading(true);
    try {
      const token = code.join("");
      await verifyOtp(email, token);
      setRegStep("password");
    } catch (err) {
      setError(err.message ?? "Código inválido o expirado. Intenta de nuevo.");
      setCode(Array(CODE_LENGTH).fill(""));
      codeRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteReg = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await completeRegistration(password, name);
      navigate("/my-bikes", { replace: true });
    } catch (err) {
      setError(err.message ?? "Ocurrió un error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { profile } = await login(email, password);
      navigate(profile?.role === "owner" ? "/owner/dashboard" : "/my-bikes", {
        replace: true,
      });
    } catch (err) {
      setError(err.message ?? "Ocurrió un error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.png" alt="Bike Store" className="h-16 mb-3" />
          <p className="text-sm text-gray-500">Taller de bicicletas</p>
        </div>

        <div className="flex rounded-lg bg-gray-100 p-1 mb-5">
          {["login", "register"].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError("");
                resetReg();
              }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                mode === m
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500"
              }`}
            >
              {m === "login" ? "Iniciar sesión" : "Registrarse"}
            </button>
          ))}
        </div>

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <Input
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
            />
            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
            <Button type="submit" loading={loading} className="mt-1 w-full" size="lg">
              Entrar
            </Button>
          </form>
        ) : (
          <>
            {regStep === "email" && (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
                <Input
                  label="Correo electrónico"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                />
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}
                <Button type="submit" loading={loading} className="mt-1 w-full" size="lg">
                  Enviar código
                </Button>
              </form>
            )}

            {regStep === "code" && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-gray-600 text-center">
                  Ingresa el código de 6 dígitos que enviamos a{" "}
                  <strong>{email}</strong>
                </p>
                <div className="flex justify-center gap-2" onPaste={handlePaste}>
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { codeRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
                      autoFocus={i === 0}
                      className="w-10 h-12 text-center text-lg font-bold border border-gray-300 rounded-lg focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none"
                    />
                  ))}
                </div>
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => { setRegStep("email"); setError(""); }}
                    className="flex-1"
                  >
                    <ArrowLeft size={16} className="mr-1" />
                    Atrás
                  </Button>
                  <Button
                    type="button"
                    onClick={handleVerifyCode}
                    loading={loading}
                    disabled={code.some((d) => !d)}
                    className="flex-1"
                  >
                    Verificar
                  </Button>
                </div>
              </div>
            )}

            {regStep === "password" && (
              <form onSubmit={handleCompleteReg} className="flex flex-col gap-3">
                <Input
                  label="Nombre completo"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ixchel García"
                  required
                />
                <Input
                  label="Contraseña"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}
                <Button type="submit" loading={loading} className="mt-1 w-full" size="lg">
                  Crear cuenta
                </Button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
