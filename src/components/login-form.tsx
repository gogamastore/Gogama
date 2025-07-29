
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
import { doc, getDoc } from "firebase/firestore";
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

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { user, loading: authLoading, signIn, sendPasswordReset } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
        // Redirect logic moved to handleLogin to check for roles
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signIn(email, password);
      const user = userCredential.user;

      // Fetch user role from Firestore
      const userDocRef = doc(db, "user", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'reseller') {
          router.push('/reseller');
        } else {
          router.push('/dashboard');
        }
      } else {
        // Default to dashboard if no role is found (e.g. initial admin)
        router.push('/dashboard');
      }

    } catch (error) {
      console.error("Failed to sign in", error);
      toast({
        variant: "destructive",
        title: "Login Gagal",
        description: "Email atau password salah.",
      });
    } finally {
        setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email Diperlukan",
        description: "Harap masukkan alamat email Anda terlebih dahulu.",
      });
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(email);
      toast({
        title: "Email Reset Password Terkirim",
        description: "Silakan periksa kotak masuk email Anda untuk instruksi lebih lanjut.",
      });
    } catch (error) {
       console.error("Failed to send password reset email", error);
       toast({
        variant: "destructive",
        title: "Gagal Mengirim Email",
        description: "Pastikan alamat email yang Anda masukkan benar.",
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
          <div className="flex justify-center items-center gap-2 mb-4">
            <Logo />
            <CardTitle className="text-3xl font-bold font-headline">OrderFlow</CardTitle>
          </div>
          <CardDescription>
            Masukkan kredensial Anda untuk mengakses akun
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="email@contoh.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Button
                  type="button"
                  variant="link"
                  onClick={handlePasswordReset}
                  className="ml-auto inline-block text-sm underline h-auto p-0"
                >
                  Lupa password?
                </Button>
              </div>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Memproses...' : 'Login'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Belum punya akun?{" "}
            <Link href="/register" className="underline">
              Daftar sebagai Reseller
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
