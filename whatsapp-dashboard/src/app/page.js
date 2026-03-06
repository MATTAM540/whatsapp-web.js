"use client";

import { useEffect, useState } from "react";
import { Users, MessageCircle, Link as LinkIcon, Activity, RefreshCcw } from "lucide-react";
import { io } from "socket.io-client";

export default function Home() {
    const [stats, setStats] = useState({
        messagesSent: 0,
        messagesRcvd: 0,
        chatCount: 0,
        contactCount: 0,
        waStatus: "DISCONNECTED"
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/stats');
            const data = await res.json();
            if (!data.error) {
                setStats(prev => ({ ...prev, ...data }));
            }
        } catch (err) {
            console.error("Failed to fetch statistics:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();

        // Connect to socket for real-time status updates
        const socket = io(window.location.origin);

        socket.on("wa_status", (data) => {
            setStats(prev => ({ ...prev, waStatus: data.status }));
        });

        socket.on("incoming_message", () => fetchStats());
        socket.on("sent_message", () => fetchStats());

        return () => socket.disconnect();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-[#0f172a]">WhatsApp Dashboard</h1>

                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${stats.waStatus === "READY" || stats.waStatus === "AUTHENTICATED"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${stats.waStatus === "READY" || stats.waStatus === "AUTHENTICATED"
                            ? "bg-green-500 animate-pulse"
                            : "bg-red-500"
                        }`}></div>
                    {stats.waStatus === "READY" ? "Bağlı" : (stats.waStatus === "QR_READY" ? "QR Hazır" : "Bağlantı Yok")}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Toplam Sohbet"
                    value={loading ? "..." : stats.chatCount}
                    icon={<MessageCircle />}
                />
                <StatCard
                    title="Kayıtlı Kişi"
                    value={loading ? "..." : stats.contactCount}
                    icon={<Users />}
                />
                <StatCard
                    title="Gönderilen Mesaj"
                    value={loading ? "..." : stats.messagesSent}
                    icon={<Activity />}
                />
                <StatCard
                    title="Gelen Mesaj"
                    value={loading ? "..." : stats.messagesRcvd}
                    icon={<RefreshCcw size={20} />}
                />
            </div>

            <div className="card p-6 mt-8 h-64 flex flex-col items-center justify-center text-gray-400 border-dashed border-2">
                <Activity size={48} className="mb-4 opacity-50" />
                <p>Grafikler ve detaylı analizler çok yakında!</p>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon }) {
    return (
        <div className="card p-6 flex flex-col gap-2 transition-all hover:shadow-md">
            <div className="flex items-center justify-between text-[#64748b]">
                <h3 className="font-medium text-sm">{title}</h3>
                {icon}
            </div>
            <p className="text-2xl font-bold text-[#0f172a]">{value}</p>
        </div>
    );
}
