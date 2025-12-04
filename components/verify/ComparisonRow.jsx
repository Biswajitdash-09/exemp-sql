"use client";

import React from 'react';
import Icon from '@/components/Icon';

const ComparisonRow = ({ field, label, verifierValue, companyValue, isMatch, color, matchType }) => {
  const getStatusBadge = () => {
    if (matchType === 'not_provided') {
      return (
        <div className="badge badge-warning gap-2 text-warning-content py-3 px-4">
          <Icon name="AlertCircle" className="w-4 h-4" />
          <span>Not Provided</span>
        </div>
      );
    }

    if (isMatch) {
      return (
        <div className="badge badge-success gap-2 text-success-content py-3 px-4">
          <Icon name="CheckCircle2" className="w-4 h-4" />
          <span>Match</span>
        </div>
      );
    } else {
      return (
        <div className="badge badge-error gap-2 text-error-content py-3 px-4">
          <Icon name="XCircle" className="w-4 h-4" />
          <span>Mismatch</span>
        </div>
      );
    }
  };

  const getRowClass = () => {
    if (matchType === 'not_provided') return 'bg-yellow-50 border-l-4 border-yellow-400';
    if (isMatch) return 'bg-green-50 border-l-4 border-green-400';
    return 'bg-red-50 border-l-4 border-red-400';
  };

  return (
    <tr className={`hover:bg-opacity-80 transition-colors duration-200 ${getRowClass()}`}>
      <td className="font-semibold text-base-content/80 py-4">{label}</td>
      <td className="py-4">{verifierValue}</td>
      <td className="py-4">{companyValue}</td>
      <td className="py-4">
        {getStatusBadge()}
      </td>
    </tr>
  );
};

export default ComparisonRow;