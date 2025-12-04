// Browser-based data seeding script
// Run this in the browser console to populate localStorage with test data

(function seedLocalStorage() {
  console.log('🌱 Seeding localStorage with test data...');

  // Import bcryptjs for password hashing (if available)
  const bcrypt = window.bcryptjs || null;

  // Generate simple hash function if bcrypt not available
  const simpleHash = (password) => {
    // For demo purposes, just return the password (in production, use proper hashing)
    return password;
  };

  // Employee data
  const employees = [
    {
      id: '_emp1',
      employeeId: '6002056',
      name: 'S Sathish',
      email: 'sathish.s@company.com',
      entityName: 'TVSCSHIB',
      dateOfJoining: '2021-02-05',
      dateOfLeaving: '2024-03-31',
      designation: 'Executive',
      exitReason: 'Resigned',
      fnfStatus: 'Completed',
      department: 'HRD'
    },
    {
      id: '_emp2',
      employeeId: '6002057',
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@company.com',
      entityName: 'TVSCSHIB',
      dateOfJoining: '2020-03-15',
      dateOfLeaving: '2024-01-20',
      designation: 'Assistant Manager',
      exitReason: 'Resigned',
      fnfStatus: 'Completed',
      department: 'Technology'
    },
    {
      id: '_emp3',
      employeeId: '6002058',
      name: 'Priya Sharma',
      email: 'priya.sharma@company.com',
      entityName: 'HIB',
      dateOfJoining: '2019-07-10',
      dateOfLeaving: '2023-12-15',
      designation: 'Manager',
      exitReason: 'Resigned',
      fnfStatus: 'Pending',
      department: 'Finance'
    }
  ];

  // Admin users
  const admins = [
    {
      id: '_admin1',
      username: 'admin',
      email: 'admin@company.com',
      password: simpleHash('admin123'),
      fullName: 'System Administrator',
      role: 'super_admin',
      department: 'IT',
      permissions: ['view_appeals', 'manage_appeals', 'view_employees', 'manage_employees', 'send_emails', 'view_reports', 'manage_admins'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '_admin2',
      username: 'hr_manager',
      email: 'hr@company.com',
      password: simpleHash('hr123'),
      fullName: 'HR Manager',
      role: 'hr_manager',
      department: 'Human Resources',
      permissions: ['view_appeals', 'manage_appeals', 'view_employees', 'send_emails', 'view_reports'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Verifier users
  const verifiers = [
    {
      id: '_ver1',
      companyName: 'codemate.ai',
      email: 'adityamathan@codemateai.dev',
      password: simpleHash('Aditya@12345'),
      isEmailVerified: true,
      isActive: true,
      verificationRequests: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Clear existing data
  localStorage.removeItem('employees');
  localStorage.removeItem('admins');
  localStorage.removeItem('verifiers');
  localStorage.removeItem('verification_records');
  localStorage.removeItem('appeals');

  // Seed all data
  localStorage.setItem('employees', JSON.stringify(employees));
  localStorage.setItem('admins', JSON.stringify(admins));
  localStorage.setItem('verifiers', JSON.stringify(verifiers));
  localStorage.setItem('verification_records', JSON.stringify([]));
  localStorage.setItem('appeals', JSON.stringify([]));

  console.log('✅ LocalStorage seeded successfully!');
  console.log('📊 Data Summary:');
  console.log('   - Employees:', employees.length);
  console.log('   - Admins:', admins.length);
  console.log('   - Verifiers:', verifiers.length);
  console.log('');
  console.log('🔐 Login Credentials:');
  console.log('   Admin - Username: admin, Password: admin123');
  console.log('   HR Manager - Username: hr_manager, Password: hr123');
  console.log('   Verifier - Email: adityamathan@codemateai.dev, Password: Aditya@12345');
  console.log('');
  console.log('🧪 Sample Employee IDs for testing:');
  employees.forEach(emp => {
    console.log(`   - ${emp.name}: ${emp.employeeId}`);
  });
})();