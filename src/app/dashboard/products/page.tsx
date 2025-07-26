import Image from "next/image"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { allProducts } from "@/lib/placeholder-data"
import { PlusCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

function AddProductSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Tambah Produk
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Tambah Produk Baru</SheetTitle>
          <SheetDescription>
            Isi detail produk baru yang akan ditambahkan ke toko Anda.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nama Produk
            </Label>
            <Input id="name" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sku" className="text-right">
              SKU
            </Label>
            <Input id="sku" className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Harga
            </Label>
            <Input id="price" type="number" className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stock" className="text-right">
              Stok
            </Label>
            <Input id="stock" type="number" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Deskripsi
            </Label>
            <Textarea id="description" className="col-span-3" />
          </div>
        </div>
        <div className="flex justify-end">
            <Button>Simpan Produk</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function ProductsPage() {
  return (
    <Tabs defaultValue="all">
        <div className="flex items-center">
            <TabsList>
            <TabsTrigger value="all">Daftar Produk</TabsTrigger>
            <TabsTrigger value="stock">Manajemen Stok</TabsTrigger>
            </TabsList>
            <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm">Impor Massal</Button>
                <AddProductSheet />
            </div>
        </div>
        <TabsContent value="all">
            <Card>
                <CardHeader>
                    <CardTitle>Produk</CardTitle>
                    <CardDescription>
                        Kelola produk Anda dan lihat performa penjualannya.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead className="hidden w-[100px] sm:table-cell">
                                <span className="sr-only">Image</span>
                            </TableHead>
                            <TableHead>Nama</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead className="hidden md:table-cell">Kategori</TableHead>
                            <TableHead>Stok</TableHead>
                            <TableHead className="text-right">Harga</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allProducts.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell className="hidden sm:table-cell">
                                <Image
                                    alt="Product image"
                                    className="aspect-square rounded-md object-cover"
                                    height="64"
                                    src={product.image}
                                    width="64"
                                    data-ai-hint={product['data-ai-hint']}
                                />
                                </TableCell>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>{product.sku}</TableCell>
                                <TableCell className="hidden md:table-cell">{product.category}</TableCell>
                                <TableCell>
                                  <Badge variant={product.stock > 10 ? "default" : product.stock > 0 ? "secondary" : "destructive"}>{product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}</Badge>
                                </TableCell>
                                <TableCell className="text-right">{product.price}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="stock">
            <Card>
                <CardHeader>
                    <CardTitle>Manajemen Stok</CardTitle>
                    <CardDescription>
                        Lakukan penyesuaian stok untuk produk Anda.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>Fitur manajemen stok akan tersedia di sini.</p>
                    <div className="flex gap-2">
                        <Button>Stok Masuk</Button>
                        <Button variant="secondary">Stok Keluar</Button>
                        <Button variant="outline">Stock Opname</Button>
                        <Button variant="outline">Transfer Stok</Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>
  )
}
