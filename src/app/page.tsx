
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import LoginForm from "@/components/login-form";

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      // Still checking for user session, do nothing.
      return;
    }

    if (user) {
      // User is logged in, check their role and redirect.
      const checkRoleAndRedirect = async () => {
        const userDocRef = doc(db, "user", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role === 'reseller') {
            router.replace('/reseller');
          } else {
            router.replace('/dashboard');
          }
        } else {
          // Default to dashboard if no role is found (e.g. initial admin)
          router.replace('/dashboard');
        }
      };
      
      checkRoleAndRedirect();

    } 
    // If !user and !loading, the component will automatically render the LoginForm below.
    
  }, [user, loading, router]);


  // While checking auth or redirecting, show a loading indicator.
  // If not loading and no user, show the login form.
  if (loading || user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <LoginForm />;
}
