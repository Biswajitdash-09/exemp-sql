require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const bcrypt = require('bcryptjs');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');
  await prisma.$connect();
  console.log('📡 Connected to database');

  // Helper to hash password
  const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
  };

  // 1. Seed Employees
  const employees = [
    {
      employeeId: '6002056',
      name: 'S Sathish',
      email: 'sathish.s@company.com',
      entityName: 'TVSCSHIB',
      dateOfJoining: new Date('2021-02-05'),
      dateOfLeaving: new Date('2024-03-31'),
      designation: 'Executive',
      exitReason: 'Resigned',
      fnfStatus: 'Completed',
      department: 'HRD'
    },
    {
      employeeId: '6002057',
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@company.com',
      entityName: 'TVSCSHIB',
      dateOfJoining: new Date('2020-03-15'),
      dateOfLeaving: new Date('2024-01-20'),
      designation: 'Assistant Manager',
      exitReason: 'Resigned',
      fnfStatus: 'Completed',
      department: 'Technology'
    }
  ];

  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { employeeId: emp.employeeId },
      update: {},
      create: emp,
    });
  }

  // 2. Seed Admins
  const adminPassword = await hashPassword('admin123');
  const hrPassword = await hashPassword('hr123');

  const admins = [
    {
      username: 'admin',
      email: 'admin@company.com',
      password: adminPassword,
      fullName: 'System Administrator',
      role: 'super_admin',
      department: 'IT',
      permissions: ['view_appeals', 'manage_appeals', 'view_employees', 'manage_employees', 'send_emails', 'view_reports', 'manage_admins'],
      isActive: true
    },
    {
      username: 'hr_manager',
      email: 'hr@company.com',
      password: hrPassword,
      fullName: 'HR Manager',
      role: 'hr_manager',
      department: 'Human Resources',
      permissions: ['view_appeals', 'manage_appeals', 'view_employees', 'send_emails', 'view_reports'],
      isActive: true
    }
  ];

  for (const admin of admins) {
    await prisma.admin.upsert({
      where: { username: admin.username },
      update: { password: admin.password },
      create: admin,
    });
  }

  // 3. Seed Verifiers
  const verifierPassword = await hashPassword('Aditya@12345');

  const verifiers = [
    {
      companyName: 'codemate.ai',
      email: 'adityamathan@codemateai.dev',
      password: verifierPassword,
      isEmailVerified: true,
      isActive: true,
      notifications: []
    }
  ];

  for (const verifier of verifiers) {
    await prisma.verifier.upsert({
      where: { email: verifier.email },
      update: { password: verifier.password },
      create: verifier,
    });
  }

  console.log('✅ Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
