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

export default function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState<number | null>(null);
  const [me, setMe] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("rc_user");
    if (!stored) { navigate("/login"); return; }
    const u = JSON.parse(stored);
    if (u.role !== "admin") { navigate("/dashboard"); return; }
    setMe(u);

    fetch(`${PROFILE_URL}?action=users&requester_id=${u.id}`)
      .then((r) => r.json())
      .then((data) => {
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        setUsers(parsed.users || []);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const grantSub = async (userId: number, days: number) => {
    setGranting(userId);
    const res = await fetch(`${PROFILE_URL}?action=grant&requester_id=${me!.id}&user_id=${userId}&days=${days}`);
    const data = await res.json();
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    if (parsed.ok) {
      setUsers((prev) =>
        prev.map((u) => u.id === userId ? { ...u, subscription_until: parsed.until } : u)
      );
    }
    setGranting(null);
  };

  const isActive = (u: User) => u.subscription_until && new Date(u.subscription_until) > new Date();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Icon name="Loader2" size={32} className="text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <p className="text-yellow-500 text-xs uppercase tracking-widest mb-1">Панель администратора</p>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">ROUNDING CHEATS</h1>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-4 py-2 border border-neutral-700 text-neutral-400 text-sm uppercase tracking-wide hover:border-white hover:text-white transition-colors"
          >
            <Icon name="ArrowLeft" size={14} />
            Кабинет
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-neutral-400 text-xs uppercase tracking-widest mb-2">Всего пользователей</p>
            <p className="text-3xl font-black text-white">{users.length}</p>
          </div>
          <div className="border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-neutral-400 text-xs uppercase tracking-widest mb-2">Активных подписок</p>
            <p className="text-3xl font-black text-green-400">{users.filter(isActive).length}</p>
          </div>
          <div className="border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-neutral-400 text-xs uppercase tracking-widest mb-2">Без подписки</p>
            <p className="text-3xl font-black text-red-400">{users.filter(u => !isActive(u)).length}</p>
          </div>
        </div>

        <div className="border border-neutral-800 bg-neutral-900">
          <div className="px-6 py-4 border-b border-neutral-800">
            <h2 className="text-white font-bold uppercase tracking-wide text-sm">Пользователи</h2>
          </div>
          <div className="divide-y divide-neutral-800">
            {users.map((u) => (
              <div key={u.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-white font-bold">{u.username || "—"}</p>
                    {u.role === "admin" && (
                      <span className="text-xs px-2 py-0.5 border border-yellow-500 text-yellow-500 uppercase tracking-wider">Admin</span>
                    )}
                    {isActive(u) ? (
                      <span className="text-xs px-2 py-0.5 bg-green-900/40 border border-green-700 text-green-400 uppercase tracking-wider">Активна</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 bg-red-900/40 border border-red-800 text-red-400 uppercase tracking-wider">Нет</span>
                    )}
                  </div>
                  <p className="text-neutral-400 text-sm">{u.email}</p>
                  {u.subscription_until && (
                    <p className="text-neutral-500 text-xs mt-1">
                      До: {new Date(u.subscription_until).toLocaleDateString("ru-RU")}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[30, 90, 365].map((days) => (
                    <button
                      key={days}
                      onClick={() => grantSub(u.id, days)}
                      disabled={granting === u.id}
                      className="px-3 py-1.5 border border-neutral-600 text-neutral-300 text-xs uppercase tracking-wide hover:border-white hover:text-white transition-colors disabled:opacity-40"
                    >
                      {granting === u.id ? <Icon name="Loader2" size={12} className="animate-spin" /> : `+${days}д`}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
