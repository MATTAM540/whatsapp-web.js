"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    FileBox,
    Bot,
    Settings,
    LogOut,
    Menu,
    X
} from "lucide-react";

const MENU_ITEMS = [
    { name: "Ana Sayfa", path: "/", icon: <LayoutDashboard size={20} /> },
    { name: "Toplu Mesaj Gönder", path: "/bulk", icon: <MessageSquare size={20} className="text-green-500" /> },
    { name: "Otomasyon & Bot", path: "/automation", icon: <Bot size={20} /> },
    { name: "Sistem Ayarları", path: "/settings", icon: <Settings size={20} /> },
];

export default function SidebarLayout({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    return (
        <div className="flex h-screen bg-[#f1f5f9] overflow-hidden">
            {/* Mobile sidebar toggle */}
            <button
                className="lg:hidden p-4 text-[#1c2434] absolute z-50"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar sidebar */}
            <aside className={`
        bg-[#1c2434] text-[#8a99af] w-64 flex-shrink-0 flex flex-col transition-transform duration-300 z-40
        ${isOpen ? "translate-x-0 fixed inset-y-0 left-0" : "-translate-x-full absolute lg:relative lg:translate-x-0"}
      `}>
                <div className="p-6 flex items-center gap-3 text-white">
                    <MessageSquare className="text-[#3c50e0]" size={28} />
                    <h1 className="text-xl font-bold tracking-wide">WA Yönetim</h1>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    {MENU_ITEMS.map((item) => {
                        const isActive = pathname === item.path || (pathname.startsWith(item.path) && item.path !== "/");
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive
                                    ? "bg-[#333a48] text-white"
                                    : "hover:bg-[#333a48] hover:text-white"
                                    }`}
                            >
                                {item.icon}
                                <span className="font-medium text-sm">{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-[#333a48]">
                    <button className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-md hover:bg-[#333a48] hover:text-white transition-colors">
                        <LogOut size={20} />
                        <span className="font-medium text-sm">Çıkış Yap</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </div>
            </main>

            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
