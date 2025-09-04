import { auth, provider, signInWithPopup, sendSignInLinkToEmail } from './firebase';
import { isCollegeEmail } from './utils';
import { toast } from 'react-toastify';

export const handleGoogleLogin = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    if (isCollegeEmail(user.email)) {
      console.log("✅ Logged in with college email:", user.email);
    } else {
      console.warn("⚠️ Non-college email used:", user.email);
    }

  } catch (error) {
    console.error("Google Sign-In Error:", error);
    toast.error("❌ Google Sign-In failed.");
    throw error; // forward it if needed
  }
};

export const sendEmailLink = async (email) => {
  const actionCodeSettings = {
    url: window.location.origin, // safer for production
    handleCodeInApp: true,
  };

  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
    toast.success("📨 Sign-in link sent!");
  } catch (error) {
    if (error.code === 'auth/quota-exceeded') {
      toast.error("🚫 Daily email sign-in quota exceeded.");
      throw new Error("quota");
      // throw { type: "quota" };
    } else {
      toast.error("❌ Failed to send sign-in link.");
      throw error;
    }
  }
};
