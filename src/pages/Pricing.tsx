import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const PAYMENT_URL = "https://functions.poehali.dev/0cfec238-3502-4660-80dd-ef5fdae16e64";

const GAMES = [
  {
    key: "rust",
    label: "Rust",
    icon: "Flame",
    plans: [
      { days: 30, label: "30 дней", price: 800, perDay: "27 ₽/день" },
      { days: 90, label: "90 дней", price: 2200, perDay: "24 ₽/день", popular: true },
    ],
  },
  {
    key: "cs2",
    label: "CS2",
    icon: "Crosshair",
    plans: [
      { days: 30, label: "30 дней", price: 800, perDay: "27 ₽/день" },
      { days: 90, label: "90 дней", price: 2200, perDay: "24 ₽/день", popular: true },
    ],
  },
  {
    key: "brawl",
    label: "Brawl Stars",
    icon: "Zap",
    plans: [
      { days: 7, label: "7 дней", price: 400, perDay: "57 ₽/день" },
      { days: 30, label: "30 дней", price: 1400, perDay: "47 ₽/день", popular: true },
    ],
  },
];

const features = [
  { category: "RAGEBOT", items: ["Antihit", "Yaw", "Aim", "Autofire", "Rapidfire", "Min Damage", "Hitchance"] },
  { category: "VISUALS", items: ["ESP Box", "ESP Healthbar", "Chams"] },
  { category: "MISC", items: ["Autostrafer", "Bunnyhop", "Auto Stop", "Check for Stop"] },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [discordModal, setDiscordModal] = useState(false);

  const game = GAMES[selectedGame];
  const plan = game.plans[selectedPlan] ?? game.plans[0];

  const handleBuy = async () => {
    const user = localStorage.getItem("rc_user") ? JSON.parse(localStorage.getItem("rc_user")!) : null;
    if (!user) { navigate("/login"); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${PAYMENT_URL}?action=create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, game: game.key, days: plan.days }),
      });
      const data = await res.json();
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      if (parsed.confirm_url) {
        window.location.href = parsed.confirm_url;
      } else {
        setError(parsed.error || "Ошибка создания платежа");
      }
    } catch {
      setError("Ошибка соединения");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center px-4 py-16">
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 text-neutral-400 hover:text-white transition-colors flex items-center gap-2 text-sm uppercase tracking-wide"
      >
        <Icon name="ArrowLeft" size={16} />
        Назад
      </button>

      <div className="text-center mb-12 mt-8">
        <p className="text-neutral-400 uppercase tracking-widest text-sm mb-3">Выбери игру и тариф</p>
        <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight">ROUNDING CHEATS</h1>
        <p className="text-neutral-400 mt-3 text-lg">Доминируй. Побеждай. Выигрывай.</p>
      </div>

      {/* Выбор игры */}
      <div className="flex gap-4 mb-10 flex-wrap justify-center">
        {GAMES.map((g, idx) => (
          <button
            key={g.key}
            onClick={() => { setSelectedGame(idx); setSelectedPlan(1); }}
            className={`flex items-center gap-3 px-8 py-4 border-2 font-bold uppercase tracking-widest text-sm transition-all duration-200 ${
              selectedGame === idx
                ? "border-white bg-white text-black"
                : "border-neutral-700 bg-neutral-900 text-white hover:border-neutral-400"
            }`}
          >
            <Icon name={g.icon as "Flame"} size={18} />
            {g.label}
          </button>
        ))}
      </div>

      {/* Выбор тарифа */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-10">
        {game.plans.map((p, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedPlan(idx)}
            className={`relative cursor-pointer border-2 p-8 flex flex-col items-center transition-all duration-300 ${
              selectedPlan === idx
                ? "border-white bg-white text-black"
                : "border-neutral-700 bg-neutral-900 text-white hover:border-neutral-400"
            }`}
          >
            {p.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold uppercase tracking-widest px-4 py-1">
                Популярный
              </div>
            )}
            <p className={`uppercase tracking-widest text-sm mb-4 ${selectedPlan === idx ? "text-neutral-600" : "text-neutral-400"}`}>
              {p.label}
            </p>
            <p className="text-5xl font-black mb-2">{p.price.toLocaleString("ru-RU")} ₽</p>
            <p className={`text-sm mb-4 ${selectedPlan === idx ? "text-neutral-600" : "text-neutral-500"}`}>{p.perDay}</p>
            <ul className={`text-sm space-y-2 w-full ${selectedPlan === idx ? "text-neutral-700" : "text-neutral-400"}`}>
              <li className="flex items-center gap-2"><Icon name="Check" size={14} />Доступ на {p.days} дней</li>
              <li className="flex items-center gap-2"><Icon name="Check" size={14} />Игра: {game.label}</li>
              <li className="flex items-center gap-2"><Icon name="Check" size={14} />Поддержка 24/7</li>
            </ul>
          </div>
        ))}
      </div>

      {/* Кнопки оплаты */}
      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        <button
          onClick={handleBuy}
          disabled={loading}
          className="w-full py-5 bg-white text-black font-black uppercase tracking-widest text-base hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {loading
            ? <><Icon name="Loader2" size={18} className="animate-spin" /> Создаём платёж...</>
            : <><Icon name="Smartphone" size={18} /> Оплатить СБП — {plan.price.toLocaleString("ru-RU")} ₽</>
          }
        </button>
        {error && (
          <p className="text-red-400 text-sm flex items-center gap-2">
            <Icon name="AlertCircle" size={14} />{error}
          </p>
        )}
        <p className="text-neutral-600 text-xs text-center">
          Оплата через СБП — мгновенное подтверждение.<br />После оплаты ссылка на чит появится в личном кабинете.
        </p>
      </div>

      <div className="flex gap-4 mt-8">
        <a href="https://t.me/herocheatssndcracs" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-6 py-3 border border-neutral-700 text-white text-sm uppercase tracking-wide hover:border-white transition-colors">
          <Icon name="Send" size={16} />Telegram
        </a>
        <button onClick={() => setDiscordModal(true)}
          className="flex items-center gap-2 px-6 py-3 border border-neutral-700 text-white text-sm uppercase tracking-wide hover:border-white transition-colors">
          <Icon name="MessageCircle" size={16} />Discord
        </button>
      </div>

      <div className="w-full max-w-4xl mt-20">
        <h2 className="text-white text-2xl font-black uppercase tracking-widest mb-8 text-center">Функции</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((group) => (
            <div key={group.category} className="border border-neutral-800 bg-neutral-900 p-6">
              <h3 className="text-neutral-400 uppercase tracking-widest text-xs mb-4">{group.category}</h3>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-white text-sm">
                    <Icon name="Check" size={14} className="text-green-400" />{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {discordModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setDiscordModal(false)}>
          <div className="bg-neutral-900 border border-neutral-700 p-10 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <Icon name="Wrench" size={40} className="text-yellow-500 mx-auto mb-4" />
            <h2 className="text-white text-xl font-black uppercase tracking-wide mb-2">В разработке</h2>
            <p className="text-neutral-400 text-sm mb-6">Discord скоро откроется. Следи в Telegram!</p>
            <a href="https://t.me/herocheatssndcracs" target="_blank" rel="noopener noreferrer"
              className="block w-full py-3 bg-white text-black font-bold uppercase tracking-widest text-sm hover:bg-neutral-200 transition-colors mb-3">
              Перейти в Telegram
            </a>
            <button onClick={() => setDiscordModal(false)} className="text-neutral-500 text-sm hover:text-white transition-colors">Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
}
