
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
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { Separator } from "./ui/separator";

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

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { user, loading: authLoading, signIn, signInWithGoogle, sendPasswordReset } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // The redirection is now handled by the onAuthStateChanged in the auth hook.
    } catch (error) {
        console.error("Google Sign-In failed", error);
        toast({
            variant: "destructive",
            title: "Login Google Gagal",
            description: "Terjadi kesalahan, silakan coba lagi.",
        });
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
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex flex-col justify-center items-center gap-4 mb-4">
            <Logo />
            <CardTitle className="text-3xl font-bold font-headline">Gogama Store</CardTitle>
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
            <Button type="submit" className="w-full" disabled={loading || authLoading}>
              {(loading || authLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Memproses...' : 'Login'}
            </Button>
          </form>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Atau lanjutkan dengan
              </span>
            </div>
          </div>
          
           <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading || authLoading}>
                {(loading || authLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <GoogleIcon />
                <span className="ml-2">Masuk dengan Google</span>
            </Button>
            
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
