
"use client";

import { useEffect, useState, useMemo, useCallback, Fragment } from "react";
import { collection, getDocs, query, where, Timestamp, orderBy } from "firebase/firestore";
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
import { Input } from "@/components/ui/input";
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
import { Calendar as CalendarIcon, Search, Package, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { format, startOfDay, endOfDay, parseISO } from "date-fns";
import { id as dateFnsLocaleId } from "date-fns/locale";
import Image from "next/image";

// Interfaces
interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  image: string;
}

interface StockMovement {
    date: Date;
    type: 'Penjualan' | 'Pembelian' | 'Penyesuaian Masuk' | 'Penyesuaian Keluar';
    quantityChange: number;
    relatedInfo: string;
    description: string;
    stockAfter: number | null;
}

// Helper function
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};


function StockHistoryDialog({ product, dateRange }: { product: Product, dateRange: { from?: Date; to?: Date } }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<StockMovement[]>([]);

    const fetchHistory = useCallback(async (productId: string, from?: Date, to?: Date) => {
        if (!from || !to) return;
        setLoading(true);

        const movements: Omit<StockMovement, 'stockAfter'>[] = [];
        const startDate = startOfDay(from);
        const endDate = endOfDay(to);

        // 1. Fetch Sales
        const salesQuery = query(
            collection(db, "orders"),
            where("productIds", "array-contains", productId),
            where("date", ">=", startDate),
            where("date", "<=", endDate)
        );
        const salesSnapshot = await getDocs(salesQuery);
        salesSnapshot.forEach(doc => {
            const orderData = doc.data();
            orderData.products?.forEach((item: { productId: string, quantity: number }) => {
                if (item.productId === productId) {
                    movements.push({
                        date: orderData.date.toDate(),
                        type: 'Penjualan',
                        quantityChange: -item.quantity,
                        relatedInfo: `Order #${doc.id.substring(0, 7)}`,
                        description: `Pelanggan: ${orderData.customer}`
                    });
                }
            });
        });
        
        // 2. Fetch Purchases
        const purchasesQuery = query(
            collection(db, "purchase_transactions"),
            where("date", ">=", startDate),
            where("date", "<=", endDate)
        );
        const purchasesSnapshot = await getDocs(purchasesQuery);
        purchasesSnapshot.forEach(doc => {
             doc.data().items?.forEach((item: { productId: string, quantity: number }) => {
                if(item.productId === productId) {
                    movements.push({
                        date: doc.data().date.toDate(),
                        type: 'Pembelian',
                        quantityChange: item.quantity,
                        relatedInfo: `Faktur #${doc.id.substring(0, 7)}`,
                        description: `Supplier: ${doc.data().supplier || 'Umum'}`
                    })
                }
            })
        });

        // 3. Fetch Adjustments
        const adjustmentsQuery = query(
            collection(db, "stock_adjustments"),
            where("productId", "==", productId),
            where("createdAt", ">=", startDate),
            where("createdAt", "<=", endDate)
        );
        const adjustmentsSnapshot = await getDocs(adjustmentsQuery);
        adjustmentsSnapshot.forEach(doc => {
            const adjData = doc.data();
            const type = adjData.type === 'in' ? 'Penyesuaian Masuk' : 'Penyesuaian Keluar';
            const quantityChange = adjData.type === 'in' ? adjData.quantity : -adjData.quantity;
             movements.push({
                date: adjData.createdAt.toDate(),
                type: type,
                quantityChange: quantityChange,
                relatedInfo: 'Admin Adjustment',
                description: `Alasan: ${adjData.reason}`
            });
        });

        // Sort all movements by date
        const sortedMovements = movements.sort((a,b) => b.date.getTime() - a.date.getTime());

        // Calculate stock after each movement (running total in reverse)
        let currentStock = product.stock;
        const finalHistory = sortedMovements.map(movement => {
            const stockAfter = currentStock;
            currentStock -= movement.quantityChange; // Reverse calculation
            return { ...movement, stockAfter };
        });

        setHistory(finalHistory);
        setLoading(false);
    }, []);

    useEffect(() => {
        if(isOpen) {
            fetchHistory(product.id, dateRange.from, dateRange.to);
        }
    }, [isOpen, product.id, dateRange, fetchHistory]);
    

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Detail</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Riwayat Stok: {product.name}</DialogTitle>
                    <DialogDescription>
                        Menampilkan semua pergerakan stok untuk produk ini dari {dateRange.from ? format(dateRange.from, 'd MMM yyyy') : ''} hingga {dateRange.to ? format(dateRange.to, 'd MMM yyyy') : ''}.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto p-1">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Tipe</TableHead>
                                <TableHead>Info</TableHead>
                                <TableHead>Perubahan</TableHead>
                                <TableHead className="text-right">Stok Akhir</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">Memuat riwayat...</TableCell></TableRow>
                            ) : history.length > 0 ? (
                                history.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{format(item.date, 'dd MMM yyyy, HH:mm')}</TableCell>
                                        <TableCell>
                                            <Badge variant={item.quantityChange > 0 ? "default" : "destructive"}>{item.type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{item.relatedInfo}</div>
                                            <div className="text-xs text-muted-foreground">{item.description}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className={`flex items-center gap-1 font-bold ${item.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {item.quantityChange > 0 ? <ArrowUp className="h-4 w-4"/> : <ArrowDown className="h-4 w-4"/>}
                                                {Math.abs(item.quantityChange)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold">{item.stockAfter}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">Tidak ada pergerakan stok pada periode ini.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default function StockFlowReportPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: startOfDay(new Date(new Date().setDate(new Date().getDate() - 30))),
    to: endOfDay(new Date()),
  });
  
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setAllProducts(productsData);
        setFilteredProducts(productsData);
    } catch (error) {
        console.error("Error fetching products: ", error);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const results = allProducts.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(lowercasedFilter);
      const skuMatch = String(product.sku || '').toLowerCase().includes(lowercasedFilter);
      return nameMatch || skuMatch;
    });
    setFilteredProducts(results);
  }, [searchTerm, allProducts]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Laporan Arus Stok</CardTitle>
          <CardDescription>
            Lacak semua riwayat pergerakan stok untuk setiap produk dalam rentang tanggal tertentu.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1 w-full md:w-auto">
                 <Label htmlFor="date-range">Rentang Tanggal</Label>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button id="date-range" variant={"outline"} className="w-full md:w-[280px] justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}` : format(dateRange.from, "LLL dd, y")) : (<span>Pilih rentang tanggal</span>)}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="flex-1 w-full md:w-auto">
                <Label htmlFor="search-product">Cari Produk</Label>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="search-product" placeholder="Cari berdasarkan nama atau SKU..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Daftar Produk</CardTitle>
            <CardDescription>Pilih produk untuk melihat detail riwayat pergerakan stoknya.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Gambar</TableHead>
                            <TableHead>Produk</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead className="text-right">Stok Saat Ini</TableHead>
                            <TableHead className="text-center w-[100px]">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></TableCell></TableRow>
                        ) : filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <Image src={product.image} alt={product.name} width={64} height={64} className="rounded-md object-cover" />
                                    </TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{product.sku}</TableCell>
                                    <TableCell className="text-right font-bold">{product.stock}</TableCell>
                                    <TableCell className="text-center">
                                       <StockHistoryDialog product={product} dateRange={dateRange}/>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow><TableCell colSpan={5} className="h-24 text-center">Produk tidak ditemukan.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
