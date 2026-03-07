"use client";

import { useEffect, useState, useRef } from "react";
import { Send, Users, Clock, AlertCircle, CheckCircle2, Loader2, Play, Pause, Trash2 } from "lucide-react";
import { io } from "socket.io-client";

export default function BulkMessagePage() {
    const [recipients, setRecipients] = useState("");
    const [message, setMessage] = useState("");
    const [minDelay, setMinDelay] = useState(2);
    const [maxDelay, setMaxDelay] = useState(5);
    const [isSending, setIsSending] = useState(false);
    const [logs, setLogs] = useState([]);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const socketRef = useRef(null);
    const logEndRef = useRef(null);

    useEffect(() => {
        // Socket connection
        socketRef.current = io(window.location.origin);

        socketRef.current.on("bulk_progress", (data) => {
            setProgress({ current: data.current, total: data.total });
            setLogs(prev => [...prev, {
                type: data.success ? "success" : "error",
                message: `${data.recipient}: ${data.message || (data.success ? "Gönderildi" : "Hata")}`,
                timestamp: new Date().toLocaleTimeString()
            }]);
        });

        socketRef.current.on("bulk_complete", (data) => {
            setIsSending(false);
            setLogs(prev => [...prev, {
                type: "info",
                message: `İşlem tamamlandı. Başarılı: ${data.successCount}, Hatalı: ${data.failCount}`,
                timestamp: new Date().toLocaleTimeString()
            }]);
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs]);

    const handleSend = async () => {
        if (!recipients.trim() || !message.trim()) {
            alert("Lütfen alıcıları ve mesajı girin.");
            return;
        }

        const recipientList = recipients.split("\n").map(r => r.trim()).filter(r => r !== "");
        if (recipientList.length === 0) return;

        setIsSending(true);
        setLogs([]);
        setProgress({ current: 0, total: recipientList.length });

        try {
            const res = await fetch("/api/bulk/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipients: recipientList,
                    message,
                    minDelay,
                    maxDelay
                })
            });

            const data = await res.json();
            if (data.error) {
                alert(data.error);
                setIsSending(false);
            }
        } catch (err) {
            console.error("Bulk send error:", err);
            setIsSending(false);
        }
    };

    const clearLogs = () => setLogs([]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-[#1c2434]">Toplu Mesaj Gönder</h1>
                {isSending && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg animate-pulse font-medium">
                        <Loader2 className="animate-spin" size={18} />
                        Mesajlar Gönderiliyor...
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sol Taraf: Form */}
                <div className="card p-6 space-y-6 bg-white border border-[#e2e8f0]">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-semibold text-[#64748b] flex items-center gap-2">
                                <Users size={16} />
                                Alıcılar (Her satıra bir numara)
                            </label>
                        </div>

                        <textarea
                            value={recipients}
                            onChange={(e) => setRecipients(e.target.value)}
                            className="w-full h-40 font-mono text-sm"
                            placeholder="905XXXXXXXXX&#10;905XXXXXXXXX"
                            disabled={isSending}
                        />
                        <p className="text-xs text-[#64748b] mt-1">
                            Toplam {recipients.split("\n").filter(r => r.trim()).length} alıcı belirlendi.
                        </p>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-[#64748b] mb-2 flex items-center gap-2">
                            <Send size={16} />
                            Mesaj İçeriği
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full h-32"
                            placeholder="Gönderilecek mesajı buraya yazın..."
                            disabled={isSending}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-[#64748b] mb-2 flex items-center gap-2">
                                <Clock size={16} />
                                Min. Gecikme (sn)
                            </label>
                            <input
                                type="number"
                                value={minDelay}
                                onChange={(e) => setMinDelay(parseInt(e.target.value))}
                                className="w-full"
                                min="1"
                                disabled={isSending}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-[#64748b] mb-2 flex items-center gap-2">
                                <Clock size={16} />
                                Max. Gecikme (sn)
                            </label>
                            <input
                                type="number"
                                value={maxDelay}
                                onChange={(e) => setMaxDelay(parseInt(e.target.value))}
                                className="w-full"
                                min="2"
                                disabled={isSending}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={isSending || !recipients.trim() || !message.trim()}
                        className="w-full py-4 bg-[#3c50e0] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#303ebd] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Gönderim Devam Ediyor...
                            </>
                        ) : (
                            <>
                                <Play size={20} />
                                Gönderimi Başlat
                            </>
                        )}
                    </button>
                </div>

                {/* Sağ Taraf: İlerleme ve Loglar */}
                <div className="flex flex-col gap-6">
                    {/* Progress Card */}
                    <div className="card p-6 bg-white border border-[#e2e8f0]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-[#1c2434]">Gönderim Durumu</h3>
                            <span className="text-sm font-medium text-[#64748b]">
                                {progress.current} / {progress.total}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
                            <div
                                className="bg-[#3c50e0] h-full transition-all duration-500 rounded-full"
                                style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Logs Card */}
                    <div className="card p-6 flex-1 bg-white border border-[#e2e8f0] flex flex-col min-h-[400px]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-[#1c2434]">İşlem Günlüğü</h3>
                            <button onClick={clearLogs} className="text-[#64748b] hover:text-red-500">
                                <Trash2 size={16} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {logs.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm italic">
                                    <AlertCircle size={32} className="mb-2 opacity-20" />
                                    Henüz bir işlem gerçekleştirilmedi.
                                </div>
                            ) : (
                                logs.map((log, index) => (
                                    <div
                                        key={index}
                                        className={`p-3 rounded-lg text-sm border flex items-start gap-3 ${log.type === "success" ? "bg-green-50 border-green-100 text-green-700" :
                                            log.type === "error" ? "bg-red-50 border-red-100 text-red-700" :
                                                "bg-blue-50 border-blue-100 text-blue-700"
                                            }`}
                                    >
                                        <div className="mt-0.5">
                                            {log.type === "success" ? <CheckCircle2 size={14} /> :
                                                log.type === "error" ? <AlertCircle size={14} /> :
                                                    <Clock size={14} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold">{log.message}</div>
                                            <div className="text-[10px] opacity-70 mt-1">{log.timestamp}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
