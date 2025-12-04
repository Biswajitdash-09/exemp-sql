# 🚀 Ex-Employee Verification Portal - Deployment Guide

## 📋 Prerequisites

Before deploying, make sure you have:

- Node.js 18+ installed
- MongoDB Atlas account
- SendGrid account
- AWS account with S3 access
- Netlify account
- GitHub account (for Netlify deployment)

## 🔧 Step 1: Setup Backend Services

### MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (Free tier is sufficient for testing)
3. Create a database user with password
4. Get the connection string (Click "Connect" → "Connect your application")
5. whitelist your IP address (or use 0.0.0.0/0 for Netlify)

### SendGrid
1. Go to [SendGrid](https://sendgrid.com/)
2. Create an account and verify your email
3. Go to Settings → API Keys
4. Create a new API key with "Full Access"
5. Go to Settings → Sender Authentication
6. Verify your sender email domain

### AWS S3
1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Navigate to S3 service
3. Create a new bucket (e.g., "employee-verification-docs")
4. Note down your Access Key ID and Secret Access Key
5. Set bucket permissions (private is fine)

## 🔐 Step 2: Configure Environment Variables

Create a `.env.local` file in your project root:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/employee-verification?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Email Service (SendGrid)
SENDGRID_API_KEY=SG.your-sendgrid-api-key
FROM_EMAIL=noreply@yourcompany.com
COMPANY_NAME=Your Company Name
SUPPORT_EMAIL=hr@yourcompany.com

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=employee-verification-docs
AWS_REGION=us-east-1

# Application Configuration
NEXT_PUBLIC_BASE_URL=https://your-app.netlify.app
NODE_ENV=production
```

## 🗄️ Step 3: Initialize Database

Run the database seeding script:

```bash
node scripts/seedDatabase.js
```

This will create:
- 6 sample employee records
- 2 admin accounts
- Default credentials displayed in console

## 🌐 Step 4: Local Testing

Test the application locally:

```bash
npm run dev
```

Visit `http://localhost:3000` and test:
- Admin login (username: `admin`, password: `admin123`)
- Verifier registration
- Verification process
- Appeal submission

## 🚀 Step 5: Deploy to Netlify

### Option A: Netlify UI (Recommended for beginners)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

2. **Deploy to Netlify**
   - Go to [Netlify](https://www.netlify.com/)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Select the repository
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `.next`
   - Add environment variables (same as `.env.local`)
   - Click "Deploy site"

### Option B: Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod --dir=.next
   ```

## ⚙️ Step 6: Configure Netlify Functions

Ensure your `netlify.toml` is properly configured (already included in project):

```toml
[build]
  command = "npm run build"
  publish = ".next"

[functions]
  directory = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 🔧 Step 7: Post-Deployment Checks

### Verify All Features:

1. **Admin Dashboard**
   - Login: `https://your-app.netlify.app/admin/login`
   - Username: `admin`, Password: `admin123`
   - Check dashboard statistics
   - Review appeal management

2. **Verifier Registration**
   - Visit: `https://your-app.netlify.app/`
   - Try registering with company email
   - Verify email blocking for personal domains

3. **Verification Process**
   - Login as verifier
   - Go through verification wizard
   - Use Employee ID: `EMP006` (S Sathish)
   - Check comparison results

4. **PDF Generation**
   - Download verification reports
   - Check PDF formatting

5. **Appeal System**
   - Submit appeals with documents
   - Check HR review workflow
   - Verify email notifications

## 🐛 Common Issues & Solutions

### Issue 1: Database Connection Error
**Solution**: Check MongoDB connection string and IP whitelist

### Issue 2: Email Not Sending
**Solution**: Verify SendGrid API key and sender authentication

### Issue 3: File Upload Fails
**Solution**: Check AWS credentials and S3 bucket permissions

### Issue 4: API Calls Fail
**Solution**: Verify environment variables in Netlify dashboard

### Issue 5: 404 Errors
**Solution**: Check Netlify redirect configuration

## 📊 Monitoring

### Check Netlify Logs:
1. Go to Netlify dashboard
2. Select your site
3. Click "Functions" tab
4. View function logs for debugging

### Check MongoDB:
- Monitor database usage in Atlas dashboard
- Check indexes and query performance

### Check SendGrid:
- Monitor email delivery in SendGrid dashboard
- Check bounce and spam reports

## 🔄 Maintenance

### Regular Tasks:
1. **Monitor API usage** - Check Netlify function limits
2. **Backup database** -定期备份MongoDB数据
3. **Update dependencies** - Keep packages updated
4. **Monitor costs** - Check AWS and SendGrid usage costs

### Security:
1. **Rotate secrets** - Regularly update API keys
2. **Monitor access** - Check unauthorized attempts
3. **Update packages** - Apply security patches
4. **Audit logs** - Review system logs regularly

## 📞 Support

If you encounter issues:

1. **Check logs** - Netlify function logs and browser console
2. **Verify configuration** - All environment variables set correctly
3. **Test locally** - Ensure everything works locally before deploying
4. **Check documentation** - Review this guide and README.md

## 🎉 You're Ready!

Your Ex-Employee Verification Portal is now live! 🚀

### Access Points:
- **Main Application**: `https://your-app.netlify.app`
- **Admin Dashboard**: `https://your-app.netlify.app/admin/login`
- **Verifier Login**: `https://your-app.netlify.app/login`

### Login Credentials:
- **Admin**: username: `admin`, password: `admin123`
- **HR Manager**: username: `hr_manager`, password: `hr123`

### Test Data:
- **Employee ID**: `EMP006` (S Sathish) for testing verification

Congratulations! You now have a production-ready employee verification system! 🎊