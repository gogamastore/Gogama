"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCart } from "@/hooks/use-cart";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const parseCurrency = (value: string): number => {
    return Number(value.replace(/[^0-9]/g, ''));
}


export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, totalAmount, clearCart } = useCart();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 font-headline">Keranjang Belanja</h1>
      {cart.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-lg border">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
          <h2 className="mt-6 text-xl font-semibold">Keranjang Anda kosong</h2>
          <p className="mt-2 text-muted-foreground">
            Sepertinya Anda belum menambahkan produk apapun.
          </p>
          <Button asChild className="mt-6">
            <Link href="/reseller">Mulai Belanja</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
             <div className="bg-card rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]"></TableHead>
                            <TableHead>Produk</TableHead>
                            <TableHead>Jumlah</TableHead>
                            <TableHead className="text-right">Harga Satuan</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                             <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cart.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        width={80}
                                        height={80}
                                        className="rounded-md object-cover"
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <Input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                                            className="w-16 h-8 text-center"
                                            min={1}
                                        />
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">{item.price}</TableCell>
                                <TableCell className="text-right font-semibold">
                                    {formatCurrency(parseCurrency(item.price) * item.quantity)}
                                </TableCell>
                                 <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                                        <Trash2 className="h-5 w-5 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             </div>
              <Button variant="outline" className="mt-4" onClick={clearCart}>
                <X className="mr-2 h-4 w-4"/>
                Kosongkan Keranjang
              </Button>
          </div>
          <div className="space-y-6">
            <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">Ringkasan Pesanan</h2>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatCurrency(totalAmount)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Diskon</span>
                        <span>- {formatCurrency(0)}</span>
                    </div>
                     <div className="flex justify-between text-lg font-bold pt-4 border-t">
                        <span>Total</span>
                        <span>{formatCurrency(totalAmount)}</span>
                    </div>
                </div>
                 <Button asChild className="w-full mt-6" size="lg">
                    <Link href="/reseller/checkout">Lanjutkan ke Pembayaran</Link>
                </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
