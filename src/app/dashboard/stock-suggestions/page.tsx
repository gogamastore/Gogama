"use client";

import { useState, useTransition } from "react";
import { Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getStockSuggestion } from "./actions";
import { sampleOrderHistory, sampleProductDetails } from "@/lib/placeholder-data";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Suggestion = {
    product_id: string;
    suggested_quantity: number;
}

export default function StockSuggestionPage() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [orderHistory, setOrderHistory] = useState(sampleOrderHistory);
  const [productDetails, setProductDetails] = useState(sampleProductDetails);
  
  const [suggestion, setSuggestion] = useState<Suggestion[] | null>(null);
  const [reasoning, setReasoning] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const result = await getStockSuggestion({ orderHistory, productDetails });
        setReasoning(result.reasoning);
        const parsedSuggestions = JSON.parse(result.suggestedStockLevels);
        setSuggestion(parsedSuggestions);

        toast({
          title: "Success!",
          description: "Stock suggestions generated successfully.",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to generate stock suggestions.",
        });
        console.error(error);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-headline">Saran Stok Cerdas</CardTitle>
          </div>
          <CardDescription>
            Gunakan AI untuk menganalisis pola pesanan dan mendapatkan saran tingkat stok yang optimal untuk mencegah kekurangan.
          </CardDescription>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Data Input</CardTitle>
            <CardDescription>
              Masukkan data riwayat pesanan dan detail produk dalam format JSON. Data sampel disediakan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="order-history">Riwayat Pesanan (JSON)</Label>
              <Textarea
                placeholder="Paste your order history JSON here..."
                id="order-history"
                rows={10}
                value={orderHistory}
                onChange={(e) => setOrderHistory(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="product-details">Detail Produk (JSON)</Label>
              <Textarea
                placeholder="Paste your product details JSON here..."
                id="product-details"
                rows={8}
                value={productDetails}
                onChange={(e) => setProductDetails(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Suggestion"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Hasil Analisis AI</CardTitle>
            <CardDescription>
              AI akan memberikan saran jumlah stok dan alasan di baliknya di sini.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPending && (
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            )}
            
            {suggestion && (
                <Card>
                    <CardHeader>
                        <CardTitle>Saran Stok</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Product ID</TableHead>
                                <TableHead className="text-right">Saran Kuantitas</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suggestion.map((item) => (
                                <TableRow key={item.product_id}>
                                    <TableCell className="font-medium">{item.product_id}</TableCell>
                                    <TableCell className="text-right font-bold text-primary">{item.suggested_quantity}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {reasoning && (
                <Card>
                    <CardHeader>
                        <CardTitle>Alasan AI</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">{reasoning}</p>
                    </CardContent>
                </Card>
            )}

            {!isPending && !suggestion && !reasoning && (
                <div className="text-center text-muted-foreground p-8">
                    Hasil akan muncul di sini setelah Anda menekan tombol "Generate Suggestion".
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
