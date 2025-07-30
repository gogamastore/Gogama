

"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, getDocs, orderBy, doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, Loader2, Package, ArrowLeft, Banknote, UploadCloud, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id as dateFnsLocaleId } from 'date-fns/locale';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';


interface OrderProduct {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

interface BankAccount {
    id: string;
    bankName: string;
    accountHolder: string;
    accountNumber: string;
}

interface Order {
  id: string;
  customer: string;
  status: 'Delivered' | 'Shipped' | 'Processing' | 'Pending' | 'Cancelled';
  paymentMethod: 'bank_transfer' | 'cod';
  paymentStatus: 'Paid' | 'Unpaid';
  paymentProofUrl?: string;
  total: string;
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


function PaymentUploader({ order, onUploadSuccess }: { order: Order, onUploadSuccess: (orderId: string, url: string) => void }) {
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [paymentProof, setPaymentProof] = useState<File | null>(null);
    const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(order.paymentProofUrl || null);
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchBankAccounts() {
            const querySnapshot = await getDocs(collection(db, "bank_accounts"));
            const accounts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankAccount));
            setBankAccounts(accounts);
        }
        fetchBankAccounts();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPaymentProof(file);
            setPaymentProofPreview(URL.createObjectURL(file));
        }
    };

    const handleUpload = async () => {
        if (!paymentProof) {
            toast({ title: "Pilih file terlebih dahulu", variant: "destructive" });
            return;
        }
        setIsUploading(true);
        try {
            const storage = getStorage();
            const storageRef = ref(storage, `payment_proofs/${order.id}_${paymentProof.name}`);
            await uploadBytes(storageRef, paymentProof);
            const downloadUrl = await getDownloadURL(storageRef);

            const orderRef = doc(db, "orders", order.id);
            await updateDoc(orderRef, { paymentProofUrl: downloadUrl });

            toast({ 
                title: "Bukti pembayaran berhasil diunggah!",
                description: "Pembayaran Anda akan segera dikonfirmasi oleh admin."
            });
            onUploadSuccess(order.id, downloadUrl);

        } catch (error) {
            console.error("Upload error:", error);
            toast({ title: "Gagal mengunggah", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card className="mt-4 bg-muted/50">
            <CardHeader>
                <CardTitle>Instruksi Pembayaran</CardTitle>
                <CardDescription>Silakan lakukan pembayaran ke salah satu rekening berikut dan unggah bukti transfer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    {bankAccounts.map(acc => (
                         <Alert key={acc.id}>
                            <Banknote className="h-4 w-4"/>
                            <AlertTitle>{acc.bankName.toUpperCase()}</AlertTitle>
                            <AlertDescription>
                                {acc.accountNumber} a/n {acc.accountHolder}
                            </AlertDescription>
                        </Alert>
                    ))}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="payment-proof">Unggah Bukti Pembayaran</Label>
                    <div className="flex items-center gap-4">
                        <Input id="payment-proof" type="file" accept="image/*" onChange={handleFileChange} disabled={!!order.paymentProofUrl} />
                        <Button onClick={handleUpload} disabled={isUploading || !paymentProof || !!order.paymentProofUrl}>
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
                            Unggah
                        </Button>
                    </div>
                </div>

                {paymentProofPreview && (
                    <div>
                        <p className="text-sm font-medium mb-2">Pratinjau / Bukti Terunggah:</p>
                        <Image src={paymentProofPreview} alt="Bukti Pembayaran" width={200} height={200} className="rounded-md border object-contain" />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


export default function OrderHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const q = query(
        collection(db, 'orders'),
        where('customerId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Order)
      );
      // Sort on the client-side after fetching
      ordersData.sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate().getTime() : 0;
        const dateB = b.date?.toDate ? b.date.toDate().getTime() : 0;
        return dateB - dateA;
      });
      setOrders(ordersData);
    } catch (error: any) {
      console.error('Error fetching orders: ', error);
      toast({
        variant: 'destructive',
        title: 'Gagal Memuat Pesanan',
        description: error.code === 'permission-denied' 
            ? 'Anda tidak memiliki izin untuk melihat data ini. Pastikan aturan keamanan sudah benar.'
            : 'Terjadi kesalahan saat mengambil data.',
      });
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, toast]);


  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUploadSuccess = (orderId: string, url: string) => {
      setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? { ...o, paymentProofUrl: url } : o));
      fetchOrders();
  };

  const handleCancelOrder = async (order: Order) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan pesanan ini? Stok akan dikembalikan.')) {
        return;
    }
    setIsProcessing(order.id);
    const batch = writeBatch(db);

    try {
        const orderRef = doc(db, "orders", order.id);
        batch.update(orderRef, { status: 'Cancelled' });

        // Only return stock if the order was not already cancelled
        if (order.products && order.status !== 'Cancelled') {
            for (const item of order.products) {
                const productRef = doc(db, "products", item.productId);
                // We need to get the product doc inside the transaction to avoid race conditions, but for simplicity here we get it before.
                // For a production app, use a Cloud Function for this kind of logic.
                const productDoc = await getDoc(productRef);
                if (productDoc.exists()) {
                    const currentStock = productDoc.data().stock || 0;
                    const newStock = currentStock + item.quantity;
                    batch.update(productRef, { stock: newStock });
                }
            }
        }
        
        await batch.commit();

        toast({
            title: "Pesanan Dibatalkan",
            description: "Pesanan Anda telah berhasil dibatalkan.",
        });

        fetchOrders();

    } catch (error) {
        console.error("Error cancelling order:", error);
        toast({
            variant: "destructive",
            title: "Gagal Membatalkan",
            description: "Terjadi kesalahan saat membatalkan pesanan.",
        });
    } finally {
        setIsProcessing(null);
    }
  };


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
          <div className="relative w-full overflow-auto">
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
                              : order.status === 'Cancelled'
                              ? 'text-red-600 border-red-600'
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
                        {order.total}
                      </TableCell>
                      <TableCell className="text-center">
                        {isProcessing === order.id ? <Loader2 className="h-4 w-4 animate-spin mx-auto"/> : (
                          <div className="flex justify-center items-center">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <FileText className="h-4 w-4" />
                                        <span className="sr-only">Lihat Detail</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-3xl">
                                    <DialogHeader>
                                        <DialogTitle>Detail Pesanan #{order.id}</DialogTitle>
                                        <DialogDescription>
                                            Tanggal: {format(order.date.toDate(), 'dd MMMM yyyy, HH:mm', { locale: dateFnsLocaleId })}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="max-h-[70vh] overflow-y-auto p-1 space-y-4">
                                        <Card>
                                            <CardHeader><CardTitle>Produk yang Dipesan</CardTitle></CardHeader>
                                            <CardContent>
                                                <div className="relative w-full overflow-auto">
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
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {order.paymentMethod === 'bank_transfer' && order.paymentStatus === 'Unpaid' && order.status !== 'Cancelled' && (
                                          <PaymentUploader order={order} onUploadSuccess={handleUploadSuccess} />
                                        )}

                                        {order.paymentProofUrl && order.paymentMethod === 'bank_transfer' && (
                                            <Card>
                                                <CardHeader><CardTitle>Bukti Pembayaran</CardTitle></CardHeader>
                                                <CardContent>
                                                    <Image src={order.paymentProofUrl} alt="Bukti Pembayaran" width={250} height={250} className="rounded-md border object-contain" />
                                                </CardContent>
                                            </Card>
                                        )}


                                        <div className="text-right font-bold text-lg border-t pt-4">
                                            Total Pesanan: {order.total}
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                             {order.status === 'Pending' && (
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleCancelOrder(order)}>
                                  <XCircle className="h-4 w-4" />
                                  <span className="sr-only">Batalkan Pesanan</span>
                                </Button>
                              )}
                          </div>
                        )}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
