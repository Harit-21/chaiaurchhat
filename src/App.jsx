import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
// import ReviewPage from './pages/ReviewPage';
import NotFound from './pages/NotFound';
// import CollegeList from './pages/CollegeList';
// import CollegeDetailPage from './pages/CollegeDetailPage';
// import CollegeDetail from './pages/CollegeDetail';
// import HostelDetail from './pages/HostelDetail';
import CollegePage from './pages/CollegePage';
import PGDetailPage from './pages/PGDetailPage';
import ScrollTop from "./components/ScrollTop";
import { auth, isSignInWithEmailLink, signInWithEmailLink } from './firebase';
import { isCollegeEmail } from './utils';
import { AuthProvider } from "./pages/AuthContext";
import { ToastContainer } from 'react-toastify';
import MyReviews from './pages/MyReviews';


function App() {

  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = prompt("Please provide your email again to confirm");
      }

      signInWithEmailLink(auth, email, window.location.href)
        .then((result) => {
          window.localStorage.removeItem('emailForSignIn');

          if (isCollegeEmail(result.user.email)) {
            console.log("✅ Logged in with college email:", result.user.email);
          } else {
            console.warn("⚠️ Non-college email used:", result.user.email);
          }
        })
        .catch((error) => {
          console.error("Sign-in error:", error);
        });
    }
  }, []);

  return (

    <AuthProvider>
      <> <ScrollTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/college/:collegeName" element={<CollegePage />} />
          <Route path="/college/:collegeName/pg/:pgName" element={<PGDetailPage />} />
          {/* <Route path="/review/:pgId" element={<ReviewPage />} /> */}
          <Route path="*" element={<NotFound />} />
          <Route path="/my-reviews" element={<MyReviews />} />
        </Routes>
        <ToastContainer />
      </>
    </AuthProvider>
  );
}

export default App;
