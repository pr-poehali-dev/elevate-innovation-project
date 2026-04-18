import { useNavigate } from "react-router-dom";

export default function Featured() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center min-h-screen px-6 py-12 lg:py-0 bg-white">
      <div className="flex-1 h-[400px] lg:h-[800px] mb-8 lg:mb-0 lg:order-2">
        <img
          src="https://cdn.poehali.dev/projects/202268fb-bf4f-4f49-939c-3a3eb0c88899/files/d82c752e-a4c8-4ff1-a679-c63332faec93.jpg"
          alt="CS2 logo"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 text-left lg:h-[800px] flex flex-col justify-center lg:mr-12 lg:order-1">
        <h3 className="uppercase mb-4 text-sm tracking-wide text-neutral-600">Преимущества Rounding Cheats</h3>
        <p className="text-2xl lg:text-4xl mb-8 text-neutral-900 leading-tight">
          Обходи защиту, опережай соперников и контролируй игру. Наши решения работают незаметно — ты просто выигрываешь.
        </p>
        <button
          onClick={() => navigate("/pricing")}
          className="bg-black text-white border border-black px-4 py-2 text-sm transition-all duration-300 hover:bg-white hover:text-black cursor-pointer w-fit uppercase tracking-wide"
        >
          Купить сейчас
        </button>
      </div>
    </div>
  );
}