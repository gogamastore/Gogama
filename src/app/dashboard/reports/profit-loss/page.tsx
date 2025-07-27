
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
  CardFooter
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
import { DollarSign, Download, Calendar as CalendarIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { id as dateFnsLocaleId } from "date-fns/locale";
import * as XLSX from "xlsx";

interface Order {
  id: string;
  total: number;
  date: Date;
  products: { productId: string; quantity: number; price: number }[];
  status: 'Delivered' | 'Shipped' | 'Processing' | 'Pending';
}

interface PurchaseTransaction {
  id: string;
  items: { productId: string; purchasePrice: number }[];
}

interface Expense {
  id: string;
  amount: number;
  date: Date;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function ProfitLossReportPage() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalCogs: 0,
    totalExpenses: 0,
    netProfit: 0,
  });

  const fetchDataForReport = useCallback(async (from: Date, to: Date) => {
    setLoading(true);
    try {
        // 1. Fetch Sales (Revenue and Products Sold)
        const ordersQuery = query(
            collection(db, "orders"),
            where("status", "in", ['Delivered', 'Shipped']),
            where("date", ">=", from),
            where("date", "<=", to)
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        let totalRevenue = 0;
        const soldProductsMap = new Map<string, number>();

        ordersSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const total = typeof data.total === 'string' ? parseFloat(data.total.replace(/[^0-9]/g, '')) : data.total || 0;
            totalRevenue += total;
            data.products?.forEach((p: { productId: string; quantity: number; }) => {
                soldProductsMap.set(p.productId, (soldProductsMap.get(p.productId) || 0) + p.quantity);
            });
        });

        // 2. Fetch Purchase Prices for COGS
        let totalCogs = 0;
        if (soldProductsMap.size > 0) {
            const productIds = Array.from(soldProductsMap.keys());
            // Firestore 'in' query is limited to 30 items per query.
            // If more products, we would need to batch this. For now, assume < 30.
            const purchasesQuery = query(collection(db, "purchase_transactions"), where("items.productId", "in", productIds));
            const purchasesSnapshot = await getDocs(purchasesQuery);
            
            const purchasePrices = new Map<string, number>();
            purchasesSnapshot.docs.forEach(doc => {
                doc.data().items.forEach((item: { productId: string; purchasePrice: number; }) => {
                    if (!purchasePrices.has(item.productId)) { // Use first found price for simplicity
                        purchasePrices.set(item.productId, item.purchasePrice);
                    }
                });
            });

            soldProductsMap.forEach((quantity, productId) => {
                const price = purchasePrices.get(productId) || 0; // Default to 0 if no purchase history
                totalCogs += price * quantity;
            });
        }
        
        // 3. Fetch Operational Expenses
        const expensesQuery = query(
            collection(db, "operational_expenses"),
            where("date", ">=", from),
            where("date", "<=", to)
        );
        const expensesSnapshot = await getDocs(expensesQuery);
        const totalExpenses = expensesSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

        // 4. Calculate Net Profit
        const netProfit = totalRevenue - totalCogs - totalExpenses;

        setReportData({ totalRevenue, totalCogs, totalExpenses, netProfit });

    } catch (error) {
        console.error("Error generating profit-loss report:", error);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dateRange.from && dateRange.to) {
        fetchDataForReport(startOfDay(dateRange.from), endOfDay(dateRange.to));
    }
  }, [dateRange, fetchDataForReport]);
  
  const handleDownloadExcel = () => {
    const fromDate = dateRange.from ? format(dateRange.from, 'dd MMMM yyyy', { locale: dateFnsLocaleId }) : 'N/A';
    const toDate = dateRange.to ? format(dateRange.to, 'dd MMMM yyyy', { locale: dateFnsLocaleId }) : 'N/A';

    const data = [
        ["Laporan Laba-Rugi"],
        ["Periode", `${fromDate} - ${toDate}`],
        [],
        ["Kategori", "Jumlah"],
        ["Pendapatan Kotor", reportData.totalRevenue],
        ["Harga Pokok Penjualan (HPP)", reportData.totalCogs],
        ["Beban Operasional", reportData.totalExpenses],
        [],
        ["Laba Bersih", reportData.netProfit],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Styling (optional, basic styling)
    worksheet["!cols"] = [{ wch: 30 }, { wch: 20 }];
    worksheet["A1"].s = { font: { bold: true, sz: 16 } };
    worksheet["A4"].s = { font: { bold: true } };
    worksheet["B4"].s = { font: { bold: true } };
    worksheet["A9"].s = { font: { bold: true } };
    worksheet["B9"].s = { font: { bold: true } };
    worksheet["B5"].z = '"Rp"#,##0';
    worksheet["B6"].z = '"Rp"#,##0';
    worksheet["B7"].z = '"Rp"#,##0';
    worksheet["B9"].z = '"Rp"#,##0';


    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laba-Rugi");
    XLSX.writeFile(workbook, `Laporan_Laba_Rugi_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <CardTitle>Laporan Laba-Rugi</CardTitle>
          <CardDescription>
            Pahami keuntungan dan kerugian bisnis Anda dalam rentang tanggal tertentu.
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
             <Button onClick={handleDownloadExcel} disabled={loading}>
                <Download className="mr-2 h-4 w-4" />
                Download Excel
            </Button>
        </CardContent>
      </Card>
      
      {loading ? (
        <div className="text-center p-8 text-muted-foreground">Menghitung laporan...</div>
      ) : (
        <Card>
            <CardHeader>
                <CardTitle>Ringkasan Laba-Rugi</CardTitle>
                <CardDescription>
                    Periode: {dateRange.from ? format(dateRange.from, "d MMMM yyyy", { locale: dateFnsLocaleId }) : ''} - {dateRange.to ? format(dateRange.to, "d MMMM yyyy", { locale: dateFnsLocaleId }) : ''}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableBody>
                        <TableRow className="text-base">
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="h-5 w-5 text-green-500"/>
                                    <span className="font-medium">Pendapatan Kotor</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(reportData.totalRevenue)}</TableCell>
                        </TableRow>
                        <TableRow className="text-base">
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <TrendingDown className="h-5 w-5 text-red-500"/>
                                    <span>Harga Pokok Penjualan (HPP)</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(reportData.totalCogs)}</TableCell>
                        </TableRow>
                         <TableRow className="text-base">
                            <TableCell>
                               <div className="flex items-center gap-3">
                                    <TrendingDown className="h-5 w-5 text-yellow-500"/>
                                    <span>Beban Operasional</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(reportData.totalExpenses)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter className="bg-muted/50 p-6 mt-4">
                 <div className={`flex justify-between items-center w-full text-xl font-bold ${reportData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <span>Laba Bersih</span>
                    <span>{formatCurrency(reportData.netProfit)}</span>
                </div>
            </CardFooter>
        </Card>
      )}
    </div>
  )
}
