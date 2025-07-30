

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Download, CreditCard, CheckCircle, FileText, Printer, Truck, Check, Loader2, Edit, RefreshCw, XCircle, Trash2, Minus, Plus, PlusCircle, Search, Calendar as CalendarIcon, Eye, DollarSign } from "lucide-react"
import { collection, getDocs, doc, updateDoc, getDoc, query, orderBy, writeBatch, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";
import { format, startOfDay, endOfDay } from 'date-fns';
import { id as dateFnsLocaleId } from "date-fns/locale";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";


declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface Product {
    id: string;
    name: string;
    sku: string;
    price: string;
    stock: number;
    image: string;
    'data-ai-hint'?: string;
    purchasePrice?: number;
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
  subtotal: number;
  shippingFee: number;
  date: any; // Allow for Firestore Timestamp object
  products: OrderProduct[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};


function AddProductToOrderDialog({ currentProducts, onAddProduct }: { currentProducts: OrderProduct[], onAddProduct: (product: Product, quantity: number) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [quantity, setQuantity] = useState(1);

    const fetchProducts = async () => {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setAllProducts(productsData);
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            fetchProducts();
        }
    }, [isOpen]);

    useEffect(() => {
        const currentProductIds = currentProducts.map(p => p.productId);
        const availableProducts = allProducts.filter(p => !currentProductIds.includes(p.id));
        const results = availableProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredProducts(results);
    }, [searchTerm, allProducts, currentProducts]);
    
    const handleAddClick = (product: Product) => {
        onAddProduct(product, quantity);
        setIsOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4"/>Tambah Produk</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Tambah Produk ke Pesanan</DialogTitle>
                    <DialogDescription>Cari dan pilih produk yang ingin ditambahkan.</DialogDescription>
                </DialogHeader>
                 <div className="relative pt-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari produk berdasarkan nama atau SKU..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="max-h-[50vh] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produk</TableHead>
                                <TableHead>Stok</TableHead>
                                <TableHead>Harga</TableHead>
                                <TableHead className="w-[180px]">Jumlah</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="text-center">Memuat produk...</TableCell></TableRow>
                            ) : filteredProducts.length > 0 ? filteredProducts.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">{p.name}</TableCell>
                                    <TableCell>{p.stock}</TableCell>
                                    <TableCell>{p.price}</TableCell>
                                    <TableCell>
                                        <Input type="number" defaultValue={1} min={1} max={p.stock} onChange={(e) => setQuantity(Number(e.target.value))} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button onClick={() => handleAddClick(p)}>Tambah</Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={5} className="text-center">Produk tidak ditemukan atau sudah ada di pesanan.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function EditOrderDialog({ order, onOrderUpdated }: { order: Order, onOrderUpdated: () => void }) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editableProducts, setEditableProducts] = useState<OrderProduct[]>([]);
    const [shippingFee, setShippingFee] = useState<number>(0);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (order) {
            setEditableProducts(JSON.parse(JSON.stringify(order.products || []))); // Deep copy
            setShippingFee(order.shippingFee || 0);
        }
    }, [order]);

    const handleQuantityChange = (productId: string, newQuantity: number) => {
        if (newQuantity < 1) return;
        setEditableProducts(products => 
            products.map(p => p.productId === productId ? { ...p, quantity: newQuantity } : p)
        );
    };

    const handleRemoveItem = (productId: string) => {
        setEditableProducts(products => products.filter(p => p.productId !== productId));
    };

    const handleAddProduct = (product: Product, quantity: number) => {
        const newProduct: OrderProduct = {
            productId: product.id,
            name: product.name,
            quantity: quantity,
            price: parseFloat(product.price.replace(/[^0-9]/g, ''))
        };
        setEditableProducts(prev => [...prev, newProduct]);
    };

    const subtotal = useMemo(() => {
        return editableProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    }, [editableProducts]);

    const newTotal = useMemo(() => subtotal + shippingFee, [subtotal, shippingFee]);

    const handleSaveChanges = async () => {
        setIsSaving(true);
        const batch = writeBatch(db);

        try {
            const originalProducts = order.products || [];
            const stockAdjustments = new Map<string, number>();

            // Calculate differences for existing products
            originalProducts.forEach(origP => {
                const newP = editableProducts.find(p => p.productId === origP.productId);
                if (newP) {
                    const diff = origP.quantity - newP.quantity; // +ve if stock returns
                    if (diff !== 0) {
                        stockAdjustments.set(origP.productId, (stockAdjustments.get(origP.productId) || 0) + diff);
                    }
                } else { // Item was removed
                    stockAdjustments.set(origP.productId, (stockAdjustments.get(origP.productId) || 0) + origP.quantity);
                }
            });

            // Calculate differences for newly added products
            editableProducts.forEach(newP => {
                if (!originalProducts.some(origP => origP.productId === newP.productId)) {
                     const diff = -newP.quantity; // -ve as stock is taken
                     stockAdjustments.set(newP.productId, (stockAdjustments.get(newP.productId) || 0) + diff);
                }
            });


            // Apply stock updates
            for (const [productId, adjustment] of stockAdjustments.entries()) {
                const productRef = doc(db, "products", productId);
                const productDoc = await getDoc(productRef);
                if (productDoc.exists()) {
                    const currentStock = productDoc.data().stock || 0;
                    batch.update(productRef, { stock: currentStock + adjustment });
                }
            }

            // Update the order itself
            const orderRef = doc(db, "orders", order.id);
            batch.update(orderRef, {
                products: editableProducts,
                shippingFee: shippingFee,
                subtotal: subtotal,
                total: formatCurrency(newTotal),
            });
            
            await batch.commit();

            toast({ title: "Pesanan Berhasil Diperbarui", description: "Stok produk dan detail pesanan telah diperbarui." });
            onOrderUpdated();
            setIsEditDialogOpen(false);

        } catch (error) {
            console.error("Error updating order:", error);
            toast({ variant: "destructive", title: "Gagal Menyimpan Perubahan" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
         <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
             <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                    <Edit className="mr-2 h-4 w-4" /> Edit Pesanan
                </Button>
             </DialogTrigger>
             <DialogContent className="sm:max-w-4xl">
                <DialogHeader className="flex-row justify-between items-center">
                    <div>
                        <DialogTitle>Edit Pesanan #{order.id.substring(0, 7)}...</DialogTitle>
                        <DialogDescription>
                            Ubah jumlah, hapus item, atau tambah produk baru ke pesanan.
                        </DialogDescription>
                    </div>
                    <AddProductToOrderDialog currentProducts={editableProducts} onAddProduct={handleAddProduct} />
                </DialogHeader>
                <div className="max-h-[50vh] overflow-y-auto p-1">
                    <div className="relative w-full overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produk</TableHead>
                                    <TableHead className="w-[150px]">Jumlah</TableHead>
                                    <TableHead className="text-right">Harga Satuan</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {editableProducts.map(p => (
                                    <TableRow key={p.productId}>
                                        <TableCell className="font-medium">{p.name}</TableCell>
                                        <TableCell>
                                             <div className="flex items-center gap-1">
                                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(p.productId, p.quantity - 1)}>
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <Input
                                                    type="number"
                                                    value={p.quantity}
                                                    onChange={(e) => handleQuantityChange(p.productId, parseInt(e.target.value, 10))}
                                                    className="w-14 h-7 text-center"
                                                    min="1"
                                                />
                                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(p.productId, p.quantity + 1)}>
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">{formatCurrency(p.price)}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatCurrency(p.price * p.quantity)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(p.productId)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {editableProducts.length === 0 && (
                                     <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            Tidak ada produk dalam pesanan. Tambahkan produk baru untuk melanjutkan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                     <Separator className="my-4"/>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
                        <div className="space-y-2">
                             <Label htmlFor="shippingFee">Biaya Pengiriman</Label>
                             <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                <Input 
                                    id="shippingFee" 
                                    type="number" 
                                    value={shippingFee}
                                    onChange={(e) => setShippingFee(Number(e.target.value))}
                                    className="pl-8"
                                />
                             </div>
                        </div>
                        <div className="space-y-1 text-right md:pt-5">
                            <p className="text-sm text-muted-foreground">Subtotal Produk: {formatCurrency(subtotal)}</p>
                            <p className="text-lg font-bold">Total Baru: {formatCurrency(newTotal)}</p>
                        </div>
                     </div>
                </div>
                 <DialogFooter className="flex-col sm:flex-row sm:justify-end items-stretch sm:items-center gap-4 pt-4 border-t">
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Batal</Button>
                        <Button onClick={handleSaveChanges} disabled={isSaving || editableProducts.length === 0}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Simpan Perubahan
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function OrdersPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const { toast } = useToast();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});


  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
        const q = query(collection(db, "orders"), orderBy("date", "asc"));
        const querySnapshot = await getDocs(q);
        const ordersData = querySnapshot.docs.map(doc => {
             const data = doc.data();
             const products = data.products?.map((p: any) => ({
                 ...p,
                 price: typeof p.price === 'string' ? parseFloat(p.price.replace(/[^0-9]/g, '')) : p.price
             })) || [];
            return {
                id: doc.id,
                ...data,
                products,
                shippingFee: data.shippingFee || 0,
                subtotal: data.subtotal || 0,
            } as Order
        });
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
  }, [toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const generateSinglePdf = async (orderId: string) => {
    const orderDocRef = doc(db, "orders", orderId);
    const orderDoc = await getDoc(orderDocRef);
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
    const orderDate = detailedOrder.date && detailedOrder.date.toDate ? format(detailedOrder.date.toDate(), 'dd MMM yyyy, HH:mm', { locale: dateFnsLocaleId }) : 'N/A';
    pdfDoc.text(`Tanggal: ${orderDate}`, 14, 37);

    const customerInfo = detailedOrder.customerDetails;
    pdfDoc.text("Informasi Pelanggan:", 14, 47);
    pdfDoc.text(`Nama: ${customerInfo?.name || detailedOrder.customer}`, 14, 52);
    pdfDoc.text(`Alamat: ${customerInfo?.address || 'N/A'}`, 14, 57);
    pdfDoc.text(`WhatsApp: ${customerInfo?.whatsapp || 'N/A'}`, 14, 62);

    const tableColumn = ["Nama Produk", "Jumlah", "Harga Satuan", "Subtotal"];
    const tableRows: (string | number)[][] = [];
    let finalY = 70;

    if(detailedOrder.products?.length > 0) {
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
        finalY = (pdfDoc as any).lastAutoTable.finalY + 10;
    }
    
    pdfDoc.setFontSize(10);
    pdfDoc.text("Subtotal Produk:", 150, finalY, { align: 'right' });
    pdfDoc.text(formatCurrency(detailedOrder.subtotal), 200, finalY, { align: 'right' });

    pdfDoc.text("Biaya Pengiriman:", 150, finalY + 5, { align: 'right' });
    pdfDoc.text(formatCurrency(detailedOrder.shippingFee), 200, finalY + 5, { align: 'right' });

    pdfDoc.setFontSize(12);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text("Total:", 150, finalY + 12, { align: 'right' });
    pdfDoc.text(String(detailedOrder.total), 200, finalY + 12, { align: 'right' });
    pdfDoc.output("dataurlnewwindow");
  };

  const generateBulkPdf = async () => {
    const pdf = new jsPDF();
    let isFirstPage = true;

    for (const orderId of selectedOrders) {
      if (!isFirstPage) {
        pdf.addPage();
      }
      
      const orderRef = doc(db, "orders", orderId);
      const orderDoc = await getDoc(orderRef);
      
      if (orderDoc.exists()) {
        const order = { id: orderDoc.id, ...orderDoc.data() } as Order;
        pdf.setFontSize(16);
        pdf.text(`Detail Pesanan: ${order.id}`, 14, 20);
        pdf.setFontSize(12);
        pdf.text(`Pelanggan: ${order.customerDetails?.name || order.customer}`, 14, 30);
        pdf.text(`Alamat: ${order.customerDetails?.address || 'N/A'}`, 14, 36);
        pdf.text(`WhatsApp: ${order.customerDetails?.whatsapp || 'N/A'}`, 14, 42);

        const tableColumn = ["Produk", "Jumlah", "Harga", "Subtotal"];
        const tableRows = order.products.map(p => [
            p.name,
            p.quantity,
            formatCurrency(p.price),
            formatCurrency(p.price * p.quantity)
        ]);

        pdf.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 50
        });
        const finalY = (pdf as any).lastAutoTable.finalY;
        pdf.setFontSize(10);
        pdf.text('Subtotal:', 150, finalY + 10, { align: 'right' });
        pdf.text(formatCurrency(order.subtotal), 200, finalY + 10, { align: 'right' });
        pdf.text('Ongkir:', 150, finalY + 15, { align: 'right' });
        pdf.text(formatCurrency(order.shippingFee), 200, finalY + 15, { align: 'right' });
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Total: ${order.total}`, 150, finalY + 22, { align: 'right' });
      }
      isFirstPage = false;
    }
    pdf.save(`pesanan-terpilih-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const updateOrderStatus = async (orderId: string, updates: Partial<Order>) => {
      setIsProcessing(orderId);
      const orderRef = doc(db, "orders", orderId);
      try {
          await updateDoc(orderRef, updates);
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

  const handleCancelOrder = async (order: Order) => {
    setIsProcessing(order.id);
    const batch = writeBatch(db);

    try {
        const orderRef = doc(db, "orders", order.id);
        batch.update(orderRef, { status: 'Cancelled' });

        // Only return stock if the order was not already cancelled
        if (order.products && order.status !== 'Cancelled') {
            for (const item of order.products) {
                const productRef = doc(db, "products", item.productId);
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
            description: "Pesanan telah dibatalkan dan stok produk telah dikembalikan.",
        });

        await fetchOrders();

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


  const filteredOrders = useMemo(() => {
    const { from, to } = dateRange;
    let filtered = allOrders;

    if (from || to) {
        filtered = allOrders.filter(order => {
            if (!order.date?.toDate) return false;
            const orderDate = order.date.toDate();
            if (from && orderDate < startOfDay(from)) return false;
            if (to && orderDate > endOfDay(to)) return false;
            return true;
        });
    }

    const unpaid = filtered.filter(o => o.paymentMethod === 'bank_transfer' && o.paymentStatus === 'Unpaid' && o.status === 'Pending');
    const toShip = filtered.filter(o => o.status === 'Processing');
    const shipped = filtered.filter(o => o.status === 'Shipped');
    const delivered = filtered.filter(o => o.status === 'Delivered');
    const cancelled = filtered.filter(o => o.status === 'Cancelled');

    return { unpaid, toShip, shipped, delivered, cancelled };
  }, [allOrders, dateRange]);
  
  const handleSelectOrder = (orderId: string, isSelected: boolean) => {
      setSelectedOrders(prev => isSelected ? [...prev, orderId] : prev.filter(id => id !== orderId));
  };
  
  const handleSelectAll = (orders: Order[], isSelected: boolean) => {
      if (isSelected) {
          setSelectedOrders(orders.map(o => o.id));
      } else {
          setSelectedOrders([]);
      }
  };


  const renderOrderTable = (orders: Order[], tabName: string) => {
    const currentSelectedInTab = orders.filter(o => selectedOrders.includes(o.id)).map(o => o.id);
    const isAllSelectedInTab = orders.length > 0 && currentSelectedInTab.length === orders.length;

    return (
    <div className="relative w-full overflow-auto">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]">
                         <Checkbox
                           checked={isAllSelectedInTab}
                           onCheckedChange={(checked) => handleSelectAll(orders, !!checked)}
                           aria-label="Pilih semua"
                         />
                    </TableHead>
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
                        <TableCell colSpan={8} className="h-24 text-center">Memuat pesanan...</TableCell>
                    </TableRow>
                ) : orders.length > 0 ? orders.map((order) => (
                <TableRow key={order.id} data-state={selectedOrders.includes(order.id) && "selected"}>
                    <TableCell>
                         <Checkbox
                           checked={selectedOrders.includes(order.id)}
                           onCheckedChange={(checked) => handleSelectOrder(order.id, !!checked)}
                           aria-label={`Pilih pesanan ${order.id}`}
                         />
                    </TableCell>
                    <TableCell className="font-medium">{order.id.substring(0, 7)}...</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                          order.status === 'Delivered' ? 'text-green-600 border-green-600' :
                          order.status === 'Shipped' ? 'text-blue-600 border-blue-600' :
                          order.status === 'Processing' ? 'text-yellow-600 border-yellow-600' : 
                          order.status === 'Cancelled' ? 'text-red-600 border-red-600' : 'text-gray-600 border-gray-600'
                      }>{order.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.paymentStatus === 'Paid' ? 'default' : 'destructive'}>
                          {order.paymentStatus === 'Paid' ? 'Lunas' : 'Belum Lunas'}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.date && order.date.toDate ? format(order.date.toDate(), 'dd MMM yyyy, HH:mm', { locale: dateFnsLocaleId }) : 'N/A'}</TableCell>
                    <TableCell className="text-right">{order.total}</TableCell>
                    <TableCell className="text-center">
                        {isProcessing === order.id ? <Loader2 className="h-4 w-4 animate-spin mx-auto"/> : (
                           <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Eye className="mr-2 h-4 w-4"/>
                                    Lihat
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Aksi untuk Pesanan #{order.id.substring(0,7)}</DialogTitle>
                                    <DialogDescription>
                                        Pelanggan: {order.customer}
                                    </DialogDescription>
                                </DialogHeader>
                                <Separator />
                                <div className="grid grid-cols-1 gap-2 py-2">
                                     {order.paymentStatus === 'Unpaid' && order.paymentMethod === 'bank_transfer' && (
                                        <Button variant="outline" className="w-full justify-start" onClick={() => updateOrderStatus(order.id, { paymentStatus: 'Paid', status: 'Processing' })}>
                                            <CheckCircle className="mr-2 h-4 w-4" /> Tandai Lunas
                                        </Button>
                                    )}
                                    
                                    {order.status === 'Pending' && (
                                        <Button variant="outline" className="w-full justify-start" onClick={() => updateOrderStatus(order.id, { status: 'Processing' })}>
                                            <RefreshCw className="mr-2 h-4 w-4" /> Proses Pesanan
                                        </Button>
                                    )}
                                    
                                    {order.status === 'Processing' && (
                                        <Button variant="outline" className="w-full justify-start" onClick={() => updateOrderStatus(order.id, { status: 'Shipped' })}>
                                            <Truck className="mr-2 h-4 w-4" /> Kirim Pesanan
                                        </Button>
                                    )}

                                    {order.status === 'Shipped' && (
                                        <Button variant="outline" className="w-full justify-start" onClick={() => updateOrderStatus(order.id, { status: 'Delivered' })}>
                                            <Check className="mr-2 h-4 w-4" /> Tandai Telah Sampai
                                        </Button>
                                    )}
                                    
                                    <Separator />
                                    
                                    <EditOrderDialog order={order} onOrderUpdated={fetchOrders} />
                                    
                                    <Dialog>
                                        <DialogTrigger asChild>
                                             <Button variant="outline" className="w-full justify-start">
                                                <FileText className="mr-2 h-4 w-4" /> Lihat Bukti Bayar
                                             </Button>
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

                                    <Button variant="outline" className="w-full justify-start" onClick={() => generateSinglePdf(order.id)}>
                                        <Printer className="mr-2 h-4 w-4" /> Download PDF
                                    </Button>

                                    {(order.status === 'Pending' || order.status === 'Processing') && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" className="w-full justify-start">
                                                    <XCircle className="mr-2 h-4 w-4" /> Batalkan Pesanan
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Tindakan ini akan membatalkan pesanan dan mengembalikan stok produk. Aksi ini tidak dapat diurungkan.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Tidak</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleCancelOrder(order)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Ya, Batalkan</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                            </DialogContent>
                           </Dialog>
                        )}
                    </TableCell>
                </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                            Tidak ada pesanan di kategori ini.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </div>
  )};


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
                 <CardTitle>Pesanan</CardTitle>
                 <CardDescription>Lihat dan kelola semua pesanan yang masuk berdasarkan statusnya.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button id="date" variant={"outline"} className="w-full sm:w-[280px] justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}` : format(dateRange.from, "LLL dd, y")) : (<span>Pilih rentang tanggal</span>)}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                    </PopoverContent>
                </Popover>
                 <Button onClick={generateBulkPdf} disabled={selectedOrders.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF ({selectedOrders.length})
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
          <Tabs defaultValue="toShip">
            <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="unpaid">
                    Belum Bayar <Badge className="ml-2">{filteredOrders.unpaid.length}</Badge>
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
                 <TabsTrigger value="cancelled">
                    Dibatalkan <Badge className="ml-2">{filteredOrders.cancelled.length}</Badge>
                </TabsTrigger>
            </TabsList>
            <TabsContent value="unpaid" className="mt-4">
                {renderOrderTable(filteredOrders.unpaid, 'unpaid')}
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
            <TabsContent value="cancelled" className="mt-4">
                 {renderOrderTable(filteredOrders.cancelled, 'cancelled')}
            </TabsContent>
          </Tabs>
      </CardContent>
    </Card>
  )
}
