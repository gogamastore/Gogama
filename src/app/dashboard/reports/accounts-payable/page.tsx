
"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DollarSign, Calendar as CalendarIcon, Loader2, Receipt, ArrowLeft } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { id as dateFnsLocaleId } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface PurchaseTransaction {
  id: string;
  date: string; // ISO 8601 string
  totalAmount: number;
  supplierName?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function AccountsPayablePage() {
  const [allPayables, setAllPayables] = useState<PurchaseTransaction[]>([]);
  const [filteredPayables, setFilteredPayables] = useState<PurchaseTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const router = useRouter();

  const filterPayablesByDate = useCallback((payables: PurchaseTransaction[], from?: Date, to?: Date) => {
    if (!from && !to) {
      return payables;
    }
    return payables.filter(payable => {
      const transactionDate = new Date(payable.date);
      if (from && transactionDate < startOfDay(from)) return false;
      if (to && transactionDate > endOfDay(to)) return false;
      return true;
    });
  }, []);

  useEffect(() => {
    const fetchPayables = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "purchase_transactions"), where("paymentMethod", "==", "credit"));
        const querySnapshot = await getDocs(q);
        const payablesData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date.toDate ? data.date.toDate().toISOString() : new Date(data.date).toISOString(),
            } as PurchaseTransaction
        });
        setAllPayables(payablesData);
        setFilteredPayables(payablesData);
      } catch (error) {
        console.error("Error fetching accounts payable: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPayables();
  }, []);

  const handleFilter = () => {
    const filtered = filterPayablesByDate(allPayables, dateRange.from, dateRange.to);
    setFilteredPayables(filtered);
  };

  const handleReset = () => {
    setDateRange({});
    setFilteredPayables(allPayables);
  };

  const totalPayableAmount = filteredPayables.reduce((sum, item) => sum + item.totalAmount, 0);

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/reports')}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Kembali ke Laporan</span>
            </Button>
            <div>
                <CardTitle>Laporan Utang Dagang</CardTitle>
                <CardDescription>
                    Lacak semua transaksi pembelian dengan metode pembayaran kredit yang belum lunas.
                </CardDescription>
            </div>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Data</CardTitle>
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
          <Button onClick={handleFilter}>Filter</Button>
          <Button variant="outline" onClick={handleReset}>Reset ke Semua</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utang Dagang</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPayableAmount)}</div>
            <p className="text-xs text-muted-foreground">Dari transaksi yang difilter.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rincian Utang Dagang</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Transaksi</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Jumlah Utang</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredPayables.length > 0 ? (
                  filteredPayables.map((payable) => (
                    <TableRow key={payable.id}>
                      <TableCell className="font-medium">{payable.id}</TableCell>
                      <TableCell>{format(new Date(payable.date), 'dd MMM yyyy', { locale: dateFnsLocaleId })}</TableCell>
                      <TableCell>{payable.supplierName || 'N/A'}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(payable.totalAmount)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      <Receipt className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      Tidak ada data utang dagang pada periode ini.
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
