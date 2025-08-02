
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePurchaseCartFromLayout } from "@/app/dashboard/layout"; // Updated import
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { addDoc, collection, doc, serverTimestamp, writeBatch, getDocs } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Banknote, CreditCard, DollarSign, Loader2, PlusCircle, UserPlus, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Supplier {
    id: string;
    name: string;
    contact?: string;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
};


function SupplierDialog({ onSelectSupplier }: { onSelectSupplier: (supplier: Supplier) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(false);
    const [newSupplier, setNewSupplier] = useState({ name: "", contact: "" });
    const { toast } = useToast();

    const fetchSuppliers = async () => {
        setLoading(true);
        const snapshot = await getDocs(collection(db, 'suppliers'));
        setSuppliers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier)));
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            fetchSuppliers();
        }
    }, [isOpen]);

    const handleAddSupplier = async () => {
        if (!newSupplier.name) {
            toast({ variant: 'destructive', title: 'Nama supplier harus diisi' });
            return;
        }
        try {
            const docRef = await addDoc(collection(db, 'suppliers'), { ...newSupplier, createdAt: serverTimestamp() });
            const addedSupplier = { id: docRef.id, ...newSupplier };
            setSuppliers(prev => [...prev, addedSupplier]);
            onSelectSupplier(addedSupplier); // Auto-select the new supplier
            toast({ title: "Supplier berhasil ditambahkan" });
            setIsAdding(false);
            setNewSupplier({ name: "", contact: "" });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Gagal menambah supplier' });
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><Users className="mr-2 h-4 w-4"/>Pilih Supplier</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Pilih atau Tambah Supplier</DialogTitle>
                </DialogHeader>
                <div className="max-h-60 overflow-y-auto">
                    {loading ? <p>Memuat...</p> : suppliers.map(s => (
                        <div key={s.id} onClick={() => { onSelectSupplier(s); setIsOpen(false); }}
                            className="p-2 hover:bg-muted rounded-md cursor-pointer">
                            <p className="font-semibold">{s.name}</p>
                            <p className="text-sm text-muted-foreground">{s.contact}</p>
                        </div>
                    ))}
                </div>
                <Separator/>
                 <Button variant="ghost" onClick={() => setIsAdding(!isAdding)} className="w-full justify-start">
                     <PlusCircle className="mr-2 h-4 w-4"/> {isAdding ? 'Batal' : 'Tambah Supplier Baru'}
                </Button>
                {isAdding && (
                    <div className="space-y-2 p-2 border rounded-md">
                        <Input placeholder="Nama Supplier" value={newSupplier.name} onChange={(e) => setNewSupplier(p => ({...p, name: e.target.value}))}/>
                        <Input placeholder="Kontak (opsional)" value={newSupplier.contact} onChange={(e) => setNewSupplier(p => ({...p, contact: e.target.value}))}/>
                        <Button onClick={handleAddSupplier} size="sm">Simpan Supplier</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

export default function ProcessPaymentPage() {
    const { cart, totalPurchase, clearCart } = usePurchaseCartFromLayout(); // Updated hook
    const router = useRouter();
    const { toast } = useToast();
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [paymentMethod, setPaymentMethod] = useState("cash");

    useEffect(() => {
        if(cart.length === 0) {
            toast({ variant: 'destructive', title: 'Keranjang pembelian kosong', description: 'Anda akan diarahkan kembali.'});
            router.replace('/dashboard/purchases');
        }
    }, [cart, router, toast]);

    const handleProcessTransaction = async () => {
        if (cart.length === 0) {
            toast({ variant: "destructive", title: "Keranjang Kosong" });
            return;
        }
        setIsProcessing(true);
        const batch = writeBatch(db);
    
        try {
            const purchaseTransactionRef = doc(collection(db, "purchase_transactions"));
            batch.set(purchaseTransactionRef, {
                date: serverTimestamp(),
                totalAmount: totalPurchase,
                items: cart.map(item => ({
                    productId: item.id,
                    productName: item.name,
                    quantity: item.quantity,
                    purchasePrice: item.purchasePrice,
                })),
                supplier: selectedSupplier?.name || "Supplier Umum",
                paymentMethod: paymentMethod,
            });
    
            for (const item of cart) {
                const productRef = doc(db, "products", item.id);
                const newStock = (item.stock || 0) + item.quantity;
                batch.update(productRef, { stock: newStock, purchasePrice: item.purchasePrice });
            }
    
            await batch.commit();
    
            toast({
                title: "Transaksi Berhasil",
                description: "Stok produk telah diperbarui.",
            });
    
            clearCart();
            router.replace('/dashboard/purchases');
    
        } catch (error) {
            console.error("Error processing transaction:", error);
            toast({ variant: "destructive", title: "Transaksi Gagal" });
        } finally {
            setIsProcessing(false);
        }
    };

    if(cart.length === 0) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-3xl font-bold font-headline">Proses Pembayaran Pembelian</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>1. Detail Supplier & Pembayaran</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                               <Label>Supplier (Opsional)</Label>
                               <div className="flex items-center gap-4 mt-2">
                                    <SupplierDialog onSelectSupplier={setSelectedSupplier}/>
                                    {selectedSupplier && <p className="text-sm font-medium p-2 border rounded-md bg-muted">{selectedSupplier.name}</p>}
                               </div>
                            </div>
                            <div>
                                <Label>Metode Pembayaran</Label>
                                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-2">
                                     <div className="flex items-center space-x-2 p-3 border rounded-md has-[:checked]:bg-muted has-[:checked]:border-primary">
                                        <RadioGroupItem value="cash" id="cash" />
                                        <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer"><DollarSign/> Cash</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded-md has-[:checked]:bg-muted has-[:checked]:border-primary">
                                        <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                                        <Label htmlFor="bank_transfer" className="flex items-center gap-2 cursor-pointer"><Banknote/> Bank Transfer</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded-md has-[:checked]:bg-muted has-[:checked]:border-primary">
                                        <RadioGroupItem value="credit" id="credit" />
                                        <Label htmlFor="credit" className="flex items-center gap-2 cursor-pointer"><CreditCard/> Kredit</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card className="sticky top-20">
                        <CardHeader>
                            <CardTitle>2. Ringkasan Pembelian</CardTitle>
                        </CardHeader>
                         <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Produk</TableHead>
                                        <TableHead className="text-right">Subtotal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cart.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div className="font-medium">{item.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {item.quantity} x {formatCurrency(item.purchasePrice)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(item.quantity * item.purchasePrice)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         </CardContent>
                         <CardFooter className="flex-col items-stretch gap-4 mt-4 bg-muted/50 p-4">
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total Pembelian</span>
                                <span>{formatCurrency(totalPurchase)}</span>
                            </div>
                            <Button size="lg" onClick={handleProcessTransaction} disabled={isProcessing}>
                                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                {isProcessing ? 'Memproses...' : 'Proses Transaksi'}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}
