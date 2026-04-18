import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const plans = [
  {
    days: 30,
    label: "1 месяц",
    price: 700,
    perDay: "23 ₽/день",
    popular: false,
  },
  {
    days: 90,
    label: "3 месяца",
    price: 1800,
    perDay: "20 ₽/день",
    popular: true,
  },
  {
    days: 365,
    label: "1 год",
    price: 5290,
    perDay: "14 ₽/день",
    popular: false,
  },
];

export default function Pricing() {
  const [selected, setSelected] = useState<number | null>(1);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-4 py-16">
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 text-neutral-400 hover:text-white transition-colors flex items-center gap-2 text-sm uppercase tracking-wide"
      >
        <Icon name="ArrowLeft" size={16} />
        Назад
      </button>

      <div className="text-center mb-12">
        <p className="text-neutral-400 uppercase tracking-widest text-sm mb-3">Выбери тариф</p>
        <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight">
          ROUNDING CHEATS
        </h1>
        <p className="text-neutral-400 mt-3 text-lg">Доминируй. Побеждай. Выигрывай.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {plans.map((plan, idx) => (
          <div
            key={idx}
            onClick={() => setSelected(idx)}
            className={`relative cursor-pointer border-2 p-8 flex flex-col items-center transition-all duration-300 ${
              selected === idx
                ? "border-white bg-white text-black"
                : "border-neutral-700 bg-neutral-900 text-white hover:border-neutral-400"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold uppercase tracking-widest px-4 py-1">
                Популярный
              </div>
            )}
            <p className={`uppercase tracking-widest text-sm mb-4 ${selected === idx ? "text-neutral-600" : "text-neutral-400"}`}>
              {plan.label}
            </p>
            <p className="text-5xl font-black mb-2">
              {plan.price.toLocaleString("ru-RU")} ₽
            </p>
            <p className={`text-sm mb-6 ${selected === idx ? "text-neutral-600" : "text-neutral-500"}`}>
              {plan.perDay}
            </p>
            <ul className={`text-sm space-y-2 w-full ${selected === idx ? "text-neutral-700" : "text-neutral-400"}`}>
              <li className="flex items-center gap-2">
                <Icon name="Check" size={14} />
                Доступ на {plan.days} дней
              </li>
              <li className="flex items-center gap-2">
                <Icon name="Check" size={14} />
                Все функции читов
              </li>
              <li className="flex items-center gap-2">
                <Icon name="Check" size={14} />
                Поддержка 24/7
              </li>
            </ul>
          </div>
        ))}
      </div>

      <button
        className="mt-10 px-16 py-5 bg-white text-black font-black uppercase tracking-widest text-base hover:bg-neutral-200 transition-colors duration-300 disabled:opacity-40"
        disabled={selected === null}
      >
        Купить{selected !== null ? ` — ${plans[selected].price.toLocaleString("ru-RU")} ₽` : ""}
      </button>

      <p className="mt-6 text-neutral-600 text-xs text-center max-w-sm">
        После оплаты вы получите инструкцию по активации на указанный контакт
      </p>
    </div>
  );
}
