"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import apiService, { handleError } from "@/lib/api.service.js";
import Icon from "@/components/Icon";

const RegistrationForm = ({ showToast }) => {
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const router = useRouter();

  // Personal email domains to block
  const PERSONAL_EMAIL_DOMAINS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'aol.com', 'icloud.com', 'mail.com', 'protonmail.com',
    'rediffmail.com', 'yandex.com'
  ];

  const validateCompanyEmail = (email) => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    if (PERSONAL_EMAIL_DOMAINS.includes(domain)) {
      setEmailError('Personal email domains are not allowed. Please use your company email address.');
      return false;
    }
    
    setEmailError('');
    return true;
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setEmail(email);
    if (email) {
      validateCompanyEmail(email);
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!companyName || !email || !password) {
      showToast("All fields are required.", "error");
      setIsLoading(false);
      return;
    }

    if (!validateCompanyEmail(email)) {
      showToast("Please use a valid company email address.", "error");
      setIsLoading(false);
      return;
    }

    try {
      // use default export's `auth` object
      const response = await apiService.auth.register(companyName, email, password);

      if (response?.success) {
        showToast("Registration successful! Redirecting to login...", "success");

        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        showToast(response?.message || "Registration failed", "error");
      }
    } catch (error) {
      handleError(error, showToast);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Company Name <span className="text-error">*</span></span>
        </label>
        <div className="relative">
          <Icon name="Building2" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Your Company Inc."
            className="input input-bordered w-full pl-10"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            disabled={isLoading}
            required
            minLength={2}
          />
        </div>
        <label className="label">
          <span className="label-text-alt text-base-content/60">
            Your company's official name
          </span>
        </label>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Company Email Address <span className="text-error">*</span></span>
        </label>
        <div className="relative">
          <Icon name="Mail" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="email"
            placeholder="verifier@yourcompany.com"
            className={`input input-bordered w-full pl-10 ${emailError ? 'input-error' : ''}`}
            value={email}
            onChange={handleEmailChange}
            onBlur={() => validateCompanyEmail(email)}
            disabled={isLoading}
            required
          />
        </div>
        {emailError && (
          <label className="label">
            <span className="label-text-alt text-error">{emailError}</span>
          </label>
        )}
        <label className="label">
          <span className="label-text-alt text-base-content/60">
            Only company email domains are allowed (no Gmail, Yahoo, etc.)
          </span>
        </label>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Password <span className="text-error">*</span></span>
        </label>
        <div className="relative">
          <Icon name="Lock" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="password"
            placeholder="Min. 6 characters"
            className="input input-bordered w-full pl-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            minLength={6}
          />
        </div>
        <label className="label">
          <span className="label-text-alt text-base-content/60">
            Minimum 6 characters long
          </span>
        </label>
      </div>

      <div className="form-control mt-6">
        <button type="submit" className="btn w-full" style={{ backgroundColor: '#007A3D', borderColor: '#007A3D', color: 'white', fontFamily: "'Montserrat', sans-serif" }} disabled={isLoading}>
          {isLoading ? <span className="loading loading-spinner" /> : "Create Account"}
        </button>
      </div>
    </form>
  );
};

export default RegistrationForm;
