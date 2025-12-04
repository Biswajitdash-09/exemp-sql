"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import LoginForm from '@/components/auth/LoginForm';
import Icon from '@/components/Icon';

export default function VerifierLoginPage() {
  return (
    <motion.div 
      className="flex items-center justify-center min-h-[calc(100vh-250px)] bg-base-200 py-12 px-4 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-md space-y-8">
        <div className="card bg-base-100 shadow-2xl transition-shadow duration-300 hover:shadow-primary/20">
          <div className="card-body p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="inline-block bg-primary/10 p-4 rounded-full">
                <Icon name="LogIn" className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mt-4 text-base-content">
                Verifier Login
              </h1>
              <p className="text-base-content/70 mt-2">
                Access your company's verification dashboard.
              </p>
            </div>
            
            <LoginForm userType="verifier" onLoginSuccess="/verify" />
            
            <div className="divider my-6 text-sm">New Here?</div>
            
            <p className="text-center text-sm">
              Don't have an account?{' '}
              <Link href="/" className="link link-primary font-semibold hover:underline">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}