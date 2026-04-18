import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  const navigate = useNavigate();
  const token = localStorage.getItem("rc_token");

  return (
    <header className={`absolute top-0 left-0 right-0 z-10 p-6 ${className ?? ""}`}>
      <div className="flex justify-between items-center">
        <div className="text-white text-sm uppercase tracking-widest font-bold cursor-pointer" onClick={() => navigate("/")}>ROUNDING CHEATS</div>
        <nav className="flex gap-6 items-center flex-wrap">
          <button onClick={() => navigate("/forum")} className="text-white hover:text-neutral-400 transition-colors duration-300 uppercase text-sm">
            Форум
          </button>
          <button onClick={() => navigate("/free-cheats")} className="text-white hover:text-neutral-400 transition-colors duration-300 uppercase text-sm">
            Бесплатно
          </button>
          <button onClick={() => navigate("/support")} className="text-white hover:text-neutral-400 transition-colors duration-300 uppercase text-sm">
            Поддержка
          </button>
          {token ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-white hover:text-neutral-400 transition-colors duration-300 uppercase text-sm"
            >
              <Icon name="User" size={15} />
              Кабинет
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 text-white hover:text-neutral-400 transition-colors duration-300 uppercase text-sm"
            >
              <Icon name="LogIn" size={15} />
              Войти
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}