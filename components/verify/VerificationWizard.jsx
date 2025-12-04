"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
// TEMPORARY: Use debug version for troubleshooting
import apiService from "@/lib/api.service.debug.js";
import { reportAPI, handleError } from "@/lib/api.service.js";
import Icon from "@/components/Icon";
import Toast from "@/components/ui/Toast";
import ComparisonRow from "@/components/verify/ComparisonRow";
import AppealModal from "@/components/verify/AppealModal";

const VerificationWizard = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    employeeId: '',
    name: '',
    entityName: '',
    dateOfJoining: '',
    dateOfLeaving: '',
    designation: '',
    exitReason: ''
  });
  const [consentGiven, setConsentGiven] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [verifier, setVerifier] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const sessionData = localStorage.getItem('verifier_session');
    console.log('VerificationWizard: Checking session data:', sessionData);

    if (sessionData) {
      try {
        const parsedSession = JSON.parse(sessionData);
        console.log('VerificationWizard: Parsed session:', parsedSession);

        if (!parsedSession.token) {
          console.error('VerificationWizard: No token in session');
          showToast('Your session is invalid (no token), please log in again.', 'error');
          router.push('/login');
          return;
        }

        setVerifier(parsedSession);
        setFormData(prev => ({ ...prev, companyName: parsedSession.companyName || '' }));
      } catch (e) {
        console.error("Failed to parse verifier session", e);
        showToast('Your session is invalid, please log in again.', 'error');
        router.push('/login');
      }
    } else {
      showToast('You must be logged in to perform a verification.', 'error');
      router.push('/login');
    }
  }, [router]);

  const showToast = (message, type) => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (step === 1 && !consentGiven) {
      showToast('Please provide consent to proceed.', 'error');
      return;
    }
    if (step === 2 && (!formData.employeeId || !formData.name)) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    if (step === 3 && (!formData.entityName || !formData.dateOfJoining || !formData.dateOfLeaving || !formData.designation || !formData.exitReason)) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleVerificationSubmit = async () => {
    setIsLoading(true);

    try {
      const verificationData = {
        employeeId: formData.employeeId.trim(),
        name: formData.name.trim(),
        entityName: formData.entityName,
        dateOfJoining: new Date(formData.dateOfJoining),
        dateOfLeaving: new Date(formData.dateOfLeaving),
        designation: formData.designation,
        exitReason: formData.exitReason,
        consentGiven: consentGiven
      };

      const response = await apiService.verification.submitRequest(verificationData);

      if (response.success) {
        setVerificationResult(response.data);
        setStep(4);
      } else {
        showToast(response.message || 'Verification failed', 'error');
      }
    } catch (error) {
      handleError(error, showToast);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    setStep(1);
    setConsentGiven(false);
    setFormData({
      companyName: verifier?.companyName || '',
      employeeId: '',
      name: '',
      entityName: '',
      dateOfJoining: '',
      dateOfLeaving: '',
      designation: '',
      exitReason: ''
    });
    setVerificationResult(null);
  };

  const handleDownloadReport = async () => {
    try {
      showToast('Generating PDF report...', 'info');

      // Use simple client-side PDF generation
      const { generateVerificationPDF } = await import('@/lib/services/simplePdfService');

      const result = generateVerificationPDF(
        {
          comparisonResults: verificationResult.comparisonResults,
          overallStatus: verificationResult.overallStatus,
          matchScore: verificationResult.matchScore
        },
        {
          employeeId: verificationResult.employeeData.employeeId,
          name: verificationResult.employeeData.name,
          entityName: verificationResult.employeeData.entityName,
          designation: verificationResult.employeeData.designation
        }
      );

      if (result.success) {
        showToast('Report downloaded successfully!', 'success');
      } else {
        showToast('Failed to generate PDF report', 'error');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      showToast(`Failed to generate PDF report: ${error.message}`, 'error');
    }
  };

  const handleSendEmail = async () => {
    try {
      // Prepare email content
      const subject = encodeURIComponent(
        `Employment Verification Report - ${verificationResult.employeeData.name} (${verificationResult.employeeData.employeeId})`
      );

      const matchedFields = verificationResult.comparisonResults.filter(r => r.isMatch).length;
      const totalFields = verificationResult.comparisonResults.length;
      const status = verificationResult.overallStatus === 'matched' ? '✓ VERIFIED' : '⚠ PARTIAL MATCH';

      const body = encodeURIComponent(
        `Hello,\n\n` +
        `I have completed the employment verification for:\n\n` +
        `Employee Name: ${verificationResult.employeeData.name}\n` +
        `Employee ID: ${verificationResult.employeeData.employeeId}\n` +
        `Designation: ${verificationResult.employeeData.designation}\n` +
        `Entity: ${verificationResult.employeeData.entityName}\n\n` +
        `VERIFICATION RESULT: ${status}\n` +
        `Match Score: ${verificationResult.matchScore}%\n` +
        `Fields Matched: ${matchedFields}/${totalFields}\n\n` +
        `Please find the detailed verification report attached (download from portal).\n\n` +
        `Best regards`
      );

      // Open email client with pre-filled content
      window.location.href = `mailto:?subject=${subject}&body=${body}`;

      showToast('Email client opened! Please add recipient and send.', 'success');
    } catch (error) {
      console.error('Email error:', error);
      showToast('Failed to open email client', 'error');
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            className="card bg-base-100 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="card-body items-center text-center">
              <Icon name="FileCheck2" className="w-16 h-16 text-primary mb-4" />
              <h2 className="card-title text-2xl">Step 1: Verifier Details & Consent</h2>
              <p className="my-4 text-base-content/70 max-w-md">
                Confirm your company details and provide consent for verification
              </p>

              <div className="w-full max-w-md space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Company Name</span>
                  </label>
                  <div className="input input-bordered bg-base-200">
                    {formData.companyName || 'Your Company'}
                  </div>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer p-4 border rounded-lg hover:bg-base-200">
                    <span className="label-text font-semibold">
                      I confirm that I have received consent from the candidate to verify their employment details
                    </span>
                    <input
                      type="checkbox"
                      checked={consentGiven}
                      onChange={(e) => setConsentGiven(e.target.checked)}
                      className="checkbox checkbox-primary"
                    />
                  </label>
                </div>
              </div>

              <div className="card-actions justify-end w-full mt-6">
                <button
                  className="btn w-full max-w-md"
                  style={{ backgroundColor: '#007A3D', borderColor: '#007A3D', color: 'white', fontFamily: "'Montserrat', sans-serif" }}
                  disabled={!consentGiven}
                  onClick={handleNext}
                >
                  Next <Icon name="ArrowRight" className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            className="card bg-base-100 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="card-body">
              <div className="text-center mb-6">
                <Icon name="User" className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="card-title text-2xl justify-center">Step 2: Employee Details</h2>
                <p className="text-base-content/70">Enter the employee details as per relieving letter</p>
              </div>

              <div className="space-y-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Employee ID</span></label>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleFormChange}
                    placeholder="e.g., 6002056"
                    className="input input-bordered"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Full Name</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g., S Sathish"
                    className="input input-bordered"
                    required
                  />
                </div>
              </div>

              <div className="card-actions justify-between mt-6">
                <button className="btn" style={{ backgroundColor: '#E6F3EF', color: '#007A3D', fontFamily: "'Montserrat', sans-serif" }} onClick={handleBack}>
                  <Icon name="ArrowLeft" className="w-4 h-4" /> Back
                </button>
                <button className="btn" style={{ backgroundColor: '#007A3D', borderColor: '#007A3D', color: 'white', fontFamily: "'Montserrat', sans-serif" }} onClick={handleNext}>
                  Next <Icon name="ArrowRight" className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            className="card bg-base-100 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="card-body">
              <div className="text-center mb-6">
                <Icon name="Briefcase" className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="card-title text-2xl justify-center">Step 3: Employment Details</h2>
                <p className="text-base-content/70">Enter the employment details as per relieving letter</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Entity Name</span></label>
                  <select name="entityName" value={formData.entityName} onChange={handleFormChange} className="select select-bordered" required>
                    <option value="">Select Entity</option>
                    <option value="TVSCSHIB">TVSCSHIB</option>
                    <option value="HIB">HIB</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Designation</span></label>
                  <select name="designation" value={formData.designation} onChange={handleFormChange} className="select select-bordered" required>
                    <option value="">Select Designation</option>
                    <option value="Executive">Executive</option>
                    <option value="Assistant Manager">Assistant Manager</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Date of Joining</span></label>
                  <input
                    type="date"
                    name="dateOfJoining"
                    value={formData.dateOfJoining}
                    onChange={handleFormChange}
                    className="input input-bordered"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Date of Leaving</span></label>
                  <input
                    type="date"
                    name="dateOfLeaving"
                    value={formData.dateOfLeaving}
                    onChange={handleFormChange}
                    className="input input-bordered"
                    required
                  />
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label"><span className="label-text font-semibold">Exit Reason</span></label>
                  <select name="exitReason" value={formData.exitReason} onChange={handleFormChange} className="select select-bordered" required>
                    <option value="">Select Exit Reason</option>
                    <option value="Resigned">Resigned</option>
                    <option value="Terminated">Terminated</option>
                    <option value="Retired">Retired</option>
                    <option value="Absconding">Absconding</option>
                    <option value="Contract Completed">Contract Completed</option>
                  </select>
                </div>
              </div>

              <div className="card-actions justify-between mt-6">
                <button className="btn" style={{ backgroundColor: '#E6F3EF', color: '#007A3D', fontFamily: "'Montserrat', sans-serif" }} onClick={handleBack}>
                  <Icon name="ArrowLeft" className="w-4 h-4" /> Back
                </button>
                <button className="btn" style={{ backgroundColor: '#007A3D', borderColor: '#007A3D', color: 'white', fontFamily: "'Montserrat', sans-serif" }} onClick={handleVerificationSubmit} disabled={isLoading}>
                  {isLoading ? <span className="loading loading-spinner"></span> : 'Verify Details'}
                </button>
              </div>
            </div>
          </motion.div>
        );

      case 4:
        if (!verificationResult) return <div className="text-center p-10"><span className="loading loading-lg loading-spinner text-primary"></span></div>;
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="text-center mb-6">
                  <Icon name="ShieldCheck" className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h2 className="card-title text-2xl justify-center">Verification Results</h2>
                  <p className="text-base-content/70">Comparison for Employee ID: <strong>{verificationResult.employeeData.employeeId}</strong></p>
                </div>

                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Entered by Verifier</th>
                        <th>Official Record</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verificationResult.comparisonResults.map((row, index) => (
                        <ComparisonRow key={index} {...row} />
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 p-4 bg-base-200 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">F&F Status</h3>
                  <div className="badge badge-lg">
                    {verificationResult.employeeData.fnfStatus === 'Completed' ? (
                      <span className="text-success-content bg-success">Completed</span>
                    ) : (
                      <span className="text-warning-content bg-warning">Pending</span>
                    )}
                  </div>
                </div>

                <div className="card-actions flex-wrap justify-center gap-4 mt-8">
                  <button className="btn" style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b', color: 'white', fontFamily: "'Montserrat', sans-serif" }} onClick={() => setIsAppealModalOpen(true)}>
                    <Icon name="FileWarning" className="w-4 h-4" /> Raise Appeal
                  </button>
                  <button className="btn" style={{ backgroundColor: '#004F9E', borderColor: '#004F9E', color: 'white', fontFamily: "'Montserrat', sans-serif" }} onClick={handleDownloadReport}>
                    <Icon name="Download" className="w-4 h-4" /> Download Report
                  </button>
                  <button className="btn" style={{ backgroundColor: '#6366f1', borderColor: '#6366f1', color: 'white', fontFamily: "'Montserrat', sans-serif" }} onClick={handleSendEmail}>
                    <Icon name="Mail" className="w-4 h-4" /> Send Email
                  </button>
                  <button className="btn" style={{ backgroundColor: '#E6F3EF', color: '#007A3D', fontFamily: "'Montserrat', sans-serif" }} onClick={handleStartOver}>
                    <Icon name="RotateCw" className="w-4 h-4" /> Start New Verification
                  </button>
                  <button className="btn" style={{ backgroundColor: '#007A3D', borderColor: '#007A3D', color: 'white', fontFamily: "'Montserrat', sans-serif" }} onClick={() => router.push(`/verify/success?employeeId=${verificationResult.employeeData.employeeId}`)}>
                    <Icon name="Check" className="w-4 h-4" /> Finish Verification
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      <ul className="steps w-full mb-12">
        <li className={`step ${step >= 1 ? 'text-[#007A3D]' : 'text-gray-400'} `} style={{ color: step >= 1 ? '#007A3D' : '#d1d5db' }}>Company & Consent</li>
        <li className={`step ${step >= 2 ? 'text-[#007A3D]' : 'text-gray-400'} `} style={{ color: step >= 2 ? '#007A3D' : '#d1d5db' }}>Employee Details</li>
        <li className={`step ${step >= 3 ? 'text-[#007A3D]' : 'text-gray-400'} `} style={{ color: step >= 3 ? '#007A3D' : '#d1d5db' }}>Employment Details</li>
        <li className={`step ${step >= 4 ? 'text-[#007A3D]' : 'text-gray-400'} `} style={{ color: step >= 4 ? '#007A3D' : '#d1d5db' }}>Results</li>
      </ul>

      {renderStepContent()}

      <AppealModal
        isOpen={isAppealModalOpen}
        onClose={() => setIsAppealModalOpen(false)}
        showToast={showToast}
        verificationId={verificationResult?.verificationId}
        verifierId={verifier?.id}
      />
    </div>
  );
};

export default VerificationWizard;