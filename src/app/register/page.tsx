
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import Image from "next/image";

function Logo() {
  return (
    <Image src="https://firebasestorage.googleapis.com/v0/b/orderflow-r7jsk.firebasestorage.app/o/ic_gogama_logo.png?alt=media&token=c7caf8ae-553a-4cf8-a4ae-bce1446b599c" alt="Gogama Store Logo" width={75} height={75} />
  );
}

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.519-3.317-11.284-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
        <path fill="#1976D2" d="M43.611 20.083H24v8h11.303c-0.792 2.237-2.231 4.166-4.087 5.574l6.19 5.238C42.012 36.49 44 30.861 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
    </svg>
)

export default function RegisterPage() {
  const [formData, setFormData] = useState({
      name: '',
      email: '',
      whatsapp: '',
      password: ''
  });
  const { user, loading: authLoading, createUser, registerWithGoogle } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/reseller');
    }
  }, [user, authLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({...prev, [id]: value}));
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
        toast({
            variant: "destructive",
            title: "Data Tidak Lengkap",
            description: "Nama, email dan password harus diisi."
        });
        return;
    }
     if (formData.password.length < 6) {
        toast({
            variant: "destructive",
            title: "Password Lemah",
            description: "Password minimal harus 6 karakter."
        });
        return;
    }
    setLoading(true);
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUser(formData.email, formData.password);
      const newUser = userCredential.user;

      // 2. Save user profile and role to Firestore
      await setDoc(doc(db, "user", newUser.uid), {
          name: formData.name,
          email: formData.email,
          whatsapp: formData.whatsapp,
          role: 'reseller' // Set role in Firestore
      });

      toast({
        title: "Pendaftaran Berhasil!",
        description: "Akun reseller Anda telah dibuat. Anda akan diarahkan...",
      });
      
      router.push('/reseller');

    } catch (error: any) {
      console.error("Failed to register", error);
      let description = "Terjadi kesalahan. Silakan coba lagi.";
      if (error.code === 'auth/email-already-in-use') {
          description = "Alamat email ini sudah terdaftar.";
      }
      toast({
        variant: "destructive",
        title: "Pendaftaran Gagal",
        description: description,
      });
    } finally {
        setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    try {
        const newUser = await registerWithGoogle();
        if (!newUser) {
            toast({
                variant: 'destructive',
                title: 'Gagal Mendaftar',
                description: 'Akun Google ini sepertinya sudah terdaftar. Silakan coba login.'
            });
        }
        // Redirect is handled in the hook
    } catch(error) {
         toast({
            variant: "destructive",
            title: "Pendaftaran Gagal",
            description: "Terjadi kesalahan saat mendaftar dengan Google.",
        });
    } finally {
        setLoading(false);
    }
  }
  
  if (authLoading || user) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex flex-col justify-center items-center gap-4 mb-4">
            <Logo />
            <CardTitle className="text-3xl font-bold font-headline">Daftar Reseller</CardTitle>
          </div>
          <CardDescription>
            Buat akun baru untuk mulai berbelanja.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input id="name" placeholder="Masukkan nama lengkap Anda" required value={formData.name} onChange={handleInputChange} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="email@contoh.com" required value={formData.email} onChange={handleInputChange} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="whatsapp">Nomor WhatsApp</Label>
              <Input id="whatsapp" type="tel" placeholder="081234567890" value={formData.whatsapp} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={formData.password} onChange={handleInputChange} placeholder="Minimal 6 karakter"/>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Mendaftarkan...' : 'Daftar dengan Email'}
            </Button>
          </form>

           <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Atau
              </span>
            </div>
          </div>
            <Button variant="outline" className="w-full" onClick={handleGoogleRegister} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <GoogleIcon />
              <span className="ml-2">Daftar dengan Google</span>
            </Button>


          <div className="mt-4 text-center text-sm">
            Sudah punya akun?{" "}
            <Link href="/" className="underline">
              Login di sini
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
