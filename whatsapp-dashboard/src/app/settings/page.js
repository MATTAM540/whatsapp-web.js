"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { QRCodeSVG } from "qrcode.react"; // We will install this for better Nextjs qr rendering, or use the base64 from server
import { ShieldAlert, ShieldCheck, RefreshCw, LogOut } from "lucide-react";

export default function SettingsPage() {
    const [waStatus, setWaStatus] = useState("DISCONNECTED");
    const [qrCodeData, setQrCodeData] = useState(null);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Connect to our custom Next.js server's socket.io instance
        const socketInstance = io(window.location.origin);
        setSocket(socketInstance);

        socketInstance.on("wa_status", (data) => {
            setWaStatus(data.status);
            setQrCodeData(data.qr); // Base64 dataURL from the server
        });

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    const handleLogout = () => {
        if (socket) {
            socket.emit("wa_command", { command: "logout" });
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
                                    className="btn-primary bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 mt-4 mx-auto gap-2"
                                >
                                    <LogOut size={18} />
                                    Oturumu Kapat
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

                {/* System Info Card */}
                <div className="card p-6 border-[#e2e8f0]">
                    <h2 className="text-lg font-semibold text-[#1c2434] mb-4">Sistem Bilgileri</h2>
                    <div className="space-y-4">
                        <InfoRow label="Oturum Kaydetme" value="Aktif (LocalAuth)" />
                        <InfoRow label="Sunucu Durumu" value="Çalışıyor (Node.js)" />
                        <InfoRow label="Puppeteer Modu" value="Headless (--no-sandbox)" />
                        <InfoRow label="Arayüz Versiyonu" value="v1.0.0" />
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
