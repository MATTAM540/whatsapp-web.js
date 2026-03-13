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
    X,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

const MENU_ITEMS = [
    { name: "Ana Sayfa", path: "/", icon: <LayoutDashboard size={20} /> },
    { name: "Toplu Mesaj Gönder", path: "/bulk", icon: <MessageSquare size={20} className="text-green-500" /> },
    { name: "Otomasyon & Bot", path: "/automation", icon: <Bot size={20} /> },
    { name: "Rehber", path: "/contacts", icon: <Users size={20} /> },
    { name: "Sistem Ayarları", path: "/settings", icon: <Settings size={20} /> },
];

export default function SidebarLayout({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    if (pathname === '/login') {
        return <>{children}</>;
    }

    return (
        <div className="flex h-screen bg-[var(--background)] overflow-hidden">
            {/* Mobile sidebar toggle */}
            <button
                className="lg:hidden p-4 text-[#1c2434] absolute z-50 top-4 left-4 bg-white rounded-lg shadow-lg border border-slate-200"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar */}
            <aside className={`
                bg-[#1c2434] text-[#8a99af] flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out z-40
                ${isOpen 
                    ? "translate-x-0 fixed inset-y-0 left-0 shadow-2xl" 
                    : "-translate-x-full fixed inset-y-0 left-0 lg:translate-x-0 lg:relative lg:inset-auto"
                }
                ${isCollapsed ? "lg:w-20" : "lg:w-64"}
                w-64
            `}>
                {/* Sidebar Header */}
                <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} border-b border-[#333a48]/50 min-h-[81px]`}>
                    <div className={`flex-shrink-0 p-2.5 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-xl shadow-lg shadow-[#25D366]/20 transition-all duration-300`}>
                        <MessageSquare className="text-white" size={22} />
                    </div>
                    {!isCollapsed && (
                        <h1 className="text-xl font-extrabold tracking-tight !text-white drop-shadow-sm transition-opacity duration-300 overflow-hidden whitespace-nowrap">
                            WA Yönetim
                        </h1>
                    )}
                </div>

                {/* Sidebar Navigation */}
                <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {MENU_ITEMS.map((item) => {
                        const isActive = pathname === item.path || (pathname.startsWith(item.path) && item.path !== "/");
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                title={isCollapsed ? item.name : ""}
                                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 group relative ${isActive
                                    ? "bg-[#333a48] text-white shadow-md shadow-black/20"
                                    : "hover:bg-[#333a48]/50 hover:text-white"
                                    }`}
                            >
                                <div className={`flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                    {item.icon}
                                </div>
                                {!isCollapsed && (
                                    <span className="font-medium text-sm whitespace-nowrap overflow-hidden transition-opacity duration-300">
                                        {item.name}
                                    </span>
                                )}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#3c50e0] rounded-r-full" />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-[#333a48]/50">
                    <button
                        onClick={async () => {
                            await fetch('/api/auth/logout', { method: 'POST' });
                            window.location.href = '/login';
                        }}
                        className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'} px-4 py-3 w-full text-left rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-all duration-200 group`}
                    >
                        <div className="group-hover:scale-110 transition-transform duration-200">
                            <LogOut size={20} />
                        </div>
                        {!isCollapsed && (
                            <span className="font-medium text-sm transition-opacity duration-300">
                                Çıkış Yap
                            </span>
                        )}
                    </button>

                    {/* Desktop Collapse Toggle */}
                    <button
                        onClick={toggleSidebar}
                        className="hidden lg:flex absolute -right-3 top-24 bg-[#3c50e0] text-white p-1.5 rounded-full border-2 border-[#f1f5f9] shadow-xl hover:scale-110 hover:bg-[#303ebd] transition-all z-50 group"
                        title={isCollapsed ? "Genişlet" : "Daralt"}
                    >
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </div>
            </main>

            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
