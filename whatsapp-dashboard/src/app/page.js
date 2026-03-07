"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { io } from "socket.io-client";

export default function Home() {
    const [stats, setStats] = useState({
        waStatus: "DISCONNECTED"
    });

    useEffect(() => {
        // Connect to socket for real-time status updates
        const socket = io(window.location.origin);

        socket.on("wa_status", (data) => {
            setStats(prev => ({ ...prev, waStatus: data.status }));
        });

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

            <div className="card p-6 mt-8 h-64 flex flex-col items-center justify-center text-gray-400 border-[#e2e8f0]">
                <Activity size={48} className="mb-4 text-[#3c50e0]" />
                <h2 className="text-xl font-medium text-[#1c2434] mb-2">Hoş Geldiniz</h2>
                <p className="text-center">Sol menüden Toplu Mesaj veya Otomasyon işlemlerini seçebilirsiniz.</p>
            </div>
        </div>
    );
}
