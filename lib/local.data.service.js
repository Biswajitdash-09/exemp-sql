"use client";

// Use the same keys as our localStorage service
const STORAGE_KEYS = {
  EMPLOYEES: 'employees',
  VERIFIERS: 'verifiers',
  ADMINS: 'admins',
  VERIFICATION_RECORDS: 'verification_records',
  APPEALS: 'appeals',
  AUTH_TOKEN: 'auth_token'
};

// Helper function to safely get data from localStorage
const getData = (key) => {
  if (typeof window === 'undefined') {
    return key === STORAGE_KEYS.EMPLOYEES ? [] :
           key === STORAGE_KEYS.VERIFIERS ? [] :
           key === STORAGE_KEYS.APPEALS ? [] :
           key === STORAGE_KEYS.ADMINS ? [] :
           key === STORAGE_KEYS.VERIFICATION_RECORDS ? [] : null;
  }
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage`, error);
    return null;
  }
};

// Helper function to safely set data to localStorage
const setData = (key, data) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage`, error);
  }
};

/**
 * Initializes the data in localStorage if it doesn't exist.
 */
export const initData = async () => {
  if (typeof window === 'undefined') {
    return;
  }
  
  // Check if we need to seed initial data (only if completely empty)
  const hasExistingData = Object.values(STORAGE_KEYS).some(key => {
    const data = localStorage.getItem(key);
    return data && JSON.parse(data).length > 0;
  });
  
  if (!hasExistingData) {
    // Seed with initial test data
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
      }
    ];
    
    const admins = [
      {
        id: '_admin1',
        username: 'admin',
        email: 'admin@company.com',
        password: 'admin123', // Simple password for demo
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
        password: 'hr123', // Simple password for demo
        fullName: 'HR Manager',
        role: 'hr_manager',
        department: 'Human Resources',
        permissions: ['view_appeals', 'manage_appeals', 'view_employees', 'send_emails', 'view_reports'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    const verifiers = [
      {
        id: '_ver1',
        companyName: 'codemate.ai',
        email: 'adityamathan@codemateai.dev',
        password: 'Aditya@12345', // Simple password for demo
        isEmailVerified: true,
        isActive: true,
        verificationRequests: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    // Set the data
    setData(STORAGE_KEYS.EMPLOYEES, employees);
    setData(STORAGE_KEYS.ADMINS, admins);
    setData(STORAGE_KEYS.VERIFIERS, verifiers);
    setData(STORAGE_KEYS.VERIFICATION_RECORDS, []);
    setData(STORAGE_KEYS.APPEALS, []);
    
    console.log('🌱 Seeded localStorage with test data');
    console.log('📊 Employees:', employees.length, 'Admins:', admins.length, 'Verifiers:', verifiers.length);
    console.log('🔐 Login credentials loaded');
  } else {
    console.log("LocalStorage already contains data.");
  }
};

/**
 * Retrieves the list of verifiers.
 * @returns {Array} A list of verifier objects.
 */
export const getVerifiers = () => {
  const verifiers = getData(STORAGE_KEYS.VERIFIERS);
  return verifiers || [];
};

/**
 * Adds a new verifier to the list.
 * @param {object} verifier - The verifier object to add.
 */
export const addVerifier = (verifier) => {
  const verifiers = getVerifiers();
  const updatedVerifiers = [...verifiers, { ...verifier, id: generateId() }];
  setData(STORAGE_KEYS.VERIFIERS, updatedVerifiers);
};

/**
 * Finds a verifier by their email address.
 * @param {string} email - The email of the verifier to find.
 * @returns {object|null} The verifier object or null if not found.
 */
export const findVerifierByEmail = (email) => {
  const verifiers = getVerifiers();
  return verifiers.find(v => v.email.toLowerCase() === email.toLowerCase()) || null;
};

/**
 * Finds a verifier by their ID.
 * @param {string} id - The ID of the verifier to find.
 * @returns {object|null} The verifier object or null if not found.
 */
export const findVerifierById = (id) => {
  const verifiers = getVerifiers();
  return verifiers.find(v => v.id === id) || null;
};

/**
 * Updates a verifier's data.
 * @param {string} id - The ID of the verifier to update.
 * @param {object} updatedData - The data to merge with the existing verifier data.
 */
export const updateVerifier = (id, updatedData) => {
  const verifiers = getVerifiers();
  const updatedVerifiers = verifiers.map(verifier => {
    if (verifier.id === id) {
      return { ...verifier, ...updatedData, updatedAt: new Date().toISOString() };
    }
    return verifier;
  });
  setData(STORAGE_KEYS.VERIFIERS, updatedVerifiers);
};

/**
 * Clears all notifications for a specific verifier.
 * @param {string} verifierId - The ID of the verifier whose notifications should be cleared.
 */
export const clearVerifierNotifications = (verifierId) => {
  const verifiers = getVerifiers();
  const updatedVerifiers = verifiers.map(verifier => {
    if (verifier.id === verifierId) {
      return { ...verifier, notifications: [] };
    }
    return verifier;
  });
  setData(STORAGE_KEYS.VERIFIERS, updatedVerifiers);
};

/**
 * Retrieves a single employee by their employee ID.
 * @param {string} employeeId - The ID of the employee.
 * @returns {object|null} The employee object or null if not found.
 */
export const findEmployeeById = (employeeId) => {
  const employees = getData(STORAGE_KEYS.EMPLOYEES);
  return employees ? employees.find(e => e.employeeId === employeeId) || null : null;
};

/**
 * Retrieves the list of appeals.
 * @returns {Array} A list of appeal objects.
 */
export const getAppeals = () => {
  const appeals = getData(STORAGE_KEYS.APPEALS);
  return appeals || [];
};

/**
 * Adds a new appeal to the list.
 * @param {object} appeal - The appeal object to add.
 */
export const addAppeal = (appeal) => {
  const appeals = getAppeals();
  const updatedAppeals = [...appeals, { ...appeal, id: generateId() }];
  setData(STORAGE_KEYS.APPEALS, updatedAppeals);
};

/**
 * Updates the status of a specific appeal and notifies the verifier.
 * @param {string} appealId - The ID of the appeal to update.
 * @param {string} status - The new status for the appeal.
 */
export const updateAppeal = (appealId, status) => {
  const appeals = getAppeals();
  let updatedAppeal = null;

  const updatedAppeals = appeals.map(appeal => {
    if (appeal.appealId === appealId) {
      updatedAppeal = { ...appeal, status, updatedAt: new Date().toISOString() };
      return updatedAppeal;
    }
    return appeal;
  });

  setData(STORAGE_KEYS.APPEALS, updatedAppeals);

  // If an appeal was updated, create a notification for the verifier
  if (updatedAppeal) {
    const verifier = findVerifierById(updatedAppeal.verifierId);
    if (verifier) {
      const notification = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9),
        message: `Your appeal for employee ${updatedAppeal.employeeId} has been ${status}.`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      
      const existingNotifications = verifier.notifications || [];
      const newNotifications = [notification, ...existingNotifications];
      
      updateVerifier(verifier.id, { notifications: newNotifications });
    }
  }
};

/**
 * Retrieves a single appeal by its ID.
 * @param {string} appealId - The ID of the appeal.
 * @returns {object|null} The appeal object or null if not found.
 */
export const getAppealById = (appealId) => {
  const appeals = getAppeals();
  return appeals.find(a => a.appealId === appealId || a.id === appealId) || null;
};

/**
 * Retrieves verification records.
 * @returns {Array} A list of verification record objects.
 */
export const getVerificationRecords = () => {
  const records = getData(STORAGE_KEYS.VERIFICATION_RECORDS);
  return records || [];
};

/**
 * Finds verification record by ID.
 * @param {string} verificationId - The verification ID.
 * @returns {object|null} The verification record or null if not found.
 */
export const findVerificationRecord = (verificationId) => {
  const records = getVerificationRecords();
  return records.find(r => r.verificationId === verificationId) || null;
};

/**
 * Adds a new verification record.
 * @param {object} record - The verification record to add.
 */
export const addVerificationRecord = (record) => {
  const records = getVerificationRecords();
  const updatedRecords = [...records, {
    ...record,
    id: generateId(),
    verificationId: generateSequentialId('VER', STORAGE_KEYS.VERIFICATION_RECORDS)
  }];
  setData(STORAGE_KEYS.VERIFICATION_RECORDS, updatedRecords);
};

// Utility functions
function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

function generateSequentialId(prefix, collectionKey) {
  const records = getData(collectionKey) || [];
  const maxId = records.reduce((max, item) => {
    const match = item.verificationId?.match(new RegExp(`${prefix}(\\d+)`));
    if (match) {
      return Math.max(max, parseInt(match[1]));
    }
    return max;
  }, 0);
  return `${prefix}${String(maxId + 1).padStart(6, '0')}`;
}

/**
 * Gets authentication token.
 * @returns {string|null} The auth token.
 */
export const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
};

/**
 * Sets authentication token.
 * @param {string} token - The auth token.
 */
export const setToken = (token) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
};

/**
 * Removes authentication token.
 */
export const removeToken = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
};