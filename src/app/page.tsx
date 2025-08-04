
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import LoginForm from "@/components/login-form";

export default function RootPage() {
  const { user, loading, isProcessingRedirect } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || isProcessingRedirect) {
      // Still checking for user session or processing a redirect, do nothing.
      return;
    }

    if (user) {
      // User is logged in, check their role and redirect.
      const checkRoleAndRedirect = async () => {
        try {
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
            // This case might happen if a user was created in Auth but not Firestore.
            // Or for the very first admin. Default to dashboard.
            router.replace('/dashboard');
          }
        } catch (error) {
          console.error("Error checking user role, defaulting to dashboard:", error);
          router.replace('/dashboard');
        }
      };
      
      checkRoleAndRedirect();

    } 
    // If !user and not loading, the component will automatically render the LoginForm below.
    
  }, [user, loading, isProcessingRedirect, router]);


  // While checking auth, processing redirect, or if a user is found and we are about to redirect, show a loading indicator.
  if (loading || isProcessingRedirect || user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Only show the login form if we are done loading and there's definitely no user.
  return <LoginForm />;
}
