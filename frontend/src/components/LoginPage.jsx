// src/components/LoginPage.jsx
import { useState } from "react";

function LoginPage({ onLoginSuccess }) {
  // State Management
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation & Error States
  const [errors, setErrors] = useState({}); // { email: "", password: "", general: "" }
  const [loading, setLoading] = useState(false);

  // Validasi Format Email
  const isValidEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = "Email wajib diisi";
    } else if (!isValidEmail(email)) {
      newErrors.email = "Format email tidak valid";
    }

    if (!password) {
      newErrors.password = "Password wajib diisi";
    } else if (password.length < 6) {
      // Optional: beri hint jika password terlalu pendek (client-side check)
      // newErrors.password = "Password minimal 6 karakter"; 
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({}); // Reset errors

    // 1. Client-Side Security Check
    if (!validateForm()) return;

    setLoading(true);

    try {
      // 2. Process Login
      await onLoginSuccess(email, password);
    } catch (err) {
      // Handle Error dari Backend
      let msg = err.message || "Gagal login. Periksa koneksi Anda.";
      
      // Security Practice: Jangan terlalu spesifik "Email salah" atau "Password salah"
      // untuk mencegah User Enumeration Attack. Gunakan "Kredensial tidak valid".
      // Tapi untuk UX internal app, pesan spesifik kadang dibutuhkan.
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Background Decor (Optional - membuat kesan elegan) */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[#009846]/10 to-transparent pointer-events-none" />
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 z-10 mx-4">
        
        {/* LOGO AREA */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#009846]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            🔐
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Selamat Datang Kembali
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Masuk untuk mengelola Inventaris Sinergi Foundation
          </p>
        </div>

        {/* GENERAL ERROR ALERT */}
        {errors.general && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg p-3 flex items-start gap-2 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* EMAIL INPUT */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 ml-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {/* Mail Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="email"
                disabled={loading}
                className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all ${
                  errors.email 
                    ? "border-red-300 focus:ring-2 focus:ring-red-200 bg-red-50/30" 
                    : "border-slate-300 focus:border-[#009846] focus:ring-4 focus:ring-[#009846]/10"
                }`}
                placeholder="nama@sinergifoundation.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {errors.email && <p className="text-red-500 text-[10px] mt-1 ml-1">{errors.email}</p>}
          </div>

          {/* PASSWORD INPUT */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 ml-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {/* Lock Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                disabled={loading}
                className={`w-full pl-10 pr-10 py-2.5 text-sm border rounded-xl outline-none transition-all ${
                  errors.password 
                    ? "border-red-300 focus:ring-2 focus:ring-red-200 bg-red-50/30" 
                    : "border-slate-300 focus:border-[#009846] focus:ring-4 focus:ring-[#009846]/10"
                }`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              
              {/* Toggle Show Password */}
              <button
                type="button"
                tabIndex="-1" // Skip tab focus
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? (
                  // Eye Off Icon
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  // Eye Icon
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-[10px] mt-1 ml-1">{errors.password}</p>}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 text-sm font-bold text-white bg-[#009846] rounded-xl hover:bg-[#007b3a] focus:ring-4 focus:ring-green-500/30 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-green-900/10 transition-all flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </>
              ) : (
                "Masuk ke Dashboard"
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Sinergi Foundation Inventaris.
            <br />
            Secure Access System.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;