"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { appealAPI, handleError } from '@/lib/api.service';
import Icon from '@/components/Icon';
import Toast from '@/components/ui/Toast';

export default function AppealList() {
  const [appeals, setAppeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type) => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  useEffect(() => {
    const fetchAppeals = async () => {
      setIsLoading(true);
      try {
        const response = await appealAPI.getAppeals();
        if (response.success) {
          setAppeals(response.data.appeals || []);
        } else {
          showToast(response.message || 'Failed to fetch appeals', 'error');
        }
      } catch (error) {
        handleError(error, showToast);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppeals();
  }, []);

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'badge-warning';
      case 'approved':
        return 'badge-success';
      case 'rejected':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-10">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <>
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      
      {isLoading ? (
        <div className="flex justify-center items-center p-10">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : appeals.length === 0 ? (
        <div className="text-center py-16 px-6 bg-base-200 rounded-lg">
          <Icon name="Inbox" className="w-16 h-16 mx-auto text-base-content/30" />
          <h3 className="mt-4 text-xl font-semibold text-base-content">No Appeals Found</h3>
          <p className="mt-2 text-base-content/60">There are currently no pending or resolved appeals.</p>
        </div>
      ) : (
        <div className="bg-base-100 rounded-lg shadow-md">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr className="bg-base-200">
                  <th className="p-4">Appeal ID</th>
                  <th>Employee ID</th>
                  <th>Verifying Company</th>
                  <th>Date Submitted</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {appeals.map((appeal) => (
                  <tr key={appeal.appealId || appeal.id} className="hover">
                    <td className="p-4 font-mono text-xs">
                      {(appeal.appealId || appeal.id).substring(0, 8)}...
                    </td>
                    <td>{appeal.employeeId}</td>
                    <td className="text-sm">
                      {appeal.verifierInfo ? appeal.verifierInfo.companyName : 'N/A'}
                    </td>
                    <td>{new Date(appeal.createdAt || appeal.submittedAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(appeal.status)} capitalize`}>
                        {appeal.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <Link href={`/admin/appeals/${appeal.appealId || appeal.id}`} className="btn btn-sm btn-outline btn-primary">
                        View
                        <Icon name="ArrowRight" className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}