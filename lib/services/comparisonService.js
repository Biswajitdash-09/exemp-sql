/**
 * Employee Verification Comparison Service
 * Handles detailed comparison between verifier submitted data and company records
 */

/**
 * Compare verifier data with employee records
 * @param {Object} verifierData - Data submitted by verifier
 * @param {Object} employeeRecord - Official employee record from database
 * @returns {Object} Detailed comparison results
 */
export function compareEmployeeData(verifierData, employeeRecord) {
  const comparisonFields = [
    'employeeId',
    'name',
    'entityName',
    'dateOfJoining',
    'dateOfLeaving',
    'designation',
    'exitReason'
  ];

  const results = {
    comparisonResults: [],
    overallStatus: 'matched',
    matchScore: 100,
    mismatchedFields: [],
    matchedFields: 0,
    totalFields: comparisonFields.length
  };

  comparisonFields.forEach(field => {
    const comparison = compareField(field, verifierData[field], employeeRecord[field]);
    results.comparisonResults.push(comparison);
    
    if (comparison.isMatch) {
      results.matchedFields++;
    } else {
      results.mismatchedFields.push({
        fieldName: comparison.field,
        verifierValue: comparison.verifierValue,
        companyValue: comparison.companyValue
      });
    }
  });

  // Calculate overall status and score
  results.matchScore = Math.round((results.matchedFields / results.totalFields) * 100);
  
  if (results.matchScore === 100) {
    results.overallStatus = 'matched';
  } else if (results.matchScore >= 70) {
    results.overallStatus = 'partial_match';
  } else {
    results.overallStatus = 'mismatch';
  }

  return results;
}

/**
 * Compare individual field with appropriate logic
 * @param {String} fieldName - Name of the field
 * @param {Any} verifierValue - Value provided by verifier
 * @param {Any} companyValue - Official company value
 * @returns {Object} Field comparison result
 */
function compareField(fieldName, verifierValue, companyValue) {
  const comparison = {
    field: fieldName,
    verifierValue: formatValueForDisplay(verifierValue, fieldName),
    companyValue: formatValueForDisplay(companyValue, fieldName),
    isMatch: false,
    matchType: 'mismatch'
  };

  switch (fieldName) {
    case 'employeeId':
      // Exact match, case sensitive
      comparison.isMatch = verifierValue === companyValue;
      comparison.matchType = comparison.isMatch ? 'exact' : 'mismatch';
      break;

    case 'name':
      // Case-insensitive comparison, ignore extra spaces
      const vName = verifierValue?.trim().toLowerCase();
      const cName = companyValue?.trim().toLowerCase();
      comparison.isMatch = vName === cName;
      comparison.matchType = comparison.isMatch ? 'exact' : 'partial';
      break;

    case 'entityName':
    case 'designation':
    case 'exitReason':
      // Exact match for dropdown values
      comparison.isMatch = verifierValue === companyValue;
      comparison.matchType = comparison.isMatch ? 'exact' : 'mismatch';
      break;

    case 'dateOfJoining':
    case 'dateOfLeaving':
      // Date comparison with small tolerance (1 day)
      comparison.isMatch = compareDates(verifierValue, companyValue);
      comparison.matchType = comparison.isMatch ? 'exact' : 'partial';
      break;

    default:
      // Default string comparison
      comparison.isMatch = String(verifierValue || '').trim() === String(companyValue || '').trim();
      comparison.matchType = comparison.isMatch ? 'exact' : 'mismatch';
  }

  // Check if verifier didn't provide value
  if (!verifierValue || verifierValue === '') {
    comparison.isMatch = false;
    comparison.matchType = 'not_provided';
  }

  return comparison;
}

/**
 * Compare two dates with tolerance
 * @param {Date|String} date1 - First date
 * @param {Date|String} date2 - Second date
 * @returns {Boolean} Whether dates match within tolerance
 */
function compareDates(date1, date2) {
  if (!date1 || !date2) return false;
  
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
  
  // Exact date comparison
  const timeDiff = Math.abs(d1.getTime() - d2.getTime());
  const dayDiff = timeDiff / (1000 * 60 * 60 * 24);
  
  return dayDiff <= 1; // Allow 1 day difference for date inputs
}

/**
 * Format value for display in comparison results
 * @param {Any} value - Value to format
 * @param {String} fieldName - Field name for context
 * @returns {String} Formatted value
 */
function formatValueForDisplay(value, fieldName) {
  if (value === null || value === undefined || value === '') {
    return 'Not Provided';
  }

  switch (fieldName) {
    case 'dateOfJoining':
    case 'dateOfLeaving':
      return formatDateForDisplay(value);
      
    case 'employeeId':
      return String(value).toUpperCase();
      
    case 'name':
      return String(value).trim();
      
    case 'entityName':
      return formatEntityName(value);
      
    case 'designation':
      return formatDesignation(value);
      
    case 'exitReason':
      return formatExitReason(value);
      
    default:
      return String(value);
  }
}

/**
 * Format date for display
 * @param {Date|String} date - Date to format
 * @returns {String} Formatted date
 */
function formatDateForDisplay(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  
  return d.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Format entity name for display
 * @param {String} entityName - Entity name
 * @returns {String} Formatted entity name
 */
function formatEntityName(entityName) {
  const entityMap = {
    'TVSCSHIB': 'TVS-CSHIB',
    'HIB': 'HIB'
  };
  return entityMap[entityName] || entityName;
}

/**
 * Format designation for display
 * @param {String} designation - Designation
 * @returns {String} Formatted designation
 */
function formatDesignation(designation) {
  const designationMap = {
    'Executive': 'Executive',
    'Assistant Manager': 'Assistant Manager',
    'Manager': 'Manager'
  };
  return designationMap[designation] || designation;
}

/**
 * Format exit reason for display
 * @param {String} exitReason - Exit reason
 * @returns {String} Formatted exit reason
 */
function formatExitReason(exitReason) {
  const exitReasonMap = {
    'Resigned': 'Resigned',
    'Terminated': 'Terminated',
    'Retired': 'Retired',
    'Absconding': 'Absconding',
    'Contract Completed': 'Contract Completed',
    '其他': 'Others'
  };
  return exitReasonMap[exitReason] || exitReason;
}

/**
 * Get F&F status based on exit reason and dates
 * @param {String} exitReason - Employee exit reason
 * @param {Date} dateOfLeaving - Date of leaving
 * @returns {String} F&F status
 */
export function calculateFnFStatus(exitReason, dateOfLeaving) {
  if (!exitReason || !dateOfLeaving) return 'Pending';
  
  const leavingDate = new Date(dateOfLeaving);
  const currentDate = new Date();
  const daysSinceLeaving = Math.floor((currentDate - leavingDate) / (1000 * 60 * 60 * 24));
  
  // Different logic based on exit reason
  switch (exitReason) {
    case 'Resigned':
    case 'Retired':
    case 'Contract Completed':
      // Usually completed within 30-45 days
      return daysSinceLeaving > 60 ? 'Completed' : 'Pending';
      
    case 'Terminated':
    case 'Absconding':
      // F&F might be pending longer
      return daysSinceLeaving > 90 ? 'Completed' : 'Pending';
      
    default:
      return 'Pending';
  }
}

/**
 * Generate comparison summary for display
 * @param {Object} comparisonResults - Comparison results
 * @returns {String} Summary text
 */
export function generateComparisonSummary(comparisonResults) {
  const { matchedFields, totalFields, overallStatus } = comparisonResults;
  
  switch (overallStatus) {
    case 'matched':
      return `Perfect Match - All ${totalFields} fields match our records.`;
      
    case 'partial_match':
      return `Partial Match - ${matchedFields} of ${totalFields} fields match our records.`;
      
    case 'mismatch':
      return `Significant Mismatch - Only ${matchedFields} of ${totalFields} fields match our records.`;
      
    default:
      return 'Verification completed with mixed results.';
  }
}

/**
 * Get color code for match status
 * @param {Boolean} isMatch - Whether field matches
 * @param {String} matchType - Type of match
 * @returns {String} Color code
 */
export function getMatchColor(isMatch, matchType) {
  if (matchType === 'not_provided') return 'gray';
  return isMatch ? 'green' : 'red';
}