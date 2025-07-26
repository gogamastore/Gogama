import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { resellerProducts } from "@/lib/placeholder-data"
import { MessageSquare, ShoppingCart } from "lucide-react"
import Link from "next/link"

export default function ResellerDashboard() {
  return (
    <div className="relative">
      <div className="container mx-auto px-4 py-8">
        <section className="mb-8">
            <Carousel className="w-full">
                <CarouselContent>
                    <CarouselItem>
                        <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-lg">
                            <Image src="https://placehold.co/1200x400.png" alt="Banner 1" fill style={{ objectFit: 'cover' }} data-ai-hint="fashion sale" />
                            <div className="absolute inset-0 bg-black/30 flex flex-col justify-center items-center text-white p-4 text-center">
                                <h2 className="text-3xl md:text-5xl font-bold font-headline">Koleksi Terbaru</h2>
                                <p className="mt-2 text-lg">Diskon hingga 30% untuk member baru!</p>
                                <Button className="mt-4">Belanja Sekarang</Button>
                            </div>
                        </div>
                    </CarouselItem>
                     <CarouselItem>
                        <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-lg">
                            <Image src="https://placehold.co/1200x400.png" alt="Banner 2" fill style={{ objectFit: 'cover' }} data-ai-hint="new arrivals" />
                             <div className="absolute inset-0 bg-black/30 flex flex-col justify-center items-center text-white p-4 text-center">
                                <h2 className="text-3xl md:text-5xl font-bold font-headline">Produk Terlaris</h2>
                                <p className="mt-2 text-lg">Jangan sampai kehabisan stok favoritmu.</p>
                                <Button className="mt-4">Lihat Produk</Button>
                            </div>
                        </div>
                    </CarouselItem>
                </CarouselContent>
                <CarouselPrevious className="absolute left-4" />
                <CarouselNext className="absolute right-4" />
            </Carousel>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 font-headline">Galeri Produk</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {resellerProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden group">
                <CardContent className="p-0">
                  <div className="relative">
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={400}
                      height={400}
                      className="object-cover w-full h-auto aspect-square group-hover:scale-105 transition-transform duration-300"
                      data-ai-hint={product['data-ai-hint']}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-muted-foreground mt-1">{product.price}</p>
                    <Button className="w-full mt-4" variant="secondary">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Tambah ke Keranjang
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
      >
        <MessageSquare className="h-7 w-7" />
        <span className="sr-only">Chat</span>
      </Button>
    </div>
  )
}
