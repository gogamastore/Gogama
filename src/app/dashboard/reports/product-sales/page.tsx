
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Package, FileText, Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { id as dateFnsLocaleId } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";

interface OrderProduct {
  productId: string;
  name: string;
  quantity: number;
}
interface Order {
  id: string;
  customer: string;
  status: 'Delivered' | 'Shipped' | 'Processing' | 'Pending';
  date: any; // Firestore Timestamp
  products: OrderProduct[];
}

interface ProductSalesReport {
    id: string;
    name: string;
    sku: string;
    image: string;
    totalSold: number;
    relatedOrders: { orderId: string, customer: string, date: any, quantity: number }[];
}


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function ProductSalesReportPage() {
  const [reportData, setReportData] = useState<ProductSalesReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const generateReport = useCallback(async (from: Date, to: Date) => {
    setLoading(true);
    try {
        const productsSnapshot = await getDocs(collection(db, "products"));
        const productsMap = new Map();
        productsSnapshot.forEach(doc => {
            productsMap.set(doc.id, { ...doc.data(), id: doc.id });
        });

        const ordersQuery = query(
            collection(db, "orders"),
            where("status", "in", ["Shipped", "Delivered"]),
            where("date", ">=", startOfDay(from)),
            where("date", "<=", endOfDay(to))
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        
        const salesMap = new Map<string, ProductSalesReport>();

        ordersSnapshot.forEach(orderDoc => {
            const order = orderDoc.data() as Order;
            order.products?.forEach(productItem => {
                if (!salesMap.has(productItem.productId)) {
                    const productDetails = productsMap.get(productItem.productId);
                    if (productDetails) {
                         salesMap.set(productItem.productId, {
                            id: productItem.productId,
                            name: productDetails.name,
                            sku: productDetails.sku,
                            image: productDetails.image || '',
                            totalSold: 0,
                            relatedOrders: []
                        });
                    }
                }
                const reportItem = salesMap.get(productItem.productId);
                if(reportItem) {
                    reportItem.totalSold += productItem.quantity;
                    reportItem.relatedOrders.push({
                        orderId: orderDoc.id,
                        customer: order.customer,
                        date: order.date,
                        quantity: productItem.quantity,
                    });
                }
            });
        });

        const sortedReport = Array.from(salesMap.values()).sort((a, b) => b.totalSold - a.totalSold);
        setReportData(sortedReport);

    } catch (error) {
        console.error("Error generating product sales report:", error);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dateRange && dateRange.from && dateRange.to) {
        generateReport(dateRange.from, dateRange.to);
    }
  }, [dateRange, generateReport]);
  
  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Laporan Penjualan Produk</CardTitle>
                <CardDescription>
                Analisis produk terlaris berdasarkan jumlah penjualan dalam periode waktu tertentu.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-4">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button id="date" variant={"outline"} className="w-[280px] justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}` : format(dateRange.from, "LLL dd, y")) : (<span>Pilih rentang tanggal</span>)}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                    </PopoverContent>
                </Popover>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Peringkat Penjualan Produk</CardTitle>
                 <CardDescription>
                    Daftar produk terlaris dalam periode yang dipilih.
                 </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Peringkat</TableHead>
                                <TableHead>Produk</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead className="text-right">Total Terjual</TableHead>
                                <TableHead className="text-center w-[100px]">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></TableCell>
                                </TableRow>
                            ) : reportData.length > 0 ? (
                                reportData.map((product, index) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-bold text-lg text-muted-foreground">#{index + 1}</TableCell>
                                    <TableCell className="font-medium flex items-center gap-3">
                                        <Image src={product.image} alt={product.name} width={40} height={40} className="rounded-md object-cover"/>
                                        {product.name}
                                    </TableCell>
                                    <TableCell>{product.sku}</TableCell>
                                    <TableCell className="text-right font-bold text-primary">{product.totalSold} unit</TableCell>
                                    <TableCell className="text-center">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="sm">Lihat</Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-2xl">
                                                <DialogHeader>
                                                    <DialogTitle>Detail Transaksi: {product.name}</DialogTitle>
                                                    <DialogDescription>
                                                        Daftar pesanan yang menyertakan produk ini dalam periode terpilih.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="max-h-[60vh] overflow-y-auto p-1">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Order ID</TableHead>
                                                                <TableHead>Pelanggan</TableHead>
                                                                <TableHead>Tanggal</TableHead>
                                                                <TableHead className="text-right">Jumlah Beli</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {product.relatedOrders.map(order => (
                                                                <TableRow key={order.orderId}>
                                                                    <TableCell>
                                                                        <Button variant="link" asChild className="p-0 h-auto">
                                                                            <Link href="/dashboard/orders">...{order.orderId.slice(-6)}</Link>
                                                                        </Button>
                                                                    </TableCell>
                                                                    <TableCell>{order.customer}</TableCell>
                                                                    <TableCell>{format(order.date.toDate(), 'dd MMM yyyy')}</TableCell>
                                                                    <TableCell className="text-right">{order.quantity}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        Tidak ada data penjualan untuk periode ini.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                 </div>
            </CardContent>
        </Card>
    </div>
  )
}
