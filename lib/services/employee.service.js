/**
 * Employee Data Service
 * Handles all employee-related database operations
 */

import { getData, setData } from './db.core.js';

const EMPLOYEES_KEY = 'employees';

// Find employee by ID
export function findEmployee(employeeId) {
    const employees = getData(EMPLOYEES_KEY);
    return employees.find(e => e.employeeId.toUpperCase() === employeeId.toUpperCase());
}

// Create new employee
export function createEmployee(employeeData) {
    const employees = getData(EMPLOYEES_KEY);

    const newEmployee = {
        ...employeeData,
        createdAt: new Date().toISOString()
    };

    employees.push(newEmployee);
    setData(EMPLOYEES_KEY, employees);

    return newEmployee;
}

// Get all employees
export function getAllEmployees() {
    return getData(EMPLOYEES_KEY);
}

// Update employee
export function updateEmployee(employeeId, updates) {
    const employees = getData(EMPLOYEES_KEY);
    const index = employees.findIndex(e => e.employeeId.toUpperCase() === employeeId.toUpperCase());

    if (index !== -1) {
        employees[index] = { ...employees[index], ...updates };
        setData(EMPLOYEES_KEY, employees);
        return employees[index];
    }

    return null;
}
