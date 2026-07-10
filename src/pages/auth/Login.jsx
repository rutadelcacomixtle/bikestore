import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function Login() {
  const { login, register, user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");

  useEffect(() => {
    if (mode === "register") return;
    if (!authLoading && user && profile) {
      navigate(profile?.role === "owner" ? "/owner/dashboard" : "/my-bikes", {
        replace: true,
      });
    }
  }, [user, profile, authLoading, mode]);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setEmail("");
    setName("");
    setPassword("");
    setError("");
    setSuccess(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password, name);
      setSuccess(true);
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
                resetForm();
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
        ) : success ? (
          <div className="text-center py-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Revisa tu correo</h3>
            <p className="text-sm text-gray-600">
              Te enviamos un enlace de confirmación a <strong>{email}</strong>.
              Haz clic en el enlace para activar tu cuenta y después inicia sesión.
            </p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            <Input
              label="Nombre completo"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ixchel García"
              required
            />
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
              Crear cuenta
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
