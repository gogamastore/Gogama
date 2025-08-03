
"use client";

import { MainNav } from "@/components/main-nav";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Search, Menu } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, createContext, useContext } from "react";
import Image from "next/image";

// Define the types for the purchase cart
interface CartItem {
  id: string;
  name: string;
  price: string;
  image: string;
  stock: number;
  purchasePrice: number;
  quantity: number;
}

interface PurchaseCartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPurchase: number;
}

// Create the context
const PurchaseCartContext = createContext<PurchaseCartContextType | undefined>(undefined);

// Export the provider as a named export
export const PurchaseCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
        try {
            const savedCart = window.sessionStorage.getItem('purchase-cart');
            if (savedCart) {
                setCart(JSON.parse(savedCart));
            }
        } catch (error) {
            console.error("Failed to load purchase cart from sessionStorage", error);
        }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        try {
            window.sessionStorage.setItem('purchase-cart', JSON.stringify(cart));
        } catch (error) {
            console.error("Failed to save purchase cart to sessionStorage", error);
        }
    }
  }, [cart]);

  const addToCart = (newItem: CartItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === newItem.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + newItem.quantity, purchasePrice: newItem.purchasePrice }
            : item
        );
      }
      return [...prevCart, newItem];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const clearCart = useCallback(() => {
    setCart([]);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('purchase-cart');
    }
  }, []);

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const totalPurchase = cart.reduce((total, item) => total + (item.purchasePrice * item.quantity), 0);
  
  const value = {
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      totalItems,
      totalPurchase
  };

  return (
    <PurchaseCartContext.Provider value={value}>
      {children}
    </PurchaseCartContext.Provider>
  );
};

// Export the hook as a named export from the layout file itself
export const usePurchaseCartFromLayout = () => {
    const context = useContext(PurchaseCartContext);
    if (context === undefined) {
        throw new Error('usePurchaseCartFromLayout must be used within a PurchaseCartProvider in the layout');
    }
    return context;
};

function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 font-semibold font-headline text-lg">
      <Image src="https://firebasestorage.googleapis.com/v0/b/orderflow-r7jsk.firebasestorage.app/o/ic_gogama_logo.png?alt=media&token=c7caf8ae-553a-4cf8-a4ae-bce1446b599c" alt="Gogama Store Logo" width={28} height={28} />
       <span className="group-[.collapsed]:hidden">Gogama Store</span>
    </Link>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
        <div className="flex h-screen items-center justify-center">
            <p>Loading...</p>
        </div>
    )
  }

  return (
    <PurchaseCartProvider>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] group">
        <div className="hidden border-r bg-card md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <Logo />
            </div>
            <div className="flex-1">
              <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                <MainNav />
              </nav>
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col">
                <SheetHeader>
                  <SheetTitle>
                    <Logo />
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    A navigation menu for the mobile dashboard.
                  </SheetDescription>
                </SheetHeader>
                <nav className="grid gap-2 text-lg font-medium">
                  <MainNav />
                </nav>
              </SheetContent>
            </Sheet>

            <div className="w-auto flex-1">
              <form>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="w-auto appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                  />
                </div>
              </form>
            </div>
            <ThemeToggle />
            <UserNav />
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </PurchaseCartProvider>
  );
}
