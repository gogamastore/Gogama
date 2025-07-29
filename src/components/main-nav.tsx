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
import { LayoutDashboard, ShoppingCart, Package, LineChart, Bot, Archive, ClipboardList, Settings, ChevronDown, Banknote, Users } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "./ui/button"

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/orders", label: "Pesanan", icon: ShoppingCart },
    { href: "/dashboard/products", label: "Produk", icon: Package },
    { href: "/dashboard/purchases", label: "Transaksi Pembelian", icon: Archive },
    { href: "/dashboard/operational-costs", label: "Biaya Operasional", icon: ClipboardList },
    { href: "/dashboard/reports", label: "Laporan", icon: LineChart },
    { href: "/dashboard/stock-suggestions", label: "Saran Stok", icon: Bot },
]

const settingsSubMenu = [
    { href: "/dashboard/settings/bank-accounts", label: "Rekening Bank", icon: Banknote },
    { href: "/dashboard/settings/staff", label: "Manajemen Staf", icon: Users },
]


export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()
  const isSettingsOpen = pathname.startsWith('/dashboard/settings');
  

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

        <Collapsible defaultOpen={isSettingsOpen} className="w-full">
           <CollapsibleTrigger asChild>
                <Button variant="ghost" className={cn(
                    "flex w-full items-center justify-start gap-3 p-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    isSettingsOpen ? "text-accent-foreground" : "text-muted-foreground",
                     "group-[.collapsed]:px-2 group-[.collapsed]:w-auto group-[.collapsed]:justify-center"
                )}>
                    <Settings className="h-5 w-5" />
                    <span className="group-[.collapsed]:hidden flex-1 text-left">Pengaturan</span>
                    <ChevronDown className="h-4 w-4 group-[.collapsed]:hidden transition-transform [&[data-state=open]]:rotate-180" />
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pt-1 group-[.collapsed]:hidden">
                 {settingsSubMenu.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex w-full items-center justify-start gap-3 rounded-md py-2 pl-11 pr-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                            )}
                        >
                             <Icon className="h-5 w-5" />
                             <span>{item.label}</span>
                        </Link>
                    )
                 })}
            </CollapsibleContent>
        </Collapsible>
      </nav>
    </TooltipProvider>
  )
}
