"use client";

import { useEffect, useState, useRef } from "react";
import { Search, Send, Paperclip, MoreVertical, Image as ImageIcon, FileText, Check, CheckCheck, MessageSquare, Loader2 } from "lucide-react";
import { io } from "socket.io-client";

export default function ChatsPage() {
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState("");
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const activeChatRef = useRef(null);

    // Keep ref in sync with state so socket handlers always see latest value
    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchChats = async () => {
        try {
            const res = await fetch('/api/chats');
            const data = await res.json();
            if (!data.error) {
                setChats(data);
            }
        } catch (err) {
            console.error("Failed to fetch chats:", err);
        } finally {
            setLoadingChats(false);
        }
    };

    const fetchMessages = async (chatId) => {
        setLoadingMessages(true);
        try {
            const res = await fetch(`/api/chats/${chatId}/messages`);
            const data = await res.json();
            if (!data.error) {
                setMessages(data);
            }
        } catch (err) {
            console.error("Failed to fetch messages:", err);
        } finally {
            setLoadingMessages(false);
        }
    };

    useEffect(() => {
        fetchChats();

        const socket = io(window.location.origin);
        socketRef.current = socket;

        socket.on("incoming_message", (data) => {
            // Update chats list
            setChats(prev => {
                const otherChats = prev.filter(c => c.id !== data.chat.id);
                return [data.chat, ...otherChats];
            });

            // Update messages only if this is the currently active chat
            if (activeChatRef.current?.id === data.chat.id) {
                setMessages(prev => [...prev, data.message]);
            }
        });

        socket.on("sent_message", (data) => {
            setChats(prev => {
                const otherChats = prev.filter(c => c.id !== data.chat.id);
                return [data.chat, ...otherChats];
            });

            if (activeChatRef.current?.id === data.chat.id) {
                setMessages(prev => [...prev, data.message]);
            }
        });

        socket.on("message_ack", (data) => {
            setMessages(prev => prev.map(m => m.messageId === data.messageId ? { ...m, status: data.status } : m));
        });

        return () => socket.disconnect();
    }, []); // Connect socket only once

    const handleSelectChat = (chat) => {
        setActiveChat(chat);
        fetchMessages(chat.id);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!messageText.trim() || !activeChat || !socketRef.current) return;

        socketRef.current.emit("send_message", {
            to: activeChat.whatsappId,
            text: messageText
        });

        setMessageText("");
    };

    return (
        <div className="flex bg-white rounded-xl shadow-sm border border-[#e2e8f0] h-[calc(100vh-8rem)] overflow-hidden">

            {/* Chats List Sidebar */}
            <div className="w-1/3 min-w-[280px] border-r border-[#e2e8f0] flex flex-col">
                <div className="p-4 border-b border-[#e2e8f0]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" size={18} />
                        <input
                            type="text"
                            placeholder="Sohbet veya kişi ara..."
                            className="w-full pl-10 pr-4 py-2 bg-[#f8fafc] border-none rounded-lg text-sm focus:ring-2 focus:ring-[#3c50e0] transition-shadow"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loadingChats ? (
                        <div className="p-8 text-center text-[#64748b]">
                            <Loader2 className="animate-spin inline-block mb-2" />
                            <p className="text-sm">Sohbetler yükleniyor...</p>
                        </div>
                    ) : chats.length === 0 ? (
                        <div className="p-8 text-center text-[#64748b]">
                            <p className="text-sm">Henüz bir sohbet geçmişi yok.</p>
                        </div>
                    ) : (
                        chats.map(chat => (
                            <div
                                key={chat.id}
                                onClick={() => handleSelectChat(chat)}
                                className={`p-4 flex gap-3 cursor-pointer transition-colors border-b border-[#f1f5f9] hover:bg-[#f8fafc] ${activeChat?.id === chat.id ? "bg-[#f1f5f9]" : ""
                                    }`}
                            >
                                <div className="w-12 h-12 rounded-full bg-[#3c50e0]/10 text-[#3c50e0] flex-shrink-0 flex items-center justify-center font-bold">
                                    {chat.name?.charAt(0) || "U"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-semibold text-[#1c2434] truncate">{chat.name}</h3>
                                        <span className="text-[10px] text-[#64748b]">
                                            {chat.lastTimestamp ? new Date(chat.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[#64748b] truncate">{chat.lastMessage}</p>
                                </div>
                                {chat.unreadCount > 0 && (
                                    <div className="w-5 h-5 rounded-full bg-[#3c50e0] text-white text-[10px] flex items-center justify-center font-medium mt-6">
                                        {chat.unreadCount}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Active Chat Area */}
            {activeChat ? (
                <div className="flex-1 min-w-0 flex flex-col bg-[#f8fafc]">
                    {/* Chat Header */}
                    <div className="p-4 bg-white border-b border-[#e2e8f0] flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#3c50e0]/10 text-[#3c50e0] flex items-center justify-center font-bold">
                                {activeChat.name?.charAt(0) || "U"}
                            </div>
                            <div>
                                <h2 className="font-semibold text-[#1c2434]">{activeChat.name}</h2>
                                <span className="text-[10px] text-[#3c50e0] font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                                    {activeChat.isGroup ? "Grup" : "Kişisel"}
                                </span>
                            </div>
                        </div>
                        <button className="p-2 text-[#64748b] hover:bg-[#f1f5f9] rounded-full transition-colors">
                            <MoreVertical size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {loadingMessages ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="animate-spin text-[#3c50e0]" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-[#64748b] italic">
                                Sohbet başlangıcı
                            </div>
                        ) : (
                            messages.map(msg => {
                                // Generate consistent color for each sender name
                                const senderColors = ['#3c50e0', '#e03c7a', '#e0a03c', '#3ce07a', '#7a3ce0', '#e05c3c', '#3cbfe0', '#8f3ce0'];
                                const colorIndex = msg.senderName ? msg.senderName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % senderColors.length : 0;

                                return (
                                    <div key={msg.id} className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[75%] rounded-2xl p-3 shadow-sm overflow-hidden ${msg.fromMe
                                            ? "bg-[#3c50e0] text-white rounded-tr-sm"
                                            : "bg-white text-[#1c2434] border border-[#e2e8f0] rounded-tl-sm"
                                            }`}>
                                            {/* Show sender name in group chats */}
                                            {activeChat?.isGroup && !msg.fromMe && msg.senderName && (
                                                <p className="text-xs font-semibold mb-1" style={{ color: senderColors[colorIndex] }}>
                                                    {msg.senderName}
                                                </p>
                                            )}
                                            <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{msg.text}</p>
                                            <div className={`flex justify-end items-center gap-1 mt-1 text-[10px] ${msg.fromMe ? "text-blue-100" : "text-slate-400"
                                                }`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {msg.fromMe && (
                                                    msg.status === "READ" ? <CheckCheck size={14} className="text-blue-200" /> :
                                                        msg.status === "DELIVERED" ? <CheckCheck size={14} /> :
                                                            <Check size={14} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-[#e2e8f0]">
                        <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-[#f8fafc] p-2 rounded-xl border border-[#e2e8f0]">
                            <button type="button" className="p-2 text-[#64748b] hover:text-[#3c50e0] transition-colors">
                                <Paperclip size={20} />
                            </button>

                            <textarea
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(e);
                                    }
                                }}
                                placeholder="Bir mesaj yazın..."
                                className="flex-1 bg-transparent border-none resize-none max-h-32 min-h-[40px] focus:ring-0 p-2 text-sm"
                                rows={1}
                            />

                            <button
                                type="submit"
                                disabled={!messageText.trim()}
                                className={`p-2 rounded-lg transition-colors ${messageText.trim() ? "bg-[#3c50e0] text-white" : "text-[#cbd5e1]"
                                    }`}
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center flex-col text-[#64748b] bg-[#f8fafc]">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <MessageSquare size={32} className="text-[#3c50e0]" />
                    </div>
                    <h2 className="text-xl font-bold text-[#1c2434] mb-1">Hoş Geldiniz</h2>
                    <p className="text-sm">Mesajlaşmaya başlamak için sol taraftan bir sohbet seçin.</p>
                </div>
            )}
        </div>
    );
}
