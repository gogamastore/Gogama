
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Home, Loader2, PlusCircle, Trash2, UserCircle, ShieldCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface UserAddress {
    id: string;
    label: string;
    address: string;
    whatsapp: string;
}

export default function ProfilePage() {
  const { user, loading: authLoading, reauthenticate, changePassword } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    whatsapp: '',
  });

  const [passwordData, setPasswordData] = useState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
  });
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);


  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isAddressLoading, setIsAddressLoading] = useState(true);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: '', address: '', whatsapp: '' });

  useEffect(() => {
    if (!authLoading && user) {
      const userDocRef = doc(db, 'user', user.uid);
      getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfileData({
            name: data.name || user.displayName || '',
            whatsapp: data.whatsapp || '',
          });
        } else {
            setProfileData({ name: user.displayName || '', whatsapp: '' });
        }
      });
      fetchAddresses();
    }
  }, [user, authLoading]);

  const fetchAddresses = async () => {
    if (!user) return;
    setIsAddressLoading(true);
    const addressesQuery = collection(db, `user/${user.uid}/addresses`);
    const querySnapshot = await getDocs(addressesQuery);
    const userAddresses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserAddress));
    setAddresses(userAddresses);
    setIsAddressLoading(false);
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setProfileData((prev) => ({ ...prev, [id]: value }));
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [id]: value }));
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
  
  const handleUpdatePassword = async () => {
      if (!passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword) {
          toast({ variant: 'destructive', title: 'Password Tidak Cocok', description: 'Pastikan password baru dan konfirmasi password sama.'});
          return;
      }
       if (passwordData.newPassword.length < 6) {
          toast({ variant: 'destructive', title: 'Password Terlalu Pendek', description: 'Password baru minimal harus 6 karakter.'});
          return;
      }
      setIsPasswordSubmitting(true);
      try {
        await reauthenticate(passwordData.currentPassword);
        await changePassword(passwordData.newPassword);
        toast({ title: 'Password Berhasil Diperbarui' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: 'Gagal Memperbarui Password', description: 'Pastikan password lama Anda benar.' });
      } finally {
          setIsPasswordSubmitting(false);
      }
  };

  const handleAddressDialogInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewAddress(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveAddress = async () => {
      if (!user) return;
      if (!newAddress.label || !newAddress.address || !newAddress.whatsapp) {
          toast({ variant: 'destructive', title: 'Data alamat tidak lengkap' });
          return;
      }
      setIsSubmitting(true);
      try {
          await addDoc(collection(db, `user/${user.uid}/addresses`), newAddress);
          toast({ title: 'Alamat baru berhasil disimpan' });
          setIsAddressDialogOpen(false);
          setNewAddress({ label: '', address: '', whatsapp: '' });
          fetchAddresses();
      } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: 'Gagal menyimpan alamat' });
      } finally {
          setIsSubmitting(false);
      }
  }

  const handleDeleteAddress = async (addressId: string) => {
      if (!user || !confirm('Anda yakin ingin menghapus alamat ini?')) return;
      
      try {
          await deleteDoc(doc(db, `user/${user.uid}/addresses`, addressId));
          toast({ title: 'Alamat berhasil dihapus' });
          fetchAddresses();
      } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: 'Gagal menghapus alamat' });
      }
  }

  if (authLoading) {
    return <div className="text-center p-8"><Loader2 className="mx-auto h-8 w-8 animate-spin"/></div>;
  }
  if (!user) {
    return <div className="text-center p-8">Silakan login untuk melihat profil Anda.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold font-headline">Profil Saya</h1>
      
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
      
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6" />
            <CardTitle>Keamanan & Password</CardTitle>
          </div>
          <CardDescription>
            Ubah password Anda secara berkala untuk menjaga keamanan akun.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Password Lama</Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Password Baru</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
            />
          </div>
           <div className="space-y-2">
            <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
            />
          </div>
        </CardContent>
        <div className="p-6 pt-0">
          <Button onClick={handleUpdatePassword} disabled={isPasswordSubmitting}>
             {isPasswordSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ubah Password
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
             <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Home className="h-6 w-6" />
                    <CardTitle>Buku Alamat</CardTitle>
                 </div>
                 <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                    <DialogTrigger asChild>
                       <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4"/>Tambah Alamat</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Tambah Alamat Baru</DialogTitle>
                            <DialogDescription>Simpan alamat untuk mempermudah proses checkout nanti.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-1">
                                <Label htmlFor="label">Label Alamat</Label>
                                <Input id="label" value={newAddress.label} onChange={handleAddressDialogInputChange} placeholder="Contoh: Rumah, Kantor, Toko"/>
                            </div>
                             <div className="space-y-1">
                                <Label htmlFor="address">Alamat Lengkap</Label>
                                <Textarea id="address" value={newAddress.address} onChange={handleAddressDialogInputChange} placeholder="Jalan, No. Rumah, RT/RW, Kelurahan, Kecamatan, Kota, Kode Pos"/>
                            </div>
                             <div className="space-y-1">
                                <Label htmlFor="whatsapp">Nomor WhatsApp Penerima</Label>
                                <Input id="whatsapp" value={newAddress.whatsapp} onChange={handleAddressDialogInputChange} placeholder="Nomor telepon di alamat ini"/>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsAddressDialogOpen(false)}>Batal</Button>
                            <Button onClick={handleSaveAddress} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Simpan
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                 </Dialog>
             </div>
          <CardDescription>
            Kelola alamat pengiriman Anda untuk proses checkout yang lebih cepat.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {isAddressLoading ? (
                 <p>Memuat alamat...</p>
            ) : addresses.length > 0 ? (
                <div className="space-y-4">
                    {addresses.map(addr => (
                         <div key={addr.id} className="flex items-start justify-between rounded-lg border p-4">
                            <div>
                                <p className="font-bold">{addr.label}</p>
                                <p className="text-sm text-muted-foreground">{addr.address}</p>
                                <p className="text-sm text-muted-foreground">Telp: {addr.whatsapp}</p>
                            </div>
                             <Button variant="ghost" size="icon" onClick={() => handleDeleteAddress(addr.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                             </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>Anda belum menambahkan alamat tersimpan.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
