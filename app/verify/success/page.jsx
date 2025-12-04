"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { motion } from 'framer-motion';

function VerificationSuccessContent() {
  const searchParams = useSearchParams();
  const employeeId = searchParams.get('employeeId');

  return (
    <motion.div 
      className="flex items-center justify-center min-h-[calc(100vh-250px)] bg-base-200 py-12 px-4 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-2xl">
        <div className="card bg-base-100 shadow-2xl transform transition-all hover:shadow-primary/20 duration-300">
          <div className="card-body items-center text-center p-10 md:p-16">
            <div className="p-4 bg-success/10 rounded-full mb-6">
              <Icon name="CheckCircle2" className="w-16 h-16 md:w-20 md:h-20 text-success" />
            </div>
            <h1 className="card-title text-3xl md:text-4xl font-bold text-base-content">
              Verification Complete
            </h1>
            <p className="text-lg text-base-content/80 mt-3 max-w-md">
              {employeeId 
                ? `The verification process for Employee ID: ${employeeId} has been successfully completed.`
                : 'The verification process has been successfully completed.'
              }
            </p>
            <div className="card-actions justify-center mt-8">
              <Link href="/verify" className="btn btn-primary btn-wide text-lg">
                <Icon name="RotateCw" className="w-5 h-5" />
                New Verification
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function VerificationSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[calc(100vh-250px)]">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center p-10">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="mt-4 text-lg font-semibold text-base-content">
              Loading success page...
            </p>
          </div>
        </div>
      </div>
    }>
      <VerificationSuccessContent />
    </Suspense>
  );
}