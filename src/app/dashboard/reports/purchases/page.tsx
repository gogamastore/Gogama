
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { DollarSign, Package, Calendar as CalendarIcon, FileText } from "lucide-react";
import { format, isValid, startOfDay, endOfDay } from "date-fns";
import { id as dateFnsLocaleId } from "date-fns/locale";

interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
}
interface PurchaseTransaction {
  id: string;
  date: string; // ISO 8601 string
  totalAmount: number;
  items: PurchaseItem[];
  supplier?: string;
}

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Helper to process data for the chart
const processPurchaseDataForChart = (transactions: PurchaseTransaction[]) => {
    const purchasesByDate: { [key: string]: number } = {};
    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        if (isValid(date)) {
            const formattedDate = format(date, 'd MMM', { locale: dateFnsLocaleId });
            if (purchasesByDate[formattedDate]) {
                purchasesByDate[formattedDate] += transaction.totalAmount;
            } else {
                purchasesByDate[formattedDate] = transaction.totalAmount;
            }
        }
    });

    return Object.keys(purchasesByDate).map(date => ({
        name: date,
        total: purchasesByDate[date]
    })).sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
};

export default function PurchasesReportPage() {
  const [allTransactions, setAllTransactions] = useState<PurchaseTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<PurchaseTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  });
  
  const filterTransactionsByDate = useCallback((transactions: PurchaseTransaction[], from?: Date, to?: Date) => {
    if (!from && !to) {
        return transactions;
    }
    return transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        if (from && transactionDate < startOfDay(from)) return false;
        if (to && transactionDate > endOfDay(to)) return false;
        return true;
    });
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        // Assuming purchase transactions are stored in a "purchase_transactions" collection
        const querySnapshot = await getDocs(collection(db, "purchase_transactions"));
        const transactionsData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id, 
                ...data,
                date: data.date.toDate ? data.date.toDate().toISOString() : new Date(data.date).toISOString(),
            } as PurchaseTransaction;
        });
        setAllTransactions(transactionsData);
        const todayTransactions = filterTransactionsByDate(transactionsData, startOfDay(new Date()), endOfDay(new Date()));
        setFilteredTransactions(todayTransactions);
      } catch (error) {
        console.error("Error fetching purchase transactions: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [filterTransactionsByDate]);
  
  const handleFilter = () => {
    const { from, to } = dateRange;
    const filtered = filterTransactionsByDate(allTransactions, from, to);
    setFilteredTransactions(filtered);
  };

  const handleReset = () => {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    setDateRange({ from: todayStart, to: todayEnd });
    const todayTransactions = filterTransactionsByDate(allTransactions, todayStart, todayEnd);
    setFilteredTransactions(todayTransactions);
  };

  const { totalPurchaseAmount, totalTransactions, chartData } = useMemo(() => {
    const amount = filteredTransactions.reduce((acc, trans) => acc + trans.totalAmount, 0);
    const transCount = filteredTransactions.length;
    const chartDataProcessed = processPurchaseDataForChart(filteredTransactions);
    return {
        totalPurchaseAmount: amount,
        totalTransactions: transCount,
        chartData: chartDataProcessed,
    };
  }, [filteredTransactions]);

  if (loading) {
    return (
        <div className="text-center p-8">
            <p>Memuat data laporan pembelian...</p>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Laporan Transaksi Pembelian</CardTitle>
          <CardDescription>
            Lacak semua transaksi pembelian stok. Filter berdasarkan rentang tanggal.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className="w-[280px] justify-start text-left font-normal"
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                        dateRange.to ? (
                            <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                            </>
                        ) : (
                            format(dateRange.from, "LLL dd, y")
                        )
                        ) : (
                        <span>Pilih rentang tanggal</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
            <Button onClick={handleFilter}>Filter</Button>
            <Button variant="outline" onClick={handleReset}>Reset</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pembelian</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPurchaseAmount)}</div>
            <p className="text-xs text-muted-foreground">Dari transaksi yang difilter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jumlah Transaksi</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
             <p className="text-xs text-muted-foreground">Dalam rentang tanggal terpilih</p>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Tren Pembelian</CardTitle>
           <CardDescription>Visualisasi pengeluaran pembelian harian dalam rentang tanggal terpilih.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value as number)} />
                    <Tooltip
                        contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                        }}
                         formatter={(value) => formatCurrency(value as number)}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rincian Transaksi Pembelian</CardTitle>
          <CardDescription>
            Daftar lengkap transaksi pembelian dalam rentang tanggal terpilih.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>ID Transaksi</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.id}</TableCell>
                        <TableCell>{format(new Date(transaction.date), 'dd MMM yyyy', { locale: dateFnsLocaleId })}</TableCell>
                        <TableCell>{transaction.supplier || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                        {formatCurrency(transaction.totalAmount)}
                        </TableCell>
                        <TableCell className="text-center">
                        <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <FileText className="h-4 w-4" />
                                        <span className="sr-only">Lihat Faktur Pembelian</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Faktur Pembelian #{transaction.id}</DialogTitle>
                                        <DialogDescription>
                                            Tanggal: {format(new Date(transaction.date), 'dd MMMM yyyy', { locale: dateFnsLocaleId })}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Rincian Produk Dibeli</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="overflow-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Produk</TableHead>
                                                                <TableHead>Jumlah</TableHead>
                                                                <TableHead className="text-right">Harga Beli Satuan</TableHead>
                                                                <TableHead className="text-right">Subtotal</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {transaction.items?.map(item => (
                                                                <TableRow key={item.productId}>
                                                                    <TableCell>{item.productName}</TableCell>
                                                                    <TableCell>{item.quantity}</TableCell>
                                                                    <TableCell className="text-right">{formatCurrency(item.purchasePrice)}</TableCell>
                                                                    <TableCell className="text-right">{formatCurrency(item.quantity * item.purchasePrice)}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <div className="text-right font-bold text-lg">
                                            Total Pembelian: {formatCurrency(transaction.totalAmount)}
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                        Tidak ada data pembelian untuk rentang tanggal ini.
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    
