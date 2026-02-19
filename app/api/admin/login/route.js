import { NextResponse } from 'next/server';
import { schemas } from '@/lib/validation';
import { generateToken } from '@/lib/auth';
import { findAdminByUsername, updateAdminLastLogin, logAccess } from '@/lib/data.service';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { error, value } = schemas.adminLogin.validate(body);

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(d => ({ field: d.path[0], message: d.message }))
      }, { status: 400 });
    }

    const { username: rawUsername, password } = value;
    const username = rawUsername.trim();

    // Debug logging only in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 Admin login attempt for: "${username}" (original: "${rawUsername}")`);
    }

    // Try to find admin by username
    let admin = await findAdminByUsername(username);

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Admin lookup result:', admin ? 'FOUND' : 'NOT FOUND');
    }

    if (!admin) {
      // Log failure (Admin not found)
      await logAccess({
        email: username, // Using username as identifier for admin logs
        role: 'admin', // Presumed role
        action: 'LOGIN',
        status: 'FAILURE',
        failureReason: 'Admin not found',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });

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

    // Verify password - only bcrypt hashed passwords are supported
    let isPasswordValid = false;
    if (admin.password && (admin.password.startsWith('$2') || admin.password.startsWith('$2a') || admin.password.startsWith('$2b'))) {
      // Hashed password - use bcrypt
      isPasswordValid = await bcrypt.compare(password, admin.password);
    } else {
      // No valid password hash found - reject login
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Admin password is not properly hashed for:', username);
      }
      isPasswordValid = false;
    }

    if (!isPasswordValid) {
      // Log failure (Invalid password)
      await logAccess({
        email: admin.email,
        role: 'admin',
        action: 'LOGIN',
        status: 'FAILURE',
        failureReason: 'Invalid password',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });

      return NextResponse.json({
        success: false,
        message: 'Invalid username or password'
      }, { status: 401 });
    }

    // Update last login time
    await updateAdminLastLogin(admin.id);

    // Log success
    await logAccess({
      email: admin.email,
      role: 'admin',
      action: 'LOGIN',
      status: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        username: admin.username,
        role: admin.role
      }
    });

    // Generate JWT token
    const token = generateToken({
      id: admin.id,
      username: admin.username,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      permissions: admin.permissions
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
      lastLoginAt: new Date(),
      createdAt: admin.createdAt
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Admin login successful:', admin.username);
    }

    return NextResponse.json({
      success: true,
      message: 'Admin login successful',
      data: {
        admin: adminResponse,
        token
      }
    }, { status: 200 });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Admin login error:', error);
    }

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
