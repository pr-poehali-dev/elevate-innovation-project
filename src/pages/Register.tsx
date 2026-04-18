import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/571ab1bd-e5f6-4058-ba0b-28adac16828f";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", username: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("Пароль минимум 6 символов");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_URL}?action=register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка регистрации");
      } else {
        localStorage.setItem("rc_token", data.token);
        localStorage.setItem("rc_user", JSON.stringify(data.user));
        navigate("/pricing");
      }
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2">ROUNDING CHEATS</h1>
          <p className="text-neutral-400 text-sm uppercase tracking-widest">Создать аккаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="border border-neutral-800 bg-neutral-900 p-8 space-y-5">
          <div>
            <label className="block text-neutral-400 text-xs uppercase tracking-widest mb-2">Никнейм</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-700 text-white px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors"
              placeholder="ProPlayer123"
            />
          </div>
          <div>
            <label className="block text-neutral-400 text-xs uppercase tracking-widest mb-2">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-700 text-white px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-neutral-400 text-xs uppercase tracking-widest mb-2">Пароль</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-700 text-white px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors"
              placeholder="Минимум 6 символов"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <Icon name="AlertCircle" size={14} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : null}
            {loading ? "Создаём аккаунт..." : "Зарегистрироваться"}
          </button>

          <p className="text-center text-neutral-500 text-sm">
            Уже есть аккаунт?{" "}
            <Link to="/login" className="text-white hover:text-neutral-300 transition-colors">
              Войти
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
