"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip"
import { LayoutDashboard, ShoppingCart, Package, LineChart, Bot, Archive, ClipboardList, Settings, ChevronDown, Banknote, Users, Contact, Building, Receipt } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "./ui/button"

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/orders", label: "Pesanan", icon: ShoppingCart },
    { href: "/dashboard/products", label: "Produk", icon: Package },
    { href: "/dashboard/purchases", label: "Transaksi Pembelian", icon: Archive },
    { href: "/dashboard/operational-costs", label: "Biaya Operasional", icon: ClipboardList },
]

const reportsSubMenu = [
    { href: "/dashboard/reports/sales", label: "Penjualan" },
    { href: "/dashboard/reports/purchases", label: "Pembelian" },
    { href: "/dashboard/reports/profit-loss", label: "Laba-Rugi" },
    { href: "/dashboard/reports/balance-sheet", label: "Neraca" },
]

const settingsSubMenu = [
    { href: "/dashboard/settings/bank-accounts", label: "Rekening Bank", icon: Banknote },
    { href: "/dashboard/settings/staff", label: "Manajemen Staf", icon: Users },
    { href: "/dashboard/settings/contacts", label: "Daftar Kontak", icon: Contact },
    { href: "/dashboard/settings/suppliers", label: "Manajemen Supplier", icon: Building },
    { href: "/dashboard/settings/promo", label: "Promo" },
    { href: "/dashboard/settings/design", label: "Desain" },
]


export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()
  const isSettingsOpen = pathname.startsWith('/dashboard/settings');
  const isReportsOpen = pathname.startsWith('/dashboard/reports');
  

  return (
    <TooltipProvider>
      <nav
        className={cn("flex flex-col items-start gap-1", className)}
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
                                "flex w-full items-center justify-start gap-3 rounded-md p-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
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

        <Collapsible defaultOpen={isReportsOpen} className="w-full">
           <CollapsibleTrigger asChild>
                <Link href="/dashboard/reports" className={cn(
                    "flex w-full items-center justify-start gap-3 p-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground rounded-md",
                    isReportsOpen ? "text-accent-foreground" : "text-muted-foreground",
                     "group-[.collapsed]:px-2 group-[.collapsed]:w-auto group-[.collapsed]:justify-center"
                )}>
                    <LineChart className="h-5 w-5" />
                    <span className="group-[.collapsed]:hidden flex-1 text-left">Laporan</span>
                    <ChevronDown className="h-4 w-4 group-[.collapsed]:hidden transition-transform [&[data-state=open]]:rotate-180" />
                </Link>
            </CollapsibleTrigger>
        </Collapsible>
        
        <Collapsible defaultOpen={isSettingsOpen} className="w-full">
           <CollapsibleTrigger asChild>
                <Link href="/dashboard/settings" className={cn(
                    "flex w-full items-center justify-start gap-3 p-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground rounded-md",
                    isSettingsOpen ? "text-accent-foreground" : "text-muted-foreground",
                     "group-[.collapsed]:px-2 group-[.collapsed]:w-auto group-[.collapsed]:justify-center"
                )}>
                    <Settings className="h-5 w-5" />
                    <span className="group-[.collapsed]:hidden flex-1 text-left">Pengaturan</span>
                    <ChevronDown className="h-4 w-4 group-[.collapsed]:hidden transition-transform [&[data-state=open]]:rotate-180" />
                </Link>
            </CollapsibleTrigger>
        </Collapsible>

        <Tooltip>
            <TooltipTrigger asChild>
                    <Link
                    href="/dashboard/stock-suggestions"
                    className={cn(
                        "flex w-full items-center justify-start gap-3 rounded-md p-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                        pathname.startsWith('/dashboard/stock-suggestions')
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                        : "text-muted-foreground",
                        "group-[.collapsed]:px-2 group-[.collapsed]:w-auto group-[.collapsed]:justify-center"
                    )}
                >
                    <Bot className="h-5 w-5" />
                    <span className="group-[.collapsed]:hidden">Saran Stok</span>
                </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
                Saran Stok
            </TooltipContent>
        </Tooltip>

      </nav>
    </TooltipProvider>
  )
}
