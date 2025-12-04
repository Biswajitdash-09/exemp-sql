"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { findVerifierById, clearVerifierNotifications } from '@/lib/data.service';
import Icon from '@/components/Icon';

const Header = () => {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = () => {
      const verifierSession = localStorage.getItem('verifier_session');
      const adminSession = localStorage.getItem('admin_session');

      if (adminSession) {
        try {
          setUser({ type: 'admin', ...JSON.parse(adminSession) });
        } catch (e) {
          console.error("Failed to parse admin session", e);
          localStorage.removeItem('admin_session');
          setUser(null);
        }
      } else if (verifierSession) {
        try {
          const sessionData = JSON.parse(verifierSession);
          
          // Check if this is a test mode session or any valid session
          if (sessionData.testMode || sessionData.email === 'testverifier@company.test' || sessionData.email === 'adityamathan@codemateai.dev') {
            console.log('🧪 Test mode or known verifier session detected, using session data directly');
            setUser({ type: 'verifier', ...sessionData });
          } else {
            // For production, try to find verifier in database
            const fullVerifierData = findVerifierById(sessionData.id);
            if (fullVerifierData) {
              setUser({ type: 'verifier', ...fullVerifierData });
            } else {
              console.warn(`Verifier with ID ${sessionData.id} found in session but not in database. Using session data as fallback.`);
              // Instead of clearing session, use the session data as fallback
              setUser({ type: 'verifier', ...sessionData });
            }
          }
        } catch (e) {
          console.error("Failed to parse verifier session", e);
          localStorage.removeItem('verifier_session');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    checkUser();

    const handleStorageChange = () => {
      checkUser();
    };

    window.addEventListener('local-storage-changed', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('local-storage-changed', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    if (user?.type === 'admin') {
      localStorage.removeItem('admin_session');
    } else {
      localStorage.removeItem('verifier_session');
    }
    
    window.dispatchEvent(new Event('local-storage-changed'));
    
    setUser(null);
    router.push('/');
  };

  const handleClearNotifications = () => {
    if (!user || user.type !== 'verifier') return;

    clearVerifierNotifications(user.id);
    
    setUser(prevUser => ({
      ...prevUser,
      notifications: [],
    }));

    window.dispatchEvent(new Event('local-storage-changed'));
  };

  return (
    <header className="shadow-md sticky top-0 z-50" style={{ backgroundColor: '#007A3D', borderBottomColor: '#016B34' }}>
      <div className="navbar container mx-auto px-4">
        <div className="navbar-start">
          <Link href="/" className="btn btn-ghost normal-case text-xl font-bold text-white hover:bg-white/10" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Employee Verification
          </Link>
        </div>
        <div className="navbar-end">
          <div className="hidden md:flex items-center">
            <ul className="menu menu-horizontal px-1 items-center">
              {user ? (
                <>
                  {user.type === 'admin' ? (
                    <li><Link href="/admin/dashboard" className="btn btn-ghost text-white hover:bg-white/10">Dashboard</Link></li>
                  ) : (
                    <li><Link href="/verify" className="btn btn-ghost text-white hover:bg-white/10">Verify Employee</Link></li>
                  )}
                </>
              ) : (
                <>
                  <li><Link href="/login" className="btn btn-ghost text-white hover:bg-white/10">Verifier Login</Link></li>
                  <li><Link href="/admin/login" className="btn text-white border-white hover:bg-white hover:text-[#007A3D] ml-2" style={{ backgroundColor: '#004F9E', borderColor: '#004F9E', fontFamily: "'Montserrat', sans-serif" }}>Admin Login</Link></li>
                </>
              )}
            </ul>

            {user?.type === 'verifier' && (
              <div className="dropdown dropdown-end ml-2">
                <label tabIndex={0} className="btn btn-ghost btn-circle text-white hover:bg-white/10">
                  <div className="indicator">
                    <Icon name="Bell" className="h-6 w-6" />
                    {user.notifications?.length > 0 && (
                      <span className="badge badge-sm indicator-item" style={{ backgroundColor: '#004F9E' }}>{user.notifications.length}</span>
                    )}
                  </div>
                </label>
                <div tabIndex={0} className="mt-3 z-[1] card card-compact dropdown-content w-80 shadow">
                  <div className="card-body" style={{ backgroundColor: '#ffffff' }}>
                    <h3 className="font-bold text-lg" style={{ fontFamily: "'Montserrat', sans-serif" }}>Notifications</h3>
                    <div className="divider my-1"></div>
                    <ul className="p-0 max-h-60 overflow-y-auto">
                      {user.notifications?.length > 0 ? (
                        user.notifications.map((notif) => (
                          <li key={notif.id} className="p-2 border-b rounded-md" style={{ borderColor: '#E6F3EF', backgroundColor: '#ffffff' }}>
                            <div className="text-wrap" style={{ fontFamily: "'Lato', sans-serif" }}>
                              <p>{notif.message}</p>
                              <p className="text-xs mt-1" style={{ color: '#64748b' }}>{new Date(notif.timestamp).toLocaleString()}</p>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="p-4 text-center" style={{ color: '#64748b' }}>No new notifications</li>
                      )}
                    </ul>
                    {user.notifications?.length > 0 && (
                      <>
                        <div className="divider my-1"></div>
                        <div className="card-actions">
                          <button
                            className="btn btn-block btn-sm"
                            style={{ backgroundColor: '#007A3D', borderColor: '#007A3D', color: 'white', fontFamily: "'Montserrat', sans-serif" }}
                            onClick={handleClearNotifications}
                          >
                            Clear All
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {user && (
              <button onClick={handleLogout} className="btn ml-4" style={{ backgroundColor: '#007A3D', borderColor: '#007A3D', color: 'white', fontFamily: "'Montserrat', sans-serif" }}>
                Logout
              </button>
            )}
          </div>
          <div className="dropdown dropdown-end md:hidden">
            <label tabIndex={0} className="btn btn-ghost md:hidden text-white hover:bg-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
            </label>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow rounded-box w-52" style={{ backgroundColor: '#ffffff' }}>
              {user ? (
                <>
                  {user.type === 'admin' ? (
                    <li><Link href="/admin/dashboard">Dashboard</Link></li>
                  ) : (
                    <>
                      <li className="flex flex-row justify-between items-center p-2">
                        <span>Notifications</span>
                        {user.notifications?.length > 0 && (
                          <span className="badge badge-primary badge-sm">{user.notifications.length}</span>
                        )}
                      </li>
                      <li><Link href="/verify">Verify Employee</Link></li>
                    </>
                  )}
                  <div className="divider my-1"></div>
                  <li><button onClick={handleLogout}>Logout</button></li>
                </>
              ) : (
                <>
                  <li><Link href="/login">Verifier Login</Link></li>
                  <li><Link href="/admin/login">Admin Login</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;