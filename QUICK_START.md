# 🚀 Quick Start Guide - Ex-Employee Verification Portal

## ⚡ 5-Minute Setup for Testing

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup Environment Variables
Create `.env.local` (copy from `.env.local.example`):
```env
MONGODB_URI=mongodb+srv://localhost:27017/employee-verification
JWT_SECRET=test-secret-key
SENDGRID_API_KEY=your-sendgrid-key
# ... other variables (see .env.local.example)
```

### Step 3: Seed Database
```bash
node scripts/seedDatabase.js
```

### Step 4: Start Development Server
```bash
npm run dev
```

### Step 5: Test the System!
Open `http://localhost:3000`

## 🧪 Quick Testing Guide

### Test Admin Access:
1. Go to `http://localhost:3000/admin/login`
2. **Username**: `admin`
3. **Password**: `admin123`
4. You should see the admin dashboard with statistics

### Test Verifier Registration:
1. Go to `http://localhost:3000`
2. Try registering with Gmail/Yahoo (should be blocked)
3. Register with company email (e.g., `test@company.com`)

### Test Verification Process:
1. Login as verifier
2. Go through verification wizard
3. Use **Employee ID**: `EMP006` (S Sathish)
4. You should see green/red indicators for matches/mismatches

### Test Appeal Process:
1. After verification, click "Raise Appeal"
2. Upload a document (any PDF/image)
3. Login as admin to review appeal
4. Approve/reject with comments

## 🔧 Common Quick Fixes

### If Database Connection Fails:
- Check MongoDB Atlas connection string
- Whitelist your IP in MongoDB Atlas
- Ensure database user has correct permissions

### If Emails Don't Send:
- Verify SendGrid API key
- Complete sender authentication in SendGrid
- Check From Email is verified

### If File Upload Fails:
- Check AWS credentials
- Verify S3 bucket exists and permissions
- Check AWS region in configuration

### If API Calls Fail:
- Verify all environment variables are set
- Check browser console for errors
- Check Netlify function logs (if deployed)

## 📊 Test Data Summary

### Admin Accounts:
- **Super Admin**: username: `admin`, password: `admin123`
- **HR Manager**: username: `hr_manager`, password: `hr123`

### Test Employee:
- **Employee ID**: `EMP006` (S Sathish)
- Expected to have some mismatches for testing

### Test Scenarios:
1. ✅ **Company Email Registration** - Should work
2. ❌ **Personal Email Registration** - Should be blocked
3. ✅ **Employee Verification** - Should show comparison results
4. ✅ **Appeal Submission** - Should work with file upload
5. ✅ **PDF Generation** - Should generate official reports
6. ✅ **Email Notifications** - Should send throughout workflow

## 🚨 If Nothing Works:

1. **Check all services are running**:
   - MongoDB Atlas: Your cluster should be created
   - SendGrid: API key should be valid
   - AWS S3: Bucket should exist

2. **Verify environment variables**:
   - All keys from `.env.local.example` should be set
   - No extra spaces or special characters

3. **Clear browser cache** and restart development server

4. **Check browser console** (F12) for JavaScript errors

5. **Check server logs** for any startup issues

## 🎯 Success Indicators:

You know it's working when:
- ✅ Admin dashboard shows statistics
- ✅ Verifier registration works (blocks personal emails)
- ✅ Verification shows green/red comparison results
- ✅ PDF download works
- ✅ Appeal submission shows in admin dashboard
- ✅ Email notifications are received

## 🆘 Need Help?

If you still have issues:
1. Check the full `README.md` for detailed setup
2. Review `DEPLOYMENT_GUIDE.md` for production deployment
3. Check browser console and server logs
4. Ensure all external services are properly configured

**You should have a fully functional verification system ready for production!** 🎉