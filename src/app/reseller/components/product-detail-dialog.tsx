

"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/hooks/use-cart"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Plus, Minus, ShoppingCart } from "lucide-react"
import { useState, useEffect } from "react"


interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  'data-ai-hint'?: string;
  stock: number;
  description?: string;
  isPromo?: boolean;
  discountPrice?: string;
}

const formatCurrency = (value: string | number): string => {
    const num = typeof value === 'string' ? Number(value.replace(/[^0-9]/g, '')) : value;
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(num);
}


export function ProductDetailDialog({ product, children }: { product: Product, children: React.ReactNode }) {
    const stockAvailable = product.stock > 0;
    const [isOpen, setIsOpen] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const { addToCart } = useCart();
    const { toast } = useToast();
    
    useEffect(() => {
        if (isOpen) {
            setQuantity(1);
        }
    }, [isOpen]);

    const handleQuantityChange = (newQuantity: number) => {
        if (newQuantity >= 1 && newQuantity <= product.stock) {
            setQuantity(newQuantity);
        }
    }

    const handleAddToCartClick = () => {
        addToCart(product, quantity);
        toast({
            title: "Produk Ditambahkan",
            description: `${quantity}x ${product.name} telah ditambahkan ke keranjang.`,
        });
        setIsOpen(false);
    }

    const displayPrice = (product.isPromo && product.discountPrice) ? product.discountPrice : product.price;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader className="pr-6">
                    <DialogTitle className="text-2xl font-bold font-headline">{product.name}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-6">
                    <div>
                        <Image
                            src={product.image}
                            alt={product.name}
                            width={600}
                            height={600}
                            className="rounded-lg object-cover w-full h-auto aspect-square"
                            data-ai-hint={product['data-ai-hint'] || 'product image'}
                        />
                    </div>
                    <div className="flex flex-col space-y-4">
                        <div>
                             {product.isPromo && product.discountPrice ? (
                                <div className="flex items-baseline gap-2">
                                    <p className="text-3xl font-bold text-primary">{formatCurrency(product.discountPrice)}</p>
                                    <p className="text-lg font-normal text-muted-foreground line-through">{formatCurrency(product.price)}</p>
                                </div>
                            ) : (
                                <p className="text-3xl font-bold text-primary">{formatCurrency(product.price)}</p>
                            )}
                             <div className="mt-2">
                                {stockAvailable ? (
                                    <Badge variant="default">Stok Tersedia: {product.stock}</Badge>
                                ) : (
                                    <Badge variant="destructive">Stok Habis</Badge>
                                )}
                             </div>
                        </div>
                        <div className="flex-1">
                            <DialogDescription className="text-base text-muted-foreground">
                            {product.description || "Tidak ada deskripsi untuk produk ini."}
                            </DialogDescription>
                        </div>
                    </div>
                </div>
                <div className="flex items-end gap-4 pt-4 border-t mt-auto">
                    <div className="space-y-1">
                        <Label htmlFor="quantity">Jumlah</Label>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => handleQuantityChange(quantity - 1)} disabled={!stockAvailable || quantity <= 1}>
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                                id="quantity"
                                type="number"
                                value={quantity}
                                onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                                className="w-16 h-10 text-center"
                                min={1}
                                max={product.stock}
                                disabled={!stockAvailable}
                            />
                            <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => handleQuantityChange(quantity + 1)} disabled={!stockAvailable || quantity >= product.stock}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <Button onClick={handleAddToCartClick} disabled={!stockAvailable} size="lg" className="flex-1">
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        {stockAvailable ? 'Tambah' : 'Stok Habis'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
