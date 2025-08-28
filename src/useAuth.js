// auth.js
import { auth, provider, signInWithPopup, sendSignInLinkToEmail } from './firebase';
import { isCollegeEmail } from './utils';

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
  }
};

export const sendEmailLink = async (email) => {
  const actionCodeSettings = {
    url: window.location.href,
    handleCodeInApp: true,
  };

  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
    alert("📨 Email link sent!");
  } catch (error) {
    console.error("Email Link Error:", error);
  }
};
