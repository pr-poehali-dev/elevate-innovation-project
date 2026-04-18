import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const PROFILE_URL = "https://functions.poehali.dev/a86bba02-ec35-48b0-88e2-748f94978b30";

interface User {
  id: number;
  email: string;
  username: string;
  role: string;
  subscription_until: string | null;
  created_at: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("rc_user");
    if (!stored) { navigate("/login"); return; }
    const u = JSON.parse(stored);
    fetch(`${PROFILE_URL}?action=me&user_id=${u.id}`)
      .then((r) => r.json())
      .then((data) => {
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        setUser(parsed);
        localStorage.setItem("rc_user", JSON.stringify(parsed));
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("rc_token");
    localStorage.removeItem("rc_user");
    navigate("/login");
  };

  const isActive = user?.subscription_until && new Date(user.subscription_until) > new Date();
  const daysLeft = user?.subscription_until
    ? Math.ceil((new Date(user.subscription_until).getTime() - Date.now()) / 86400000)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Icon name="Loader2" size={32} className="text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Личный кабинет</h1>
          <div className="flex gap-3">
            {user?.role === "admin" && (
              <button
                onClick={() => navigate("/admin")}
                className="flex items-center gap-2 px-4 py-2 border border-yellow-500 text-yellow-500 text-sm uppercase tracking-wide hover:bg-yellow-500 hover:text-black transition-colors"
              >
                <Icon name="Shield" size={14} />
                Админка
              </button>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 border border-neutral-700 text-neutral-400 text-sm uppercase tracking-wide hover:border-white hover:text-white transition-colors"
            >
              <Icon name="LogOut" size={14} />
              Выйти
            </button>
          </div>
        </div>

        <div className="border border-neutral-800 bg-neutral-900 p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-neutral-800 flex items-center justify-center">
              <Icon name="User" size={28} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-xl">{user?.username || "Без имени"}</p>
              <p className="text-neutral-400 text-sm">{user?.email}</p>
            </div>
            {user?.role === "admin" && (
              <span className="ml-auto text-xs font-bold uppercase tracking-widest px-3 py-1 border border-yellow-500 text-yellow-500">
                Admin
              </span>
            )}
          </div>

          <div className="border-t border-neutral-800 pt-6">
            <p className="text-neutral-400 text-xs uppercase tracking-widest mb-4">Подписка</p>
            {isActive ? (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <div>
                  <p className="text-white font-bold">Активна — осталось {daysLeft} дн.</p>
                  <p className="text-neutral-500 text-sm">
                    До {new Date(user!.subscription_until!).toLocaleDateString("ru-RU")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <p className="text-neutral-400">Подписка не активна</p>
                </div>
                <button
                  onClick={() => navigate("/pricing")}
                  className="px-6 py-2 bg-white text-black text-sm font-bold uppercase tracking-wide hover:bg-neutral-200 transition-colors"
                >
                  Купить
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="border border-neutral-800 bg-neutral-900 p-8">
          <p className="text-neutral-400 text-xs uppercase tracking-widest mb-4">Что входит в подписку</p>
          <div className="grid grid-cols-2 gap-3 text-sm text-neutral-300">
            {["Antihit", "Yaw", "Aim", "Autofire", "Rapidfire", "ESP Box", "Chams", "Bunnyhop", "Autostrafer", "Auto Stop"].map(f => (
              <div key={f} className="flex items-center gap-2">
                <Icon name="Check" size={12} className="text-green-400" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
