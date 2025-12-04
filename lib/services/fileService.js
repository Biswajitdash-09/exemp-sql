import crypto from 'crypto';

/**
 * Upload file to S3 or local storage
 * @param {File} file - File object from form data
 * @param {String} folder - Folder path in S3 bucket
 * @returns {Object} Upload result with filename and URL
 */
export async function uploadFileToS3(file, folder = 'uploads') {
  try {
    // Check if we're in development or AWS credentials are not configured
    if (process.env.NODE_ENV === 'development' || !process.env.AWS_ACCESS_KEY_ID) {
      return uploadFileLocally(file, folder);
    }

    // Import AWS only if needed
    const AWS = require('aws-sdk');
    
    // Configure AWS S3
    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'employee-verification-docs';

    if (!file || file.size === 0) {
      throw new Error('No file provided or file is empty');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds maximum limit of 10MB');
    }

    // Validate file type (allowed types)
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only PDF, JPEG, PNG, and Word documents are allowed');
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const filename = `${folder}/${timestamp}-${randomString}.${fileExtension}`;

    // Prepare upload parameters
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: file,
      ContentType: file.type,
      ACL: 'private', // Make files private
      Metadata: {
        originalName: file.name,
        uploadTime: new Date().toISOString()
      }
    };

    // Upload to S3
    const uploadResult = await s3.upload(uploadParams).promise();

    if (!uploadResult.Location) {
      throw new Error('File upload failed - no location returned');
    }

    // Return upload result
    return {
      filename: filename,
      s3Url: uploadResult.Location,
      s3Key: filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size
    };

  } catch (error) {
    console.error('File upload error:', error);
    
    // Fallback to local storage if S3 fails
    if (process.env.NODE_ENV === 'development') {
      console.log('Falling back to local storage due to S3 error');
      return uploadFileLocally(file, folder);
    }
    
    throw new Error(`File upload failed: ${error.message}`);
  }
}

/**
 * Get signed URL for file download (temporary access)
 * @param {String} s3Key - S3 object key
 * @param {Number} expiration - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns {String} Signed URL for download
 */
export async function getSignedDownloadUrl(s3Key, expiration = 3600) {
  try {
    // Check if AWS is configured
    if (!process.env.AWS_ACCESS_KEY_ID) {
      throw new Error('S3 not configured, cannot generate signed URL');
    }

    const AWS = require('aws-sdk');
    const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'employee-verification-docs';
    
    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    const params = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Expires: expiration
    };

    const signedUrl = await s3.getSignedUrlPromise('getObject', params);
    return signedUrl;

  } catch (error) {
    console.error('Get signed URL error:', error);
    throw new Error(`Failed to generate download URL: ${error.message}`);
  }
}

/**
 * Delete file from S3
 * @param {String} s3Key - S3 object key
 * @returns {Boolean} Success status
 */
export async function deleteFileFromS3(s3Key) {
  try {
    if (!process.env.AWS_ACCESS_KEY_ID) {
      console.log('S3 not configured, skipping file deletion');
      return true;
    }

    const AWS = require('aws-sdk');
    const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'employee-verification-docs';
    
    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    const deleteParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key
    };

    await s3.deleteObject(deleteParams).promise();
    return true;

  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Check if file exists in S3
 * @param {String} s3Key - S3 object key
 * @returns {Boolean} File existence
 */
export async function checkFileExists(s3Key) {
  try {
    if (!process.env.AWS_ACCESS_KEY_ID) {
      return false; // Assume file doesn't exist if S3 is not configured
    }

    const AWS = require('aws-sdk');
    const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'employee-verification-docs';
    
    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    const params = {
      Bucket: BUCKET_NAME,
      Key: s3Key
    };

    await s3.headObject(params).promise();
    return true;

  } catch (error) {
    if (error.code === 'NotFound') {
      return false;
    }
    console.error('Check file exists error:', error);
    return false;
  }
}

/**
 * Get file metadata from S3
 * @param {String} s3Key - S3 object key
 * @returns {Object} File metadata
 */
export async function getFileMetadata(s3Key) {
  try {
    if (!process.env.AWS_ACCESS_KEY_ID) {
      throw new Error('S3 not configured');
    }

    const AWS = require('aws-sdk');
    const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'employee-verification-docs';
    
    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    const params = {
      Bucket: BUCKET_NAME,
      Key: s3Key
    };

    const headObject = await s3.headObject(params).promise();
    
    return {
      size: headObject.ContentLength,
      lastModified: headObject.LastModified,
      contentType: headObject.ContentType,
      metadata: headObject.Metadata || {}
    };

  } catch (error) {
    console.error('Get file metadata error:', error);
    throw new Error(`Failed to get file metadata: ${error.message}`);
  }
}

/**
 * Utility function to sanitize filename
 * @param {String} filename - Original filename
 * @returns {String} Sanitized filename
 */
export function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

/**
 * Validate file type based on file signature
 * @param {Buffer} buffer - File buffer
 * @param {String} mimeType - Expected MIME type
 * @returns {Boolean} Valid file type
 */
export function validateFileType(buffer, mimeType) {
  const signatures = {
    'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
    'image/jpeg': [0xFF, 0xD8, 0xFF], // FF D8 FF
    'image/png': [0x89, 0x50, 0x4E, 0x47], // PNG
    'application/msword': [0xD0, 0xCF, 0x11, 0xE0], // DOC
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [0x50, 0x4B, 0x03, 0x04] // DOCX (ZIP)
  };

  const expectedSignature = signatures[mimeType];
  if (!expectedSignature) return true; // Skip validation if no signature defined

  for (let i = 0; i < expectedSignature.length; i++) {
    if (buffer[i] !== expectedSignature[i]) {
      return false;
    }
  }

  return true;
}

// Local storage fallback for development
export async function uploadFileLocally(file, folder = 'uploads') {
  if (typeof window === 'undefined') {
    // Server-side: Create a mock file path for demonstration
    const fileExtension = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(4).toString('hex');
    const filename = `${folder}/${timestamp}-${randomString}.${fileExtension}`;
    
    return {
      filename: filename,
      localPath: `./uploads/${filename}`,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      isLocal: true,
      s3Url: null
    };
  }
  
  // Client-side: For demo purposes, we'll store the file in memory and return a mock response
  console.log(`Local upload (demo): ${file.name} (${file.size} bytes)`);
  
  const fileExtension = file.name.split('.').pop();
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(4).toString('hex');
  const filename = `local-${timestamp}-${randomString}.${fileExtension}`;
  
  return {
    filename: filename,
    localPath: `./uploads/${folder}/${filename}`,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    isLocal: true,
    s3Url: null,
    mockUrl: `data:${file.type};base64,mock-preview` // Very basic preview
  };
}

// Helper to convert file to base64 for local storage (development only)
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Helper to get file preview URL for local files
export function getLocalFilePreview(fileInfo) {
  if (fileInfo.isLocal && fileInfo.mockUrl) {
    return fileInfo.mockUrl;
  }
  return null;
}