import { Inter } from "next/font/google";
import "./globals.css";
import SidebarLayout from "@/components/SidebarLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "WhatsApp Web Dashboard",
    description: "Next.js WhatsApp Web Yönetim Paneli",
    icons: {
        icon: "/whatsapp-icon.svg",
        shortcut: "/whatsapp-icon.svg",
        apple: "/whatsapp-icon.svg",
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="tr">
            <body className={inter.className}>
                <SidebarLayout>
                    {children}
                </SidebarLayout>
            </body>
        </html>
    );
}
