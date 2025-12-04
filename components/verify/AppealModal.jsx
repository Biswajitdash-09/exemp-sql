"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import apiService, { appealAPI, handleError } from '@/lib/api.service.js';
import Icon from '@/components/Icon';

const AppealModal = ({ isOpen, onClose, showToast, verificationId, verifierId }) => {
  const [comments, setComments] = useState('');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [mismatchedFields, setMismatchedFields] = useState([]);

  useEffect(() => {
    if (isOpen && verificationId) {
      fetchVerificationData();
    }
  }, [isOpen, verificationId]);

  const fetchVerificationData = async () => {
    try {
      // Get verification details to show mismatched fields
      const response = await apiService.verification.getVerificationDetails(verificationId);
      if (response.success && response.data) {
        setVerificationData(response.data);
        const mismatches = response.data.comparisonResults?.filter(result => !result.isMatch) || [];
        setMismatchedFields(mismatches);
      }
    } catch (error) {
      console.error('Failed to fetch verification details:', error);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        showToast('File size must be less than 10MB', 'error');
        return;
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        showToast('Only PDF, JPEG, PNG, and Word documents are allowed', 'error');
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (document.getElementById('appeal_file_input')) {
      document.getElementById('appeal_file_input').value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!comments || comments.trim().length < 10) {
      showToast('Please provide detailed comments (at least 10 characters).', 'error');
      return;
    }

    if (mismatchedFields.length === 0) {
      showToast('No mismatched fields found to appeal.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const appealData = {
        verificationId: verificationId,
        comments: comments.trim(),
        mismatchedFields: mismatchedFields.map(field => ({
          fieldName: field.field,
          verifierValue: field.verifierValue,
          companyValue: field.companyValue
        }))
      };

      const response = await appealAPI.submitAppeal(appealData, file);

      if (response.success) {
        showToast('Appeal submitted successfully! HR team will review your case.', 'success');

        // Reset form and close modal
        setComments('');
        setFile(null);
        setVerificationData(null);
        setMismatchedFields([]);

        // Clear file input visually
        if (document.getElementById('appeal_file_input')) {
          document.getElementById('appeal_file_input').value = '';
        }
        onClose();
      } else {
        showToast(response.message || 'Failed to submit appeal', 'error');
      }
    } catch (error) {
      handleError(error, showToast);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <dialog className={`modal ${isOpen ? 'modal-open' : ''}`} open>
      <motion.div
        className="modal-box w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>

        <div className="mb-6">
          <h3 className="font-bold text-2xl mb-2 flex items-center gap-2">
            <Icon name="FileWarning" className="w-6 h-6 text-warning" />
            Submit an Appeal
          </h3>
          <p className="text-base-content/70">
            If you believe there is a discrepancy in the verification results, please provide comments and any supporting documents.
          </p>
        </div>

        {/* Mismatched Fields Section */}
        {mismatchedFields.length > 0 ? (
          <div className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-lg">
            <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Icon name="AlertTriangle" className="w-5 h-5 text-warning" />
              Mismatched Fields
            </h4>
            <div className="space-y-2">
              {mismatchedFields.map((field, index) => (
                <div key={index} className="bg-base-100 p-3 rounded border border-base-300">
                  <div className="font-medium text-base-content/80 capitalize">{field.field.replace(/([A-Z])/g, ' $1').trim()}</div>
                  <div className="text-sm text-base-content/60 mt-1">
                    <span className="font-medium">Your provided:</span> {field.verifierValue || 'Not provided'}
                  </div>
                  <div className="text-sm text-base-content/60">
                    <span className="font-medium">Company record:</span> {field.companyValue || 'Not available'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-6 p-6 bg-success/10 border border-success/30 rounded-lg text-center">
            <Icon name="CheckCircle2" className="w-16 h-16 text-success mx-auto mb-3" />
            <h4 className="font-semibold text-lg mb-2 text-success">Perfect Match!</h4>
            <p className="text-base-content/70">
              All verification fields matched company records. No mismatches found to appeal.
            </p>
            <p className="text-sm text-base-content/60 mt-2">
              You can only submit an appeal if there are discrepancies in the verification results.
            </p>
          </div>
        )}


        {mismatchedFields.length > 0 ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Appeal Comments <span className="text-error">*</span></span>
              </label>
              <textarea
                className="textarea textarea-bordered h-32"
                placeholder="Please explain the discrepancy in detail. Mention which fields you believe are incorrect and provide any additional context or evidence."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                disabled={isLoading}
                required
                minLength={10}
                maxLength={1000}
              />
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  Minimum 10 characters, maximum 1000 characters
                </span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Supporting Document (Recommended)</span>
              </label>
              <div className="border-2 border-dashed border-base-300 rounded-lg p-4">
                <input
                  id="appeal_file_input"
                  type="file"
                  className="file-input file-input-bordered w-full hidden"
                  onChange={handleFileChange}
                  disabled={isLoading}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />

                {!file ? (
                  <div className="text-center py-4">
                    <Icon name="UploadCloud" className="w-12 h-12 text-base-content/40 mx-auto mb-2" />
                    <p className="text-base-content/60 mb-2">Upload relieving letter or other supporting documents</p>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => document.getElementById('appeal_file_input').click()}
                      disabled={isLoading}
                    >
                      <Icon name="Plus" className="w-4 h-4" /> Choose File
                    </button>
                    <p className="text-xs text-base-content/50 mt-2">
                      PDF, JPEG, PNG, Word (Max 10MB)
                    </p>
                  </div>
                ) : (
                  <div className="bg-base-100 p-3 rounded">
                    <div className="flex items-center gap-3">
                      <Icon name="File" className="w-8 h-8 text-primary" />
                      <div>
                        <div className="font-medium">{file.name}</div>
                        <div className="text-sm text-base-content/60">
                          {(file.size / 1024).toFixed(2)} KB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={handleRemoveFile}
                      disabled={isLoading}
                    >
                      <Icon name="X" className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-action flex justify-between items-center pt-4 border-t">
              <button type="button" onClick={onClose} className="btn btn-ghost" disabled={isLoading}>
                Cancel
              </button>
              <div className="text-sm text-base-content/60">
                {mismatchedFields.length} field{mismatchedFields.length !== 1 ? 's' : ''} selected for appeal
              </div>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? <span className="loading loading-spinner"></span> : 'Submit Appeal'}
              </button>
            </div>
          </form>
        ) : (
          <div className="modal-action justify-center pt-4">
            <button type="button" onClick={onClose} className="btn btn-primary btn-wide">
              Close
            </button>
          </div>
        )}
      </motion.div>

      {/* Click outside to close */}
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

export default AppealModal;