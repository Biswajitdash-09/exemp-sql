/**
 * Local Storage Database Service
 * Replaces MongoDB operations with localStorage-based storage
 */

const STORAGE_KEYS = {
  EMPLOYEES: 'employees',
  VERIFIERS: 'verifiers',
  ADMINS: 'admins',
  VERIFICATION_RECORDS: 'verification_records',
  APPEALS: 'appeals',
  DASHBOARD_STATS: 'dashboard_stats',
  AUTH_TOKEN: 'auth_token'
};

// Server-side localStorage mock - defined first to avoid initialization issues
class ServerStorage {
  constructor() {
    this.data = {};
    this.initializeData();
  }

  initializeData() {
    const defaults = {
      employees: [],
      verifiers: [],
      admins: [],
      verification_records: [],
      appeals: [],
      dashboard_stats: null
    };

    Object.keys(defaults).forEach(key => {
      if (!this.data[key]) {
        this.data[key] = defaults[key];
      }
    });
  }

  getItem(key) {
    return JSON.stringify(this.data[key] || []);
  }

  setItem(key, value) {
    this.data[key] = JSON.parse(value);
  }

  removeItem(key) {
    delete this.data[key];
  }
}

class LocalStorageDB {
  constructor() {
    this.initializeData();
  }

  // Initialize default data if not exists
  initializeData() {
    if (typeof window === 'undefined') return;

    const defaults = {
      [STORAGE_KEYS.EMPLOYEES]: [],
      [STORAGE_KEYS.VERIFIERS]: [],
      [STORAGE_KEYS.ADMINS]: [],
      [STORAGE_KEYS.VERIFICATION_RECORDS]: [],
      [STORAGE_KEYS.APPEALS]: [],
      [STORAGE_KEYS.DASHBOARD_STATS]: null
    };

    Object.keys(defaults).forEach(key => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(defaults[key]));
      }
    });
  }

  // Generic methods
  getData(key) {
    try {
      let data;
      if (typeof window === 'undefined') {
        // Server-side - use FILE-BASED storage instead of RAM
        const { getCollection } = require('./fileStorage.service');
        data = JSON.stringify(getCollection(key));
      } else {
        // Browser-side - use localStorage
        data = localStorage.getItem(key);
      }
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return [];
    }
  }

  setData(key, data) {
    try {
      if (typeof window === 'undefined') {
        // Server-side - use FILE-BASED storage instead of RAM
        const { updateCollection } = require('./fileStorage.service');
        updateCollection(key, data);
      } else {
        // Browser-side - use localStorage
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch (error) {
      console.error(`Error writing ${key}:`, error);
    }
  }

  generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
  }

  generateSequentialId(prefix, collectionKey) {
    const data = this.getData(collectionKey);
    const maxId = data.reduce((max, item) => {
      const match = item.id?.match(new RegExp(`${prefix}(\\d+)`));
      if (match) {
        return Math.max(max, parseInt(match[1]));
      }
      return max;
    }, 0);
    return `${prefix}${String(maxId + 1).padStart(6, '0')}`;
  }

  // Employee methods
  findEmployee(employeeId) {
    const employees = this.getData(STORAGE_KEYS.EMPLOYEES);
    return employees.find(emp => emp.employeeId === employeeId);
  }

  createEmployee(employeeData) {
    const employees = this.getData(STORAGE_KEYS.EMPLOYEES);
    const newEmployee = {
      id: this.generateId(),
      ...employeeData,
      employeeId: employeeData.employeeId.toUpperCase(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    employees.push(newEmployee);
    this.setData(STORAGE_KEYS.EMPLOYEES, employees);
    return newEmployee;
  }

  updateEmployee(employeeId, updateData) {
    const employees = this.getData(STORAGE_KEYS.EMPLOYEES);
    const index = employees.findIndex(emp => emp.employeeId === employeeId);
    if (index !== -1) {
      employees[index] = {
        ...employees[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      this.setData(STORAGE_KEYS.EMPLOYEES, employees);
      return employees[index];
    }
    return null;
  }

  getAllEmployees() {
    return this.getData(STORAGE_KEYS.EMPLOYEES);
  }

  // Bulk employee operations
  seedEmployees(employeesData) {
    const employees = employeesData.map(emp => ({
      id: this.generateId(),
      ...emp,
      employeeId: emp.employeeId.toUpperCase(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    this.setData(STORAGE_KEYS.EMPLOYEES, employees);
    return employees;
  }

  // Verifier methods
  findVerifierByEmail(email) {
    const verifiers = this.getData(STORAGE_KEYS.VERIFIERS);
    return verifiers.find(v => v.email.toLowerCase() === email.toLowerCase());
  }

  findVerifierById(id) {
    const verifiers = this.getData(STORAGE_KEYS.VERIFIERS);
    return verifiers.find(v => v.id === id);
  }

  createVerifier(verifierData) {
    const verifiers = this.getData(STORAGE_KEYS.VERIFIERS);
    const newVerifier = {
      id: this.generateId(),
      ...verifierData,
      email: verifierData.email.toLowerCase(),
      isEmailVerified: false,
      isActive: true,
      verificationRequests: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    verifiers.push(newVerifier);
    this.setData(STORAGE_KEYS.VERIFIERS, verifiers);
    return newVerifier;
  }

  updateVerifier(id, updateData) {
    const verifiers = this.getData(STORAGE_KEYS.VERIFIERS);
    const index = verifiers.findIndex(v => v.id === id);
    if (index !== -1) {
      verifiers[index] = {
        ...verifiers[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      this.setData(STORAGE_KEYS.VERIFIERS, verifiers);
      return verifiers[index];
    }
    return null;
  }

  // Admin methods
  findAdminByUsername(username) {
    const admins = this.getData(STORAGE_KEYS.ADMINS);
    return admins.find(a => a.username === username);
  }

  findAdminByEmail(email) {
    const admins = this.getData(STORAGE_KEYS.ADMINS);
    return admins.find(a => a.email.toLowerCase() === email.toLowerCase());
  }

  findAdminById(id) {
    const admins = this.getData(STORAGE_KEYS.ADMINS);
    return admins.find(a => a.id === id);
  }

  createAdmin(adminData) {
    const admins = this.getData(STORAGE_KEYS.ADMINS);
    const newAdmin = {
      id: this.generateId(),
      ...adminData,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    admins.push(newAdmin);
    this.setData(STORAGE_KEYS.ADMINS, admins);
    return newAdmin;
  }

  updateAdmin(id, updateData) {
    const admins = this.getData(STORAGE_KEYS.ADMINS);
    const index = admins.findIndex(a => a.id === id);
    if (index !== -1) {
      admins[index] = {
        ...admins[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      this.setData(STORAGE_KEYS.ADMINS, admins);
      return admins[index];
    }
    return null;
  }

  // Verification Record methods
  createVerificationRecord(recordData) {
    const records = this.getData(STORAGE_KEYS.VERIFICATION_RECORDS);
    const newRecord = {
      id: this.generateId(),
      verificationId: this.generateSequentialId('VER', STORAGE_KEYS.VERIFICATION_RECORDS),
      ...recordData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    records.push(newRecord);
    this.setData(STORAGE_KEYS.VERIFICATION_RECORDS, records);
    return newRecord;
  }

  updateVerificationRecord(verificationId, updateData) {
    const records = this.getData(STORAGE_KEYS.VERIFICATION_RECORDS);
    const index = records.findIndex(r => r.verificationId === verificationId);
    if (index !== -1) {
      records[index] = {
        ...records[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      this.setData(STORAGE_KEYS.VERIFICATION_RECORDS, records);
      return records[index];
    }
    return null;
  }

  findVerificationRecordByVerifier(verificationId, verifierId) {
    const records = this.getData(STORAGE_KEYS.VERIFICATION_RECORDS);
    return records.find(r =>
      r.verificationId === verificationId && r.verifierId === verifierId
    );
  }

  findVerificationRecord(verificationId) {
    const records = this.getData(STORAGE_KEYS.VERIFICATION_RECORDS);
    return records.find(r => r.verificationId === verificationId);
  }

  getVerificationRecordsByVerifier(verifierId, page = 1, limit = 10) {
    const records = this.getData(STORAGE_KEYS.VERIFICATION_RECORDS);
    const filtered = records.filter(r => r.verifierId === verifierId);
    const sorted = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
      records: sorted.slice(start, end),
      total: filtered.length,
      page,
      pages: Math.ceil(filtered.length / limit)
    };
  }

  // Appeal methods
  createAppeal(appealData) {
    const appeals = this.getData(STORAGE_KEYS.APPEALS);
    const newAppeal = {
      id: this.generateId(),
      appealId: this.generateSequentialId('APL', STORAGE_KEYS.APPEALS),
      ...appealData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    appeals.push(newAppeal);
    this.setData(STORAGE_KEYS.APPEALS, appeals);
    return newAppeal;
  }

  findAppeal(appealId) {
    const appeals = this.getData(STORAGE_KEYS.APPEALS);
    return appeals.find(a => a.appealId === appealId);
  }

  findAppealById(id) {
    const appeals = this.getData(STORAGE_KEYS.APPEALS);
    return appeals.find(a => a.id === id);
  }

  updateAppeal(appealId, updateData) {
    const appeals = this.getData(STORAGE_KEYS.APPEALS);
    const index = appeals.findIndex(a => a.appealId === appealId);
    if (index !== -1) {
      appeals[index] = {
        ...appeals[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      this.setData(STORAGE_KEYS.APPEALS, appeals);
      return appeals[index];
    }
    return null;
  }

  getAppeals(filters = {}, page = 1, limit = 10) {
    let appeals = this.getData(STORAGE_KEYS.APPEALS);

    // Apply filters
    if (filters.status) {
      appeals = appeals.filter(a => a.status === filters.status);
    }
    if (filters.employeeId) {
      appeals = appeals.filter(a => a.employeeId === filters.employeeId);
    }

    // Sort by creation date (newest first)
    const sorted = appeals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      appeals: sorted.slice(start, end),
      total: appeals.length,
      page,
      pages: Math.ceil(appeals.length / limit)
    };
  }

  // Authentication token methods
  setToken(token) {
    try {
      if (typeof window === 'undefined') {
        // Server-side - use in-memory storage
        if (!this.storage) {
          this.storage = new ServerStorage();
        }
        this.storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      } else {
        // Browser-side - use localStorage
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      }
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  getToken() {
    try {
      if (typeof window === 'undefined') {
        // Server-side - use in-memory storage
        if (!this.storage) {
          this.storage = new ServerStorage();
        }
        return this.storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      } else {
        // Browser-side - use localStorage
        return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      }
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  removeToken() {
    try {
      if (typeof window === 'undefined') {
        // Server-side - use in-memory storage
        if (!this.storage) {
          this.storage = new ServerStorage();
        }
        this.storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      } else {
        // Browser-side - use localStorage
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      }
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  // Utility methods
  clearAllData() {
    if (typeof window === 'undefined') return;
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    // Re-initialize with empty data
    const defaults = {
      [STORAGE_KEYS.EMPLOYEES]: [],
      [STORAGE_KEYS.VERIFIERS]: [],
      [STORAGE_KEYS.ADMINS]: [],
      [STORAGE_KEYS.VERIFICATION_RECORDS]: [],
      [STORAGE_KEYS.APPEALS]: []
    };

    Object.keys(defaults).forEach(key => {
      localStorage.setItem(key, JSON.stringify(defaults[key]));
    });
  }

  exportData() {
    const data = {};
    Object.values(STORAGE_KEYS).forEach(key => {
      data[key] = this.getData(key);
    });
    return data;
  }

  importData(data) {
    Object.entries(data).forEach(([key, value]) => {
      this.setData(key, value);
    });
  }

  // Dashboard methods
  getDashboardStats() {
    if (typeof window === 'undefined') return null;
    try {
      const stats = localStorage.getItem(STORAGE_KEYS.DASHBOARD_STATS);
      return stats ? JSON.parse(stats) : null;
    } catch (error) {
      console.error('Error reading dashboard stats:', error);
      return null;
    }
  }

  setDashboardStats(stats) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.DASHBOARD_STATS, JSON.stringify(stats));
    } catch (error) {
      console.error('Error writing dashboard stats:', error);
    }
  }

  generateMockDashboardData() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Generate more realistic mock data
    const mockStats = {
      summary: {
        totalVerifications: Math.floor(Math.random() * 50) + 20,
        recentVerifications: Math.floor(Math.random() * 15) + 5,
        totalAppeals: Math.floor(Math.random() * 20) + 8,
        pendingAppeals: Math.floor(Math.random() * 8) + 2,
        totalVerifiers: Math.floor(Math.random() * 10) + 5,
        activeVerifiers: Math.floor(Math.random() * 6) + 3,
        totalEmployees: Math.floor(Math.random() * 100) + 50
      },
      breakdowns: {
        verificationStatus: {
          'approved': 15,
          'pending': 8,
          'rejected': 5,
          'appealed': 3
        },
        appealStatus: {
          'pending': 4,
          'approved': 8,
          'rejected': 3
        }
      },
      trends: {
        verifications: this.generateVerificationTrend()
      },
      recentActivities: this.generateRecentActivities(),
      pendingAppealsCount: Math.floor(Math.random() * 8) + 2
    };

    this.setDashboardStats(mockStats);
    return mockStats;
  }

  generateVerificationTrend() {
    const trend = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dateStr = date.toISOString().split('T')[0];
      trend.push({
        date: dateStr,
        count: Math.floor(Math.random() * 8) + 1
      });
    }

    return trend;
  }

  generateRecentActivities() {
    const activities = [];
    const now = new Date();

    // Generate recent verification activities
    for (let i = 0; i < 5; i++) {
      const activityDate = new Date(now.getTime() - (i * 12 * 60 * 60 * 1000));
      activities.push({
        type: 'verification',
        id: `VER${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
        description: `Verification for EMP${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
        status: ['approved', 'pending', 'rejected'][Math.floor(Math.random() * 3)],
        user: ['Tech Corp', 'Data Solutions', 'Cloud Systems'][Math.floor(Math.random() * 3)],
        timestamp: activityDate.toISOString()
      });
    }

    // Generate recent appeal activities
    for (let i = 0; i < 3; i++) {
      const activityDate = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      activities.push({
        type: 'appeal',
        id: `APL${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
        description: `Appeal for EMP${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
        status: ['pending', 'approved', 'rejected'][Math.floor(Math.random() * 3)],
        user: ['Tech Corp', 'Data Solutions', 'Cloud Systems'][Math.floor(Math.random() * 3)],
        timestamp: activityDate.toISOString()
      });
    }

    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
  }

  calculateRealDashboardStats() {
    // Get real data from storage
    const verifications = this.getData('verificationRecords');
    const appeals = this.getData('appeals');
    const verifiers = this.getData('verifiers');
    const employees = this.getData('employees');

    // Calculate date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Calculate summary stats from REAL data
    const recentVerifications = verifications.filter(v =>
      new Date(v.verificationCompletedAt) >= thirtyDaysAgo
    );

    const summary = {
      totalVerifications: verifications.length,
      recentVerifications: recentVerifications.length,
      totalAppeals: appeals.length,
      pendingAppeals: appeals.filter(a => a.status === 'pending').length,
      totalVerifiers: verifiers.length,
      activeVerifiers: verifiers.filter(v => v.isActive).length,
      totalEmployees: employees.length
    };

    // Verification status breakdown
    const verificationStatus = {
      approved: verifications.filter(v => v.overallStatus === 'matched').length,
      pending: verifications.filter(v => v.overallStatus === 'pending').length,
      rejected: verifications.filter(v => v.overallStatus === 'rejected').length,
      appealed: verifications.filter(v => appeals.some(a => a.verificationId === v.verificationId)).length
    };

    // Appeal status breakdown
    const appealStatus = {
      pending: appeals.filter(a => a.status === 'pending').length,
      approved: appeals.filter(a => a.status === 'approved').length,
      rejected: appeals.filter(a => a.status === 'rejected').length
    };

    // Recent activities from actual data
    const recentActivities = [
      ...verifications.slice(-5).reverse().map(v => ({
        type: 'verification',
        id: v.verificationId,
        description: `Verification for ${v.employeeId}`,
        status: v.overallStatus,
        user: v.verifierEmail || 'Unknown',
        timestamp: v.verificationCompletedAt
      })),
      ...appeals.slice(-5).reverse().map(a => ({
        type: 'appeal',
        id: a.appealId,
        description: `Appeal for ${a.verificationId}`,
        status: a.status,
        user: a.verifierEmail || 'Unknown',
        timestamp: a.createdAt
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

    return {
      summary,
      breakdowns: {
        verificationStatus,
        appealStatus
      },
      recentActivities,
      lastUpdated: now.toISOString()
    };
  }

  getOrCreateDashboardStats() {
    // ALWAYS use real-time data, no caching
    return this.calculateRealDashboardStats();
  }
}

// Export singleton instance for both environments
let db = null;
try {
  db = createDBInstance();
} catch (error) {
  console.warn('Failed to create DB instance:', error);
}

// Export for both browser and Node.js environments
export { LocalStorageDB, ServerStorage };

// Export default instance
export default db;

// Enhanced instance creation for both environments
function createDBInstance() {
  try {
    return new LocalStorageDB();
  } catch (error) {
    console.warn('Failed to create DB instance:', error);
    return null;
  }
}

// Create a helper to handle method exports safely
function createMethodExports(dbInstance) {
  if (!dbInstance) return {};

  const methods = {
    findEmployee: (...args) => dbInstance.findEmployee(...args),
    createEmployee: (...args) => dbInstance.createEmployee(...args),
    updateEmployee: (...args) => dbInstance.updateEmployee(...args),
    getAllEmployees: (...args) => dbInstance.getAllEmployees(...args),
    seedEmployees: (...args) => dbInstance.seedEmployees(...args),
    findVerifierByEmail: (...args) => dbInstance.findVerifierByEmail(...args),
    findVerifierById: (...args) => dbInstance.findVerifierById(...args),
    createVerifier: (...args) => dbInstance.createVerifier(...args),
    updateVerifier: (...args) => dbInstance.updateVerifier(...args),
    findAdminByUsername: (...args) => dbInstance.findAdminByUsername(...args),
    findAdminByEmail: (...args) => dbInstance.findAdminByEmail(...args),
    findAdminById: (...args) => dbInstance.findAdminById(...args),
    createAdmin: (...args) => dbInstance.createAdmin(...args),
    updateAdmin: (...args) => dbInstance.updateAdmin(...args),
    createVerificationRecord: (...args) => dbInstance.createVerificationRecord(...args),
    updateVerificationRecord: (...args) => dbInstance.updateVerificationRecord(...args),
    findVerificationRecord: (...args) => dbInstance.findVerificationRecord(...args),
    findVerificationRecordByVerifier: (...args) => dbInstance.findVerificationRecordByVerifier(...args),
    getVerificationRecordsByVerifier: (...args) => dbInstance.getVerificationRecordsByVerifier(...args),
    createAppeal: (...args) => dbInstance.createAppeal(...args),
    findAppeal: (...args) => dbInstance.findAppeal(...args),
    findAppealById: (...args) => dbInstance.findAppealById(...args),
    updateAppeal: (...args) => dbInstance.updateAppeal(...args),
    getAppeals: (...args) => dbInstance.getAppeals(...args),
    getDashboardStats: (...args) => dbInstance.getDashboardStats(...args),
    setDashboardStats: (...args) => dbInstance.setDashboardStats(...args),
    calculateRealDashboardStats: (...args) => dbInstance.calculateRealDashboardStats(...args),
    setToken: (...args) => dbInstance.setToken(...args),
    getToken: (...args) => dbInstance.getToken(...args),
    removeToken: (...args) => dbInstance.removeToken(...args),
    clearAllData: (...args) => dbInstance.clearAllData(...args),
    exportData: (...args) => dbInstance.exportData(...args),
    importData: (...args) => dbInstance.importData(...args)
  };

  return methods;
}

// Export methods safely
export const methodExports = createMethodExports(db);

// Export individual methods for backward compatibility
export const {
  findEmployee,
  createEmployee,
  updateEmployee,
  getAllEmployees,
  seedEmployees,
  findVerifierByEmail,
  findVerifierById,
  createVerifier,
  updateVerifier,
  findAdminByUsername,
  findAdminByEmail,
  findAdminById,
  createAdmin,
  updateAdmin,
  createVerificationRecord,
  findVerificationRecord,
  getVerificationRecordsByVerifier,
  createAppeal,
  findAppeal,
  findAppealById,
  updateAppeal,
  getAppeals,
  getDashboardStats,
  setDashboardStats,
  calculateRealDashboardStats,
  setToken,
  getToken,
  removeToken,
  clearAllData,
  exportData,
  importData
} = methodExports;

// Export methods that need explicit binding
export const getOrCreateDashboardStats = (...args) => db ? db.getOrCreateDashboardStats(...args) : null;