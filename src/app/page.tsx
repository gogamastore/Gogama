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
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useAuth();
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
        // Default to dashboard if no role is found
        console.warn("User document not found in Firestore, defaulting to dashboard.");
        router.push('/dashboard');
      }

    } catch (error) {
      console.error("Failed to sign in", error);
      toast({
        variant: "destructive",
        title: "Login Gagal",
        description: "Email atau password salah.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Logo />
            <CardTitle className="text-3xl font-bold font-headline">OrderFlow</CardTitle>
          </div>
          <CardDescription>
            Masukkan kredensial Anda untuk mengakses dasbor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="admin@orderflow.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="#"
                  className="ml-auto inline-block text-sm underline"
                >
                  Lupa password?
                </Link>
              </div>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Apakah Anda seorang reseller?{" "}
            <Link href="/reseller" className="underline">
              Pergi ke Portal Reseller
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
