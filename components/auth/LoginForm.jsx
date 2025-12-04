"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import Toast from "@/components/ui/Toast";

const LoginForm = ({ userType, onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "", show: false });
  const router = useRouter();

  const showToast = (message, type) => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const fieldName = userType === "admin" ? "Username" : "Email";
    if (!email || !password) {
      showToast(`${fieldName} and password are required.`, "error");
      setIsLoading(false);
      return;
    }

    try {
      // Use backend API for authentication
      const response = userType === "admin"
        ? await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: email, password }),
          })
        : await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

      const data = await response.json();

      if (data.success) {
        // Store session for UI state with proper format
        const sessionKey = userType === "admin" ? "admin_session" : "verifier_session";
        
        // Use the token from the backend response
        const sessionData = userType === "admin"
          ? {
              ...data.data.admin,
              token: data.data.token,
              userType: "admin"
            }
          : {
              ...data.data.verifier,
              token: data.data.token,
              userType: "verifier"
            };
        
        localStorage.setItem(sessionKey, JSON.stringify(sessionData));

        // Dispatch event to notify other components like Header
        window.dispatchEvent(new Event("local-storage-changed"));

        showToast("Login successful! Redirecting...", "success");
        setTimeout(() => {
          router.push(onLoginSuccess);
        }, 1500);
      } else {
        showToast(data.message || "Invalid credentials. Please check your username/email and password.", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      showToast("An unexpected error occurred. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">
              {userType === "admin" ? "Username" : "Email Address"}
            </span>
          </label>
          <div className="relative">
            <Icon name="Mail" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type={userType === "admin" ? "text" : "email"}
              placeholder={userType === "admin" ? "admin" : "your.email@company.com"}
              className="input input-bordered w-full pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Password</span>
          </label>
          <div className="relative">
            <Icon name="Lock" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="password"
              placeholder="••••••••"
              className="input input-bordered w-full pl-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
        </div>
        <div className="form-control mt-6">
          <button type="submit" className="btn w-full" style={{ backgroundColor: '#007A3D', borderColor: '#007A3D', color: 'white', fontFamily: "'Montserrat', sans-serif" }} disabled={isLoading}>
            {isLoading ? <span className="loading loading-spinner"></span> : "Login"}
          </button>
        </div>
      </form>
    </>
  );
};

export default LoginForm;
