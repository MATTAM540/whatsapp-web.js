"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Upload, Search, Trash2, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ContactsPage() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    
    const [newName, setNewName] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [vcfFile, setVcfFile] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/contacts");
            const data = await res.json();
            
            if (Array.isArray(data)) {
                setContacts(data);
            } else if (data.error) {
                setMessage({ type: "error", text: data.error });
                setContacts([]);
            } else {
                setContacts([]);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            setMessage({ type: "error", text: "Kişiler yüklenirken bir hata oluştu." });
            setContacts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddContact = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const res = await fetch("/api/contacts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName, phoneNumber: newPhone })
            });
            const data = await res.json();
            if (data.error) {
                setMessage({ type: "error", text: data.error });
            } else {
                setMessage({ type: "success", text: "Kişi eklendi" });
                setNewName("");
                setNewPhone("");
                setIsAddModalOpen(false);
                fetchContacts();
            }
        } catch (error) {
            setMessage({ type: "error", text: "Bir hata oluştu" });
        } finally {
            setActionLoading(false);
        }
    };

    const handleImportVCF = async () => {
        if (!vcfFile) return;
        setActionLoading(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const content = e.target.result;
                const res = await fetch("/api/contacts/vcf", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ vcfContent: content })
                });
                const data = await res.json();
                if (data.error) {
                    setMessage({ type: "error", text: data.error });
                } else {
                    setMessage({ type: "success", text: data.message });
                    setIsImportModalOpen(false);
                    setVcfFile(null);
                    fetchContacts();
                }
                setActionLoading(false);
            };
            reader.readAsText(vcfFile);
        } catch (error) {
            setMessage({ type: "error", text: "Dosya okunurken hata oluştu" });
            setActionLoading(false);
        }
    };

    const filteredContacts = (Array.isArray(contacts) ? contacts : []).filter(c => 
        (c.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
        (c.phoneNumber || "").includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#1c2434]">Rehber Yönetimi</h1>
                    <p className="text-sm text-[#64748b]">Kişilerinizi yönetin, manuel ekleyin veya VCF içe aktarın.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsImportModalOpen(true)}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Upload size={18} />
                        VCF İçe Aktar
                    </button>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <UserPlus size={18} />
                        Yeni Kişi Ekle
                    </button>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span className="text-sm font-medium">{message.text}</span>
                    <button onClick={() => setMessage(null)} className="ml-auto text-xs font-bold uppercase tracking-wider">Kapat</button>
                </div>
            )}

            <div className="card bg-white border border-[#e2e8f0] overflow-hidden">
                <div className="p-4 border-b border-[#e2e8f0] bg-slate-50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="İsim veya telefon numarası ile ara..." 
                            className="w-full pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-[#64748b] text-xs font-bold uppercase tracking-wider border-b border-[#e2e8f0]">
                                <th className="px-6 py-4">İsim</th>
                                <th className="px-6 py-4">Telefon</th>
                                <th className="px-6 py-4">Eklenme Tarihi</th>
                                <th className="px-6 py-4 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e2e8f0]">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center">
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <Loader2 className="animate-spin" size={32} />
                                            <span>Kişiler yükleniyor...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredContacts.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center text-gray-400">
                                        {searchTerm ? "Arama kriterlerine uygun kişi bulunamadı." : "Henüz hiç kişi eklenmemiş."}
                                    </td>
                                </tr>
                            ) : (
                                filteredContacts.map((contact) => (
                                    <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-[#1c2434]">{contact.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono">{contact.phoneNumber}</td>
                                        <td className="px-6 py-4 text-sm text-[#64748b]">
                                            {new Date(contact.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-[#64748b] hover:text-red-500 transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Manuel Ekleme Modalı */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="text-lg font-bold text-[#1c2434]">Yeni Kişi Ekle</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <AlertCircle className="rotate-45" size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddContact} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[#64748b]">Ad Soyad</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Örn: Ahmet Yılmaz" 
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[#64748b]">Telefon Numarası</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                    placeholder="Örn: 905XXXXXXXXX" 
                                    className="w-full"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary flex-1">İptal</button>
                                <button type="submit" disabled={actionLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                                    {actionLoading ? <Loader2 className="animate-spin" size={18} /> : "Kaydet"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VCF İçe Aktar Modalı */}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="text-lg font-bold text-[#1c2434]">VCF İçe Aktar (Rehber)</h3>
                            <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <AlertCircle className="rotate-45" size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 text-center">
                            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center gap-3 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                                <input 
                                    type="file" 
                                    accept=".vcf" 
                                    onChange={(e) => setVcfFile(e.target.files[0])}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <Upload className="text-blue-500" size={40} />
                                <div className="text-sm font-semibold text-[#1c2434]">
                                    {vcfFile ? vcfFile.name : "VCF Dosyasını Buraya Bırakın"}
                                </div>
                                <div className="text-xs text-[#64748b]">Veya tıklayarak dosya seçin</div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setIsImportModalOpen(false)} className="btn-secondary flex-1">İptal</button>
                                <button 
                                    onClick={handleImportVCF} 
                                    disabled={!vcfFile || actionLoading} 
                                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                                >
                                    {actionLoading ? <Loader2 className="animate-spin" size={18} /> : "İçe Aktarmaya Başla"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
