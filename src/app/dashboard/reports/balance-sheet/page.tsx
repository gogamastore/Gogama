
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Download, Scale } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { id as dateFnsLocaleId } from "date-fns/locale";
import * as XLSX from "xlsx";

// Helper function
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Generate month options for the filter
const getMonthOptions = () => {
  const options = [];
  const today = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    options.push({
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy", { locale: dateFnsLocaleId }),
    });
  }
  return options;
};

export default function BalanceSheetPage() {
  const [loading, setLoading] = useState(true);
  const monthOptions = useMemo(() => getMonthOptions(), []);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);
  
  const [reportData, setReportData] = useState({
    assets: {
      currentAssets: {
        cash: 0,
        receivables: 0,
        inventory: 0,
        total: 0,
      },
      total: 0,
    },
    liabilitiesAndEquity: {
      equity: {
        retainedEarnings: 0,
        total: 0,
      },
      total: 0,
    },
  });

  const generateReport = useCallback(async (month: string) => {
    setLoading(true);
    try {
        const [year, monthIndex] = month.split('-').map(Number);
        const startDate = startOfMonth(new Date(year, monthIndex - 1));
        const endDate = endOfMonth(new Date(year, monthIndex - 1));

        // --- CALCULATE ASSETS ---

        // 1. Receivables (Piutang) at end of month
        const receivablesQuery = query(
            collection(db, "orders"),
            where("paymentStatus", "==", "Unpaid"),
            where("status", "in", ["Shipped", "Delivered"]),
            where("date", "<=", Timestamp.fromDate(endDate))
        );
        const receivablesSnapshot = await getDocs(receivablesQuery);
        const totalReceivables = receivablesSnapshot.docs.reduce((sum, doc) => sum + (doc.data().total || 0), 0);
        
        // 2. Inventory Value (Nilai Persediaan) at end of month
        const productsSnapshot = await getDocs(collection(db, "products"));
        // This is a simplified inventory valuation. A real system would need historical purchase prices.
        // We'll use the latest purchase price we can find for each product.
        const purchasePrices = new Map<string, number>();
        const purchasesSnapshot = await getDocs(collection(db, "purchase_transactions"));
        purchasesSnapshot.docs.forEach(doc => {
            doc.data().items.forEach((item: { productId: string; purchasePrice: number; }) => {
                 purchasePrices.set(item.productId, item.purchasePrice);
            });
        });

        let totalInventoryValue = 0;
        productsSnapshot.docs.forEach(doc => {
            const product = doc.data();
            const purchasePrice = purchasePrices.get(doc.id) || 0;
            totalInventoryValue += (product.stock || 0) * purchasePrice;
        });

        // --- CALCULATE LIABILITIES & EQUITY ---
        
        // 3. Retained Earnings (Laba Ditahan) up to end of month
        const allTimeEndDate = endOfMonth(new Date()); // Use a fixed end date for all-time calculation
        const revenueQuery = query(collection(db, "orders"), where("date", "<=", Timestamp.fromDate(endDate)));
        const expensesQuery = query(collection(db, "operational_expenses"), where("date", "<=", Timestamp.fromDate(endDate)));
        const purchasesQuery = query(collection(db, "purchase_transactions"), where("date", "<=", Timestamp.fromDate(endDate)));
        
        const [revenueSnapshot, expensesSnapshot, purchasesSnapshotData] = await Promise.all([
             getDocs(revenueQuery),
             getDocs(expensesQuery),
             getDocs(purchasesQuery),
        ]);

        const totalRevenue = revenueSnapshot.docs.reduce((sum, doc) => sum + (doc.data().total || 0), 0);
        const totalExpenses = expensesSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
        const totalCogs = purchasesSnapshotData.docs.reduce((sum, doc) => sum + (doc.data().totalAmount || 0), 0);

        const retainedEarnings = totalRevenue - totalCogs - totalExpenses;
        
        // 4. Cash (Kas) - Simplified calculation
        const cash = retainedEarnings - totalReceivables; // A proxy for cash

        const totalCurrentAssets = cash + totalReceivables + totalInventoryValue;
        const totalAssets = totalCurrentAssets; // Assuming no fixed assets for now
        
        const totalEquity = retainedEarnings;
        const totalLiabilitiesAndEquity = totalEquity; // Assuming no liabilities for now

        setReportData({
            assets: {
                currentAssets: { cash, receivables: totalReceivables, inventory: totalInventoryValue, total: totalCurrentAssets },
                total: totalAssets,
            },
            liabilitiesAndEquity: {
                equity: { retainedEarnings, total: totalEquity },
                total: totalLiabilitiesAndEquity,
            }
        });

    } catch (error) {
        console.error("Error generating balance sheet:", error);
    } finally {
        setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    generateReport(selectedMonth);
  }, [selectedMonth, generateReport]);

  const handleDownloadExcel = () => {
    const monthLabel = monthOptions.find(opt => opt.value === selectedMonth)?.label || selectedMonth;

    const data = [
      ["Laporan Neraca"],
      ["Periode", `Per Akhir ${monthLabel}`],
      [],
      ["AKTIVA", "", "PASIVA", ""],
      ["Aset Lancar", "" ,"Ekuitas", ""],
      ["Kas & Bank", formatCurrency(reportData.assets.currentAssets.cash), "Laba Ditahan", formatCurrency(reportData.liabilitiesAndEquity.equity.retainedEarnings)],
      ["Piutang Usaha", formatCurrency(reportData.assets.currentAssets.receivables)],
      ["Persediaan", formatCurrency(reportData.assets.currentAssets.inventory)],
      ["Total Aset Lancar", formatCurrency(reportData.assets.currentAssets.total), "Total Ekuitas", formatCurrency(reportData.liabilitiesAndEquity.equity.total)],
      [],
      ["TOTAL AKTIVA", formatCurrency(reportData.assets.total), "TOTAL PASIVA", formatCurrency(reportData.liabilitiesAndEquity.total)],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 25 }, { wch: 20 }];
    // Basic styling could be added here
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Neraca");
    XLSX.writeFile(workbook, `Laporan_Neraca_${selectedMonth}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Laporan Neraca</CardTitle>
          <CardDescription>
            Lihat posisi keuangan aset, kewajiban, dan ekuitas bisnis Anda pada akhir bulan tertentu.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Pilih Bulan" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleDownloadExcel} disabled={loading}>
            <Download className="mr-2 h-4 w-4" />
            Download Excel
          </Button>
        </CardContent>
      </Card>
      
      {loading ? (
        <div className="text-center p-8 text-muted-foreground">Menyusun laporan neraca...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Neraca Keuangan</CardTitle>
            <CardDescription>
              Posisi per akhir {monthOptions.find(opt => opt.value === selectedMonth)?.label}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
                {/* Aktiva */}
                <div>
                    <h3 className="text-lg font-semibold mb-2 text-center">AKTIVA</h3>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Aset Lancar</TableHead>
                                <TableHead className="text-right">Jumlah</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>Kas & Bank</TableCell>
                                <TableCell className="text-right">{formatCurrency(reportData.assets.currentAssets.cash)}</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>Piutang Usaha</TableCell>
                                <TableCell className="text-right">{formatCurrency(reportData.assets.currentAssets.receivables)}</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>Persediaan</TableCell>
                                <TableCell className="text-right">{formatCurrency(reportData.assets.currentAssets.inventory)}</TableCell>
                            </TableRow>
                            <TableRow className="font-bold bg-muted/50">
                                <TableCell>Total Aset Lancar</TableCell>
                                <TableCell className="text-right">{formatCurrency(reportData.assets.currentAssets.total)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
                {/* Pasiva */}
                <div>
                    <h3 className="text-lg font-semibold mb-2 text-center">PASIVA</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ekuitas</TableHead>
                                <TableHead className="text-right">Jumlah</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>Laba Ditahan</TableCell>
                                <TableCell className="text-right">{formatCurrency(reportData.liabilitiesAndEquity.equity.retainedEarnings)}</TableCell>
                            </TableRow>
                            <TableRow className="font-bold bg-muted/50">
                                <TableCell>Total Ekuitas</TableCell>
                                <TableCell className="text-right">{formatCurrency(reportData.liabilitiesAndEquity.equity.total)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>
          </CardContent>
          <CardFooter className="bg-primary/10 p-6 mt-4 grid md:grid-cols-2 gap-8">
            <div className="flex justify-between items-center w-full text-lg font-bold text-primary">
                <div className="flex items-center gap-3">
                    <Scale className="h-6 w-6"/>
                    <span>TOTAL AKTIVA</span>
                </div>
                <span>{formatCurrency(reportData.assets.total)}</span>
            </div>
            <div className="flex justify-between items-center w-full text-lg font-bold text-primary">
                <div className="flex items-center gap-3">
                    <Scale className="h-6 w-6"/>
                    <span>TOTAL PASIVA</span>
                </div>
                <span>{formatCurrency(reportData.liabilitiesAndEquity.total)}</span>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
