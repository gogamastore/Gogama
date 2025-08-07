
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "../ui/button";

const heroBanners = [
  {
    title: "Koleksi Fashion Terbaru",
    subtitle: "Tampil Gaya Setiap Hari",
    image: "https://placehold.co/1200x500.png",
    hint: "fashion collection",
    buttonText: "Belanja Sekarang"
  },
  {
    title: "Mega Sale Elektronik",
    subtitle: "Diskon hingga 50%",
    image: "https://placehold.co/1200x500.png",
    hint: "electronics sale",
    buttonText: "Lihat Promo"
  },
  {
    title: "Perabotan Rumah Impian",
    subtitle: "Ciptakan Kenyamanan di Rumah Anda",
    image: "https://placehold.co/1200x500.png",
    hint: "home furniture",
    buttonText: "Jelajahi"
  },
]

export default function HeroSection() {
  return (
    <section className="w-full pt-6 md:pt-10">
      <div className="container max-w-screen-2xl">
        <Carousel className="w-full" opts={{ loop: true }}>
          <CarouselContent>
            {heroBanners.map((banner, index) => (
              <CarouselItem key={index}>
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative aspect-[2/1] md:h-[500px] w-full">
                        <Image
                            src={banner.image}
                            alt={banner.title}
                            layout="fill"
                            objectFit="cover"
                            className="brightness-75"
                            data-ai-hint={banner.hint}
                        />
                        <div className="absolute inset-0 flex flex-col items-start justify-center p-6 md:p-16 text-white space-y-2 md:space-y-4">
                            <h2 className="text-2xl md:text-5xl font-bold font-headline leading-tight">
                                {banner.title}
                            </h2>
                            <p className="text-base md:text-2xl">{banner.subtitle}</p>
                            <Button size="lg" className="font-headline text-sm md:text-lg mt-2 md:mt-4">{banner.buttonText}</Button>
                        </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2" />
          <CarouselNext className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2" />
        </Carousel>
      </div>
    </section>
  );
}
