"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import Toast from "@/components/ui/Toast";

const OtpLoginForm = ({ onLoginSuccess }) => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [toast, setToast] = useState({ message: "", type: "", show: false });
    const router = useRouter();

    // Cooldown timer
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const showToast = (message, type) => {
        setToast({ message, type, show: true });
    };

    const closeToast = () => {
        setToast({ ...toast, show: false });
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();

        if (!email) {
            showToast("Email is required.", "error");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                showToast(data.message || "OTP sent to your email!", "success");
                setStep(2);
                setCooldown(60); // 60 seconds cooldown
            } else {
                showToast(data.message || "Failed to send OTP", "error");
                if (data.cooldownSeconds) {
                    setCooldown(data.cooldownSeconds);
                }
            }
        } catch (error) {
            console.error("Send OTP error:", error);
            showToast("An unexpected error occurred. Please try again.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();

        if (!otp || otp.length !== 6) {
            showToast("Please enter a valid 6-digit OTP.", "error");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, otp }),
            });

            const data = await response.json();

            if (data.success) {
                // Store session
                const sessionData = {
                    ...data.data.verifier,
                    token: data.data.token,
                    userType: "verifier"
                };

                localStorage.setItem("verifier_session", JSON.stringify(sessionData));
                window.dispatchEvent(new Event("local-storage-changed"));

                showToast("Login successful! Redirecting...", "success");
                setTimeout(() => {
                    router.push(onLoginSuccess);
                }, 1500);
            } else {
                showToast(data.message || "Invalid OTP. Please try again.", "error");
            }
        } catch (error) {
            console.error("Verify OTP error:", error);
            showToast("An unexpected error occurred. Please try again.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (cooldown > 0) return;

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                showToast("New OTP sent to your email!", "success");
                setCooldown(60);
                setOtp(""); // Clear previous OTP
            } else {
                showToast(data.message || "Failed to resend OTP", "error");
                if (data.cooldownSeconds) {
                    setCooldown(data.cooldownSeconds);
                }
            }
        } catch (error) {
            console.error("Resend OTP error:", error);
            showToast("Failed to resend OTP. Please try again.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        setStep(1);
        setOtp("");
    };

    return (
        <>
            {toast.show && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

            {step === 1 ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-semibold">Email Address</span>
                        </label>
                        <div className="relative">
                            <Icon name="Mail" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                            <input
                                type="email"
                                placeholder="your.email@company.com"
                                className="input input-bordered w-full pl-10"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <label className="label">
                            <span className="label-text-alt text-base-content/60">
                                We'll send a 6-digit OTP to your email
                            </span>
                        </label>
                    </div>

                    <div className="form-control mt-6">
                        <button
                            type="submit"
                            className="btn w-full"
                            style={{ backgroundColor: '#007A3D', borderColor: '#007A3D', color: 'white', fontFamily: "'Montserrat', sans-serif" }}
                            disabled={isLoading || cooldown > 0}
                        >
                            {isLoading ? (
                                <span className="loading loading-spinner"></span>
                            ) : cooldown > 0 ? (
                                `Wait ${cooldown}s`
                            ) : (
                                <>
                                    <Icon name="Send" className="w-4 h-4" />
                                    Send OTP
                                </>
                            )}
                        </button>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="text-center mb-4">
                        <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full">
                            <Icon name="CheckCircle" className="w-4 h-4" />
                            <span className="text-sm font-medium">OTP sent to {email}</span>
                        </div>
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-semibold">Enter OTP</span>
                        </label>
                        <div className="relative">
                            <Icon name="KeyRound" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                            <input
                                type="text"
                                placeholder="Enter 6-digit OTP"
                                className="input input-bordered w-full pl-10 text-center text-2xl tracking-[0.5em] font-mono"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                disabled={isLoading}
                                maxLength={6}
                                required
                            />
                        </div>
                        <label className="label">
                            <span className="label-text-alt text-base-content/60">
                                OTP expires in 5 minutes
                            </span>
                        </label>
                    </div>

                    <div className="form-control mt-6">
                        <button
                            type="submit"
                            className="btn w-full"
                            style={{ backgroundColor: '#007A3D', borderColor: '#007A3D', color: 'white', fontFamily: "'Montserrat', sans-serif" }}
                            disabled={isLoading || otp.length !== 6}
                        >
                            {isLoading ? <span className="loading loading-spinner"></span> : "Verify & Login"}
                        </button>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={handleBack}
                            disabled={isLoading}
                        >
                            <Icon name="ArrowLeft" className="w-4 h-4" />
                            Change Email
                        </button>

                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={handleResendOtp}
                            disabled={isLoading || cooldown > 0}
                        >
                            {cooldown > 0 ? `Resend in ${cooldown}s` : (
                                <>
                                    <Icon name="RefreshCw" className="w-4 h-4" />
                                    Resend OTP
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </>
    );
};

export default OtpLoginForm;
