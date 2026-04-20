import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const FORUM_URL = "https://functions.poehali.dev/4ca3f38e-9af8-40e6-8324-b719b7776a0b";

interface Post {
  id: number;
  user_id: number;
  username: string;
  title: string;
  content: string;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
}

interface ChatMsg {
  id: number;
  user_id: number | null;
  username: string;
  content: string;
  created_at: string;
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return new Date(iso).toLocaleDateString("ru-RU");
}

const COLORS = ["#e879f9", "#38bdf8", "#4ade80", "#fb923c", "#f472b6", "#a78bfa", "#34d399"];
function userColor(username: string) {
  let h = 0;
  for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) % COLORS.length;
  return COLORS[h];
}

export default function Forum() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [lastId, setLastId] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const user = localStorage.getItem("rc_user") ? JSON.parse(localStorage.getItem("rc_user")!) : null;

  const loadPosts = () => {
    fetch(`${FORUM_URL}?action=list`)
      .then((r) => r.json())
      .then((data) => {
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        setPosts(parsed.posts || []);
      })
      .finally(() => setLoading(false));
  };

  const loadChat = async (since = 0) => {
    const res = await fetch(`${FORUM_URL}?action=chat_list&since=${since}`);
    const data = await res.json();
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    const msgs: ChatMsg[] = parsed.messages || [];
    if (msgs.length > 0) {
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const fresh = msgs.filter((m) => !ids.has(m.id));
        if (!fresh.length) return prev;
        const updated = [...prev, ...fresh].slice(-100);
        setLastId(updated[updated.length - 1].id);
        return updated;
      });
    }
  };

  useEffect(() => {
    loadPosts();
    loadChat(0);
    pollRef.current = setInterval(() => {
      setLastId((id) => { loadChat(id); return id; });
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async () => {
    const text = chatInput.trim();
    if (!text || sendingMsg) return;
    if (!user) { navigate("/login"); return; }
    setSendingMsg(true);
    const res = await fetch(`${FORUM_URL}?action=chat_send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, username: user.username || user.email, content: text }),
    });
    const data = await res.json();
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    if (parsed.ok && parsed.message) {
      setMessages((prev) => [...prev, parsed.message].slice(-100));
      setLastId(parsed.message.id);
    }
    setChatInput("");
    setSendingMsg(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    setSubmitting(true);
    setError("");

    let file_data = null, file_name = null;
    if (file) {
      const buf = await file.arrayBuffer();
      file_data = btoa(String.fromCharCode(...new Uint8Array(buf)));
      file_name = file.name;
    }

    const res = await fetch(`${FORUM_URL}?action=create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, user_id: user.id, username: user.username, file_data, file_name }),
    });
    const data = await res.json();
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    if (!res.ok) { setError(parsed.error || "Ошибка"); }
    else { setForm({ title: "", content: "" }); setFile(null); setShowForm(false); loadPosts(); }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <button onClick={() => navigate("/")} className="text-neutral-500 hover:text-white text-xs uppercase tracking-widest flex items-center gap-1 mb-3 transition-colors">
              <Icon name="ArrowLeft" size={12} /> Главная
            </button>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight">Форум</h1>
            <p className="text-neutral-400 text-sm mt-1">Делись конфигами и советами</p>
          </div>
          <button
            onClick={() => user ? setShowForm(!showForm) : navigate("/login")}
            className="flex items-center gap-2 px-5 py-3 bg-white text-black font-bold uppercase tracking-wide text-sm hover:bg-neutral-200 transition-colors"
          >
            <Icon name="Plus" size={15} />Новый пост
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Посты — левая часть */}
          <div className="flex-1 min-w-0">
            {showForm && (
              <form onSubmit={handleSubmit} className="border border-neutral-700 bg-neutral-900 p-6 mb-8 space-y-4">
                <h2 className="text-white font-bold uppercase tracking-wide text-sm">Создать пост</h2>
                <div>
                  <label className="block text-neutral-400 text-xs uppercase tracking-widest mb-2">Заголовок</label>
                  <input type="text" required value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 text-white px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors"
                    placeholder="Название конфига..." />
                </div>
                <div>
                  <label className="block text-neutral-400 text-xs uppercase tracking-widest mb-2">Описание</label>
                  <textarea required value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    rows={4}
                    className="w-full bg-neutral-950 border border-neutral-700 text-white px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors resize-none"
                    placeholder="Опиши конфиг..." />
                </div>
                <div>
                  <label className="block text-neutral-400 text-xs uppercase tracking-widest mb-2">Файл (необязательно)</label>
                  <div onClick={() => fileRef.current?.click()}
                    className="border border-dashed border-neutral-700 p-4 text-center cursor-pointer hover:border-neutral-400 transition-colors">
                    {file ? <p className="text-white text-sm">{file.name}</p> : <p className="text-neutral-500 text-sm">Нажми чтобы выбрать файл</p>}
                  </div>
                  <input ref={fileRef} type="file" className="hidden" accept=".cfg,.json,.txt,.zip,.rar"
                    onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </div>
                {error && <p className="text-red-400 text-sm flex items-center gap-2"><Icon name="AlertCircle" size={14} />{error}</p>}
                <div className="flex gap-3">
                  <button type="submit" disabled={submitting}
                    className="px-8 py-3 bg-white text-black font-bold uppercase tracking-wide text-sm hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center gap-2">
                    {submitting && <Icon name="Loader2" size={14} className="animate-spin" />}Опубликовать
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
            ) : posts.length === 0 ? (
              <div className="text-center py-20 text-neutral-600">
                <Icon name="MessageSquare" size={40} className="mx-auto mb-4" />
                <p className="uppercase tracking-widest text-sm">Пока нет постов. Будь первым!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="border border-neutral-800 bg-neutral-900 p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="text-white font-bold text-lg leading-tight">{post.title}</h3>
                      {post.file_url && (
                        <a href={post.file_url} download={post.file_name || "config"}
                          className="flex items-center gap-2 px-3 py-1.5 border border-neutral-700 text-neutral-300 text-xs uppercase tracking-wide hover:border-white hover:text-white transition-colors whitespace-nowrap">
                          <Icon name="Download" size={12} />Скачать
                        </a>
                      )}
                    </div>
                    <p className="text-neutral-400 text-sm leading-relaxed mb-4">{post.content}</p>
                    <div className="flex items-center gap-4 text-xs text-neutral-600">
                      <span className="flex items-center gap-1"><Icon name="User" size={11} />{post.username}</span>
                      <span>{new Date(post.created_at).toLocaleDateString("ru-RU")}</span>
                      {post.file_name && <span className="flex items-center gap-1"><Icon name="Paperclip" size={11} />{post.file_name}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Чат — правая панель */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="border border-neutral-800 bg-neutral-900 flex flex-col h-[600px] lg:sticky lg:top-8">
              {/* Заголовок чата */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white font-bold text-sm uppercase tracking-widest">Чат</span>
                <span className="ml-auto text-neutral-600 text-xs">{messages.length} сообщ.</span>
              </div>

              {/* Сообщения */}
              <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-neutral-700 gap-2">
                    <Icon name="MessageCircle" size={32} />
                    <p className="text-xs uppercase tracking-widest text-center">Будь первым в чате</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = user && msg.user_id === user.id;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div className={`max-w-[85%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                          {!isMe && (
                            <span className="text-xs font-bold" style={{ color: userColor(msg.username) }}>
                              {msg.username}
                            </span>
                          )}
                          <div className={`px-3 py-2 text-sm leading-snug break-words ${
                            isMe
                              ? "bg-white text-black"
                              : "bg-neutral-800 text-white"
                          }`}>
                            {msg.content}
                          </div>
                          <span className="text-neutral-600 text-[10px]">{timeAgo(msg.created_at)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Ввод */}
              <div className="border-t border-neutral-800 p-3 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder={user ? "Написать..." : "Войди чтобы писать"}
                  disabled={!user || sendingMsg}
                  maxLength={500}
                  className="flex-1 bg-neutral-950 border border-neutral-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-neutral-400 transition-colors placeholder:text-neutral-600 disabled:opacity-40"
                />
                <button
                  onClick={sendMessage}
                  disabled={!user || !chatInput.trim() || sendingMsg}
                  className="w-9 h-9 bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition-colors disabled:opacity-30 shrink-0"
                >
                  {sendingMsg
                    ? <Icon name="Loader2" size={14} className="animate-spin" />
                    : <Icon name="Send" size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
