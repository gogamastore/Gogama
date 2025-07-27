"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Download, MoreHorizontal, CreditCard, CheckCircle } from "lucide-react"
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  customer: string;
  status: 'Delivered' | 'Shipped' | 'Processing' | 'Pending';
  paymentStatus: 'Paid' | 'Unpaid';
  total: string;
  date: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const ordersData = querySnapshot.docs.map(doc => ({ 
            id: doc.id, 
            paymentStatus: 'Unpaid', // Default to unpaid if not present
            ...doc.data() 
        } as Order));
        setOrders(ordersData);
    } catch (error) {
        console.error("Error fetching orders: ", error);
        toast({
            variant: "destructive",
            title: "Gagal memuat pesanan",
            description: "Terjadi kesalahan saat mengambil data dari server."
        });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdatePaymentStatus = async (orderId: string, newStatus: 'Paid' | 'Unpaid') => {
    const orderRef = doc(db, "orders", orderId);
    try {
        await updateDoc(orderRef, { paymentStatus: newStatus });
        setOrders(prevOrders => 
            prevOrders.map(order => 
                order.id === orderId ? { ...order, paymentStatus: newStatus } : order
            )
        );
        toast({
            title: "Status Pembayaran Diperbarui",
            description: `Pesanan ${orderId} telah ditandai sebagai ${newStatus === 'Paid' ? 'Lunas' : 'Belum Lunas'}.`,
        });
    } catch (error) {
         console.error("Error updating payment status: ", error);
         toast({
            variant: "destructive",
            title: "Gagal Memperbarui Status",
            description: "Terjadi kesalahan saat memperbarui status pembayaran."
        });
    }
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Pesanan</CardTitle>
                <CardDescription>Lihat dan kelola semua pesanan yang masuk.</CardDescription>
            </div>
            <Button>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox />
              </TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Status Pesanan</TableHead>
              <TableHead>Status Pembayaran</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right w-[50px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">Memuat pesanan...</TableCell>
                </TableRow>
            ) : orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>{order.customer}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={
                    order.status === 'Delivered' ? 'text-green-600 border-green-600' :
                    order.status === 'Shipped' ? 'text-blue-600 border-blue-600' :
                    order.status === 'Processing' ? 'text-yellow-600 border-yellow-600' : 'text-gray-600 border-gray-600'
                  }>{order.status}</Badge>
                </TableCell>
                <TableCell>
                   <Badge variant={order.paymentStatus === 'Paid' ? 'default' : 'destructive'}>
                        {order.paymentStatus === 'Paid' ? 'Lunas' : 'Belum Lunas'}
                    </Badge>
                </TableCell>
                <TableCell>{order.date}</TableCell>
                <TableCell className="text-right">{order.total}</TableCell>
                 <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        <DropdownMenuItem>Lihat Detail</DropdownMenuItem>
                        <DropdownMenuItem>Cetak Label</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Ubah Status Pembayaran</DropdownMenuLabel>
                        <DropdownMenuItem 
                            disabled={order.paymentStatus === 'Paid'}
                            onClick={() => handleUpdatePaymentStatus(order.id, 'Paid')}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Tandai Sudah Lunas
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            disabled={order.paymentStatus === 'Unpaid'}
                            onClick={() => handleUpdatePaymentStatus(order.id, 'Unpaid')}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Tandai Belum Lunas
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
