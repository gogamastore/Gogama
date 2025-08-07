
import Link from "next/link";
import { Facebook, Twitter, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

export default function Footer() {
  const logoUrl = "https://firebasestorage.googleapis.com/v0/b/orderflow-r7jsk.firebasestorage.app/o/ic_gogama_logo.png?alt=media&token=c7caf8ae-553a-4cf8-a4ae-bce1446b599c";

  return (
    <footer className="w-full border-t bg-card">
      <div className="container mx-auto grid max-w-screen-2xl grid-cols-1 gap-8 px-4 py-10 md:grid-cols-4 md:px-6">
        <div className="flex flex-col space-y-4">
          <Link href="/" className="flex items-center space-x-2">
            <Image src={logoUrl} alt="Gogama Logo" width={32} height={32} className="h-8 w-8" />
            <span className="text-xl font-bold font-headline">Gogama Store</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Toko online terpercaya dengan berbagai pilihan produk berkualitas.
          </p>
          <div className="flex space-x-4">
            <Link href="#" aria-label="Facebook">
              <Facebook className="h-5 w-5 text-muted-foreground hover:text-primary" />
            </Link>
            <Link href="#" aria-label="Twitter">
              <Twitter className="h-5 w-5 text-muted-foreground hover:text-primary" />
            </Link>
            <Link href="#" aria-label="Instagram">
              <Instagram className="h-5 w-5 text-muted-foreground hover:text-primary" />
            </Link>
          </div>
        </div>
        <div>
          <h3 className="mb-4 font-headline text-lg font-semibold">Layanan Pelanggan</h3>
          <ul className="space-y-2">
            <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Bantuan</Link></li>
            <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Metode Pembayaran</Link></li>
            <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Lacak Pesanan</Link></li>
            <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Hubungi Kami</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-headline text-lg font-semibold">Tentang Kami</h3>
          <ul className="space-y-2">
            <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Tentang Gogama</Link></li>
            <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Karir</Link></li>
            <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Kebijakan Privasi</Link></li>
            <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Syarat & Ketentuan</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-headline text-lg font-semibold">Berlangganan Newsletter</h3>
          <p className="mb-4 text-sm text-muted-foreground">Dapatkan info promo dan produk terbaru.</p>
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input type="email" placeholder="Email Anda" className="bg-background"/>
            <Button type="submit" className="font-headline">Kirim</Button>
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="container mx-auto flex max-w-screen-2xl items-center justify-center px-4 py-4 md:px-6">
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Gogama Store. Semua hak dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}
