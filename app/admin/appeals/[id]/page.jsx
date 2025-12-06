"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import AppealDetail from '@/components/admin/AppealDetail';
import Icon from '@/components/Icon';
import { use } from 'react';

export default function AppealDetailPage({ params }) {
  const { id } = use(params);

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
        <Link href="/admin/dashboard" className="btn btn-ghost mb-4">
          <Icon name="ArrowLeft" className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-4xl font-bold text-base-content tracking-tight flex items-center gap-3">
          <Icon name="FileText" className="w-9 h-9 text-primary" />
          Appeal Details
        </h1>
        <p className="mt-2 text-lg text-base-content/70">
          Review the details of the appeal and take action.
        </p>
      </div>

      <AppealDetail appealId={id} />
    </motion.div>
  );
}