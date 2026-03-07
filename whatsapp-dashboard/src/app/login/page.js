"use client";

import { useState } from "react";
import { Lock, LogIn, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!password) {
            setError("Lütfen şifrenizi girin.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                // Redirect will be handled by Next.js router after successful login
                router.push("/");
                router.refresh();
            } else {
                setError(data.message || "Giriş başarısız.");
            }
        } catch (err) {
            setError("Bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] px-4">
            <div className="card w-full max-w-md p-8 md:p-10 bg-white rounded-2xl shadow-xl border border-[#e2e8f0]">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-[#1c2434] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-slate-200">
                        <Lock className="text-white" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-[#1c2434]">Yönetim Paneli</h1>
                    <p className="text-[#64748b] mt-2 text-sm text-center">Devam etmek için lütfen yönetici şifrenizi girin.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 flex items-start gap-3 border border-red-100 text-sm animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1c2434] block">
                            Şifre
                        </label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            className="input-field py-3 text-lg tracking-widest placeholder:tracking-normal w-full px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3c50e0]/20 focus:border-[#3c50e0] transition-all bg-white disabled:bg-slate-50 disabled:text-slate-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 rounded-xl bg-[#3c50e0] hover:bg-[#3c50e0]/90 text-white font-medium shadow-md shadow-[#3c50e0]/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <LogIn size={20} />
                                <span>Giriş Yap</span>
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Simple footer for credibility */}
            <div className="fixed bottom-6 text-xs text-[#94a3b8] font-medium text-center">
                &copy; {new Date().getFullYear()} Güvenli Bağlantı. Tüm Hakları Saklıdır.
            </div>
        </div>
    );
}
