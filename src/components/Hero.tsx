import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function Hero() {
  const navigate = useNavigate();
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0vh", "50vh"]);

  return (
    <div
      ref={container}
      className="relative flex items-center justify-center h-screen overflow-hidden"
    >
      <motion.div
        style={{ y }}
        className="absolute inset-0 w-full h-full"
      >
        <img
          src="https://cdn.poehali.dev/projects/202268fb-bf4f-4f49-939c-3a3eb0c88899/files/c5d7911f-b6ef-48ce-8710-87fc2ae88726.jpg"
          alt="CS2 gaming"
          className="w-full h-full object-cover"
        />
      </motion.div>

      <div className="relative z-10 text-center text-white px-6">
        <h1 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter mb-6 uppercase leading-none">
          ROUNDING<br />CHEATS
        </h1>
        <p className="text-xl md:text-3xl lg:text-4xl font-bold uppercase tracking-widest opacity-90 mt-4">
          Доминируй. Побеждай. Выигрывай.
        </p>
        <button
          onClick={() => navigate("/pricing")}
          className="inline-block mt-10 px-10 py-4 bg-white text-black font-bold uppercase tracking-widest text-sm hover:bg-neutral-200 transition-colors duration-300"
        >
          Получить доступ
        </button>
      </div>
    </div>
  );
}