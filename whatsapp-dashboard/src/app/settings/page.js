"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { ShieldAlert, ShieldCheck, RefreshCw, LogOut, PhoneOff } from "lucide-react";

export default function SettingsPage() {
    const [waStatus, setWaStatus] = useState("DISCONNECTED");
    const [qrCodeData, setQrCodeData] = useState(null);
    const [socket, setSocket] = useState(null);
    const [autoReject, setAutoReject] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        // Fetch Settings
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.autoRejectCalls === "true") {
                    setAutoReject(true);
                }
            })
            .catch(err => console.error("Error fetching settings:", err));

        // Connect to our custom Next.js server's socket.io instance
        const socketInstance = io(window.location.origin);
        setSocket(socketInstance);

        socketInstance.on("wa_status", (data) => {
            setWaStatus(data.status);
            setQrCodeData(data.qr);
            if (data.status !== "AUTHENTICATED" && data.status !== "READY") {
                setIsLoggingOut(false);
            }
        });

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    const handleLogout = () => {
        if (socket) {
            setIsLoggingOut(true);
            socket.emit("wa_command", { command: "logout" });
        }
    };

    const toggleAutoReject = async () => {
        setSaving(true);
        const newValue = !autoReject;
        setAutoReject(newValue);

        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ autoRejectCalls: newValue ? "true" : "false" })
            });
        } catch (err) {
            console.error("Error saving setting:", err);
            setAutoReject(!newValue); // revert on error
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <h1 className="text-2xl font-bold text-[#1c2434] mb-8">Sistem Ayarları & Bağlantı</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Connection Status Card */}
                <div className="card p-6 border-[#e2e8f0]">
                    <h2 className="text-lg font-semibold text-[#1c2434] mb-4">WhatsApp Web Bağlantısı</h2>

                    <div className="flex flex-col items-center justify-center p-8 bg-[#f8fafc] rounded-lg border border-dashed border-[#cbd5e1] min-h-[300px]">
                        {waStatus === "AUTHENTICATED" || waStatus === "READY" ? (
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck size={40} className="text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-[#0f172a]">Oturum Aktif</h3>
                                <p className="text-[#64748b] text-sm max-w-xs mx-auto mb-6">
                                    WhatsApp hesabınız başarıyla bağlandı. Arka planda mesajlaşma ve otomasyon işlemleri çalışıyor.
                                </p>
                                <button
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="px-4 py-2 bg-red-50 text-red-600 rounded flex items-center hover:bg-red-100 border border-red-200 mt-4 mx-auto gap-2 disabled:opacity-50"
                                >
                                    {isLoggingOut ? (
                                        <>
                                            <RefreshCw size={18} className="animate-spin" />
                                            Çıkış Yapılıyor...
                                        </>
                                    ) : (
                                        <>
                                            <LogOut size={18} />
                                            Oturumu Kapat
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : waStatus === "QR_READY" && qrCodeData ? (
                            <div className="text-center space-y-4">
                                <div className="bg-white p-4 rounded-xl shadow-sm inline-block">
                                    <img src={qrCodeData} alt="WhatsApp QR Code" width={200} height={200} />
                                </div>
                                <h3 className="text-lg font-semibold text-[#0f172a]">QR Kodu Okutun</h3>
                                <p className="text-[#64748b] text-sm max-w-xs mx-auto">
                                    WhatsApp uygulamasını açın, Bağlı Cihazlar menüsünden yeni cihaz ekleyerek karekodu okutun.
                                </p>
                            </div>
                        ) : (
                            <div className="text-center space-y-4 text-[#64748b]">
                                <RefreshCw size={32} className="mx-auto animate-spin opacity-50 mb-2" />
                                <p>WhatsApp servisi başlatılıyor...</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Settings Toggles Card */}
                    <div className="card p-6 border-[#e2e8f0]">
                        <h2 className="text-lg font-semibold text-[#1c2434] mb-4">Genel Ayarlar</h2>

                        <div className="flex items-center justify-between p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${autoReject ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-500'}`}>
                                    <PhoneOff size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-[#1c2434] text-sm">Gelen Aramaları Otomatik Reddet</p>
                                    <p className="text-xs text-[#64748b] mt-0.5">Arama gediğinde bot otomatik olarak meşgule atar.</p>
                                </div>
                            </div>

                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={autoReject} onChange={toggleAutoReject} disabled={saving} />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3c50e0]"></div>
                            </label>
                        </div>
                    </div>

                    {/* System Info Card */}
                    <div className="card p-6 border-[#e2e8f0]">
                        <h2 className="text-lg font-semibold text-[#1c2434] mb-4">Sistem Bilgileri</h2>
                        <div className="space-y-4">
                            <InfoRow label="Oturum Kaydetme" value="Aktif (LocalAuth)" />
                            <InfoRow label="Sunucu Durumu" value="Çalışıyor (Node.js)" />
                            <InfoRow label="Puppeteer Modu" value="Headless (--no-sandbox)" />
                            <InfoRow label="Arayüz Versiyonu" value="v2.0.0 (Lite)" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="flex justify-between items-center py-3 border-b border-[#f1f5f9] last:border-0">
            <span className="text-[#64748b] text-sm">{label}</span>
            <span className="font-medium text-[#1c2434] text-sm">{value}</span>
        </div>
    );
}
