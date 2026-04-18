import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const CHEATS_URL = "https://functions.poehali.dev/52e9a5a2-619e-4b9d-b5b8-7199e379b00e";

interface Cheat {
  id: number;
  title: string;
  description: string;
  link_url: string;
  created_at: string;
}

export default function FreeCheats() {
  const navigate = useNavigate();
  const [cheats, setCheats] = useState<Cheat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", link_url: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const user = localStorage.getItem("rc_user") ? JSON.parse(localStorage.getItem("rc_user")!) : null;
  const isAdmin = user?.role === "admin";

  const loadCheats = () => {
    fetch(`${CHEATS_URL}?action=list`)
      .then((r) => r.json())
      .then((data) => {
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        setCheats(parsed.cheats || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCheats(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await fetch(`${CHEATS_URL}?action=add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, requester_id: user.id }),
    });
    const data = await res.json();
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    if (!res.ok) {
      setError(parsed.error || "Ошибка");
    } else {
      setForm({ title: "", description: "", link_url: "" });
      setShowForm(false);
      loadCheats();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    await fetch(`${CHEATS_URL}?action=delete&cheat_id=${id}&requester_id=${user.id}`, { method: "GET" });
    setCheats((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <button onClick={() => navigate("/")} className="text-neutral-500 hover:text-white text-xs uppercase tracking-widest flex items-center gap-1 mb-3 transition-colors">
              <Icon name="ArrowLeft" size={12} /> Главная
            </button>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight">Бесплатные читы</h1>
            <p className="text-neutral-400 text-sm mt-1">Коллекция бесплатных инструментов от команды</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-5 py-3 bg-yellow-500 text-black font-bold uppercase tracking-wide text-sm hover:bg-yellow-400 transition-colors"
            >
              <Icon name="Plus" size={15} />
              Добавить
            </button>
          )}
        </div>

        {showForm && isAdmin && (
          <form onSubmit={handleSubmit} className="border border-yellow-500/30 bg-neutral-900 p-6 mb-8 space-y-4">
            <h2 className="text-yellow-500 font-bold uppercase tracking-wide text-sm">Добавить чит (Admin)</h2>
            <div>
              <label className="block text-neutral-400 text-xs uppercase tracking-widest mb-2">Название</label>
              <input type="text" required value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 text-white px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors"
                placeholder="Название чита..." />
            </div>
            <div>
              <label className="block text-neutral-400 text-xs uppercase tracking-widest mb-2">Описание</label>
              <textarea value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full bg-neutral-950 border border-neutral-700 text-white px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors resize-none"
                placeholder="Что делает этот чит, для какой игры..." />
            </div>
            <div>
              <label className="block text-neutral-400 text-xs uppercase tracking-widest mb-2">Ссылка</label>
              <input type="url" required value={form.link_url}
                onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 text-white px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors"
                placeholder="https://..." />
            </div>
            {error && <p className="text-red-400 text-sm flex items-center gap-2"><Icon name="AlertCircle" size={14} />{error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={submitting}
                className="px-8 py-3 bg-yellow-500 text-black font-bold uppercase tracking-wide text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center gap-2">
                {submitting && <Icon name="Loader2" size={14} className="animate-spin" />}
                Добавить
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-6 py-3 border border-neutral-700 text-neutral-400 text-sm uppercase tracking-wide hover:border-white hover:text-white transition-colors">
                Отмена
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Icon name="Loader2" size={28} className="text-white animate-spin" /></div>
        ) : cheats.length === 0 ? (
          <div className="text-center py-20 text-neutral-600">
            <Icon name="Package" size={40} className="mx-auto mb-4" />
            <p className="uppercase tracking-widest text-sm">Список пуст. Скоро здесь появятся читы!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cheats.map((cheat) => (
              <div key={cheat.id} className="border border-neutral-800 bg-neutral-900 p-6">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-white font-bold text-lg">{cheat.title}</h3>
                  <div className="flex gap-2">
                    <a href={cheat.link_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-white text-black font-bold text-xs uppercase tracking-wide hover:bg-neutral-200 transition-colors whitespace-nowrap">
                      <Icon name="ExternalLink" size={12} />
                      Скачать
                    </a>
                    {isAdmin && (
                      <button onClick={() => handleDelete(cheat.id)}
                        className="p-2 border border-red-800 text-red-500 hover:bg-red-900/30 transition-colors">
                        <Icon name="Trash2" size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {cheat.description && <p className="text-neutral-400 text-sm leading-relaxed mb-3">{cheat.description}</p>}
                <p className="text-neutral-600 text-xs">{new Date(cheat.created_at).toLocaleDateString("ru-RU")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
