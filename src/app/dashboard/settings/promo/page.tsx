"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from '@/hooks/use-toast';
import { Percent, PlusCircle, Trash2, Loader2, ArrowLeft, Tags, CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { addDays, format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPromotionsAndProducts } from './actions';


interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  stock: number;
}

interface Promotion extends Product {
    promoId: string;
    discountPrice: number;
    startDate: Date;
    endDate: Date;
}

const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9]/g, '')) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
};


export default function PromoSettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [discountPrice, setDiscountPrice] = useState<number>(0);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });

  const fetchPromotionsAndProductsCallback = useCallback(async () => {
    setLoading(true);
    try {
        const { promotions: fetchedPromos, products: fetchedProducts } = await getPromotionsAndProducts();

        // Dates will be strings after serialization, so we convert them back
        const parsedPromos = fetchedPromos.map(p => ({
            ...p,
            startDate: new Date(p.startDate),
            endDate: new Date(p.endDate)
        }));

        setPromotions(parsedPromos as Promotion[]);
        setProducts(fetchedProducts as Product[]);
    } catch (error) {
        console.error('Error fetching data: ', error);
        toast({ variant: 'destructive', title: 'Gagal Memuat Data' });
    } finally {
        setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPromotionsAndProductsCallback();
  }, [fetchPromotionsAndProductsCallback]);

  const handleAddPromo = async () => {
    if (!selectedProductId || !discountPrice || !dateRange?.from || !dateRange?.to) {
        toast({ variant: 'destructive', title: 'Data tidak lengkap' });
        return;
    }
    setIsSubmitting(true);
    try {
        await addDoc(collection(db, 'promotions'), {
            productId: selectedProductId,
            discountPrice: discountPrice,
            startDate: dateRange.from,
            endDate: dateRange.to,
            createdAt: serverTimestamp()
        });
        toast({ title: "Promo berhasil ditambahkan" });
        setIsDialogOpen(false);
        fetchPromotionsAndProductsCallback();
        // Reset form
        setSelectedProductId('');
        setDiscountPrice(0);
        setDateRange({ from: new Date(), to: addDays(new Date(), 7) });
    } catch (error) {
        console.error("Error adding promotion:", error);
        toast({ variant: 'destructive', title: 'Gagal menambahkan promo' });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleDeletePromo = async (promoId: string) => {
    if (!confirm('Anda yakin ingin menghapus promo ini?')) return;
    try {
        await deleteDoc(doc(db, 'promotions', promoId));
        toast({ title: 'Promo berhasil dihapus' });
        fetchPromotionsAndProductsCallback();
    } catch (error) {
        console.error("Error deleting promo:", error);
        toast({ variant: 'destructive', title: 'Gagal menghapus promo' });
    }
  }


  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/settings')}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Kembali ke Pengaturan</span>
            </Button>
            <h1 className="text-xl md:text-2xl font-bold">Pengaturan Promo</h1>
        </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Daftar Produk Promo</CardTitle>
            <CardDescription>
              Tambah, edit, atau hapus promo untuk produk tertentu.
            </CardDescription>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Promo
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="text-center p-8 text-muted-foreground">Memuat data promo...</div>
          ) : promotions.length > 0 ? (
            <div className="space-y-4">
              {promotions.map((promo) => (
                <div key={promo.promoId} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <Image src={promo.image} alt={promo.name} width={64} height={64} className="rounded-md object-cover"/>
                    <div>
                      <p className="font-bold">{promo.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground line-through">{formatCurrency(promo.price)}</p>
                        <p className="text-sm font-semibold text-primary">{formatCurrency(promo.discountPrice)}</p>
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        Berlaku hingga: {format(new Date(promo.endDate), 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <Badge variant={new Date() > new Date(promo.endDate) ? "secondary" : "default"}>
                        {new Date() > new Date(promo.endDate) ? "Berakhir" : "Aktif"}
                     </Badge>
                     <Button variant="ghost" size="icon" onClick={() => handleDeletePromo(promo.promoId)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                     </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <Tags className="mx-auto h-12 w-12 text-muted-foreground"/>
              <p className="mt-2">Belum ada promo yang ditambahkan.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Promo Baru</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                 <div className="space-y-2">
                    <Label>Pilih Produk</Label>
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih produk yang akan dipromosikan" />
                        </SelectTrigger>
                        <SelectContent>
                            {products.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                    <div className='flex items-center gap-2'>
                                        <Image src={p.image} alt={p.name} width={24} height={24} className="rounded-sm"/>
                                        <span>{p.name} ({formatCurrency(p.price)})</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                  <Label htmlFor="discountPrice">Harga Diskon (Rp)</Label>
                  <Input id="discountPrice" type="number" value={discountPrice} onChange={(e) => setDiscountPrice(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                     <Label>Periode Promo</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className="w-full justify-start text-left font-normal"
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
                </div>
              </div>
              <DialogFooter>
                 <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                <Button onClick={handleAddPromo} disabled={isSubmitting}>
                   {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Promo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
    </div>
  );
}
