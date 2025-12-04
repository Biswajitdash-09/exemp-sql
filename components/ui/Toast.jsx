"use client";

import React, { useEffect } from 'react';
import Icon from '@/components/Icon';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  const alertType = {
    success: 'alert-success',
    error: 'alert-error',
    warning: 'alert-warning',
    info: 'alert-info',
  };

  const iconType = {
    success: 'CheckCircle',
    error: 'XCircle',
    warning: 'AlertTriangle',
    info: 'Info',
  };

  return (
    <div className="toast toast-top toast-end z-50">
      <div className={`alert ${alertType[type] || 'alert-info'} shadow-lg flex items-center`}>
        <Icon name={iconType[type] || 'Info'} className="w-6 h-6" />
        <span>{message}</span>
        <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle">
          <Icon name="X" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;