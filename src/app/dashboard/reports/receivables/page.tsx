
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DollarSign, FileWarning, Calendar as CalendarIcon, Package } from "lucide-react";
import { format, isValid, startOfDay, endOfDay } from "date-fns";
import { id as dateFnsLocaleId } from "date-fns/locale";

interface Order {
  id: string;
  customer: string;
  status: 'Delivered' | 'Shipped' | 'Processing' | 'Pending';
  paymentStatus: 'Paid' | 'Unpaid';
  total: number;
  date: string; // ISO 8601 string
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function ReceivablesReportPage() {
  const [allReceivables, setAllReceivables] = useState<Order[]>([]);
  const [filteredReceivables, setFilteredReceivables] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const filterReceivablesByDate = useCallback((receivables: Order[], from?: Date, to?: Date) => {
    if (!from && !to) {
        return receivables;
    }
    return receivables.filter(order => {
        const orderDate = new Date(order.date);
        if (from && orderDate < startOfDay(from)) return false;
        if (to && orderDate > endOfDay(to)) return false;
        return true;
    });
  }, []);

  useEffect(() => {
    const fetchReceivables = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const allOrders = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const total = typeof data.total === 'string' 
                ? parseFloat(data.total.replace(/[^0-9]/g, '')) 
                : typeof data.total === 'number' ? data.total : 0;
            return { 
                id: doc.id, 
                ...data,
                total,
                date: data.date.toDate ? data.date.toDate().toISOString() : new Date(data.date).toISOString(),
            } as Order;
        });

        // Filter for receivables: Shipped or Delivered status, but Unpaid
        const receivableOrders = allOrders.filter(order => 
            (order.status === 'Shipped' || order.status === 'Delivered') && order.paymentStatus === 'Unpaid'
        );

        setAllReceivables(receivableOrders);
        setFilteredReceivables(receivableOrders); // Initially show all receivables
      } catch (error) {
        console.error("Error fetching receivables: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReceivables();
  }, []);

  const handleFilter = () => {
    const { from, to } = dateRange;
    const filtered = filterReceivablesByDate(allReceivables, from, to);
    setFilteredReceivables(filtered);
  };

  const handleReset = () => {
    setDateRange({});
    setFilteredReceivables(allReceivables);
  };

  const { totalReceivableAmount, totalReceivableOrders } = useMemo(() => {
    const amount = filteredReceivables.reduce((acc, order) => acc + order.total, 0);
    const ordersCount = filteredReceivables.length;
    return {
        totalReceivableAmount: amount,
        totalReceivableOrders: ordersCount,
    };
  }, [filteredReceivables]);

  if (loading) {
    return (
        <div className="text-center p-8">
            <p>Memuat data laporan piutang...</p>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Laporan Piutang Usaha</CardTitle>
          <CardDescription>
            Lacak semua pesanan yang telah dikirim namun belum lunas. Filter berdasarkan rentang tanggal pesanan.
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
            <Button variant="outline" onClick={handleReset}>Reset ke Semua</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Piutang</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalReceivableAmount)}</div>
            <p className="text-xs text-muted-foreground">Dari pesanan yang difilter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jumlah Transaksi Piutang</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReceivableOrders}</div>
             <p className="text-xs text-muted-foreground">Dalam rentang tanggal terpilih</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Rincian Piutang</CardTitle>
          <CardDescription>
            Daftar lengkap transaksi piutang dalam rentang tanggal terpilih.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Tanggal Pesan</TableHead>
                    <TableHead>Status Pesanan</TableHead>
                    <TableHead className="text-right">Jumlah Piutang</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredReceivables.length > 0 ? (
                    filteredReceivables.map((order) => (
                    <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell>{format(new Date(order.date), 'dd MMM yyyy', { locale: dateFnsLocaleId })}</TableCell>
                        <TableCell>
                        <Badge
                            variant="outline"
                            className={
                                order.status === 'Delivered' ? 'text-green-600 border-green-600' : 'text-blue-600 border-blue-600'
                            }
                        >
                            {order.status}
                        </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                        {formatCurrency(order.total)}
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                        Tidak ada data piutang untuk rentang tanggal ini.
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
