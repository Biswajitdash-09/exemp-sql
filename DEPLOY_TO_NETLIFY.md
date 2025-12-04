# 🚀 Netlify Deployment Guide - Step by Step

## 📋 Prerequisites Required (DO NOT SKIP)

Before starting, you MUST have these services set up:

### 1. MongoDB Atlas (Database)
- Go to https://www.mongodb.com/cloud/atlas
- Create a FREE cluster (M0 is fine)
- Create a database user
- Get your connection string

### 2. SendGrid (Email Service)
- Go to https://sendgrid.com/
- Create a FREE account
- Get an API key
- Verify your sender email

### 3. AWS S3 (File Storage)
- Go to https://aws.amazon.com/
- Create an AWS account (has free tier)
- Create an S3 bucket
- Get Access Key ID and Secret Access Key

## 🔧 Step 1: Configure Your Local Environment

### Create .env.local file
In your project root, create `.env.local` with these values:

```env
# Replace with YOUR actual values
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster.mongodb.net/employee-verification?retryWrites=true&w=majority

JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

SENDGRID_API_KEY=SG.your-actual-sendgrid-api-key
FROM_EMAIL=your-email@yourcompany.com
COMPANY_NAME=Your Company Name
SUPPORT_EMAIL=your-email@yourcompany.com

AWS_ACCESS_KEY_ID=AKIAYOURACCESSKEY
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET=employee-verification-docs
AWS_REGION=us-east-1

NEXT_PUBLIC_BASE_URL=https://your-app-name.netlify.app
NODE_ENV=production
```

### Test Locally First!
```bash
npm run dev
```
Visit http://localhost:3000 and test:
- Admin login: `https://localhost:3000/admin/login`
- Test with admin: username: `admin`, password: `admin123`

## 🔧 Step 2: Prepare for Netlify Deployment

### Update next.config.mjs
✅ Already updated for you above

### Test the Build Process
```bash
npm run build
```
If build succeeds, you're ready for deployment!

## 🔧 Step 3: Deploy to Netlify

### Option A: Netlify Website (Easiest)
1. **Go to Netlify**: https://www.netlify.com/
2. **Sign up/in** with your GitHub account
3. **Click "Add new site" → "Import an existing project"**
4. **Select GitHub** and authorize
5. **Select this repository**
6. **Configure Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `out`
   - Environment variables: Click "Add variable" and add all from `.env.local`

### Option B: Netlify CLI (Advanced)
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod --dir=out
```

## 🔧 Step 4: Configure Environment Variables in Netlify

### Add ALL these variables in Netlify Dashboard:
Go to your site → Settings → Environment variables → Add new

```
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster.mongodb.net/employee-verification?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
SENDGRID_API_KEY=SG.your-actual-sendgrid-api-key
FROM_EMAIL=your-email@yourcompany.com
COMPANY_NAME=Your Company Name
SUPPORT_EMAIL=your-email@yourcompany.com
AWS_ACCESS_KEY_ID=AKIAYOURACCESSKEY
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET=employee-verification-docs
AWS_REGION=us-east-1
NEXT_PUBLIC_BASE_URL=https://your-app-name.netlify.app
NODE_ENV=production
```

## 🔧 Step 5: Deploy and Test

### Deploy the Site
1. **Click "Deploy site"** in Netlify
2. **Wait for deployment** (usually 2-5 minutes)
3. **Visit your URL**: `https://your-app-name.netlify.app`

### Test Everything Works:
1. ✅ **Admin Login**: Go to `https://your-app-name.netlify.app/admin/login`
   - Username: `admin`, Password: `admin123`
   - Should see dashboard

2. ✅ **Verifier Registration**: Try registering with company email
   - Should block personal emails (Gmail, Yahoo)

3. ✅ **Verification Process**:
   - Login as verifier
   - Go to verification page
   - Use Employee ID: `EMP006`
   - Should show green/red indicators

4. ✅ **Appeal System**: Submit appeal and check admin dashboard

## 🔧 Step 6: Troubleshooting Common Issues

### Issue: API calls return 500 errors
**Solution**: Check environment variables in Netlify dashboard - one might be missing or wrong.

### Issue: Login doesn't work
**Solution**: Check JWT_SECRET is set correctly and MongoDB is accessible.

### Issue: Emails not sending
**Solution**: Verify SendGrid API key and sender email is authenticated.

### Issue: File uploads fail
**Solution**: Check AWS credentials and S3 bucket permissions.

### Issue: Build fails
**Solution**: Check if all dependencies are installed and next.config.mjs is correct.

## 🔧 Step 7: Final Checks

### Verify All Features:
- [ ] Admin login works
- [ ] Verifier registration works (blocks personal emails)
- [ ] Verification process shows comparison results
- [ ] PDF download works
- [ ] Appeal submission works
- [ ] Admin can review appeals
- [ ] Email notifications are sent

### Success Indicators:
🎉 **You should see**:
- Admin dashboard with statistics
- Registration form validates emails
- Verification shows green/red indicators
- PDF reports generate and download
- Appeal system works end-to-end

## 🎯 FINAL RESULT:

**Your Ex-Employee Verification Portal is now LIVE on Netlify!** 🚀

### Access Points:
- **Main App**: `https://your-app-name.netlify.app`
- **Admin Dashboard**: `https://your-app-name.netlify.app/admin/login`

### Login Credentials:
- **Admin**: username: `admin`, password: `admin123`
- **HR Manager**: username: `hr_manager`, password: `hr123`

### Test Employee:
- **Employee ID**: `EMP006` (S Sathish)

## 🆘 If Still Issues:

1. **Check Netlify logs**: Site → Functions → Functions logs
2. **Verify ALL services**: MongoDB, SendGrid, AWS are working
3. **Test locally first**: Make sure everything works locally
4. **Check environment**: Every single variable from .env.local must be in Netlify

**Congratulations! Your verification portal is now live and ready for production use!** 🎊

If you need help with any specific step, let me know which step is giving you trouble!
<write_to_file>
<path>next.config.mjs</path>
<content>
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
  },
  // Add these lines for Netlify Functions
  output: 'standalone',
  experimental: {
    outputFileTracingIncludes: {
      '*': ['public/**/*'],
    },
  },
};

export default nextConfig;