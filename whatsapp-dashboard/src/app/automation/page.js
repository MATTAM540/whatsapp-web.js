"use client";

import { useEffect, useState } from "react";
import {
    Bot, MessageSquareReply, CalendarClock, Plus, Trash2, Power, PowerOff,
    Clock, Send, Loader2, CheckCircle2, XCircle, AlertCircle, X, UserPlus,
    ChevronDown, ChevronUp, Layers
} from "lucide-react";
import ContactPicker from "@/components/ContactPicker";

// Helper: UTC+3 offset for display
function toLocalISO(date) {
    // Standard way to get YYYY-MM-DDTHH:mm for datetime-local in user's system time
    const d = new Date(date);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function fromLocalInput(datetimeStr) {
    // Standard way: browsers return local time string, new Date() converts to correct UTC
    return new Date(datetimeStr);
}

function formatDateTR(dateStr) {
    const d = new Date(dateStr);
    // Display in UTC+3
    return d.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
}

export default function AutomationPage() {
    // Auto Reply State
    const [rules, setRules] = useState([]);
    const [loadingRules, setLoadingRules] = useState(true);
    const [showRuleForm, setShowRuleForm] = useState(false);
    const [ruleForm, setRuleForm] = useState({ triggerType: 'CONTAINS', keyword: '', replyText: '' });
    const [savingRule, setSavingRule] = useState(false);

    // Scheduled Messages State
    const [scheduled, setScheduled] = useState([]);
    const [loadingScheduled, setLoadingScheduled] = useState(true);
    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [scheduleForm, setScheduleForm] = useState({ toPhone: '', text: '', sendAt: '', minDelay: 2, maxDelay: 5 });
    const [savingSchedule, setSavingSchedule] = useState(false);

    // Active tab
    const [activeTab, setActiveTab] = useState('auto-reply');
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [expandedBatches, setExpandedBatches] = useState({});

    const toggleBatch = (batchId) => {
        setExpandedBatches(prev => ({ ...prev, [batchId]: !prev[batchId] }));
    };

    // ── Fetch Data ──
    const fetchRules = async () => {
        try {
            const res = await fetch('/api/automation/auto-reply');
            const data = await res.json();
            if (!data.error) setRules(data);
        } catch (err) {
            console.error("Failed to fetch rules:", err);
        } finally {
            setLoadingRules(false);
        }
    };

    const fetchScheduled = async () => {
        try {
            const res = await fetch('/api/automation/scheduled');
            const data = await res.json();
            if (!data.error) setScheduled(data);
        } catch (err) {
            console.error("Failed to fetch scheduled:", err);
        } finally {
            setLoadingScheduled(false);
        }
    };

    useEffect(() => {
        fetchRules();
        fetchScheduled();
    }, []);

    // ── Auto Reply Actions ──
    const createRule = async (e) => {
        e.preventDefault();
        setSavingRule(true);
        try {
            const res = await fetch('/api/automation/auto-reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ruleForm)
            });
            if (res.ok) {
                setRuleForm({ triggerType: 'CONTAINS', keyword: '', replyText: '' });
                setShowRuleForm(false);
                fetchRules();
            }
        } catch (err) {
            console.error("Failed to create rule:", err);
        } finally {
            setSavingRule(false);
        }
    };

    const toggleRule = async (id, currentActive) => {
        try {
            await fetch(`/api/automation/auto-reply/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentActive })
            });
            fetchRules();
        } catch (err) {
            console.error("Failed to toggle rule:", err);
        }
    };

    const deleteRule = async (id) => {
        if (!confirm('Bu kuralı silmek istediğinize emin misiniz?')) return;
        try {
            await fetch(`/api/automation/auto-reply/${id}`, { method: 'DELETE' });
            fetchRules();
        } catch (err) {
            console.error("Failed to delete rule:", err);
        }
    };

    // ── Scheduled Message Actions ──
    const createScheduled = async (e) => {
        e.preventDefault();
        setSavingSchedule(true);
        try {
            const utcDate = fromLocalInput(scheduleForm.sendAt);
            const res = await fetch('/api/automation/scheduled', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...scheduleForm,
                    sendAt: utcDate.toISOString()
                })
            });
            if (res.ok) {
                setScheduleForm({ toPhone: '', text: '', sendAt: '', minDelay: 2, maxDelay: 5 });
                setShowScheduleForm(false);
                fetchScheduled();
            }
        } catch (err) {
            console.error("Failed to create schedule:", err);
        } finally {
            setSavingSchedule(false);
        }
    };

    const deleteScheduled = async (id) => {
        if (!confirm('Bu zamanlı mesajı iptal etmek istediğinize emin misiniz?')) return;
        try {
            await fetch(`/api/automation/scheduled/${id}`, { method: 'DELETE' });
            fetchScheduled();
        } catch (err) {
            console.error("Failed to delete schedule:", err);
        }
    };

    const handleContactsSelected = (newNumbers) => {
        setScheduleForm(prev => {
            const current = prev.toPhone.trim();
            const updatedPhone = current ? `${current}\n${newNumbers}` : newNumbers;
            return {
                ...prev,
                toPhone: updatedPhone
            };
        });
    };

    const triggerLabels = {
        EXACT_MATCH: 'Tam Eşleşme',
        CONTAINS: 'İçerir',
        ALWAYS: 'Her Mesaj'
    };

    const statusConfig = {
        PENDING: { label: 'Bekliyor', icon: <Clock size={14} />, color: 'text-amber-600 bg-amber-50' },
        SENT: { label: 'Gönderildi', icon: <CheckCircle2 size={14} />, color: 'text-green-600 bg-green-50' },
        FAILED: { label: 'Başarısız', icon: <XCircle size={14} />, color: 'text-red-600 bg-red-50' }
    };

    const getGroupedScheduled = () => {
        const groups = {};
        const individual = [];

        scheduled.forEach(msg => {
            if (msg.batchId) {
                if (!groups[msg.batchId]) {
                    groups[msg.batchId] = {
                        id: msg.batchId,
                        isBatch: true,
                        items: [],
                        text: msg.text,
                        sendAt: msg.sendAt,
                        createdAt: msg.createdAt,
                        minDelay: msg.minDelay,
                        maxDelay: msg.maxDelay
                    };
                }
                groups[msg.batchId].items.push(msg);
            } else {
                individual.push({ ...msg, isBatch: false });
            }
        });

        const all = [...Object.values(groups), ...individual];
        return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold text-[#1c2434]">Bot ve Otomasyon</h1>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-[#f1f5f9] p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('auto-reply')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'auto-reply'
                        ? 'bg-white text-[#3c50e0] shadow-sm'
                        : 'text-[#64748b] hover:text-[#1c2434]'
                        }`}
                >
                    <MessageSquareReply size={16} />
                    Otomatik Yanıt
                </button>
                <button
                    onClick={() => setActiveTab('scheduled')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'scheduled'
                        ? 'bg-white text-[#3c50e0] shadow-sm'
                        : 'text-[#64748b] hover:text-[#1c2434]'
                        }`}
                >
                    <CalendarClock size={16} />
                    Zamanlı Mesajlar
                </button>
            </div>

            {/* ══════════════════════════════════════════ AUTO REPLY TAB ══════════════════════════════════════════ */}
            {activeTab === 'auto-reply' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-[#64748b]">
                            Gelen mesajlara belirli kurallara göre otomatik yanıt verir.
                        </p>
                        <button
                            onClick={() => setShowRuleForm(!showRuleForm)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#3c50e0] text-white rounded-lg text-sm font-medium hover:bg-[#303ebd] transition-colors"
                        >
                            {showRuleForm ? <X size={16} /> : <Plus size={16} />}
                            {showRuleForm ? 'İptal' : 'Yeni Kural'}
                        </button>
                    </div>

                    {/* New Rule Form */}
                    {showRuleForm && (
                        <form onSubmit={createRule} className="card p-6 border-l-4 border-l-[#3c50e0] space-y-4 animate-in">
                            <h3 className="font-semibold text-[#1c2434]">Yeni Otomatik Yanıt Kuralı</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#64748b] mb-1.5">Tetikleme Tipi</label>
                                    <select
                                        value={ruleForm.triggerType}
                                        onChange={(e) => setRuleForm(p => ({ ...p, triggerType: e.target.value }))}
                                        className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:ring-2 focus:ring-[#3c50e0] focus:border-transparent bg-white"
                                    >
                                        <option value="CONTAINS">İçerir</option>
                                        <option value="EXACT_MATCH">Tam Eşleşme</option>
                                        <option value="ALWAYS">Her Mesaja Yanıt</option>
                                    </select>
                                </div>

                                {ruleForm.triggerType !== 'ALWAYS' && (
                                    <div>
                                        <label className="block text-sm font-medium text-[#64748b] mb-1.5">Anahtar Kelime</label>
                                        <input
                                            type="text"
                                            value={ruleForm.keyword}
                                            onChange={(e) => setRuleForm(p => ({ ...p, keyword: e.target.value }))}
                                            placeholder="örn: merhaba, fiyat, bilgi"
                                            className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:ring-2 focus:ring-[#3c50e0] focus:border-transparent"
                                            required
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#64748b] mb-1.5">Yanıt Metni</label>
                                <textarea
                                    value={ruleForm.replyText}
                                    onChange={(e) => setRuleForm(p => ({ ...p, replyText: e.target.value }))}
                                    placeholder="Otomatik gönderilecek yanıt mesajı..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:ring-2 focus:ring-[#3c50e0] focus:border-transparent resize-none"
                                    required
                                />
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={savingRule}
                                    className="flex items-center gap-2 px-5 py-2 bg-[#3c50e0] text-white rounded-lg text-sm font-medium hover:bg-[#303ebd] transition-colors disabled:opacity-50"
                                >
                                    {savingRule ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    Kural Oluştur
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Rules List */}
                    {loadingRules ? (
                        <div className="card p-12 flex items-center justify-center">
                            <Loader2 className="animate-spin text-[#3c50e0]" />
                        </div>
                    ) : rules.length === 0 ? (
                        <div className="card p-12 text-center">
                            <div className="w-16 h-16 bg-[#f1f5f9] rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bot size={28} className="text-[#64748b]" />
                            </div>
                            <p className="text-[#64748b] font-medium">Henüz otomatik yanıt kuralı yok.</p>
                            <p className="text-sm text-[#94a3b8] mt-1">Yukarıdaki butona tıklayarak ilk kuralınızı oluşturun.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {rules.map(rule => (
                                <div
                                    key={rule.id}
                                    className={`card p-5 border-l-4 transition-all ${rule.isActive
                                        ? 'border-l-[#3c50e0] opacity-100'
                                        : 'border-l-[#cbd5e1] opacity-60'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${rule.isActive
                                                    ? 'bg-indigo-50 text-[#3c50e0]'
                                                    : 'bg-slate-100 text-[#64748b]'
                                                    }`}>
                                                    {triggerLabels[rule.triggerType]}
                                                </span>
                                                {rule.keyword && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-[#475569]">
                                                        &quot;{rule.keyword}&quot;
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-[#1c2434] whitespace-pre-wrap">{rule.replyText}</p>
                                            <p className="text-xs text-[#94a3b8] mt-2">
                                                Oluşturma: {formatDateTR(rule.createdAt)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => toggleRule(rule.id, rule.isActive)}
                                                className={`p-2 rounded-lg transition-colors ${rule.isActive
                                                    ? 'bg-indigo-50 text-[#3c50e0] hover:bg-indigo-100'
                                                    : 'bg-slate-50 text-[#64748b] hover:bg-slate-100'
                                                    }`}
                                                title={rule.isActive ? 'Devre dışı bırak' : 'Etkinleştir'}
                                            >
                                                {rule.isActive ? <Power size={18} /> : <PowerOff size={18} />}
                                            </button>
                                            <button
                                                onClick={() => deleteRule(rule.id)}
                                                className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                                title="Sil"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════ SCHEDULED TAB ══════════════════════════════════════════ */}
            {activeTab === 'scheduled' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-[#64748b]">
                            Belirli bir tarih ve saatte otomatik mesaj gönderilmesini planlayın. <span className="font-medium">(UTC+3)</span>
                        </p>
                        <button
                            onClick={() => setShowScheduleForm(!showScheduleForm)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#3c50e0] text-white rounded-lg text-sm font-medium hover:bg-[#303ebd] transition-colors"
                        >
                            {showScheduleForm ? <X size={16} /> : <Plus size={16} />}
                            {showScheduleForm ? 'İptal' : 'Yeni Zamanlı Mesaj'}
                        </button>
                    </div>

                    {/* New Scheduled Message Form */}
                    {showScheduleForm && (
                        <form onSubmit={createScheduled} className="card p-6 border-l-4 border-l-[#3c50e0] space-y-4 animate-in">
                            <h3 className="font-semibold text-[#1c2434]">Yeni Zamanlı Mesaj</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-sm font-medium text-[#64748b]">Telefon Numaraları</label>
                                        <button 
                                            type="button"
                                            onClick={() => setIsPickerOpen(true)}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded transition-colors"
                                        >
                                            <UserPlus size={14} />
                                            Rehberden Seç
                                        </button>
                                    </div>
                                    <textarea
                                        value={scheduleForm.toPhone}
                                        onChange={(e) => setScheduleForm(p => ({ ...p, toPhone: e.target.value }))}
                                        placeholder="905xxxxxxxxx&#10;905xxxxxxxxx"
                                        className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:ring-2 focus:ring-[#3c50e0] focus:border-transparent resize-none"
                                        rows={3}
                                        required
                                    />
                                    <p className="text-xs text-[#94a3b8] mt-1">Birden fazla numara için alt alta veya virgül ile ayırarak yazın.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#64748b] mb-1.5">Gönderim Zamanı (UTC+3)</label>
                                    <input
                                        type="datetime-local"
                                        value={scheduleForm.sendAt}
                                        onChange={(e) => setScheduleForm(p => ({ ...p, sendAt: e.target.value }))}
                                        className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:ring-2 focus:ring-[#3c50e0] focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-[#64748b] mb-1.5">Min. Gecikme (sn)</label>
                                            <input
                                                type="number"
                                                value={scheduleForm.minDelay}
                                                onChange={(e) => setScheduleForm(p => ({ ...p, minDelay: e.target.value }))}
                                                className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:ring-2 focus:ring-[#3c50e0] focus:border-transparent"
                                                min="1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[#64748b] mb-1.5">Max. Gecikme (sn)</label>
                                            <input
                                                type="number"
                                                value={scheduleForm.maxDelay}
                                                onChange={(e) => setScheduleForm(p => ({ ...p, maxDelay: e.target.value }))}
                                                className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:ring-2 focus:ring-[#3c50e0] focus:border-transparent"
                                                min="2"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-[#94a3b8] mt-1.5 leading-tight">Gönderilecek kişi sayısı birden fazlaysa mesajlar arasına rastgele gecikme eklenir.</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#64748b] mb-1.5">Mesaj</label>
                                <textarea
                                    value={scheduleForm.text}
                                    onChange={(e) => setScheduleForm(p => ({ ...p, text: e.target.value }))}
                                    placeholder="Gönderilecek mesaj metni..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:ring-2 focus:ring-[#3c50e0] focus:border-transparent resize-none"
                                    required
                                />
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={savingSchedule}
                                    className="flex items-center gap-2 px-5 py-2 bg-[#3c50e0] text-white rounded-lg text-sm font-medium hover:bg-[#303ebd] transition-colors disabled:opacity-50"
                                >
                                    {savingSchedule ? <Loader2 size={16} className="animate-spin" /> : <CalendarClock size={16} />}
                                    Planla
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Scheduled Messages List */}
                    {loadingScheduled ? (
                        <div className="card p-12 flex items-center justify-center">
                            <Loader2 className="animate-spin text-[#3c50e0]" />
                        </div>
                    ) : scheduled.length === 0 ? (
                        <div className="card p-12 text-center">
                            <div className="w-16 h-16 bg-[#f1f5f9] rounded-full flex items-center justify-center mx-auto mb-4">
                                <CalendarClock size={28} className="text-[#64748b]" />
                            </div>
                            <p className="text-[#64748b] font-medium">Henüz zamanlı mesaj yok.</p>
                            <p className="text-sm text-[#94a3b8] mt-1">Yukarıdaki butona tıklayarak ilk zamanlı mesajınızı oluşturun.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {getGroupedScheduled().map(group => {
                                if (group.isBatch) {
                                    const successCount = group.items.filter(i => i.status === 'SENT').length;
                                    const failCount = group.items.filter(i => i.status === 'FAILED').length;
                                    const pendingCount = group.items.filter(i => i.status === 'PENDING').length;
                                    const isExpanded = expandedBatches[group.id];

                                    return (
                                        <div key={group.id} className="space-y-2">
                                            <div className="card p-5 border-l-4 border-l-indigo-400 bg-indigo-50/30">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                                                <Layers size={14} />
                                                                Toplu İşlem ({group.items.length} Numara)
                                                            </span>
                                                            <div className="flex gap-2">
                                                                {successCount > 0 && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ {successCount}</span>}
                                                                {failCount > 0 && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">✗ {failCount}</span>}
                                                                {pendingCount > 0 && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">⌛ {pendingCount}</span>}
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-[#1c2434] line-clamp-2 mb-2">{group.text}</p>
                                                        <div className="flex items-center gap-4 text-xs text-[#94a3b8]">
                                                            <span className="flex items-center gap-1">
                                                                <CalendarClock size={12} />
                                                                Planlanan: {formatDateTR(group.sendAt)}
                                                            </span>
                                                            <span className="flex items-center gap-1 font-medium text-indigo-600 cursor-pointer hover:underline" onClick={() => toggleBatch(group.id)}>
                                                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                                {isExpanded ? 'Detayları Gizle' : 'Numaraları Göster'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="ml-6 space-y-2 animate-in slide-in-from-top-2">
                                                    {group.items.map(msg => {
                                                        const sc = statusConfig[msg.status] || statusConfig.PENDING;
                                                        return (
                                                            <div key={msg.id} className="card p-3 border-l-2 bg-white flex items-center justify-between gap-4 text-sm">
                                                                <span className="font-mono text-[#64748b]">📞 {msg.toPhone.replace('@c.us', '')}</span>
                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${sc.color}`}>
                                                                    {sc.icon}
                                                                    {sc.label}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                const msg = group;
                                const sc = statusConfig[msg.status] || statusConfig.PENDING;
                                return (
                                    <div
                                        key={msg.id}
                                        className={`card p-5 border-l-4 transition-all ${msg.status === 'PENDING'
                                            ? 'border-l-amber-400'
                                            : msg.status === 'SENT'
                                                ? 'border-l-green-400'
                                                : 'border-l-red-400'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                                                        {sc.icon}
                                                        {sc.label}
                                                    </span>
                                                    <span className="text-xs text-[#64748b] font-mono">
                                                        📞 {msg.toPhone.replace('@c.us', '')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-[#1c2434] whitespace-pre-wrap mb-2">{msg.text}</p>
                                                <div className="flex items-center gap-4 text-xs text-[#94a3b8]">
                                                    <span className="flex items-center gap-1">
                                                        <CalendarClock size={12} />
                                                        Gönderim: {formatDateTR(msg.sendAt)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} />
                                                        Gecikme: {msg.minDelay}-{msg.maxDelay} sn
                                                    </span>
                                                    <span>
                                                        Oluşturma: {formatDateTR(msg.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                            {msg.status === 'PENDING' && (
                                                <button
                                                    onClick={() => deleteScheduled(msg.id)}
                                                    className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex-shrink-0"
                                                    title="İptal Et"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
            {isPickerOpen && (
                <ContactPicker 
                    onClose={() => setIsPickerOpen(false)} 
                    onSelect={handleContactsSelected}
                />
            )}
        </div>
    );
}
