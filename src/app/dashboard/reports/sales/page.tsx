

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
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
import Image from "next/image";

interface OrderProduct {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
}
interface Order {
  id: string;
  customer: string;
  customerDetails?: { name: string; address: string; whatsapp: string };
  status: 'Delivered' | 'Shipped' | 'Processing' | 'Pending' | 'Cancelled';
  total: number;
  subtotal: number;
  shippingFee: number;
  date: string; // Should be ISO 8601 string
  products: OrderProduct[];
}

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Helper function to process data for the chart
const processSalesDataForChart = (orders: Order[]) => {
    const salesByDate: { [key: string]: number } = {};
    orders.forEach(order => {
        if (order.status === 'Delivered' || order.status === 'Shipped') {
             const date = new Date(order.date);
             if (isValid(date)) {
                const formattedDate = format(date, 'd MMM', { locale: dateFnsLocaleId });
                if (salesByDate[formattedDate]) {
                    salesByDate[formattedDate] += order.total;
                } else {
                    salesByDate[formattedDate] = order.total;
                }
             }
        }
    });

    return Object.keys(salesByDate).map(date => ({
        name: date,
        total: salesByDate[date]
    })).sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
};


function OrderDetailDialog({ order }: { order: Order }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="p-0 h-auto font-medium">
          {order.id}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Faktur #{order.id}</DialogTitle>
          <DialogDescription>
            Tanggal: {format(new Date(order.date), 'dd MMMM yyyy, HH:mm', { locale: dateFnsLocaleId })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pelanggan</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p><strong>Nama:</strong> {order.customerDetails?.name || order.customer}</p>
              <p><strong>Alamat:</strong> {order.customerDetails?.address || 'N/A'}</p>
              <p><strong>WhatsApp:</strong> {order.customerDetails?.whatsapp || 'N/A'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Rincian Produk</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead className="text-right">Harga Satuan</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.products?.map(p => (
                    <TableRow key={p.productId}>
                      <TableCell className="flex items-center gap-2">
                        <Image src={p.image || 'https://placehold.co/40x40.png'} alt={p.name} width={40} height={40} className="rounded" />
                        {p.name}
                      </TableCell>
                      <TableCell>{p.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.quantity * p.price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="space-y-2 text-right text-sm">
            <p>Subtotal Produk: <span className="font-medium">{formatCurrency(order.subtotal)}</span></p>
            <p>Biaya Pengiriman: <span className="font-medium">{formatCurrency(order.shippingFee)}</span></p>
            <p className="font-bold text-base border-t pt-2 mt-2">Total: <span className="text-primary">{formatCurrency(order.total)}</span></p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


export default function SalesReportPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  });

  const filterOrdersByDate = useCallback((orders: Order[], from?: Date, to?: Date) => {
    if (!from && !to) {
        return orders;
    }
    return orders.filter(order => {
        const orderDate = new Date(order.date);
        if (from && orderDate < startOfDay(from)) return false;
        if (to && orderDate > endOfDay(to)) return false;
        return true;
    });
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const ordersDataPromises = querySnapshot.docs.map(async (orderDoc) => {
            const data = orderDoc.data();
            const total = typeof data.total === 'string' 
                ? parseFloat(data.total.replace(/[^0-9]/g, '')) 
                : typeof data.total === 'number' ? data.total : 0;
            
            // Fetch customer details if not embedded
            let customerDetails = data.customerDetails;
            if (data.customerId && !customerDetails) {
                const userDocRef = doc(db, "user", data.customerId);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    customerDetails = userDoc.data();
                }
            }

            return { 
                id: orderDoc.id, 
                ...data, 
                total,
                subtotal: data.subtotal || 0,
                shippingFee: data.shippingFee || 0,
                products: data.products || [],
                date: data.date.toDate ? data.date.toDate().toISOString() : new Date(data.date).toISOString(), // Handle Firestore Timestamp
                customerDetails 
            } as Order;
        });
        const ordersData = await Promise.all(ordersDataPromises);
        setAllOrders(ordersData);
        // Initial filter for today
        const todayOrders = filterOrdersByDate(ordersData, startOfDay(new Date()), endOfDay(new Date()));
        setFilteredOrders(todayOrders);
      } catch (error) {
        console.error("Error fetching orders: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [filterOrdersByDate]);

  const handleFilter = () => {
    const { from, to } = dateRange;
    const filtered = filterOrdersByDate(allOrders, from, to);
    setFilteredOrders(filtered);
  };

  const handleReset = () => {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    setDateRange({ from: todayStart, to: todayEnd });
    const todayOrders = filterOrdersByDate(allOrders, todayStart, todayEnd);
    setFilteredOrders(todayOrders);
  };

  const { totalRevenue, totalOrders, averageOrderValue, chartData } = useMemo(() => {
    const revenue = filteredOrders.reduce((acc, order) => acc + order.total, 0);
    const ordersCount = filteredOrders.length;
    const avgValue = ordersCount > 0 ? revenue / ordersCount : 0;
    const chartDataProcessed = processSalesDataForChart(filteredOrders);
    return {
        totalRevenue: revenue,
        totalOrders: ordersCount,
        averageOrderValue: avgValue,
        chartData: chartDataProcessed
    };
  }, [filteredOrders]);


  if (loading) {
    return (
        <div className="text-center p-8">
            <p>Memuat data laporan penjualan...</p>
        </div>
    )
  }


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Laporan Penjualan</CardTitle>
          <CardDescription>
            Analisis detail penjualan produk Anda. Filter berdasarkan rentang tanggal untuk wawasan yang lebih spesifik.
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

      <div className="grid gap-4 md:grid-cols-3">
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Dari pesanan yang difilter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jumlah Pesanan</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
             <p className="text-xs text-muted-foreground">Dalam rentang tanggal terpilih</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Nilai Pesanan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">Rata-rata nilai per transaksi</p>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Tren Penjualan</CardTitle>
           <CardDescription>Visualisasi pendapatan harian dalam rentang tanggal terpilih.</CardDescription>
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
          <CardTitle>Rincian Penjualan</CardTitle>
          <CardDescription>
            Daftar lengkap transaksi penjualan dalam rentang tanggal terpilih.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                        <TableCell>
                           <OrderDetailDialog order={order} />
                        </TableCell>
                        <TableCell>{order.customerDetails?.name || order.customer}</TableCell>
                        <TableCell>{format(new Date(order.date), 'dd MMM yyyy, HH:mm', { locale: dateFnsLocaleId })}</TableCell>
                        <TableCell>
                        <Badge
                            variant="outline"
                            className={
                                order.status === 'Delivered' ? 'text-green-600 border-green-600' :
                                order.status === 'Shipped' ? 'text-blue-600 border-blue-600' :
                                order.status === 'Processing' ? 'text-yellow-600 border-yellow-600' : 'text-gray-600 border-gray-600'
                            }
                        >
                            {order.status}
                        </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                        {formatCurrency(order.total)}
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                        Tidak ada data penjualan untuk rentang tanggal ini.
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
