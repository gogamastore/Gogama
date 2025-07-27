import { CartProvider } from "@/hooks/use-cart"
import ResellerHeader from "./components/reseller-header"

function Logo() {
  return (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6 text-primary"
      >
        <path d="M2 12.5C2 11.12 3.12 10 4.5 10H6a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h2.5a2.5 2.5 0 0 0 2.5-2.5V10.5A2.5 2.5 0 0 1 17.5 8H20" />
        <path d="M2 17.5c0-1.38 1.12-2.5 2.5-2.5H6a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h2.5a2.5 2.5 0 0 0 2.5-2.5V10.5A2.5 2.5 0 0 1 17.5 8H20" />
        <path d="m21 15-4-4" />
        <path d="m17 15 4-4" />
      </svg>
  );
}

export default function ResellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="flex flex-col min-h-screen">
        <ResellerHeader />
        <main className="flex-1 bg-background">{children}</main>
        <footer className="bg-card border-t">
          <div className="container mx-auto p-4 text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} OrderFlow. All rights reserved.
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}
