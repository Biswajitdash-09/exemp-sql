"use client";

import React, { useState, useEffect } from "react";
import Icon from "@/components/Icon";

/**
 * AccessLogList Component
 * Displays system access logs with filtering and pagination
 */
const AccessLogList = () => {
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState({ status: 'ALL', role: 'ALL' });
    const [error, setError] = useState(null);

    const fetchLogs = async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const sessionData = localStorage.getItem('admin_session');
            const session = sessionData ? JSON.parse(sessionData) : null;

            if (!session?.token) {
                setError('Session expired. Please login again.');
                return;
            }

            const queryParams = new URLSearchParams({
                page,
                limit: pagination.limit,
                ...(filter.status !== 'ALL' && { status: filter.status }),
                ...(filter.role !== 'ALL' && { role: filter.role })
            });

            const response = await fetch(`/api/admin/logs?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${session.token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setLogs(data.data.logs);
                setPagination(data.data.pagination);
            } else {
                setError(data.message || 'Failed to fetch logs');
            }
        } catch (err) {
            console.error('Error fetching logs:', err);
            setError('An error occurred while fetching logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(1);
    }, [filter]); // Re-fetch when filters change

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            fetchLogs(newPage);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilter(prev => ({ ...prev, [key]: value }));
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const formatIP = (ip) => {
        if (!ip) return '-';
        if (ip === '::1') return 'Localhost';
        if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
        return ip;
    };

    const formatUserAgent = (ua) => {
        if (!ua) return '-';

        // Simple OS detection
        let os = 'Unknown OS';
        if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Mac')) os = 'MacOS';
        else if (ua.includes('Linux')) os = 'Linux';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

        // Simple Browser detection
        // Order matters: Edge/Chrome often contain "Safari", Chrome contains "Safari", etc.
        let browser = 'Unknown Browser';
        if (ua.includes('Edg/')) browser = 'Edge';
        else if (ua.includes('Chrome/')) browser = 'Chrome';
        else if (ua.includes('Firefox/')) browser = 'Firefox';
        else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';

        return `${browser} on ${os}`;
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center justify-between bg-base-100 p-4 rounded-lg shadow-sm">
                <div className="flex gap-4">
                    <select
                        className="select select-bordered select-sm"
                        value={filter.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                        <option value="ALL">All Status</option>
                        <option value="SUCCESS">Success</option>
                        <option value="FAILURE">Failure</option>
                    </select>

                    <select
                        className="select select-bordered select-sm"
                        value={filter.role}
                        onChange={(e) => handleFilterChange('role', e.target.value)}
                    >
                        <option value="ALL">All Roles</option>
                        <option value="verifier">Verifier</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                <button
                    onClick={() => fetchLogs(pagination.page)}
                    className="btn btn-sm btn-ghost"
                    disabled={loading}
                >
                    <Icon name="RefreshCw" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="alert alert-error">
                    <Icon name="AlertTriangle" className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Logs Table */}
            <div className="overflow-x-auto bg-base-100 rounded-lg shadow">
                <table className="table w-full">
                    <thead className="bg-base-200">
                        <tr>
                            <th>Timestamp</th>
                            <th>User (Email)</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>IP Address</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="text-center py-8">
                                    <span className="loading loading-spinner loading-md"></span>
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center py-8 text-base-content/60">
                                    No logs found matching your criteria
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover">
                                    <td className="text-xs font-mono whitespace-nowrap">
                                        {formatDate(log.timestamp)}
                                    </td>
                                    <td>
                                        <div className="font-medium">{log.email}</div>
                                    </td>
                                    <td>
                                        <span className={`badge badge-sm ${log.role === 'admin' ? 'badge-primary' : 'badge-ghost'}`}>
                                            {log.role}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge badge-sm ${log.status === 'SUCCESS' ? 'badge-success text-white' : 'badge-error text-white'}`}>
                                            {log.status === 'SUCCESS' ? <Icon name="Check" className="w-3 h-3 mr-1" /> : <Icon name="X" className="w-3 h-3 mr-1" />}
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="font-mono text-xs text-base-content/70">
                                        {formatIP(log.ipAddress)}
                                    </td>
                                    <td className="max-w-xs truncate text-xs">
                                        {log.status === 'FAILURE' ? (
                                            <span className="text-error">{log.failureReason}</span>
                                        ) : (
                                            <span className="text-base-content/50 truncate" title={log.userAgent}>
                                                {formatUserAgent(log.userAgent)}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-4">
                <div className="join">
                    <button
                        className="join-item btn btn-sm"
                        disabled={pagination.page <= 1 || loading}
                        onClick={() => handlePageChange(pagination.page - 1)}
                    >
                        «
                    </button>
                    <button className="join-item btn btn-sm no-animation bg-base-100">
                        Page {pagination.page} of {pagination.pages || 1}
                    </button>
                    <button
                        className="join-item btn btn-sm"
                        disabled={pagination.page >= pagination.pages || loading}
                        onClick={() => handlePageChange(pagination.page + 1)}
                    >
                        »
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccessLogList;
