import React, { Suspense, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { RecoilRoot } from "recoil";
import './index.css';

const AdminDashboard = React.lazy(() => import("./pages/Admindashboard"));
const AdminSignin = React.lazy(() => import("./pages/AdminSignin"));
const SignIn = React.lazy(() => import("./pages/Signin"));
const Signup = React.lazy(() => import("./pages/Signup"));
const LandingPage = React.lazy(() => import("./pages/LandingPage"));
const Dashboard = React.lazy(() => import("./pages/dashboard"));

// Protected routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/admin/dashboard'];

// Keyboard detection component
function KeyboardDetector() {
  const navigate = useNavigate();
  const location = useLocation();
  const [, setKeySequence] = useState("");

  // Only redirect if user is on a protected route without token
  useEffect(() => {
    const token = localStorage.getItem("token");
    const isProtectedRoute = PROTECTED_ROUTES.includes(location.pathname);
    
    if (isProtectedRoute && !token) {
      navigate('/');
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Add the pressed key to our sequence
      setKeySequence(prev => {
        // Keep only the last 5 characters to avoid long strings
        const newSequence = (prev + e.key).slice(-5);

        // Check if our sequence contains "admin"
        if (newSequence.toLowerCase().includes("admin")) {
          // Reset sequence after detecting
          setKeySequence("");
          localStorage.clear();
          // Redirect to admin signin
          navigate("/admin/signin");
        }

        return newSequence;
      });
    };

    // Add the event listener
    window.addEventListener("keydown", handleKeyDown);

    // Clean up
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate]);

  return null; // This component doesn't render anything
}

function AppRoutes() {
  return (
    <>
      <KeyboardDetector />
      <Routes>
        <Route path="/" element={
          <Suspense fallback={<LoadingAnimation />}>
            <LandingPage />
          </Suspense>
        } />
        <Route path="/signin" element={
          <Suspense fallback={<LoadingAnimation />}>
            <SignIn />
          </Suspense>
        } />
        <Route path="/signup" element={
          <Suspense fallback={<LoadingAnimation />}>
            <Signup />
          </Suspense>
        } />
        <Route path="/dashboard" element={
          <Suspense fallback={<LoadingAnimation />}>
            <Dashboard />
          </Suspense>
        } />
        {/* Add the admin route even though we're redirecting to it via keyboard */}
        <Route path="/admin/signin" element={
          <Suspense fallback={<LoadingAnimation />}>
            <AdminSignin />
          </Suspense>
        } />

        <Route path="/admin/dashboard" element={
          <Suspense fallback={<LoadingAnimation />}>
            <AdminDashboard />
          </Suspense>
        } />
      </Routes>
    </>
  );
}

function App() {
  return (
    <RecoilRoot>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <Footer/>
    </RecoilRoot>
  );
}

function Footer() {
  return (
    <footer className="py-12 bg-gray-900 text-gray-400">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-6 md:mb-0">
            <span className="font-extrabold text-3xl tracking-wide text-gray-200 drop-shadow-md">
              Campus<span className="text-blue-400">Hub</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-8 mb-6 md:mb-0 justify-center">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="/about" className="hover:text-white transition-colors">About Us</a>
            <a href="sr3x0r.vercel.app" className="hover:text-white transition-colors">Contact</a>
          </div>
          <div className="flex gap-4">
            <a href="https://x.com/sreecharandesu" className="text-gray-400 hover:text-white transition-colors">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
              </svg>
            </a>
            <a href="https://github.com/sreecharan-desu" className="text-gray-400 hover:text-white transition-colors">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
        <div className="text-gray-400 text-sm text-center flex items-center space-x-1">
          <span>Made with</span>
          <span className="text-red-500 animate-pulse text-lg">♥</span>
          <span>by</span>
          <a
            href="https://github.com/sreecharan-desu"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:text-white transition-colors duration-300"
          >
            SreeCharan
          </a>
        </div>
      </div>
    </footer>
  );
}

function LoadingAnimation() {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="relative w-16 h-16">
        <div className="w-full h-full border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}

export default App;