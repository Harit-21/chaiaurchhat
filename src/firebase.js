import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signInWithPopup, signOut} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDKju-b7nF0RB0L3BmDLguF60ArLyoiXOw",
  authDomain: "chaiaurchhat.vercel.app",
  databaseURL: "https://themadbrogrammers-default-rtdb.firebaseio.com",
  projectId: "themadbrogrammers",
  storageBucket: "themadbrogrammers.firebasestorage.app",
  messagingSenderId: "771054270434",
  appId: "1:771054270434:web:fb3ad2c0807cf1794a6bbb",
  measurementId: "G-Y2NG7XH0KQ"
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
