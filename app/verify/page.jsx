"use client";

import { motion } from 'framer-motion';
import VerificationWizard from "@/components/verify/VerificationWizard";

export default function VerifyPage() {
  return (
    <motion.div 
      className="w-full max-w-5xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-base-content tracking-tight">
          Employee Verification Wizard
        </h1>
        <p className="mt-3 text-lg text-base-content/80 max-w-3xl mx-auto">
          Follow the steps below to securely verify employment details. Your session is protected.
        </p>
      </div>
      <VerificationWizard />
    </motion.div>
  );
}