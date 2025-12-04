# Testing Credentials Guide

## Overview

This guide provides comprehensive instructions for using the test credentials that bypass all authentication checkpoints in the Employee Verification Portal. These credentials are designed specifically for testing all functionalities without restrictions.

## 🚀 Quick Start

### 1. Setup Test Credentials
First, run the test credentials setup script:

```bash
node scripts/create-test-credentials.js
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Access Login Pages
- **Admin Login**: http://localhost:3000/admin/login
- **Verifier Login**: http://localhost:3000/login

## 🔐 Test Credentials

### Admin Login Credentials
```
Username: testadmin
Password: TestAdmin@2024!
Email: testadmin@verification.portal
```

### Verifier Login Credentials
```
Email: testverifier@company.test
Password: TestVerifier@2024!
Company: Test Company Inc
```

## 📋 Step-by-Step Login Instructions

### Admin Login Steps:

1. **Navigate to Admin Login**
   - Open browser and go to: `http://localhost:3000/admin/login`

2. **Enter Credentials**
   - Username: `testadmin`
   - Password: `TestAdmin@2024!`

3. **Click Login**
   - The system will automatically detect test mode
   - You'll see "Test admin login successful - Test mode activated" message

4. **Access Admin Dashboard**
   - You'll be redirected to: `http://localhost:3000/admin/dashboard`
   - Full admin permissions are enabled

### Verifier Login Steps:

1. **Navigate to Verifier Login**
   - Open browser and go to: `http://localhost:3000/login`

2. **Enter Credentials**
   - Email: `testverifier@company.test`
   - Password: `TestVerifier@2024!`

3. **Click Login**
   - The system will automatically detect test mode
   - You'll see "Test login successful - Test mode activated" message

4. **Access Verifier Dashboard**
   - You'll be redirected to: `http://localhost:3000/verify`
   - Full verifier permissions are enabled

## 🧪 Test Mode Features

### What Gets Bypassed:
- ✅ Email verification requirements
- ✅ Account activation status checks
- ✅ Password validation (accepts any password for test accounts)
- ✅ Permission restrictions
- ✅ Rate limiting
- ✅ CORS restrictions (in test mode)
- ✅ Data validation errors
- ✅ Authentication checkpoints

### What Remains Active:
- ⚠️ Basic UI functionality
- ⚠️ Navigation between pages
- ⚠️ Form submissions (but validation is bypassed)
- ⚠️ API calls (but authentication is bypassed)

## 🎯 Testing Scenarios

### 1. Admin Functionality Testing
With admin credentials, you can test:
- **Dashboard Management**: View all system statistics
- **Employee Management**: Add, edit, delete employees
- **Appeal Management**: View and respond to appeals
- **Verification Records**: Access all verification data
- **User Management**: Manage admin accounts
- **Reports**: Generate and view reports
- **Email Functions**: Test email sending capabilities

### 2. Verifier Functionality Testing
With verifier credentials, you can test:
- **Employee Verification**: Submit verification requests
- **Document Upload**: Test file upload functionality
- **Comparison Tools**: Test data comparison features
- **Appeal Submission**: Submit appeals for discrepancies
- **History Viewing**: View verification history
- **Profile Management**: Update verifier information

### 3. Cross-Role Testing
Test interactions between admin and verifier roles:
- **Appeal Workflow**: Verifier submits → Admin responds → Verifier views
- **Data Consistency**: Ensure data syncs correctly
- **Permission Boundaries**: Test access controls
- **Notification Systems**: Test alerts and emails

## 🔧 Advanced Testing Options

### Using Bypass Tokens
You can also use bypass tokens for additional flexibility:

#### Admin Bypass Token
```javascript
// In API calls, include bypass token
{
  "username": "testadmin",
  "password": "any_password",
  "bypassToken": "ADMIN_TEST_BYPASS"
}
```

#### Verifier Bypass Token
```javascript
// In API calls, include bypass token
{
  "email": "testverifier@company.test",
  "password": "any_password",
  "bypassToken": "VERIFIER_TEST_BYPASS"
}
```

#### Global Test Mode Token
```javascript
// Activate test mode globally
{
  "testMode": "TEST_BYPASS_2024!"
}
```

### Header-Based Bypass
For API testing, you can use headers:

```bash
# Admin API calls
curl -H "X-Test-Mode: TEST_BYPASS_2024!" \
     -H "Authorization: Bearer your_token" \
     http://localhost:3000/api/admin/dashboard

# Verifier API calls
curl -H "X-Bypass-Token: VERIFIER_TEST_BYPASS" \
     -H "Authorization: Bearer your_token" \
     http://localhost:3000/api/verify/request
```

## 📊 Test Data

The setup script creates sample test data:

### Employees
- **TEST001**: John Doe (Manager, TVSCSHIB)
- **TEST002**: Jane Smith (Assistant Manager, HIB)

### Verification Records
- **VER000001**: Approved verification for John Doe
- **VER000002**: Pending verification for Jane Smith

### Appeals
- **APL000001**: Pending appeal for Jane Smith's verification

## 🛠️ Troubleshooting

### Login Issues

**Problem**: Login fails with "Invalid credentials"
**Solution**: 
1. Ensure you ran the setup script: `node scripts/create-test-credentials.js`
2. Check credentials are exactly as specified (case-sensitive)
3. Try using bypass token in request body
4. Restart the development server

**Problem**: "Test mode not detected"
**Solution**:
1. Include `testMode: "TEST_BYPASS_2024!"` in request body
2. Use exact email/username: `testadmin` or `testverifier@company.test`
3. Check browser console for JavaScript errors
4. Verify the test middleware is properly loaded

### Data Issues

**Problem**: No test data visible
**Solution**:
1. Refresh the page after login
2. Check browser storage (localStorage) for test data
3. Re-run the setup script to recreate data
4. Clear browser cache and try again

**Problem**: Permissions errors
**Solution**:
1. Test mode should bypass all permissions
2. Include bypass token in requests
3. Check if admin account has `testMode: true`
4. Verify JWT token includes test mode flag

## 🔄 Resetting Test Environment

To completely reset the test environment:

```bash
# 1. Stop the development server (Ctrl+C)
# 2. Clear browser data
# 3. Recreate test credentials
node scripts/create-test-credentials.js
# 4. Restart development server
npm run dev
```

## 📝 Testing Checklist

### Admin Testing Checklist
- [ ] Login with test admin credentials
- [ ] View dashboard statistics
- [ ] Access employee management
- [ ] View verification records
- [ ] Manage appeals (approve/reject)
- [ ] Generate reports
- [ ] Manage admin users
- [ ] Test email functionality

### Verifier Testing Checklist
- [ ] Login with test verifier credentials
- [ ] Submit verification request
- [ ] Upload documents
- [ ] Use comparison tools
- [ ] Submit appeal
- [ ] View verification history
- [ ] Update profile
- [ ] Test notifications

### Integration Testing Checklist
- [ ] Admin-Verifier workflow
- [ ] Data synchronization
- [ ] Permission boundaries
- [ ] Error handling
- [ ] Email notifications
- [ ] File uploads/downloads
- [ ] Report generation
- [ ] Mobile responsiveness

## 🔒 Security Notes

⚠️ **IMPORTANT**: These test credentials are **FOR TESTING ONLY**!

### Never Use in Production:
- Test usernames and passwords
- Bypass tokens
- Test mode activation
- Hardcoded test data

### Production Security:
- Use proper authentication
- Implement email verification
- Enforce strong passwords
- Remove test bypasses
- Use environment-based configs

## 📚 Additional Resources

### API Documentation
- [API Routes Documentation](./API_DOCUMENTATION.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Authentication Guide](./AUTHENTICATION_GUIDE.md)

### Development Guides
- [Development Setup](./DEVELOPMENT_SETUP.md)
- [Testing Strategy](./TESTING_STRATEGY.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

## ❓ Questions & Support

If you encounter issues with test credentials:

1. Check this guide first
2. Review browser console logs
3. Verify setup script completed successfully
4. Check server logs for test mode activation messages
5. Ensure development server is running properly

---

**Happy Testing! 🎯**

*This testing system allows you to thoroughly validate all portal functionalities without the overhead of account setup, email verification, or permission management.*