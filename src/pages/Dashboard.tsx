import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Icon from "@/components/ui/icon";

const PROFILE_URL = "https://functions.poehali.dev/a86bba02-ec35-48b0-88e2-748f94978b30";
const PAYMENT_URL = "https://functions.poehali.dev/0cfec238-3502-4660-80dd-ef5fdae16e64";

const GAMES = [
  { key: "rust", label: "Rust", icon: "Flame" },
  { key: "cs2", label: "CS2", icon: "Crosshair" },
  { key: "brawl", label: "Brawl Stars", icon: "Zap" },
];

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
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [cheatLinks, setCheatLinks] = useState<Record<string, string>>({});
  const [loadingLink, setLoadingLink] = useState<string | null>(null);
  const [justPaid] = useState(searchParams.get("paid") === "1");

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

  const getCheatLink = async (game: string) => {
    if (!user) return;
    setLoadingLink(game);
    const res = await fetch(`${PAYMENT_URL}?action=cheat_link&user_id=${user.id}&game=${game}`);
    const data = await res.json();
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    if (parsed.link_url) {
      setCheatLinks((prev) => ({ ...prev, [game]: parsed.link_url }));
    } else {
      setCheatLinks((prev) => ({ ...prev, [game]: "__error__" }));
    }
    setLoadingLink(null);
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
              <button onClick={() => navigate("/admin")}
                className="flex items-center gap-2 px-4 py-2 border border-yellow-500 text-yellow-500 text-sm uppercase tracking-wide hover:bg-yellow-500 hover:text-black transition-colors">
                <Icon name="Shield" size={14} />Админка
              </button>
            )}
            <button onClick={logout}
              className="flex items-center gap-2 px-4 py-2 border border-neutral-700 text-neutral-400 text-sm uppercase tracking-wide hover:border-white hover:text-white transition-colors">
              <Icon name="LogOut" size={14} />Выйти
            </button>
          </div>
        </div>

        {justPaid && (
          <div className="border border-green-700 bg-green-900/20 p-4 mb-6 flex items-center gap-3">
            <Icon name="CheckCircle" size={20} className="text-green-400 shrink-0" />
            <p className="text-green-400 text-sm font-bold">Оплата прошла успешно! Подписка активирована.</p>
          </div>
        )}

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
              <span className="ml-auto text-xs font-bold uppercase tracking-widest px-3 py-1 border border-yellow-500 text-yellow-500">Admin</span>
            )}
          </div>

          <div className="border-t border-neutral-800 pt-6">
            <p className="text-neutral-400 text-xs uppercase tracking-widest mb-4">Подписка</p>
            {isActive ? (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <div>
                  <p className="text-white font-bold">Активна — осталось {daysLeft} дн.</p>
                  <p className="text-neutral-500 text-sm">До {new Date(user!.subscription_until!).toLocaleDateString("ru-RU")}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <p className="text-neutral-400">Подписка не активна</p>
                </div>
                <button onClick={() => navigate("/pricing")}
                  className="px-6 py-2 bg-white text-black text-sm font-bold uppercase tracking-wide hover:bg-neutral-200 transition-colors">
                  Купить
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Скачать читы */}
        <div className="border border-neutral-800 bg-neutral-900 p-8 mb-6">
          <p className="text-neutral-400 text-xs uppercase tracking-widest mb-5">Скачать чит</p>
          {isActive ? (
            <div className="space-y-3">
              {GAMES.map((g) => (
                <div key={g.key} className="flex items-center justify-between border border-neutral-800 p-4">
                  <div className="flex items-center gap-3">
                    <Icon name={g.icon as "Flame"} size={18} className="text-neutral-300" />
                    <span className="text-white font-bold text-sm">{g.label}</span>
                  </div>
                  {cheatLinks[g.key] && cheatLinks[g.key] !== "__error__" ? (
                    <a href={cheatLinks[g.key]} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-white text-black font-bold text-xs uppercase tracking-wide hover:bg-neutral-200 transition-colors">
                      <Icon name="Download" size={13} />Скачать
                    </a>
                  ) : cheatLinks[g.key] === "__error__" ? (
                    <span className="text-red-400 text-xs">Ссылка не добавлена</span>
                  ) : (
                    <button onClick={() => getCheatLink(g.key)} disabled={loadingLink === g.key}
                      className="flex items-center gap-2 px-4 py-2 border border-neutral-600 text-neutral-300 text-xs uppercase tracking-wide hover:border-white hover:text-white transition-colors disabled:opacity-50">
                      {loadingLink === g.key
                        ? <><Icon name="Loader2" size={13} className="animate-spin" />Загрузка...</>
                        : <><Icon name="Link" size={13} />Получить ссылку</>}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-neutral-600">
              <Icon name="Lock" size={28} className="mx-auto mb-3" />
              <p className="text-sm uppercase tracking-widest">Купи подписку чтобы скачать чит</p>
            </div>
          )}
        </div>

        <div className="border border-neutral-800 bg-neutral-900 p-8">
          <p className="text-neutral-400 text-xs uppercase tracking-widest mb-4">Что входит в подписку</p>
          <div className="grid grid-cols-2 gap-3 text-sm text-neutral-300">
            {["Antihit", "Yaw", "Aim", "Autofire", "Rapidfire", "ESP Box", "Chams", "Bunnyhop", "Autostrafer", "Auto Stop"].map(f => (
              <div key={f} className="flex items-center gap-2">
                <Icon name="Check" size={12} className="text-green-400" />{f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
