import { NextResponse } from 'next/server';
import { schemas } from '@/lib/validation';
import { generateToken } from '@/lib/auth';

// Initialize localStorage for server-side
if (typeof global !== 'undefined' && !global.localStorage) {
  global.localStorage = {
    data: {},
    getItem: function (key) { return this.data[key] || null; },
    setItem: function (key, value) { this.data[key] = value; },
    removeItem: function (key) { delete this.data[key]; },
    clear: function () { this.data = {}; }
  };
}

// Import and initialize LocalStorageDB
let db;
try {
  const { LocalStorageDB } = require('@/lib/localStorage.service');
  db = new LocalStorageDB();
} catch (error) {
  console.error('Failed to initialize LocalStorageDB:', error);
  // Fallback to simple object-based storage
  db = {
    data: {},
    findAdminByUsername(username) {
      const admins = this.data.admins || [];
      return admins.find(a => a.username === username);
    },
    createAdmin(adminData) {
      const admins = this.data.admins || [];
      const newAdmin = {
        id: '_' + Math.random().toString(36).substr(2, 9),
        ...adminData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      admins.push(newAdmin);
      this.data.admins = admins;
      return newAdmin;
    },
    updateAdmin(id, updateData) {
      const admins = this.data.admins || [];
      const index = admins.findIndex(a => a.id === id);
      if (index !== -1) {
        admins[index] = { ...admins[index], ...updateData, updatedAt: new Date().toISOString() };
        this.data.admins = admins;
        return admins[index];
      }
      return null;
    }
  };
}

// Test configuration
const TEST_CONFIG = {
  TEST_USERNAME: 'testadmin',
  TEST_PASSWORD: 'TestAdmin@2024!',
  BYPASS_TOKEN: 'ADMIN_TEST_BYPASS',
  TEST_MODE_TOKEN: 'TEST_BYPASS_2024!'
};

export async function POST(request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { error, value } = schemas.adminLogin.validate(body);

    // Allow test bypass to skip validation for test credentials
    const isTestAttempt = body.username === TEST_CONFIG.TEST_USERNAME;

    if (error && !isTestAttempt) {
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(d => ({ field: d.path[0], message: d.message }))
      }, { status: 400 });
    }

    const { username, password, bypassToken, testMode } = body;

    // Check for test mode bypass
    if (isTestAttempt && (
      password === TEST_CONFIG.TEST_PASSWORD ||
      (bypassToken === TEST_CONFIG.BYPASS_TOKEN) ||
      (testMode === TEST_CONFIG.TEST_MODE_TOKEN)
    )) {
      console.log('🧪 Test mode bypass activated for admin login');

      // Find or create test admin
      let admin = db.findAdminByUsername(TEST_CONFIG.TEST_USERNAME);

      if (!admin) {
        // Create test admin if not exists
        admin = db.createAdmin({
          username: TEST_CONFIG.TEST_USERNAME,
          email: 'testadmin@verification.portal',
          password: 'bypassed', // Doesn't matter for test mode
          fullName: 'Test Administrator',
          role: 'super_admin',
          department: 'Testing',
          permissions: [
            'view_appeals',
            'manage_appeals',
            'view_employees',
            'manage_employees',
            'send_emails',
            'view_reports',
            'manage_admins'
          ],
          testMode: true,
          bypassToken: TEST_CONFIG.BYPASS_TOKEN
        });
      } else {
        // Update admin to ensure test mode is enabled
        db.updateAdmin(admin.id, {
          isActive: true,
          testMode: true,
          bypassToken: TEST_CONFIG.BYPASS_TOKEN,
          permissions: [
            'view_appeals',
            'manage_appeals',
            'view_employees',
            'manage_employees',
            'send_emails',
            'view_reports',
            'manage_admins'
          ]
        });
      }

      // Update last login time
      const updatedAdmin = db.updateAdmin(admin.id, {
        lastLoginAt: new Date().toISOString()
      });

      // Generate JWT token with test mode indicator
      const token = generateToken({
        id: admin.id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        permissions: admin.permissions,
        testMode: true,
        bypassToken: TEST_CONFIG.BYPASS_TOKEN
      });

      // Return response without sensitive data
      const adminResponse = {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        department: admin.department,
        permissions: admin.permissions,
        lastLoginAt: updatedAdmin.lastLoginAt,
        createdAt: admin.createdAt,
        testMode: true // Indicate this is test mode
      };

      return NextResponse.json({
        success: true,
        message: 'Test admin login successful - Test mode activated',
        data: {
          admin: adminResponse,
          token,
          testMode: true
        }
      }, { status: 200 });
    }


    // Normal authentication flow
    const { username: normalUsername, password: normalPassword } = value;

    // Try to find admin by username OR email (improved UX)
    let admin = db.findAdminByUsername(normalUsername);

    // If not found by username, try by email
    if (!admin) {
      const admins = db.getData ? db.getData('admins') : db.data?.admins || [];
      admin = admins.find(a =>
        a.email && a.email.toLowerCase() === normalUsername.toLowerCase()
      );
    }

    if (!admin) {
      return NextResponse.json({
        success: false,
        message: 'Invalid username or password'
      }, { status: 401 });
    }

    // Check if account is active
    if (!admin.isActive) {
      return NextResponse.json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      }, { status: 403 });
    }

    // Verify password - handle both bcrypt and plaintext for demo
    let isPasswordValid = false;
    if (admin.password.startsWith('$2') || admin.password.startsWith('$2a') || admin.password.startsWith('$2b')) {
      // Hashed password - use bcrypt
      const bcrypt = require('bcryptjs');
      isPasswordValid = await bcrypt.compare(normalPassword, admin.password);
    } else {
      // Plain text password for demo
      isPasswordValid = normalPassword === admin.password;
    }

    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: 'Invalid username or password'
      }, { status: 401 });
    }

    // Update last login time
    const updatedAdmin = db.updateAdmin(admin.id, {
      lastLoginAt: new Date().toISOString()
    });

    // Generate JWT token
    const token = generateToken({
      id: admin.id,
      username: admin.username,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      permissions: admin.permissions,
      testMode: admin.testMode || false
    });

    // Return response without sensitive data
    const adminResponse = {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      department: admin.department,
      permissions: admin.permissions,
      lastLoginAt: updatedAdmin.lastLoginAt,
      createdAt: admin.createdAt,
      testMode: admin.testMode || false
    };

    return NextResponse.json({
      success: true,
      message: admin.testMode ? 'Test admin login successful' : 'Admin login successful',
      data: {
        admin: adminResponse,
        token,
        testMode: admin.testMode || false
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Admin login error:', error);

    return NextResponse.json({
      success: false,
      message: 'Login failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: false,
    message: 'Method not allowed'
  }, { status: 405 });
}