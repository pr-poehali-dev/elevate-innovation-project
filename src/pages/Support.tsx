import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

export default function Support() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <button onClick={() => navigate("/")} className="text-neutral-500 hover:text-white text-xs uppercase tracking-widest flex items-center gap-1 mb-10 mx-auto transition-colors">
          <Icon name="ArrowLeft" size={12} /> Главная
        </button>

        <div className="border border-neutral-800 bg-neutral-900 p-10">
          <div className="w-16 h-16 bg-neutral-800 flex items-center justify-center mx-auto mb-6">
            <Icon name="HeadphonesIcon" fallback="Headphones" size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-3">Поддержка</h1>
          <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
            Возникли проблемы с читом, активацией или оплатой? Наш специалист поможет тебе в Telegram.
          </p>

          <a
            href="https://t.me/mar11xuana"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-4 bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-neutral-200 transition-colors mb-4"
          >
            <Icon name="Send" size={18} />
            Написать @mar11xuana
          </a>

          <p className="text-neutral-600 text-xs">Время ответа: обычно до 1 часа</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-left">
          <div className="border border-neutral-800 bg-neutral-900 p-5">
            <Icon name="Clock" size={18} className="text-neutral-400 mb-3" />
            <p className="text-white text-sm font-bold mb-1">Быстро</p>
            <p className="text-neutral-500 text-xs">Отвечаем в течение часа</p>
          </div>
          <div className="border border-neutral-800 bg-neutral-900 p-5">
            <Icon name="ShieldCheck" size={18} className="text-neutral-400 mb-3" />
            <p className="text-white text-sm font-bold mb-1">Надёжно</p>
            <p className="text-neutral-500 text-xs">Решаем любые вопросы</p>
          </div>
        </div>
      </div>
    </div>
  );
}
