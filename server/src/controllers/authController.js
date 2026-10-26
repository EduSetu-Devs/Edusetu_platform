const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User, StudentProfile, TeacherProfile, ParentProfile, ParentStudent, AdminProfile } = require('../models');
const { sequelize } = require('../config/db');
const { generateToken } = require('../utils/tokenHandler');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'edusetu_dev_jwt_secret_key_2026';

const ALLOWED_ROLES = ['student', 'teacher', 'parent', 'school', 'admin'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Helper to generate a clean unique studentId (e.g. STU0012608)
 */
const generateStudentId = (userId) => {
  const timestampPart = Date.now().toString().slice(-4);
  return `STU${String(userId || '').padStart(3, '0')}${timestampPart}`;
};

/**
 * Helper to generate a clean unique teacherId (e.g. TCH0012608)
 */
const generateTeacherId = (userId) => {
  const timestampPart = Date.now().toString().slice(-4);
  return `TCH${String(userId || '').padStart(3, '0')}${timestampPart}`;
};

/**
 * Helper to generate a clean unique parentId (e.g. PAR0012608)
 */
const generateParentId = (userId) => {
  const timestampPart = Date.now().toString().slice(-4);
  return `PAR${String(userId || '').padStart(3, '0')}${timestampPart}`;
};

/**
 * Helper to generate a clean unique adminId (e.g. ADM0012608)
 */
const generateAdminId = (userId) => {
  const timestampPart = Date.now().toString().slice(-4);
  return `ADM${String(userId || '').padStart(3, '0')}${timestampPart}`;
};

/**
 * Register a new user
 * @route POST /api/auth/register
 */
const register = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      profileImage,
      className,
      section,
      rollNumber,
      department,
      designation,
      subjects,
      qualification,
      experience,
      relationship,
      occupation,
      address,
      studentId,
      studentIds
    } = req.body;

    // 1. Input Validation: Name
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      await transaction.rollback();
      return errorResponse(res, 400, 'Name is required and must be at least 2 characters long');
    }

    // 2. Input Validation: Email
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      await transaction.rollback();
      return errorResponse(res, 400, 'A valid email address is required');
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 3. Input Validation: Password
    if (!password || typeof password !== 'string' || password.length < 8) {
      await transaction.rollback();
      return errorResponse(res, 400, 'Password is required and must be at least 8 characters long');
    }

    // 4. Input Validation: Role
    const userRole = role ? role.toLowerCase().trim() : 'student';
    if (!ALLOWED_ROLES.includes(userRole)) {
      await transaction.rollback();
      return errorResponse(
        res,
        400,
        `Invalid role '${role}'. Allowed roles are: ${ALLOWED_ROLES.join(', ')}`
      );
    }

    // 5. Check for Duplicate Email
    const existingUser = await User.findOne({ where: { email: normalizedEmail }, transaction });
    if (existingUser) {
      await transaction.rollback();
      return errorResponse(res, 409, 'An account with this email address already exists');
    }

    // 6. Create User (password hashing is handled securely in User model hook)
    const newUser = await User.create(
      {
        name: name.trim(),
        email: normalizedEmail,
        password: password,
        role: userRole,
        phone: phone ? phone.trim() : '',
        profileImage: profileImage || '',
        isActive: true
      },
      { transaction }
    );

    // 7. Role-Specific Profile Creation
    let studentProfileData = null;
    let teacherProfileData = null;
    let parentProfileData = null;
    let adminProfileData = null;

    if (userRole === 'student') {
      const generatedId = generateStudentId(newUser.id);
      const studentProfile = await StudentProfile.create(
        {
          userId: newUser.id,
          studentId: generatedId,
          className: className || '',
          section: section || '',
          rollNumber: rollNumber || ''
        },
        { transaction }
      );
      studentProfileData = studentProfile.toJSON();
    } else if (userRole === 'teacher') {
      const generatedId = generateTeacherId(newUser.id);
      const teacherProfile = await TeacherProfile.create(
        {
          userId: newUser.id,
          teacherId: generatedId,
          department: department || '',
          designation: designation || '',
          subjects: Array.isArray(subjects) ? subjects : subjects ? [subjects] : [],
          className: className || '',
          section: section || '',
          phone: phone ? phone.trim() : '',
          qualification: qualification || '',
          experience: experience || ''
        },
        { transaction }
      );
      teacherProfileData = teacherProfile.toJSON();
    } else if (userRole === 'parent') {
      const generatedId = generateParentId(newUser.id);
      const parentProfile = await ParentProfile.create(
        {
          userId: newUser.id,
          parentId: generatedId,
          phone: phone ? phone.trim() : '',
          relationship: relationship || 'Parent',
          occupation: occupation || '',
          address: address || ''
        },
        { transaction }
      );
      parentProfileData = parentProfile.toJSON();

      // Optional Child Mapping at Registration
      const rawChildren = studentIds || (studentId ? [studentId] : []);
      if (Array.isArray(rawChildren) && rawChildren.length > 0) {
        for (const childIdent of rawChildren) {
          const isNum = !isNaN(Number(childIdent));
          const childWhere = isNum
            ? { id: Number(childIdent) }
            : { studentId: String(childIdent) };

          const childProfile = await StudentProfile.findOne({ where: childWhere, transaction });
          if (childProfile) {
            await ParentStudent.create(
              {
                parentProfileId: parentProfile.id,
                studentProfileId: childProfile.id,
                relationship: relationship || 'Child'
              },
              { transaction }
            );
          }
        }
      }
    } else if (userRole === 'admin') {
      const generatedId = generateAdminId(newUser.id);
      const adminProfile = await AdminProfile.create(
        {
          userId: newUser.id,
          adminId: generatedId,
          designation: designation || 'System Administrator',
          department: department || 'Administration'
        },
        { transaction }
      );
      adminProfileData = adminProfile.toJSON();
    }

    // Commit database transaction
    await transaction.commit();

    // 8. Generate JWT token
    const token = generateToken(newUser);

    // 9. Format response payload (password is omitted)
    const responseUser = newUser.toJSON();
    if (studentProfileData) {
      responseUser.studentProfile = studentProfileData;
    }
    if (teacherProfileData) {
      responseUser.teacherProfile = teacherProfileData;
    }
    if (parentProfileData) {
      responseUser.parentProfile = parentProfileData;
    }
    if (adminProfileData) {
      responseUser.adminProfile = adminProfileData;
    }

    return successResponse(res, 201, 'User registered successfully', {
      user: responseUser,
      token
    });

  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    console.error('[Auth Register Error]:', error.message);
    if (error.name === 'SequelizeValidationError') {
      return errorResponse(res, 400, error.errors[0]?.message || 'Validation error');
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return errorResponse(res, 409, 'An account with this email address already exists');
    }
    return errorResponse(res, 500, 'An error occurred during registration. Please try again later.');
  }
};

/**
 * Login existing user
 * @route POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate request body presence
    if (!email || !password) {
      return errorResponse(res, 400, 'Email and password are both required');
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Lookup user by email (include StudentProfile, TeacherProfile, or ParentProfile)
    const user = await User.findOne({
      where: { email: normalizedEmail },
      include: [
        {
          model: StudentProfile,
          as: 'studentProfile',
          required: false
        },
        {
          model: TeacherProfile,
          as: 'teacherProfile',
          required: false
        },
        {
          model: ParentProfile,
          as: 'parentProfile',
          required: false
        }
      ]
    });

    // Generic error message for security (prevent user enumeration)
    const invalidCredentialsMessage = 'Invalid email or password';

    if (!user) {
      return errorResponse(res, 401, invalidCredentialsMessage);
    }

    // 3. Verify password hash using bcrypt
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return errorResponse(res, 401, invalidCredentialsMessage);
    }

    // 4. Check if account is active
    if (!user.isActive) {
      return errorResponse(res, 401, 'Your account has been deactivated. Please contact support.');
    }

    // 5. Generate JWT token
    const token = generateToken(user);

    // 6. Return success response (omits password)
    return successResponse(res, 200, 'Login successful', {
      user: user.toJSON(),
      token
    });

  } catch (error) {
    console.error('[Auth Login Error]:', error.message);
    return errorResponse(res, 500, 'An error occurred during login. Please try again later.');
  }
};

/**
 * Get currently authenticated user details
 * @route GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    // req.user is attached by authMiddleware
    if (!req.user) {
      return errorResponse(res, 401, 'Authentication required');
    }

    // Load full user with profile
    const fullUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: StudentProfile,
          as: 'studentProfile',
          required: false
        },
        {
          model: TeacherProfile,
          as: 'teacherProfile',
          required: false
        },
        {
          model: ParentProfile,
          as: 'parentProfile',
          required: false
        },
        {
          model: AdminProfile,
          as: 'adminProfile',
          required: false
        }
      ]
    });

    return successResponse(res, 200, 'Current user profile retrieved', fullUser ? fullUser.toJSON() : req.user.toJSON());
  } catch (error) {
    console.error('[Auth Me Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve user profile');
  }
};

/**
 * Verify Admin Verification Password for protected Administrator portal access
 * @route POST /api/auth/admin/verify (or /api/auth/verify-admin-password)
 */
const verifyAdminPassword = async (req, res) => {
  try {
    const verificationPassword = req.body.verificationPassword || req.body.adminPassword;

    // 1. Validation: Missing password
    if (!verificationPassword || typeof verificationPassword !== 'string' || !verificationPassword.trim()) {
      return errorResponse(res, 400, 'Admin verification password is required');
    }

    const expectedSecret = process.env.ADMIN_VERIFICATION_PASSWORD || 'EduSetuAdminSecured2026!';

    // 2. Timing-safe comparison using SHA-256 digests to prevent timing attacks
    const inputHash = crypto.createHash('sha256').update(String(verificationPassword.trim())).digest();
    const expectedHash = crypto.createHash('sha256').update(expectedSecret).digest();

    const isMatch = crypto.timingSafeEqual(inputHash, expectedHash);

    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid admin verification.');
    }

    // 3. Issue a short-lived (5 min) Admin Verification Token
    const adminVerificationToken = jwt.sign(
      {
        type: 'admin_verification',
        nonce: crypto.randomUUID()
      },
      JWT_SECRET,
      { expiresIn: '5m' }
    );

    return successResponse(res, 200, 'Admin verification successful', {
      verified: true,
      adminVerificationToken,
      expiresInSeconds: 300
    });

  } catch (error) {
    console.error('[Admin Verification Error]:', error.message);
    return errorResponse(res, 500, 'Verification error. Please try again.');
  }
};

/**
 * Admin Login with Verification Token
 * @route POST /api/auth/admin/login
 */
const adminLogin = async (req, res) => {
  try {
    const { email, password, adminVerificationToken } = req.body;

    // 1. Validate inputs
    if (!email || typeof email !== 'string' || !email.trim()) {
      return errorResponse(res, 400, 'Email or username is required');
    }
    if (!password || typeof password !== 'string') {
      return errorResponse(res, 400, 'Password is required');
    }

    // 2. Validate Admin Verification Token
    if (!adminVerificationToken || typeof adminVerificationToken !== 'string') {
      return errorResponse(res, 401, 'Admin verification token is required. Please verify admin password first.');
    }

    try {
      const decoded = jwt.verify(adminVerificationToken, JWT_SECRET);
      if (decoded.type !== 'admin_verification') {
        return errorResponse(res, 401, 'Invalid verification token type');
      }
    } catch (tokenErr) {
      return errorResponse(res, 401, 'Admin verification token has expired or is invalid. Please re-verify.');
    }

    // 3. Find User by Email
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      where: { email: normalizedEmail },
      include: [
        {
          model: AdminProfile,
          as: 'adminProfile',
          required: false
        }
      ]
    });

    if (!user) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    // 4. Validate Account Password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    // 5. Verify User Role is actually 'admin'
    if (user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied: Account is not an administrator');
    }

    // 6. Check if account is active
    if (!user.isActive) {
      return errorResponse(res, 401, 'Your account has been deactivated. Please contact support.');
    }

    // 7. Generate standard JWT
    const token = generateToken(user);

    return successResponse(res, 200, 'Admin login successful', {
      user: user.toJSON(),
      token
    });

  } catch (error) {
    console.error('[Admin Login Error]:', error.message);
    return errorResponse(res, 500, 'An error occurred during admin login. Please try again later.');
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  verifyAdminPassword,
  adminLogin
};
