import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signInWithPopup, signOut} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDKju-b7nF0RB0L3BmDLguF60ArLyoiXOw",
  authDomain: "themadbrogrammers.firebaseapp.com",
  // etc...
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.useDeviceLanguage();

const provider = new GoogleAuthProvider();

export {
  auth,
  provider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signInWithPopup,
  signOut
};
