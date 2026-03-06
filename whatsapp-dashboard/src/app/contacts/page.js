"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Phone, X, Loader2 } from "lucide-react";

export default function ContactsPage() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newContact, setNewContact] = useState({ name: "", phone: "" });
    const [submitting, setSubmitting] = useState(false);

    const fetchContacts = async () => {
        try {
            const res = await fetch('/api/contacts');
            const data = await res.json();
            if (!data.error) {
                setContacts(data);
            }
        } catch (err) {
            console.error("Failed to fetch contacts:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const handleAddContact = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newContact),
            });
            const data = await res.json();
            if (!data.error) {
                setContacts([data, ...contacts]);
                setShowModal(false);
                setNewContact({ name: "", phone: "" });
            } else {
                alert(data.error);
            }
        } catch (err) {
            console.error("Failed to add contact:", err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-[#1c2434] mb-8">Kişiler ve Sistem Yönetimi</h1>

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#1c2434]">Kişi Listesi ({loading ? "..." : contacts.length})</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary gap-2 bg-[#3c50e0] hover:bg-[#303ebd]"
                >
                    <Plus size={18} />
                    Yeni Kişi Ekle
                </button>
            </div>

            <div className="card overflow-hidden bg-white rounded-lg shadow-sm border border-[#e2e8f0]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-[#e2e8f0] text-xs font-semibold text-[#64748b] tracking-wider uppercase bg-[#f8fafc]">
                            <th className="px-6 py-4">İsim</th>
                            <th className="px-6 py-4">Telefon</th>

                            <th className="px-6 py-4">Katılma Tarihi</th>
                            <th className="px-6 py-4 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0]">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-[#64748b]">
                                    <Loader2 className="animate-spin inline-block mr-2" /> Veriler yükleniyor...
                                </td>
                            </tr>
                        ) : contacts.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-[#64748b]">
                                    Henüz kayıtlı kişi bulunmuyor.
                                </td>
                            </tr>
                        ) : (
                            contacts.map((contact) => (
                                <tr key={contact.id} className="hover:bg-[#f8fafc] transition-colors">
                                    <td className="px-6 py-4 font-medium text-[#1c2434]">{contact.name || "—"}</td>
                                    <td className="px-6 py-4 text-[#64748b] flex items-center gap-2">
                                        <Phone size={14} />
                                        {contact.phone}
                                    </td>

                                    <td className="px-6 py-4 text-[#64748b]">
                                        {new Date(contact.dateAdded).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="px-6 py-4 flex items-center justify-end gap-3 text-[#cbd5e1]">
                                        <button className="hover:text-[#3c50e0] transition-colors"><Edit2 size={18} /></button>
                                        <button className="hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Contact Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-[#f1f5f9] flex justify-between items-center">
                            <h3 className="text-xl font-bold text-[#1c2434]">Yeni Kişi Ekle</h3>
                            <button onClick={() => setShowModal(false)} className="text-[#64748b] hover:text-[#1c2434]">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddContact} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#64748b] mb-1">Ad Soyad</label>
                                <input
                                    type="text"
                                    value={newContact.name}
                                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                    className="w-full"
                                    placeholder="Örn: Ahmet Yılmaz"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#64748b] mb-1">Telefon Numarası (WhatsApp ID)</label>
                                <input
                                    type="text"
                                    required
                                    value={newContact.phone}
                                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                    className="w-full"
                                    placeholder="Örn: 905001234567"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-[#e2e8f0] rounded-lg text-[#64748b] font-medium hover:bg-[#f8fafc]"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 btn-primary bg-[#3c50e0] hover:bg-[#303ebd] disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={18} /> : "Kaydet"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
