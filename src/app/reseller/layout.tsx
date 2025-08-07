
import type { Metadata } from "next";
import { Poppins, PT_Sans } from "next/font/google";
import "./../globals.css";
import { cn } from "@/lib/utils";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";
import BottomNav from "@/components/layout/bottom-nav";
import { CartProvider } from "@/hooks/use-cart";
import ResellerChatTrigger from "./components/reseller-chat-trigger";

export const metadata: Metadata = {
  title: "Gogama Experience",
  description: "Your one-stop shop for everything.",
  icons: {
    icon: 'https://firebasestorage.googleapis.com/v0/b/orderflow-r7jsk.firebasestorage.app/o/ic_gogama_logo.png?alt=media&token=c7caf8ae-553a-4cf8-a4ae-bce1446b599c',
  },
};

export default function ResellerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
     <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased")}>
        <CartProvider>
            <div className="relative flex min-h-dvh flex-col bg-background">
              <Header />
              <main className="flex-1 pb-20 md:pb-0">{children}</main>
              <Footer />
              <BottomNav />
              <ResellerChatTrigger />
            </div>
            <Toaster />
        </CartProvider>
      </body>
    </html>
  );
}
