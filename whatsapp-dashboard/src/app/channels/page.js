import { Plus, Hash } from "lucide-react";

export default function ChannelsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-[#1c2434]">Kanal Yönetimi</h1>
                <button className="btn-primary gap-2 bg-[#10b981] hover:bg-[#059669]">
                    <Plus size={18} />
                    Yeni Kanal Oluştur
                </button>
            </div>

            <div className="card overflow-hidden bg-white rounded-lg shadow-sm border border-[#e2e8f0] p-12 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                    <Hash size={40} className="text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-[#1c2434] mb-2">Henüz kanalınız yok</h2>
                <p className="text-[#64748b] max-w-md mx-auto mb-6">
                    Kanallar, duyurularınızı ve güncellemelerinizi geniş kitlelere ulaştırmanın en iyi yoludur. Buradan yeni bir kanal oluşturabilir veya yöneticisi olduğunuz kanalları yönetebilirsiniz.
                </p>
                <button className="btn-primary gap-2">
                    Kanal Oluştur
                </button>
            </div>
        </div>
    );
}
