"use client";

import { useState, useEffect } from 'react';
import { appealAPI, handleError } from '@/lib/api.service';
import Icon from '@/components/Icon';
import Toast from '@/components/ui/Toast';

export default function AppealDetail({ appealId }) {
  const [appeal, setAppeal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [hrResponseText, setHrResponseText] = useState('');
  const [selectedAction, setSelectedAction] = useState('approved');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    const fetchAppeal = async () => {
      setIsLoading(true);
      try {
        const response = await appealAPI.getAppeal(appealId);
        if (response.success) {
          setAppeal(response.data.appeal);
        } else {
          showToast(response.message || 'Failed to load appeal data', 'error');
        }
      } catch (error) {
        handleError(error, showToast);
      } finally {
        setIsLoading(false);
      }
    };

    if (appealId) {
      fetchAppeal();
    }
  }, [appealId]);

  const showToast = (message, type) => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  const handleUpdateStatus = async (newStatus, hrResponse) => {
    setIsUpdating(true);
    try {
      const response = await appealAPI.respondToAppeal(appealId, newStatus, hrResponse);

      if (response.success) {
        setAppeal(prev => ({ ...prev, status: newStatus, hrResponse }));
        showToast(`Appeal has been ${newStatus}.`, 'success');
      } else {
        showToast(response.message || 'Failed to update appeal', 'error');
      }
    } catch (error) {
      handleError(error, showToast);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
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
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body items-center text-center p-10">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-lg font-semibold">Loading Appeal Details...</p>
        </div>
      </div>
    );
  }

  if (!appeal) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body items-center text-center p-10">
          <Icon name="FileX2" className="w-16 h-16 text-error mb-4" />
          <h2 className="card-title text-2xl">Appeal Not Found</h2>
          <p className="text-base-content/70">The requested appeal could not be found. It may have been deleted or the ID is incorrect.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      <div className="card bg-base-100 shadow-xl transition-shadow duration-300 hover:shadow-primary/10">
        <div className="card-body p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="card-title text-2xl">Appeal ID</h2>
              <p className="font-mono text-sm text-base-content/70 mt-1">{appeal.appealId}</p>
            </div>
            <span className={`badge ${getStatusBadge(appeal.status)} badge-lg capitalize`}>
              {appeal.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg">
              <Icon name="User" className="w-6 h-6 text-primary" />
              <div>
                <p className="font-semibold">Employee ID</p>
                <p className="text-base-content/80">{appeal.employeeId}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg">
              <Icon name="Calendar" className="w-6 h-6 text-primary" />
              <div>
                <p className="font-semibold">Date Submitted</p>
                <p className="text-base-content/80">{new Date(appeal.createdAt).toLocaleDateString('en-GB')}, {new Date(appeal.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
            <div className="col-span-1 md:col-span-2 flex items-center gap-3 p-3 bg-base-200/50 rounded-lg">
              <Icon name="Shield" className="w-6 h-6 text-primary" />
              <div>
                <p className="font-semibold">Verifier Info</p>
                <p className="text-base-content/80 font-mono text-xs">
                  {appeal.verifierInfo?.companyName || 'Unknown'} ({appeal.verifierInfo?.email || 'N/A'})
                </p>
              </div>
            </div>
          </div>

          <div className="divider"></div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
              <Icon name="MessageSquare" className="w-5 h-5" />
              Verifier's Comments
            </h3>
            <p className="bg-base-200 p-4 rounded-lg whitespace-pre-wrap text-base-content/90">{appeal.comments || appeal.appealReason || 'No comments provided'}</p>
          </div>

          {/* Show HR Response for closed appeals */}
          {appeal.status !== 'pending' && appeal.hrResponse && (
            <>
              <div className="divider"></div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                  <Icon name="MessageCircle" className="w-5 h-5 text-primary" />
                  HR Comments
                </h3>
                <div className={`p-4 rounded-lg ${appeal.status === 'approved' ? 'bg-success/10 border border-success/30' : 'bg-error/10 border border-error/30'}`}>
                  <p className="whitespace-pre-wrap text-base-content/90">{appeal.hrResponse}</p>
                  {appeal.reviewedAt && (
                    <p className="text-xs text-base-content/60 mt-2">
                      Reviewed on: {new Date(appeal.reviewedAt).toLocaleDateString('en-GB')}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Supporting Documents Section */}
          {(appeal.documents && appeal.documents.length > 0) && (
            <>
              <div className="divider"></div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                  <Icon name="Paperclip" className="w-5 h-5" />
                  Supporting Documents ({appeal.documents.length})
                </h3>
                <div className="space-y-3">
                  {appeal.documents.map((docUrl, index) => {
                    const fileName = docUrl.split('/').pop() || `Document ${index + 1}`;
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(docUrl);
                    const isPdf = /\.pdf$/i.test(docUrl);

                    return (
                      <div key={index} className="bg-base-200 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon
                              name={isPdf ? "FileText" : isImage ? "Image" : "File"}
                              className="w-6 h-6 text-primary"
                            />
                            <div>
                              <p className="font-semibold text-sm truncate max-w-xs">{fileName}</p>
                              <p className="text-xs text-base-content/60">
                                {isPdf ? 'PDF Document' : isImage ? 'Image' : 'Document'}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-ghost"
                            >
                              <Icon name="ExternalLink" className="w-4 h-4" />
                              View
                            </a>
                            <a
                              href={docUrl}
                              download={fileName}
                              className="btn btn-sm btn-primary"
                            >
                              <Icon name="Download" className="w-4 h-4" />
                              Download
                            </a>
                          </div>
                        </div>
                        {/* Preview for images */}
                        {isImage && (
                          <div className="mt-3 border border-base-300 rounded-lg overflow-hidden">
                            <img
                              src={docUrl}
                              alt={fileName}
                              className="max-h-48 w-auto mx-auto"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Legacy file support */}
          {appeal.file && !appeal.documents?.length && (
            <>
              <div className="divider"></div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                  <Icon name="Paperclip" className="w-5 h-5" />
                  Attached Document
                </h3>
                <div className="bg-base-200 p-4 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon name="File" className="w-6 h-6 text-primary" />
                    <div>
                      <p className="font-semibold">{appeal.file.name}</p>
                      <p className="text-sm text-base-content/70">
                        {appeal.file.type} - {(appeal.file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button className="btn btn-sm btn-ghost" disabled>
                    <Icon name="Download" className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            </>
          )}

          {appeal.status === 'pending' && (
            <>
              <div className="divider"></div>

              {!showResponseForm ? (
                <div className="card-actions justify-end mt-4">
                  <button
                    className="btn btn-error"
                    onClick={() => {
                      setSelectedAction('rejected');
                      setShowResponseForm(true);
                    }}
                    disabled={isUpdating}
                  >
                    <Icon name="XCircle" className="w-5 h-5" />
                    Reject
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() => {
                      setSelectedAction('approved');
                      setShowResponseForm(true);
                    }}
                    disabled={isUpdating}
                  >
                    <Icon name="CheckCircle" className="w-5 h-5" />
                    Approve
                  </button>
                </div>
              ) : (
                <div className="bg-base-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    HR Comments - {selectedAction === 'approved' ? 'Approve Appeal' : 'Reject Appeal'}
                  </h3>

                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text font-semibold">HR Comments <span className="text-error">*</span></span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered h-24"
                      placeholder="Enter your comments for the verifier explaining your decision..."
                      value={hrResponseText}
                      onChange={(e) => setHrResponseText(e.target.value)}
                      required
                    ></textarea>
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">
                        This comment will be sent to the verifier via email
                      </span>
                    </label>
                  </div>

                  <div className="card-actions justify-end gap-2">
                    <button
                      className="btn btn-ghost"
                      onClick={() => {
                        setShowResponseForm(false);
                        setHrResponseText('');
                      }}
                      disabled={isUpdating}
                    >
                      Cancel
                    </button>
                    <button
                      className={`btn ${selectedAction === 'approved' ? 'btn-success' : 'btn-error'}`}
                      onClick={() => handleUpdateStatus(selectedAction, hrResponseText)}
                      disabled={isUpdating || !hrResponseText.trim()}
                    >
                      {isUpdating ? <span className="loading loading-spinner"></span> : (
                        <>
                          {selectedAction === 'approved' ? <Icon name="CheckCircle" className="w-4 h-4" /> : <Icon name="XCircle" className="w-4 h-4" />}
                          {selectedAction === 'approved' ? 'Approve' : 'Reject'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}