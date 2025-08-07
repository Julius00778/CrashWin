// ✅ FILE: client/src/pages/Auth.tsx

import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [, setLocation] = useLocation();

  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    city: "",
    country: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin) {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (error) return alert("Signup error: " + error.message);
      if (!data.user) return alert("Signup failed.");

      const { error: dbError } = await supabase.from("users").insert({
        id: data.user.id,
        name: form.name,
        phone: form.phone,
        city: form.city,
        country: form.country,
        email: form.email,
      });

      if (dbError) return alert("DB error: " + dbError.message);

      alert("Signup successful! Please verify your email.");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) return alert("Login error: " + error.message);

      const user = data.user;
      if (!user) return alert("Login failed");

      if (!user.email_confirmed_at) {
        return alert("Please verify your email before logging in.");
      }

      setLocation("/");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 p-6 rounded-lg shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isLogin ? "Login" : "Create Account"}
        </h2>

        {!isLogin && (
          <>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-800"
              required
            />
            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-800"
              required
            />
            <input
              type="text"
              name="city"
              placeholder="City"
              value={form.city}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-800"
              required
            />
            <input
              type="text"
              name="country"
              placeholder="Country"
              value={form.country}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-800"
              required
            />
          </>
        )}

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-800"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-800"
          required
        />

        <button
          type="submit"
          className="w-full bg-green-500 hover:bg-green-600 p-2 rounded"
        >
          {isLogin ? "Log In" : "Create Account"}
        </button>

        <p className="text-center text-sm">
          {isLogin ? "Don't have an account?" : "Already have an account?"} {" "}
          <span
            className="text-blue-400 cursor-pointer"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Sign up" : "Log in"}
          </span>
        </p>
      </form>
    </div>
  );
}
