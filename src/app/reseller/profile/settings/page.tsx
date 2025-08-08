
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UserCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfileSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    whatsapp: '',
  });

  useEffect(() => {
    if (!authLoading && user) {
      const userDocRef = doc(db, 'user', user.uid);
      getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfileData({
            name: data.name || user.displayName || '',
            whatsapp: data.whatsapp || '62',
          });
        } else {
            setProfileData({ name: user.displayName || '', whatsapp: '62' });
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setProfileData((prev) => ({ ...prev, [id]: value }));
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const userDocRef = doc(db, 'user', user.uid);
      await updateDoc(userDocRef, {
        name: profileData.name,
        whatsapp: profileData.whatsapp,
      });
      toast({ title: 'Profil Berhasil Diperbarui' });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Gagal Memperbarui Profil',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (authLoading) {
    return <div className="text-center p-8"><Loader2 className="mx-auto h-8 w-8 animate-spin"/></div>;
  }
  if (!user) {
    router.replace('/login');
    return <div className="text-center p-8"><Loader2 className="mx-auto h-8 w-8 animate-spin"/></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-screen-lg">
       <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Kembali</span>
            </Button>
            <h1 className="text-3xl font-bold font-headline">Pengaturan Profil</h1>
       </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <UserCircle className="h-6 w-6" />
            <CardTitle>Informasi Akun</CardTitle>
          </div>
          <CardDescription>
            Perbarui informasi kontak dan nama Anda di sini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              value={profileData.name}
              onChange={handleProfileChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">Nomor WhatsApp</Label>
            <Input
              id="whatsapp"
              value={profileData.whatsapp}
              onChange={handleProfileChange}
              placeholder="Contoh: 628123456789"
            />
          </div>
           <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email || ''} disabled />
          </div>
        </CardContent>
        <div className="p-6 pt-0">
          <Button onClick={handleUpdateProfile} disabled={isSubmitting}>
             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Perubahan Profil
          </Button>
        </div>
      </Card>
    </div>
  );
}
