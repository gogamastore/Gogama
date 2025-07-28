
"use client";

import { useEffect, useState, useMemo } from "react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Download, MoreHorizontal, CreditCard, CheckCircle, FileText, Printer, Truck, Check, Loader2, Edit, RefreshCw } from "lucide-react"
import { collection, getDocs, doc, updateDoc, getDoc, query, orderBy } from "firebase/firestore";
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
  status: 'Delivered' | 'Shipped' | 'Processing' | 'Pending' | 'Cancelled';
  paymentStatus: 'Paid' | 'Unpaid';
  paymentMethod: 'cod' | 'bank_transfer';
  paymentProofUrl?: string;
  total: string;
  date: any; // Allow for Firestore Timestamp object
  products?: OrderProduct[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};


function EditOrderDialog({ order }: { order: Order }) {
    // This is a placeholder for the full edit functionality.
    // Implementing full editing (quantity change, item removal, total recalculation, stock adjustment) is complex.
    // For now, it displays the items.
    return (
         <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Edit Pesanan #{order.id}</DialogTitle>
                <DialogDescription>
                    Ubah jumlah atau hapus item dari pesanan. Total akan dihitung ulang secara otomatis.
                </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Produk</TableHead>
                            <TableHead>Jumlah</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {order.products?.map(p => (
                            <TableRow key={p.productId}>
                                <TableCell>{p.name}</TableCell>
                                <TableCell>{p.quantity}</TableCell>
                                <TableCell className="text-right">
                                    {/* Placeholder for future actions */}
                                    <Button variant="outline" size="sm" disabled>Ubah</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
             <DialogFooter>
                <Button variant="outline">Batal</Button>
                <Button disabled>Simpan Perubahan</Button>
            </DialogFooter>
        </DialogContent>
    )
}

export default function OrdersPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    try {
        const q = query(collection(db, "orders"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        const ordersData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Order));
        setAllOrders(ordersData);
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

  const generatePdf = async (orderId: string) => {
    const orderDoc = await getDoc(doc(db, "orders", orderId));
    if (!orderDoc.exists()) {
        toast({ variant: "destructive", title: "Pesanan tidak ditemukan" });
        return;
    }
    const detailedOrder = { id: orderDoc.id, ...orderDoc.data() } as Order;

    const pdfDoc = new jsPDF();
    pdfDoc.setFontSize(20);
    pdfDoc.text("Faktur Pesanan", 14, 22);
    pdfDoc.setFontSize(10);
    pdfDoc.text(`ID Pesanan: ${detailedOrder.id}`, 14, 32);
    const orderDate = detailedOrder.date && detailedOrder.date.toDate ? format(detailedOrder.date.toDate(), 'dd MMM yyyy') : 'N/A';
    pdfDoc.text(`Tanggal: ${orderDate}`, 14, 37);

    const customerInfo = detailedOrder.customerDetails;
    pdfDoc.text("Informasi Pelanggan:", 14, 47);
    pdfDoc.text(`Nama: ${customerInfo?.name || detailedOrder.customer}`, 14, 52);
    pdfDoc.text(`Alamat: ${customerInfo?.address || 'N/A'}`, 14, 57);
    pdfDoc.text(`WhatsApp: ${customerInfo?.whatsapp || 'N/A'}`, 14, 62);

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

    pdfDoc.autoTable({ head: [tableColumn], body: tableRows, startY: 70 });
    const finalY = (pdfDoc as any).lastAutoTable.finalY;
    pdfDoc.setFontSize(12);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text("Total:", 150, finalY + 10, { align: 'right' });
    pdfDoc.text(String(detailedOrder.total), 200, finalY + 10, { align: 'right' });
    pdfDoc.output("dataurlnewwindow");
  };

  const updateOrderStatus = async (orderId: string, updates: Partial<Order>) => {
      setIsProcessing(orderId);
      const orderRef = doc(db, "orders", orderId);
      try {
          await updateDoc(orderRef, updates);
          // Instead of local update, fetch all orders again to ensure consistency
          await fetchOrders();
          toast({
              title: "Status Pesanan Diperbarui",
              description: `Pesanan ${orderId.substring(0,7)}... telah diperbarui.`,
          });
      } catch (error) {
           console.error("Error updating order status: ", error);
           toast({
              variant: "destructive",
              title: "Gagal Memperbarui Status",
          });
      } finally {
          setIsProcessing(null);
      }
  };

  const filteredOrders = useMemo(() => {
    // unpaid: Bank transfer, not yet paid, status is still pending
    const unpaid = allOrders
      .filter(o => o.paymentMethod === 'bank_transfer' && o.paymentStatus === 'Unpaid' && o.status === 'Pending')
      .sort((a, b) => a.date.toMillis() - b.date.toMillis());

    // toProcess: All non-COD pending orders that admin can process even if unpaid.
     const toProcess = allOrders
      .filter(o => o.status === 'Pending')
      .sort((a, b) => a.date.toMillis() - b.date.toMillis());

    // toShip: All COD orders, or Bank transfers that are paid. Status is 'Processing'.
    const toShip = allOrders
      .filter(o => o.status === 'Processing')
      .sort((a, b) => a.date.toMillis() - b.date.toMillis());

    const shipped = allOrders.filter(o => o.status === 'Shipped');
    const delivered = allOrders.filter(o => o.status === 'Delivered');
    const cancelled = allOrders.filter(o => o.status === 'Cancelled');

    return { unpaid, toShip, shipped, delivered, toProcess, cancelled };
  }, [allOrders]);


  const renderOrderTable = (orders: Order[], tabName: string) => (
    <div className="relative w-full overflow-auto">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pembayaran</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center w-[150px]">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">Memuat pesanan...</TableCell>
                    </TableRow>
                ) : orders.length > 0 ? orders.map((order) => (
                <TableRow key={order.id}>
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
                    <TableCell>{order.date && order.date.toDate ? format(order.date.toDate(), 'dd MMM yyyy') : 'N/A'}</TableCell>
                    <TableCell className="text-right">{order.total}</TableCell>
                    <TableCell className="text-center">
                        {isProcessing === order.id ? <Loader2 className="h-4 w-4 animate-spin mx-auto"/> : (
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Aksi Cepat</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  
                                  {/* --- DYNAMIC ACTIONS --- */}
                                  {order.paymentStatus === 'Unpaid' && order.paymentMethod === 'bank_transfer' && (
                                     <DropdownMenuItem onClick={() => updateOrderStatus(order.id, { paymentStatus: 'Paid' })}>
                                        <CheckCircle className="mr-2 h-4 w-4" /> Tandai Lunas
                                     </DropdownMenuItem>
                                  )}
                                  
                                  {order.status === 'Pending' && (
                                     <DropdownMenuItem onClick={() => updateOrderStatus(order.id, { status: 'Processing' })}>
                                        <RefreshCw className="mr-2 h-4 w-4" /> Proses Pesanan
                                     </DropdownMenuItem>
                                  )}
                                  
                                  {order.status === 'Processing' && (
                                      <DropdownMenuItem onClick={() => updateOrderStatus(order.id, { status: 'Shipped' })}>
                                          <Truck className="mr-2 h-4 w-4" /> Kirim Pesanan
                                      </DropdownMenuItem>
                                  )}

                                   {order.status === 'Shipped' && (
                                      <DropdownMenuItem onClick={() => updateOrderStatus(order.id, { status: 'Delivered' })}>
                                          <Check className="mr-2 h-4 w-4" /> Tandai Telah Sampai
                                      </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                   <Dialog>
                                      <DialogTrigger asChild>
                                        <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full">
                                            <Edit className="mr-2 h-4 w-4" /> Edit Pesanan
                                        </button>
                                      </DialogTrigger>
                                      <EditOrderDialog order={order} />
                                   </Dialog>
                                  
                                   <Dialog>
                                      <DialogTrigger asChild>
                                          <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full">
                                              <FileText className="mr-2 h-4 w-4" /> Lihat Bukti Bayar
                                          </button>
                                      </DialogTrigger>
                                      <DialogContent>
                                          <DialogHeader>
                                              <DialogTitle>Bukti Pembayaran #{order.id}</DialogTitle>
                                              <DialogDescription>Pelanggan: {order.customer}</DialogDescription>
                                          </DialogHeader>
                                          {order.paymentProofUrl ? (
                                              <Link href={order.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                                                  <Image src={order.paymentProofUrl} alt={`Payment proof for ${order.id}`} width={500} height={500} className="rounded-md object-contain border" />
                                              </Link>
                                          ) : (<p className="text-center text-muted-foreground py-8">Belum ada bukti pembayaran.</p>)}
                                      </DialogContent>
                                  </Dialog>
                                  <DropdownMenuItem onClick={() => generatePdf(order.id)}>
                                      <Printer className="mr-2 h-4 w-4" /> Download PDF
                                  </DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
                        )}
                    </TableCell>
                </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                            Tidak ada pesanan di kategori ini.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </div>
  );


  return (
    <Card>
      <CardHeader>
        <CardTitle>Pesanan</CardTitle>
        <CardDescription>Lihat dan kelola semua pesanan yang masuk berdasarkan statusnya.</CardDescription>
      </CardHeader>
      <CardContent>
          <Tabs defaultValue="toProcess">
            <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="unpaid">
                    Belum Bayar <Badge className="ml-2">{filteredOrders.unpaid.length}</Badge>
                </TabsTrigger>
                 <TabsTrigger value="toProcess">
                    Perlu Diproses <Badge className="ml-2">{filteredOrders.toProcess.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="toShip">
                    Perlu Dikirim <Badge className="ml-2">{filteredOrders.toShip.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="shipped">
                    Dikirim <Badge className="ml-2">{filteredOrders.shipped.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="delivered">
                    Selesai <Badge className="ml-2">{filteredOrders.delivered.length}</Badge>
                </TabsTrigger>
            </TabsList>
            <TabsContent value="unpaid" className="mt-4">
                {renderOrderTable(filteredOrders.unpaid, 'unpaid')}
            </TabsContent>
             <TabsContent value="toProcess" className="mt-4">
                {renderOrderTable(filteredOrders.toProcess, 'toProcess')}
            </TabsContent>
            <TabsContent value="toShip" className="mt-4">
                {renderOrderTable(filteredOrders.toShip, 'toShip')}
            </TabsContent>
            <TabsContent value="shipped" className="mt-4">
                 {renderOrderTable(filteredOrders.shipped, 'shipped')}
            </TabsContent>
            <TabsContent value="delivered" className="mt-4">
                 {renderOrderTable(filteredOrders.delivered, 'delivered')}
            </TabsContent>
          </Tabs>
      </CardContent>
    </Card>
  )
}

    