const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    console.log('🔗 Initializing localStorage...');
    
    // Initialize localStorage for Node.js environment
    if (typeof global !== 'undefined' && !global.localStorage) {
      global.localStorage = {
        data: {},
        getItem: function(key) { return this.data[key] || null; },
        setItem: function(key, value) { this.data[key] = value; },
        removeItem: function(key) { delete this.data[key]; },
        clear: function() { this.data = {}; }
      };
    }

    // Import LocalStorageDB class directly
    const { LocalStorageDB } = require('./lib/localStorage.service');
    const db = new LocalStorageDB();
    
    console.log('✅ localStorage initialized successfully');

    // Check if admin already exists
    const existingAdmin = db.findAdminByUsername('admin');
    if (existingAdmin) {
      console.log('✅ Admin already exists:', existingAdmin.username);
      return;
    }

    // Hash password manually
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Create admin user
    const admin = db.createAdmin({
      username: 'admin',
      email: 'admin@company.com',
      password: hashedPassword,
      fullName: 'System Administrator',
      role: 'super_admin',
      department: 'IT',
      permissions: ['view_appeals', 'manage_appeals', 'view_employees', 'manage_employees', 'send_emails', 'view_reports', 'manage_admins']
    });

    console.log('✅ Admin user created successfully');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Email:', admin.email);

  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();