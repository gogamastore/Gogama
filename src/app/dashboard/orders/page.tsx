
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Download, MoreHorizontal, CreditCard, CheckCircle, FileText, Printer } from "lucide-react"
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";
import { format } from 'date-fns';
import jsPDF from "jspdf";
import "jspdf-autotable";

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface OrderProduct {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}
interface CustomerDetails {
    name: string;
    address: string;
    whatsapp: string;
}

interface Order {
  id: string;
  customer: string;
  customerDetails?: CustomerDetails;
  status: 'Delivered' | 'Shipped' | 'Processing' | 'Pending';
  paymentStatus: 'Paid' | 'Unpaid';
  paymentProofUrl?: string;
  total: string;
  date: any; // Allow for Firestore Timestamp object
  products?: OrderProduct[];
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
  
  const generatePdf = async (order: Order) => {
    const doc = new jsPDF();
    
    // Fetch full order details if needed
    let detailedOrder = order;
    if (!order.products || !order.customerDetails) {
        const orderDoc = await getDoc(doc(db, "orders", order.id));
        if (orderDoc.exists()) {
            detailedOrder = { id: orderDoc.id, ...orderDoc.data() } as Order;
        }
    }

    // Title
    doc.setFontSize(20);
    doc.text("Faktur Pesanan", 14, 22);

    // Order Info
    doc.setFontSize(10);
    doc.text(`ID Pesanan: ${detailedOrder.id}`, 14, 32);
    doc.text(`Tanggal: ${format(detailedOrder.date.toDate(), 'dd MMM yyyy')}`, 14, 37);
    
    // Customer Info
    doc.text("Informasi Pelanggan:", 14, 47);
    const customerInfo = detailedOrder.customerDetails;
    doc.text(`Nama: ${customerInfo?.name || detailedOrder.customer}`, 14, 52);
    doc.text(`Alamat: ${customerInfo?.address || 'N/A'}`, 14, 57);
    doc.text(`WhatsApp: ${customerInfo?.whatsapp || 'N/A'}`, 14, 62);


    // Products Table
    const tableColumn = ["Nama Produk", "Jumlah", "Harga Satuan", "Subtotal"];
    const tableRows: (string | number)[][] = [];

    detailedOrder.products?.forEach(prod => {
        const subtotal = prod.price * prod.quantity;
        const row = [
            prod.name,
            prod.quantity,
            new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(prod.price),
            new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(subtotal)
        ];
        tableRows.push(row);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 70,
    });
    
    const finalY = (doc as any).lastAutoTable.finalY;
    
    // Total
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Total:", 150, finalY + 10, { align: 'right' });
    doc.text(String(detailedOrder.total), 200, finalY + 10, { align: 'right' });

    doc.output("dataurlnewwindow");
  };


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
                Download Laporan
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-auto">
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
                    <TableCell className="font-medium">{order.id.substring(0, 7)}...</TableCell>
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
                    <TableCell>
                        {order.date && order.date.toDate ? format(order.date.toDate(), 'dd MMM yyyy') : 'N/A'}
                    </TableCell>
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
                            
                            <Dialog>
                                <DialogTrigger asChild>
                                    <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full">
                                        <FileText className="mr-2 h-4 w-4" />
                                        Lihat Bukti Bayar
                                    </button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Bukti Pembayaran #{order.id}</DialogTitle>
                                        <DialogDescription>
                                            Pelanggan: {order.customer}
                                        </DialogDescription>
                                    </DialogHeader>
                                    {order.paymentProofUrl ? (
                                        <Link href={order.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                                            <Image src={order.paymentProofUrl} alt={`Payment proof for ${order.id}`} width={500} height={500} className="rounded-md object-contain border" />
                                        </Link>
                                    ) : (
                                        <p className="text-center text-muted-foreground py-8">Belum ada bukti pembayaran yang diunggah.</p>
                                    )}
                                </DialogContent>
                            </Dialog>

                            <DropdownMenuItem onSelect={() => generatePdf(order)}>
                            <Printer className="mr-2 h-4 w-4" />
                            Download PDF
                            </DropdownMenuItem>
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
        </div>
      </CardContent>
    </Card>
  )
}
