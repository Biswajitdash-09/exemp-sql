"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import RegistrationForm from '@/components/auth/RegistrationForm';
import Toast from '@/components/ui/Toast';
import Icon from '@/components/Icon';

export default function HomePage() {
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const showToast = (message, type) => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  return (
    <>
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      <motion.div 
        className="flex flex-col lg:flex-row items-center justify-center gap-16 min-h-[calc(100vh-200px)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        
        {/* Hero Section */}
        <div className="text-center lg:text-left lg:w-1/2 xl:w-2/5">
          <h1 className="text-5xl font-bold leading-tight text-primary">
            Secure & Instant Employee Verification
          </h1>
          <p className="py-6 text-lg text-base-content/80">
            A fast, reliable, and automated platform for third-party verifiers to confirm employment history. Register your company to get started.
          </p>
          <div className="flex items-center justify-center lg:justify-start gap-4">
            <div className="flex items-center gap-2">
              <Icon name="ShieldCheck" className="w-6 h-6 text-success" />
              <span className="font-semibold">Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="Zap" className="w-6 h-6 text-warning" />
              <span className="font-semibold">Fast</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="Cog" className="w-6 h-6 text-info" />
              <span className="font-semibold">Automated</span>
            </div>
          </div>
        </div>

        {/* Registration Form Card */}
        <div className="card w-full max-w-md shadow-2xl bg-base-100 shrink-0">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4 text-center">Create a Verifier Account</h2>
            <RegistrationForm showToast={showToast} />
            <div className="divider my-4">OR</div>
            <p className="text-center text-sm">
              Already have an account?{' '}
              <Link href="/login" className="link link-primary font-semibold">
                Login Now
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </>
  );
}