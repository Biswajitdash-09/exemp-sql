import Joi from 'joi';

// Personal email domains to block
const PERSONAL_EMAIL_DOMAINS = [
  '@gmail.com', '@yahoo.com', '@hotmail.com', '@outlook.com',
  '@aol.com', '@icloud.com', '@mail.com', '@protonmail.com'
];

// Custom validation for company email
const companyEmailValidator = Joi.string().email().custom((value, helpers) => {
  const isPersonal = PERSONAL_EMAIL_DOMAINS.some(domain =>
    value.toLowerCase().endsWith(domain.toLowerCase())
  );

  if (isPersonal) {
    return helpers.error('email.company');
  }

  return value;
}, 'Company Email Validator').messages({
  'email.company': 'Personal email domains are not allowed. Please use your company email address.'
});

// Validation schemas
export const schemas = {
  // Verifier registration
  verifierRegistration: Joi.object({
    companyName: Joi.string().trim().min(2).max(100).required()
      .messages({
        'string.empty': 'Company name is required',
        'string.min': 'Company name must be at least 2 characters',
        'string.max': 'Company name cannot exceed 100 characters'
      }),
    email: companyEmailValidator.required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string().min(6).max(128).required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password cannot exceed 128 characters',
        'any.required': 'Password is required'
      })
  }),

  // Verifier login
  verifierLogin: Joi.object({
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string().required()
      .messages({
        'any.required': 'Password is required'
      })
  }),

  // Admin login
  adminLogin: Joi.object({
    username: Joi.string().required()
      .messages({
        'any.required': 'Username is required'
      }),
    password: Joi.string().required()
      .messages({
        'any.required': 'Password is required'
      })
  }),

  // Verification request
  verificationRequest: Joi.object({
    employeeId: Joi.string().trim().required()
      .messages({
        'any.required': 'Employee ID is required'
      }),
    name: Joi.string().trim().min(2).max(100).required()
      .messages({
        'string.empty': 'Employee name is required',
        'string.min': 'Name must be at least 2 characters',
        'any.required': 'Employee name is required'
      }),
    entityName: Joi.string().trim().min(1).max(100).required()
      .messages({
        'string.empty': 'Entity name is required',
        'any.required': 'Entity name is required'
      }),
    dateOfJoining: Joi.date().required()
      .messages({
        'any.required': 'Date of joining is required'
      }),
    dateOfLeaving: Joi.date().greater(Joi.ref('dateOfJoining')).required()
      .messages({
        'date.greater': 'Date of leaving must be after date of joining',
        'any.required': 'Date of leaving is required'
      }),
    designation: Joi.string().trim().min(1).max(100).required()
      .messages({
        'string.empty': 'Designation is required',
        'any.required': 'Designation is required'
      }),
    exitReason: Joi.string().trim().min(1).max(100).required()
      .messages({
        'string.empty': 'Exit reason is required',
        'any.required': 'Exit reason is required'
      }),
    consentGiven: Joi.boolean().valid(true).required()
      .messages({
        'any.only': 'Consent must be given to proceed',
        'any.required': 'Consent confirmation is required'
      })
  }),

  // Appeal submission
  appealSubmission: Joi.object({
    verificationId: Joi.string().required()
      .messages({
        'any.required': 'Verification ID is required'
      }),
    comments: Joi.string().trim().min(10).max(1000).required()
      .messages({
        'string.empty': 'Comments are required',
        'string.min': 'Comments must be at least 10 characters',
        'string.max': 'Comments cannot exceed 1000 characters',
        'any.required': 'Please provide comments for the appeal'
      }),
    mismatchedFields: Joi.array().items(
      Joi.object({
        fieldName: Joi.string().required(),
        verifierValue: Joi.string().required(),
        companyValue: Joi.string().required()
      })
    ).optional()
  }),

  // Appeal response (admin)
  appealResponse: Joi.object({
    status: Joi.string().valid('approved', 'rejected').required()
      .messages({
        'any.only': 'Status must be either approved or rejected',
        'any.required': 'Status is required'
      }),
    hrResponse: Joi.string().trim().min(2).max(2000).required()
      .messages({
        'string.empty': 'HR response is required',
        'string.min': 'HR response must be at least 2 characters',
        'string.max': 'HR response cannot exceed 2000 characters',
        'any.required': 'Please provide HR response'
      })
  }),

  // Employee management (admin)
  employeeUpdate: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    entityName: Joi.string().valid('TVSCSHIB', 'HIB').optional(),
    dateOfJoining: Joi.date().optional(),
    dateOfLeaving: Joi.date().optional(),
    designation: Joi.string().valid('Executive', 'Assistant Manager', 'Manager').optional(),
    exitReason: Joi.string().valid('Resigned', 'Terminated', 'Retired', 'Absconding', 'Contract Completed', '其他').optional(),
    fnfStatus: Joi.string().valid('Completed', 'Pending').optional(),
    department: Joi.string().trim().optional()
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};

// Validation middleware factory
export function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  };
}

// Query validation middleware
export function validateQuery(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors
      });
    }

    next();
  };
}

// Query schemas
export const querySchemas = {
  // Pagination and filtering
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // Date range filter
  dateRange: Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().greater(Joi.ref('startDate')).optional()
      .messages({
        'date.greater': 'End date must be after start date'
      })
  }),

  // Appeal filters
  appealFilters: Joi.object({
    status: Joi.string().valid('pending', 'approved', 'rejected').optional(),
    employeeId: Joi.string().optional(),
    verifierEmail: Joi.string().email().optional()
  }).optional()
};