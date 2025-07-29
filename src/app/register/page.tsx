
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

function Logo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-8 w-8 text-primary"
    >
      <path d="M2 12.5C2 11.12 3.12 10 4.5 10H6a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h2.5a2.5 2.5 0 0 0 2.5-2.5V10.5A2.5 2.5 0 0 1 17.5 8H20" />
      <path d="M2 17.5c0-1.38 1.12-2.5 2.5-2.5H6a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h2.5a2.5 2.5 0 0 0 2.5-2.5V10.5A2.5 2.5 0 0 1 17.5 8H20" />
      <path d="m21 15-4-4" />
      <path d="m17 15 4-4" />
    </svg>
  );
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
      name: '',
      email: '',
      whatsapp: '',
      password: ''
  });
  const { user, loading: authLoading, createUser } = useAuth();
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
          <div className="flex justify-center items-center gap-2 mb-4">
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
              {loading ? 'Mendaftarkan...' : 'Daftar'}
            </Button>
          </form>
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
