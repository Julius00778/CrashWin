import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'signup';
  onSwitchMode: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, mode, onSwitchMode, onSuccess }: AuthModalProps) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    city: "",
    country: "India",
    agreeToTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const resetForm = () => {
    setForm({
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
      dateOfBirth: "",
      city: "",
      country: "India",
      agreeToTerms: false,
    });
    setErrors({});
    setStep(1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.firstName.trim()) newErrors.firstName = "First name is required";
    if (!form.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (mode === 'signup' && form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }
    
    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    if (mode === 'signup' && !form.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'login') {
      if (!form.email || !form.password) {
        setErrors({ email: !form.email ? 'Email is required' : '', password: !form.password ? 'Password is required' : '' });
        return;
      }
    } else {
      // For signup, only handle step 2 (final submission)
      if (step === 1) {
        // Don't handle form submission for step 1, use the Continue button instead
        return;
      }
      if (!validateStep2()) return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

        if (error) throw error;

        const user = data.user;
        if (!user) throw new Error("Login failed");

        if (!user.email_confirmed_at) {
          throw new Error("Please verify your email before logging in.");
        }

        onSuccess();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
        });

        if (error) throw error;
        if (!data.user) throw new Error("Signup failed.");

        // For now, we'll store additional user data in user metadata
        // This avoids database schema issues while still capturing the information
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            first_name: form.firstName,
            last_name: form.lastName,
            phone: form.phone,
            date_of_birth: form.dateOfBirth,
            city: form.city,
            country: form.country,
          }
        });

        if (updateError) console.warn("Could not save additional user data:", updateError.message);

        alert("Signup successful! Please verify your email before logging in.");
        resetForm();
        onSwitchMode();
      }
    } catch (error: any) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl shadow-2xl w-full max-w-md transform animate-slideIn border border-gray-700">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200 z-10"
        >
          <i className="fas fa-times text-xl"></i>
        </button>

        {/* Header */}
        <div className="p-8 pb-4">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-accent-gold to-accent-green bg-clip-text text-transparent">
              {mode === 'login' ? 'Welcome Back' : 'Join CrashWin'}
            </h2>
            <p className="text-gray-400 mt-2">
              {mode === 'login' ? 'Sign in to your account' : 
               step === 1 ? 'Enter your basic information' : 'Complete your account setup'}
            </p>
          </div>

          {/* Progress Indicator for Signup */}
          {mode === 'signup' && (
            <div className="flex items-center justify-center mb-6">
              <div className="flex space-x-2">
                <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${step >= 1 ? 'bg-accent-gold' : 'bg-gray-600'}`}></div>
                <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-accent-gold' : 'bg-gray-600'}`}></div>
              </div>
              <span className="ml-3 text-sm text-gray-400">
                Step {step} of 2
              </span>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-8">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {errors.general}
            </div>
          )}

          {mode === 'login' ? (
            <div className="space-y-4">
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full p-4 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/20 focus:outline-none transition-all duration-300"
                />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>
              
              <div>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full p-4 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/20 focus:outline-none transition-all duration-300"
                />
                {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
              </div>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className="space-y-4 animate-slideIn">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        name="firstName"
                        placeholder="First Name"
                        value={form.firstName}
                        onChange={handleChange}
                        className="w-full p-4 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/20 focus:outline-none transition-all duration-300"
                      />
                      {errors.firstName && <p className="text-red-400 text-sm mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Last Name"
                        value={form.lastName}
                        onChange={handleChange}
                        className="w-full p-4 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/20 focus:outline-none transition-all duration-300"
                      />
                      {errors.lastName && <p className="text-red-400 text-sm mt-1">{errors.lastName}</p>}
                    </div>
                  </div>
                  
                  <div>
                    <input
                      type="email"
                      name="email"
                      placeholder="Email address"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full p-4 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/20 focus:outline-none transition-all duration-300"
                    />
                    {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <input
                      type="date"
                      name="dateOfBirth"
                      placeholder="Date of Birth"
                      value={form.dateOfBirth}
                      onChange={handleChange}
                      className="w-full p-4 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/20 focus:outline-none transition-all duration-300"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        name="city"
                        placeholder="City"
                        value={form.city}
                        onChange={handleChange}
                        className="w-full p-4 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/20 focus:outline-none transition-all duration-300"
                      />
                    </div>
                    <div>
                      <select
                        name="country"
                        value={form.country}
                        onChange={handleChange}
                        className="w-full p-4 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/20 focus:outline-none transition-all duration-300"
                      >
                        <option value="India">India</option>
                        <option value="USA">USA</option>
                        <option value="UK">UK</option>
                        <option value="Canada">Canada</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-slideIn">
                  <div>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone Number"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full p-4 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/20 focus:outline-none transition-all duration-300"
                    />
                    {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
                  </div>
                  
                  <div>
                    <input
                      type="password"
                      name="password"
                      placeholder="Password"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full p-4 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/20 focus:outline-none transition-all duration-300"
                    />
                    {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
                  </div>
                  
                  <div>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      className="w-full p-4 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/20 focus:outline-none transition-all duration-300"
                    />
                    {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
                  </div>

                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={form.agreeToTerms}
                      onChange={handleChange}
                      className="mt-1 w-4 h-4 text-accent-gold bg-gray-800 border-gray-600 rounded focus:ring-accent-gold"
                    />
                    <label className="text-sm text-gray-400">
                      I agree to the <span className="text-accent-gold cursor-pointer hover:underline">Terms of Service</span> and <span className="text-accent-gold cursor-pointer hover:underline">Privacy Policy</span>
                    </label>
                  </div>
                  {errors.agreeToTerms && <p className="text-red-400 text-sm">{errors.agreeToTerms}</p>}
                </div>
              )}
            </>
          )}

          <div className="flex flex-col space-y-4 mt-6">
            {mode === 'signup' && step === 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="w-full bg-gradient-to-r from-accent-gold to-yellow-500 hover:from-yellow-500 hover:to-accent-gold text-black font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <i className="fas fa-arrow-right mr-2"></i>
                Continue to Step 2
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-accent-green to-green-600 hover:from-green-600 hover:to-accent-green text-white font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
                  </div>
                ) : (
                  mode === 'login' ? 'Sign In' : 'Create Account'
                )}
              </button>
            )}

            {mode === 'signup' && step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-gray-400 hover:text-white py-2 transition-colors duration-300"
              >
                ← Back
              </button>
            )}
          </div>

          <div className="text-center mt-6">
            <p className="text-gray-400 text-sm">
              {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={onSwitchMode}
                className="text-accent-gold hover:text-yellow-400 font-semibold transition-colors duration-300"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}