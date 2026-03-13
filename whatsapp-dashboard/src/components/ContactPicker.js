"use client";

import { useState, useEffect } from "react";
import { Search, X, Check, Loader2 } from "lucide-react";

export default function ContactPicker({ onSelect, onClose }) {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIds, setSelectedIds] = useState(new Set());

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const res = await fetch("/api/contacts");
                const data = await res.json();
                setContacts(data);
            } catch (error) {
                console.error("Fetch contacts error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchContacts();
    }, []);

    const filteredContacts = contacts.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.phoneNumber.includes(searchTerm)
    );

    const toggleSelect = (id) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleSelectAll = () => {
        const next = new Set(filteredContacts.map(c => c.id));
        setSelectedIds(next);
    };

    const handleClear = () => {
        setSelectedIds(new Set());
    };

    const handleConfirm = () => {
        const selectedContacts = contacts.filter(c => selectedIds.has(c.id));
        onSelect(selectedContacts.map(c => c.phoneNumber).join("\n"));
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-[#1c2434]">Rehberden Seç</h3>
                        <p className="text-xs text-[#64748b] mt-1">{selectedIds.size} kişi seçildi</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="İsim ile ara..." 
                            className="w-full pl-10 h-12 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4 mt-3 px-1 text-sm font-semibold">
                        <button onClick={handleSelectAll} className="text-blue-600 hover:text-blue-700">Tümünü Seç</button>
                        <div className="w-px h-4 bg-slate-200 self-center"></div>
                        <button onClick={handleClear} className="text-gray-500 hover:text-gray-600">Temizle</button>
                    </div>
                </div>

                {/* Contact List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="p-10 flex flex-col items-center justify-center text-gray-400 gap-2">
                            <Loader2 className="animate-spin" size={32} />
                            <span>Yükleniyor...</span>
                        </div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="p-10 text-center text-gray-400 italic">Kişi bulunamadı.</div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {filteredContacts.map((contact) => (
                                <div 
                                    key={contact.id} 
                                    onClick={() => toggleSelect(contact.id)}
                                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                                >
                                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                                        selectedIds.has(contact.id) 
                                            ? "bg-blue-600 border-blue-600 shadow-sm" 
                                            : "border-slate-300 group-hover:border-blue-400"
                                    }`}>
                                        {selectedIds.has(contact.id) && <Check size={14} className="text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-[#1c2434]">{contact.name}</div>
                                        <div className="text-xs text-[#64748b]">{contact.phoneNumber}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                    <button 
                        onClick={handleConfirm}
                        disabled={selectedIds.size === 0}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:grayscale"
                    >
                        Seçilenleri Ekle ({selectedIds.size})
                    </button>
                </div>
            </div>
        </div>
    );
}
