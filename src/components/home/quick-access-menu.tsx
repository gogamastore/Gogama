
import { categories } from "@/lib/data";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

export default function QuickAccessMenu() {
  return (
    <section className="w-full py-6 md:py-10">
      <div className="container max-w-screen-2xl">
        <h2 className="text-2xl font-bold font-headline mb-6 text-center">Jelajahi Kategori</h2>
        <Carousel
          opts={{
            align: "start",
            dragFree: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2">
            {categories.map((category) => (
              <CarouselItem key={category.name} className="basis-1/4 sm:basis-1/5 md:basis-1/6 lg:basis-[12%] pl-2">
                 <Link href="#" className="group">
                  <Card className="h-full transition-all duration-300 hover:bg-primary/10 hover:shadow-md">
                    <CardContent className="flex flex-col items-center justify-center p-2 aspect-square">
                      <category.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-2 transition-transform duration-300 group-hover:scale-110" />
                      <span className="text-center text-[10px] sm:text-xs font-semibold font-headline leading-tight">
                        {category.name}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
