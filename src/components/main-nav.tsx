"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip"
import { LayoutDashboard, ShoppingCart, Package, LineChart, Bot, Archive, ClipboardList, Settings } from "lucide-react"

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/orders", label: "Pesanan", icon: ShoppingCart },
    { href: "/dashboard/products", label: "Produk", icon: Package },
    { href: "/dashboard/purchases", label: "Transaksi Pembelian", icon: Archive },
    { href: "/dashboard/operational-costs", label: "Biaya Operasional", icon: ClipboardList },
    { href: "/dashboard/reports", label: "Laporan", icon: LineChart },
    { href: "/dashboard/stock-suggestions", label: "Saran Stok", icon: Bot },
    { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
]

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()

  return (
    <TooltipProvider>
      <nav
        className={cn("flex flex-col items-start gap-2", className)}
        {...props}
      >
        {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href) && (item.href !== "/dashboard" || pathname === "/dashboard")
            return (
                <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                         <Link
                            href={item.href}
                            className={cn(
                                "flex w-full items-center justify-start gap-2 rounded-md p-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                isActive
                                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                                : "text-muted-foreground",
                                "group-[.collapsed]:px-2 group-[.collapsed]:w-auto group-[.collapsed]:justify-center"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="group-[.collapsed]:hidden">{item.label}</span>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        {item.label}
                    </TooltipContent>
                </Tooltip>
            )
        })}
      </nav>
    </TooltipProvider>
  )
}
