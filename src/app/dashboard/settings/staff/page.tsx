"use client";

import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  query,
  where,
  addDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Loader2, User, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';


interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  role: string;
}

export default function StaffManagementPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { createUser } = useAuth(); // Import the createUser function
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    password: '',
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'user'), where('role', '==', 'admin'));
      const querySnapshot = await getDocs(q);
      const staffData = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Staff)
      );
      setStaffList(staffData);
    } catch (error) {
      console.error('Error fetching staff: ', error);
      toast({
        variant: 'destructive',
        title: 'Gagal Memuat Staf',
        description: 'Terjadi kesalahan saat mengambil data dari server. Pastikan Anda memiliki izin yang benar.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewStaff((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddStaff = async () => {
    if (
      !newStaff.name ||
      !newStaff.email ||
      !newStaff.password ||
      !newStaff.position
    ) {
      toast({
        variant: 'destructive',
        title: 'Data Tidak Lengkap',
        description: 'Nama, email, password, dan jabatan harus diisi.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Create user in Firebase Authentication
      const userCredential = await createUser(newStaff.email, newStaff.password);
      const user = userCredential.user;

      // 2. Add staff details to Firestore, including the UID and role
      await setDoc(doc(db, "user", user.uid), {
          name: newStaff.name,
          email: newStaff.email,
          phone: newStaff.phone,
          position: newStaff.position,
          role: 'admin'
      });

      toast({
        title: 'Staf Berhasil Ditambahkan',
        description: `${newStaff.name} telah ditambahkan sebagai admin.`,
      });
      setIsDialogOpen(false);
      setNewStaff({ name: '', email: '', phone: '', position: '', password: '' });
      fetchStaff(); // Refresh list
    } catch (error: any) {
      console.error('Error adding staff: ', error);
      toast({
        variant: 'destructive',
        title: 'Gagal Menambahkan Staf',
        description: error.message || 'Pastikan email belum terdaftar.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus staf "${name}"? Tindakan ini tidak bisa dibatalkan.`)) {
      return;
    }
    // Deleting a user from Auth requires a backend function for security.
    // For now, we will only delete their record from Firestore.
    // The user will no longer appear in the list but their Auth account will remain.
    try {
      await deleteDoc(doc(db, "user", id));
      toast({
        title: 'Staf Berhasil Dihapus',
        description: `Data staf ${name} telah dihapus dari Firestore. Akun login mereka masih ada.`
      });
      fetchStaff(); // Refresh list
    } catch (error: any) {
      console.error('Error deleting staff document: ', error);
      toast({
        variant: 'destructive',
        title: 'Gagal Menghapus Staf',
        description: error.message || "Terjadi kesalahan saat menghapus data.",
      });
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/settings')}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Kembali ke Pengaturan</span>
            </Button>
            <h1 className="text-xl md:text-2xl font-bold">Manajemen Staf</h1>
        </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Daftar Staf Admin</CardTitle>
            <CardDescription>
              Tambah, lihat, atau hapus staf yang memiliki akses ke dasbor admin.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah Staf
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah Staf Admin Baru</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input id="name" value={newStaff.name} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="email">Alamat Email</Label>
                  <Input id="email" type="email" value={newStaff.email} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input id="phone" type="tel" value={newStaff.phone} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Jabatan</Label>
                  <Input id="position" value={newStaff.position} onChange={handleInputChange} placeholder="Contoh: Admin Gudang"/>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={newStaff.password} onChange={handleInputChange} placeholder="Minimal 6 karakter" />
                </div>
              </div>
              <DialogFooter>
                 <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                <Button onClick={handleAddStaff} disabled={isSubmitting}>
                   {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Staf
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead>Jabatan</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                        Memuat data staf...
                        </TableCell>
                    </TableRow>
                    ) : staffList.length > 0 ? (
                    staffList.map((staff) => (
                        <TableRow key={staff.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground"/>
                            {staff.name}
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span>{staff.email}</span>
                                <span className="text-xs text-muted-foreground">{staff.phone}</span>
                            </div>
                        </TableCell>
                        <TableCell>{staff.position}</TableCell>
                         <TableCell>
                            <Badge variant="secondary">{staff.role}</Badge>
                         </TableCell>
                        <TableCell className="text-right">
                            <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteStaff(staff.id, staff.name)}
                            title="Menghapus staf hanya akan menghapus data dari daftar ini, bukan akun login mereka."
                            >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                        Belum ada staf yang ditambahkan.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
