"use client";
import { CHAT_TEXT,chatLocale } from "@/lib/chat-translations";
import { useEffect,useRef,useState } from "react";
type Message = {
    sender: "user" | "bot";
    text: string;
};
const blue = "var(--destekol-brand, #0069d2)";
export default function ChatWidget({ locale = "ar" }: {
    locale?: string;
}) {
    locale = chatLocale(locale);
    const t = CHAT_TEXT[chatLocale(locale)];
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"text" | "voice">("text");
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [preparing, setPreparing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [welcome, setWelcome] = useState(true);
    const [notice, setNotice] = useState("");
    const [audioUrl, setAudioUrl] = useState("");
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const voiceActive = useRef(false);
    const playbackId = useRef(0);
    const speechRequest = useRef<AbortController | null>(null);
    const answerRequest = useRef<AbortController | null>(null);
    const clip = useRef<{
        text: string;
        locale: string;
        url: string;
    } | null>(null);
    const lastAnswer = [...messages].reverse().find(m => m.sender === "bot");
    function stopMedia() {
        playbackId.current++;
        speechRequest.current?.abort();
        videoRef.current?.pause();
        audioRef.current?.pause();
        setIsSpeaking(false);
        setPreparing(false);
    }
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
    useEffect(() => () => {
        playbackId.current++;
        speechRequest.current?.abort();
        answerRequest.current?.abort();
        audioRef.current?.pause();
        videoRef.current?.pause();
        if (clip.current)
            URL.revokeObjectURL(clip.current.url);
    }, []);
    async function readAnswer(text: string) {
        stopMedia();
        setWelcome(false);
        setNotice("");
        const id = playbackId.current;
        const controller = new AbortController();
        speechRequest.current = controller;
        const timer = setTimeout(() => controller.abort(), 15000);
        setPreparing(true);
        try {
            let url = clip.current?.text === text && clip.current.locale === locale ? clip.current.url : "";
            if (!url) {
                setAudioUrl("");
                const response = await fetch("/api/chat/audio", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, locale }) }).catch(() => { throw new Error(t.audioFailed); });
                if (!response.ok || !response.headers.get("content-type")?.includes("audio"))
                    throw new Error(response.status === 429 ? t.tooMany : t.audioFailed);
                const blob = await response.blob();
                if (!blob.size)
                    throw new Error(t.audioEmpty);
                if (id !== playbackId.current)
                    return;
                if (clip.current)
                    URL.revokeObjectURL(clip.current.url);
                url = URL.createObjectURL(blob);
                clip.current = { text, locale, url };
            }
            if (id !== playbackId.current || !voiceActive.current)
                return;
            setAudioUrl(url);
            setPreparing(false);
            const audio = audioRef.current;
            if (!audio)
                throw new Error(t.openVoice);
            audio.src = url;
            audio.playbackRate = 1.1;
            try {
                await audio.play();
            }
            catch {
                if (id === playbackId.current)
                    setNotice(t.audioReady);
            }
        }
        catch (error) {
            if (id === playbackId.current)
                setNotice(controller.signal.aborted ? t.audioTimeout : error instanceof Error ? error.message : t.playFailed);
        }
        finally {
            clearTimeout(timer);
            if (id === playbackId.current)
                setPreparing(false);
        }
    }
    async function handleSend(event: React.FormEvent) {
        event.preventDefault();
        if (!input.trim() || loading)
            return;
        const text = input.trim();
        setInput("");
        stopMedia();
        setWelcome(false);
        setNotice("");
        setAudioUrl("");
        setMessages(items => [...items, { sender: "user", text }]);
        setLoading(true);
        const controller = new AbortController();
        answerRequest.current = controller;
        const timer = setTimeout(() => controller.abort(), 60000);
        try {
            const response = await fetch("/api/chat", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, locale }) }).catch(() => { throw new Error(t.connectionFailed); });
            const data = await response.json().catch(() => { throw new Error(t.answerFailed); });
            if (!response.ok || typeof data.answer !== "string" || !data.answer.trim())
                throw new Error(response.status === 429 ? t.tooMany : response.status === 503 ? t.unavailable : t.answerFailed);
            if (controller.signal.aborted)
                return;
            setMessages(items => [...items, { sender: "bot", text: data.answer }]);
            if (voiceActive.current)
                void readAnswer(data.answer);
        }
        catch (error) {
            if (!controller.signal.aborted)
                setNotice(error instanceof Error ? error.message : t.connectionFailed);
            else
                setNotice(t.answerTimeout);
        }
        finally {
            clearTimeout(timer);
            setLoading(false);
        }
    }
    function selectTab(tab: "text" | "voice") {
        stopMedia();
        setNotice("");
        voiceActive.current = tab === "voice";
        setActiveTab(tab);
    }
    return <div dir={locale === "ar" ? "rtl" : "ltr"} className="fixed bottom-6 start-6 z-50 font-sans" style={{ color: "#1e293b" }}>
    {!isOpen ? <button type="button" aria-label={t.open} onClick={() => { setIsOpen(true); voiceActive.current = activeTab === "voice"; }} className="w-14 h-14 rounded-full shadow-2xl" style={{ backgroundColor: blue, color: "white" }}>💬</button> :
            <section aria-label={t.title} className="w-80 sm:w-96 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col" style={{ height: 580, maxWidth: "calc(100vw - 3rem)", maxHeight: "calc(100dvh - 3rem)", backgroundColor: "white" }}>
        <header className="p-3 flex shrink-0 items-center justify-between gap-2" style={{ backgroundColor: blue, color: "white" }}>
          <div className="flex gap-1 p-1 rounded-xl text-xs font-bold" style={{ backgroundColor: "#0054a8" }}>
            {(["text", "voice"] as const).map(tab => <button key={tab} type="button" aria-pressed={activeTab === tab} onClick={() => selectTab(tab)} className="px-3 py-1.5 rounded-lg" style={{ backgroundColor: activeTab === tab ? "white" : "transparent", color: activeTab === tab ? blue : "white" }}>{tab === "text" ? t.textTab : t.voiceTab}</button>)}
          </div>
          <button type="button" aria-label={t.close} onClick={() => { voiceActive.current = false; stopMedia(); answerRequest.current?.abort(); setIsOpen(false); }} className="px-2 text-base font-bold" style={{ color: "white" }}>✕</button>
        </header>
        {activeTab === "voice" && <div className="flex shrink-0 flex-col items-center gap-2 p-3 text-center" style={{ backgroundColor: "#0f172a", color: "white" }}>
          {welcome && locale === "ar" ? <video ref={videoRef} src="/brand/welcome.mp4" aria-label={t.welcomeVideo} autoPlay playsInline controls onEnded={() => setWelcome(false)} onError={() => { setWelcome(false); setNotice(t.videoFailed); }} onPlay={() => audioRef.current?.pause()} className="w-28 h-28 rounded-full object-cover border-4" style={{ borderColor: blue }}/> :
                        <img src="/brand/Avatar.png" alt={t.avatar} className={`w-24 h-24 rounded-full object-cover border-4 ${isSpeaking ? "animate-pulse" : ""}`} style={{ borderColor: blue }}/>}
          <p className="text-xs" style={{ color: "#e2e8f0" }}>{isSpeaking ? t.speaking : preparing ? t.audioLoading : welcome ? (locale === "ar" ? t.welcomeHint : t.greeting) : t.voiceDescription}</p>
          <div className="flex gap-4 text-xs">
            {lastAnswer && <button type="button" disabled={preparing} onClick={() => isSpeaking ? stopMedia() : void readAnswer(lastAnswer.text)} className="underline disabled:opacity-50" style={{ color: "white" }}>{isSpeaking ? t.stop : t.replay}</button>}
            {(!welcome || locale !== "ar") && <button type="button" onClick={() => {
                            stopMedia();
                            if (locale === "ar")
                                setWelcome(true);
                            else
                                void readAnswer(t.greeting);
                        }} className="underline" style={{ color: "#cbd5e1" }}>{t.welcomeReplay}</button>}
          </div>
        </div>}
        <audio ref={audioRef} controls aria-label={t.audioPlayer} className="w-full shrink-0" style={{ display: activeTab === "voice" && audioUrl ? "block" : "none" }} onPlay={() => { videoRef.current?.pause(); setWelcome(false); setIsSpeaking(true); setNotice(""); }} onPause={() => setIsSpeaking(false)} onEnded={() => setIsSpeaking(false)} onError={() => { setIsSpeaking(false); setNotice(t.playFailed); }}/>
        <div className="min-h-0 flex-1 p-3 overflow-y-auto space-y-3" style={{ backgroundColor: "#f8fafc" }} aria-live="polite">
          {!messages.length && <p className="text-xs text-center mt-4" style={{ color: "#64748b" }}>{t.greeting}</p>}
          {messages.map((message, index) => <div key={index} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}><div className="max-w-[85%] rounded-xl p-3 text-sm leading-relaxed border" style={{ backgroundColor: message.sender === "user" ? blue : "white", color: message.sender === "user" ? "white" : "#1e293b", borderColor: message.sender === "user" ? blue : "#e2e8f0", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{message.text}</div></div>)}
          {loading && <p className="text-xs" style={{ color: "#64748b" }}>{t.answerLoading}</p>}<div ref={messagesEndRef}/>
        </div>
        {notice && <p role="status" className="p-2 text-xs shrink-0" style={{ backgroundColor: "#fef3c7", color: "#78350f" }}>{notice}</p>}
        <form onSubmit={handleSend} className="p-3 border-t flex shrink-0 gap-2" style={{ backgroundColor: "white" }}>
          <input aria-label={t.question} maxLength={4000} value={input} onChange={event => setInput(event.target.value)} placeholder={t.placeholder} className="min-w-0 flex-1 text-sm px-3 py-2.5 border rounded-xl" style={{ color: "#1e293b", backgroundColor: "white" }}/>
          <button type="submit" disabled={loading || !input.trim()} className="px-4 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50" style={{ backgroundColor: blue, color: "white" }}>{t.send}</button>
        </form>
      </section>}
  </div>;
}
