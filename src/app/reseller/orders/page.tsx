"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileText, Loader2, Package, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { id as dateFnsLocaleId } from 'date-fns/locale';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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
  status: 'Delivered' | 'Shipped' | 'Processing' | 'Pending' | 'Cancelled';
  paymentStatus: 'Paid' | 'Unpaid';
  total: number;
  date: any;
  products: OrderProduct[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function OrderHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchOrders() {
      if (authLoading) return;
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const q = query(
          collection(db, 'orders'),
          where('customerId', '==', user.uid),
          orderBy('date', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const ordersData = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Order)
        );
        setOrders(ordersData);
      } catch (error) {
        console.error('Error fetching orders: ', error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [user, authLoading]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
         <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Kembali</span>
        </Button>
        <h1 className="text-3xl font-bold font-headline">Riwayat Pesanan</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Pesanan Saya</CardTitle>
          <CardDescription>
            Lihat semua riwayat transaksi Anda di sini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status Pesanan</TableHead>
                <TableHead>Status Pembayaran</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center w-[100px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      ...{order.id.slice(-6)}
                    </TableCell>
                    <TableCell>
                      {format(order.date.toDate(), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          order.status === 'Delivered'
                            ? 'text-green-600 border-green-600'
                            : order.status === 'Shipped'
                            ? 'text-blue-600 border-blue-600'
                            : order.status === 'Processing'
                            ? 'text-yellow-600 border-yellow-600'
                            : 'text-gray-600 border-gray-600'
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.paymentStatus === 'Paid'
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {order.paymentStatus === 'Paid' ? 'Lunas' : 'Belum Lunas'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell className="text-center">
                       <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <FileText className="h-4 w-4" />
                                    <span className="sr-only">Lihat Detail</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Detail Pesanan #{order.id}</DialogTitle>
                                    <DialogDescription>
                                        Tanggal: {format(order.date.toDate(), 'dd MMMM yyyy, HH:mm', { locale: dateFnsLocaleId })}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="max-h-[60vh] overflow-y-auto p-1 space-y-4">
                                     <Card>
                                        <CardHeader><CardTitle>Produk yang Dipesan</CardTitle></CardHeader>
                                        <CardContent>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Produk</TableHead>
                                                        <TableHead>Jumlah</TableHead>
                                                        <TableHead className="text-right">Harga</TableHead>
                                                        <TableHead className="text-right">Subtotal</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {order.products.map(p => (
                                                        <TableRow key={p.productId}>
                                                            <TableCell className="flex items-center gap-2">
                                                                <Image src={p.image} alt={p.name} width={40} height={40} className="rounded" />
                                                                {p.name}
                                                            </TableCell>
                                                            <TableCell>{p.quantity}</TableCell>
                                                            <TableCell className="text-right">{formatCurrency(p.price)}</TableCell>
                                                            <TableCell className="text-right">{formatCurrency(p.price * p.quantity)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                     <div className="text-right font-bold text-lg border-t pt-4">
                                        Total Pesanan: {formatCurrency(order.total)}
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Package className="mx-auto h-8 w-8 text-muted-foreground mb-2"/>
                    Anda belum memiliki riwayat pesanan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
