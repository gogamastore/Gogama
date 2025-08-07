
"use client";

import { useState, useEffect } from "react";
import { products } from "@/lib/data";
import ProductCard from "../product-card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../ui/carousel";
import { Clock } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";

export default function FlashSaleSection() {
    const flashSaleProducts = products.filter(p => p.promotion === 'Flash Sale');
    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const endTime = new Date();
            endTime.setHours(endTime.getHours() + 2);
            endTime.setMinutes(endTime.getMinutes() + 15);
            endTime.setSeconds(endTime.getSeconds() + 10);
            
            const difference = +endTime - +new Date();
            let timeLeft = { hours: 0, minutes: 0, seconds: 0 };

            if (difference > 0) {
                timeLeft = {
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                };
            }
            return timeLeft;
        };
        
        // Set initial value on client
        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (time: number) => time.toString().padStart(2, '0');

    return (
        <section className="w-full py-6 md:py-10 bg-primary/5">
            <div className="container max-w-screen-2xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <h2 className="text-2xl md:text-3xl font-bold font-headline text-primary">Flash Sale</h2>
                        {timeLeft !== null && (
                            <div className="flex items-center gap-2 text-foreground">
                                <Clock className="h-6 w-6" />
                                <div className="font-mono text-base sm:text-lg font-semibold space-x-1">
                                    <span className="hidden md:inline">Berakhir dalam</span>
                                    <span className="bg-destructive text-destructive-foreground rounded-md px-2 py-1">{formatTime(timeLeft.hours)}</span>
                                    <span>:</span>
                                    <span className="bg-destructive text-destructive-foreground rounded-md px-2 py-1">{formatTime(timeLeft.minutes)}</span>
                                    <span>:</span>
                                    <span className="bg-destructive text-destructive-foreground rounded-md px-2 py-1">{formatTime(timeLeft.seconds)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                     <Button asChild variant="link" className="p-0 h-auto font-headline">
                        <Link href="#">Lihat Semua</Link>
                     </Button>
                </div>
                <Carousel
                    opts={{
                        align: "start",
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-2">
                        {flashSaleProducts.map((product) => (
                            <CarouselItem key={product.id} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 pl-2">
                                <ProductCard product={product} showStockProgress={true} />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-[-20px] top-1/2 -translate-y-1/2 hidden md:inline-flex" />
                    <CarouselNext className="absolute right-[-20px] top-1/2 -translate-y-1/2 hidden md:inline-flex" />
                </Carousel>
            </div>
        </section>
    );
}
