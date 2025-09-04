import React, { createContext, useContext, useEffect, useState } from "react";
import {
  auth,
  signOut,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "../firebase";
import { toast } from "react-toastify";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initialAuthChecked, setInitialAuthChecked] = useState(false);
  const [previousUser, setPreviousUser] = useState(null); // track last user

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      console.log("Auth state changed:", firebaseUser);

      // Show login toast only when transitioning from null to a user
      if (firebaseUser && !previousUser && initialAuthChecked) {
        toast.success(`✅ Signed in as ${firebaseUser.email}`);
      }

      // Show logout toast when going from user → null
      if (!firebaseUser && previousUser && initialAuthChecked) {
        toast.info("👋 Signed out");
      }

      setUser(firebaseUser);
      setPreviousUser(firebaseUser);
      setInitialAuthChecked(true);
    });

    const completeSignInWithEmailLink = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        console.log("🔗 Email sign-in link detected in URL");

        let email = window.localStorage.getItem("emailForSignIn");

        if (!email) {
          console.warn("⚠️ No email in localStorage. Asking user for email.");
          email = window.prompt("Please enter your email to complete sign-in:");
        }

        if (!email) {
          toast.error("❌ Email is required to sign in.");
          return;
        }

        try {
          const result = await signInWithEmailLink(auth, email, window.location.href);
          console.log("✅ Email sign-in successful:", result.user);
          window.localStorage.removeItem("emailForSignIn");

          // Optional: Clear link from URL after successful login
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
          console.error("❌ Email link sign-in error:", error);
          toast.error("❌ Email sign-in failed.");
        }
      }
    };

    completeSignInWithEmailLink();

    return () => unsubscribe();
  }, [previousUser, initialAuthChecked]);

  const logout = () => {
    signOut(auth).catch((error) => {
      console.error("Error signing out: ", error);
      toast.error("❌ Sign-out failed.");
    });
  };

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
