const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, StudentProfile, TeacherProfile, ParentProfile, ParentStudent, AdminProfile, EmailVerificationOTP } = require('../models');
const { sequelize } = require('../config/db');
const { generateToken } = require('../utils/tokenHandler');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { setAuthCookies, clearAuthCookies, refreshCsrfCookie } = require('../utils/authCookie');
const emailService = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'edusetu_dev_jwt_secret_key_2026' : undefined);
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be explicitly configured in production environment');
}

const ALLOWED_ROLES = ['student', 'teacher', 'parent'];
const OTP_HASH_SECRET = process.env.OTP_HASH_SECRET || JWT_SECRET;
const DUMMY_PASSWORD_HASH = '$2b$10$ZrtdDfB348Y/x5IzF4JNIuDQcOuOkYQdLhjW9q6u8.X0YQsK849cq';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hashOtp = (normalizedEmail, otp) =>
  crypto.createHmac('sha256', OTP_HASH_SECRET).update(`${normalizedEmail}:${otp}`).digest('hex');

const otpMatches = (storedHash, candidateHash) => Boolean(
  storedHash &&
  storedHash.length === candidateHash.length &&
  crypto.timingSafeEqual(Buffer.from(storedHash), Buffer.from(candidateHash))
);

const authSuccessData = (user, token) => {
  const data = { user };
  // Token exposure is opt-in for non-browser API clients. Browsers use the HttpOnly cookie.
  if (process.env.AUTH_EXPOSE_TOKEN === 'true') data.token = token;
  return data;
};

const completeLogin = (res, user, token, message, statusCode = 200) => {
  setAuthCookies(res, token);
  return successResponse(res, statusCode, message, authSuccessData(user, token));
};

const buildRegistrationPayload = (body, normalizedEmail, userRole, hashedPassword, acceptedAt) => {
  const payload = {
    name: typeof body.name === 'string' ? body.name.trim() : '',
    email: normalizedEmail,
    password: hashedPassword,
    role: userRole,
    phone: typeof body.phone === 'string' ? body.phone.trim() : '',
    profileImage: typeof body.profileImage === 'string' ? body.profileImage : '',
    className: typeof body.className === 'string' ? body.className.trim() : '',
    section: typeof body.section === 'string' ? body.section.trim() : '',
    rollNumber: typeof body.rollNumber === 'string' ? body.rollNumber.trim() : '',
    department: typeof body.department === 'string' ? body.department.trim() : '',
    designation: typeof body.designation === 'string' ? body.designation.trim() : '',
    subjects: Array.isArray(body.subjects) ? body.subjects.slice(0, 20) : [],
    qualification: typeof body.qualification === 'string' ? body.qualification.trim() : '',
    experience: typeof body.experience === 'string' ? body.experience.trim() : '',
    relationship: typeof body.relationship === 'string' ? body.relationship.trim() : '',
    occupation: typeof body.occupation === 'string' ? body.occupation.trim() : '',
    address: typeof body.address === 'string' ? body.address.trim() : '',
    studentId: body.studentId ? String(body.studentId).trim() : '',
    studentIds: Array.isArray(body.studentIds) ? body.studentIds.slice(0, 10).map(String) : [],
    termsAcceptedAt: acceptedAt,
    privacyAcceptedAt: acceptedAt
  };

  return payload;
};

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
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_UNVERIFIED_REGISTRATION !== 'true') {
    return errorResponse(
      res,
      410,
      'Direct registration is disabled. Request an email verification OTP via /api/auth/send-otp, then complete registration via /api/auth/verify-otp.'
    );
  }

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

    return completeLogin(res, responseUser, token, 'User registered successfully', 201);

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
      // Perform a dummy bcrypt comparison to keep response timing similar for unknown emails.
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
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

    // Administrators must pass the separate admin verification flow.
    if (user.role === 'admin') {
      return errorResponse(res, 403, 'Administrator login requires the protected admin portal.');
    }

    // 5. Generate JWT token and set the HttpOnly session cookie
    const token = generateToken(user);

    return completeLogin(res, user.toJSON(), token, 'Login successful');

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

    const expectedSecret = process.env.ADMIN_VERIFICATION_PASSWORD || (process.env.DEMO_MODE === 'true' ? 'EduSetu@AdminPass2026!' : null);
    if (!expectedSecret) {
      console.error('[Admin Verification] ADMIN_VERIFICATION_PASSWORD is not configured; refusing verification.');
      return errorResponse(res, 503, 'Administrator verification is not configured. Contact the system owner.');
    }

    const trimmed = String(verificationPassword.trim());

    const inputHash = crypto.createHash('sha256').update(trimmed).digest();
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
      { expiresIn: '5m', algorithm: 'HS256' }
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
      const decoded = jwt.verify(adminVerificationToken, JWT_SECRET, { algorithms: ['HS256'] });
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
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
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

    // 7. Generate standard JWT and set the HttpOnly session cookie
    const token = generateToken(user);

    return completeLogin(res, user.toJSON(), token, 'Admin login successful');

  } catch (error) {
    console.error('[Admin Login Error]:', error.message);
    return errorResponse(res, 500, 'An error occurred during admin login. Please try again later.');
  }
};

/**
 * Send OTP for New Account Registration
 * @route POST /api/auth/send-otp
 */
const sendRegistrationOtp = async (req, res) => {
  try {
    const { name, email, password, role, acceptedTerms, acceptedPrivacy } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return errorResponse(res, 400, 'Name is required and must be at least 2 characters long');
    }
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return errorResponse(res, 400, 'A valid email address is required');
    }
    const normalizedEmail = email.trim().toLowerCase();

    if (!password || typeof password !== 'string' || password.length < 8) {
      return errorResponse(res, 400, 'Password is required and must be at least 8 characters long');
    }
    if (acceptedTerms !== true || acceptedPrivacy !== true) {
      return errorResponse(res, 400, 'You must accept the Terms of Service and Privacy Policy to create an account');
    }
    const userRole = role ? role.toLowerCase().trim() : 'student';
    if (!ALLOWED_ROLES.includes(userRole)) {
      return errorResponse(res, 400, `Invalid role '${role}'. Allowed roles are: ${ALLOWED_ROLES.join(', ')}`);
    }

    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return errorResponse(res, 409, 'An account with this email address already exists');
    }

    // Cooldown per email in addition to the IP-based rate limiter to prevent email bombing.
    const previousOtp = await EmailVerificationOTP.findOne({
      where: { email: normalizedEmail, verified: false },
      order: [['createdAt', 'DESC']]
    });
    if (previousOtp) {
      const elapsedMs = Date.now() - new Date(previousOtp.createdAt).getTime();
      const cooldownMs = 60 * 1000;
      if (elapsedMs >= 0 && elapsedMs < cooldownMs) {
        const retryAfterSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
        res.setHeader('Retry-After', String(retryAfterSeconds));
        return errorResponse(res, 429, `Please wait ${retryAfterSeconds} seconds before requesting another OTP`);
      }
    }

    // Generate cryptographically secure 6-digit OTP
    const otp = String(crypto.randomInt(100000, 1000000));
    const otpHash = hashOtp(normalizedEmail, otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Delete any previous unverified OTPs for this email
    await EmailVerificationOTP.destroy({ where: { email: normalizedEmail, verified: false } });

    // Pre-hash password before saving into temporary verification payload so cleartext password is never stored
    const hashedPassword = await bcrypt.hash(password, 10);
    const acceptedAt = new Date().toISOString();
    const sanitizedPayload = buildRegistrationPayload(req.body, normalizedEmail, userRole, hashedPassword, acceptedAt);

    const otpRecord = await EmailVerificationOTP.create({
      email: normalizedEmail,
      otp: otpHash,
      payload: JSON.stringify(sanitizedPayload),
      expiresAt,
      verified: false,
      attempts: 0
    });

    let sendResult;
    try {
      sendResult = await emailService.sendOtpEmail(normalizedEmail, otp, name.trim());
    } catch (sendError) {
      await EmailVerificationOTP.destroy({ where: { id: otpRecord.id } });
      throw sendError;
    }

    const isDev = process.env.NODE_ENV !== 'production' && Boolean(sendResult?.devMode);

    return successResponse(res, 200, isDev
      ? `OTP code generated! (Dev Mode: ${otp})`
      : 'OTP sent successfully to your email address', {
      email: normalizedEmail,
      expiresInMinutes: 10,
      devOtp: isDev ? otp : undefined
    });
  } catch (error) {
    console.error('[Send Registration OTP Error]:', error.message);
    return errorResponse(res, 500, 'Failed to send verification OTP. Please try again.');
  }
};

/**
 * Verify OTP and Complete Registration
 * @route POST /api/auth/verify-otp
 */
const verifyAndRegisterOtp = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      await transaction.rollback();
      return errorResponse(res, 400, 'Email and OTP are both required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      await transaction.rollback();
      return errorResponse(res, 400, 'OTP must be a 6-digit code');
    }

    const otpRecord = await EmailVerificationOTP.findOne({
      where: { email: normalizedEmail, verified: false },
      order: [['createdAt', 'DESC']],
      transaction
    });

    if (!otpRecord) {
      await transaction.rollback();
      return errorResponse(res, 400, 'No active OTP found for this email. Please request a new OTP.');
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      await transaction.rollback();
      return errorResponse(res, 400, 'OTP has expired. Please request a new OTP.');
    }

    if (otpRecord.attempts >= 5) {
      await transaction.rollback();
      return errorResponse(res, 400, 'Maximum verification attempts exceeded. Please request a new OTP.');
    }

    const candidateHash = hashOtp(normalizedEmail, cleanOtp);
    const isOtpValid = otpMatches(otpRecord.otp, candidateHash);

    if (!isOtpValid) {
      otpRecord.attempts += 1;
      await otpRecord.save({ transaction });
      await transaction.commit();
      return errorResponse(res, 400, `Invalid OTP code. ${5 - otpRecord.attempts} attempts remaining.`);
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save({ transaction });

    // Parse payload (reject if parse fails or malformed; do not fallback to client req.body)
    let payload = null;
    try {
      payload = JSON.parse(otpRecord.payload || '');
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        payload = null;
      }
    } catch (e) {
      payload = null;
    }

    if (!payload) {
      await transaction.rollback();
      return errorResponse(res, 400, 'Registration session data is invalid or expired. Please request a new OTP.');
    }

    if (payload.email !== normalizedEmail) {
      await transaction.rollback();
      return errorResponse(res, 400, 'Registration session does not match this email address. Please request a new OTP.');
    }

    const {
      name,
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
    } = payload;

    if (!password || typeof password !== 'string') {
      await transaction.rollback();
      return errorResponse(res, 400, 'Password is required to complete registration');
    }

    const userRole = role ? role.toLowerCase().trim() : 'student';
    if (!ALLOWED_ROLES.includes(userRole)) {
      await transaction.rollback();
      return errorResponse(res, 400, `Invalid role '${role}'. Allowed roles are: ${ALLOWED_ROLES.join(', ')}`);
    }

    // Check duplicate email in User table
    const existingUser = await User.findOne({ where: { email: normalizedEmail }, transaction });
    if (existingUser) {
      await transaction.rollback();
      return errorResponse(res, 409, 'An account with this email address already exists');
    }

    const newUser = await User.create(
      {
        name: (name || 'User').trim(),
        email: normalizedEmail,
        password: password,
        role: userRole,
        phone: phone ? phone.trim() : '',
        profileImage: profileImage || '',
        isActive: true,
        termsAcceptedAt: payload.termsAcceptedAt ? new Date(payload.termsAcceptedAt) : null,
        privacyAcceptedAt: payload.privacyAcceptedAt ? new Date(payload.privacyAcceptedAt) : null
      },
      { transaction }
    );

    let studentProfileData = null;
    let teacherProfileData = null;
    let parentProfileData = null;

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

      const rawChildren = studentIds || (studentId ? [studentId] : []);
      if (Array.isArray(rawChildren) && rawChildren.length > 0) {
        for (const childIdent of rawChildren) {
          const isNum = !isNaN(Number(childIdent));
          const childWhere = isNum ? { id: Number(childIdent) } : { studentId: String(childIdent) };
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
    }

    await transaction.commit();

    const token = generateToken(newUser);
    const responseUser = newUser.toJSON();
    if (studentProfileData) responseUser.studentProfile = studentProfileData;
    if (teacherProfileData) responseUser.teacherProfile = teacherProfileData;
    if (parentProfileData) responseUser.parentProfile = parentProfileData;

    return completeLogin(res, responseUser, token, 'Email verified and account registered successfully', 201);
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    console.error('[Verify & Register OTP Error]:', error.message);
    return errorResponse(res, 500, 'An error occurred during account verification. Please try again.');
  }
};

/**
 * Clear the browser session cookies
 * @route POST /api/auth/logout
 */
const logout = (req, res) => {
  clearAuthCookies(res);
  return successResponse(res, 200, 'Logged out successfully');
};

/**
 * Issue a fresh CSRF cookie for an existing cookie session.
 * The CSRF value is intentionally readable by the SPA (double-submit pattern).
 * @route GET /api/auth/csrf
 */
const getCsrfToken = (req, res) => {
  const csrfToken = refreshCsrfCookie(res);
  res.setHeader('Cache-Control', 'no-store');
  return successResponse(res, 200, 'CSRF token issued', { csrfToken });
};

const firebaseAuthService = require('../services/firebaseAuthService');

/**
 * Handle Google / Firebase ID token login and account registration
 * @route POST /api/auth/firebase-login
 */
const firebaseLogin = async (req, res) => {
  const { idToken, role = 'student' } = req.body;
  if (!idToken) {
    return errorResponse(res, 400, 'Firebase ID Token is required');
  }

  let decodedToken;
  try {
    decodedToken = await firebaseAuthService.verifyIdToken(idToken);
  } catch (err) {
    console.error('[Firebase Login Error]:', err.message);
    return errorResponse(res, 401, 'Invalid or expired Firebase token');
  }

  const email = (decodedToken.email || '').toLowerCase().trim();
  if (!email) {
    return errorResponse(res, 400, 'Firebase account does not have an associated email address');
  }

  const name = decodedToken.name || email.split('@')[0];
  const profileImage = decodedToken.picture || '';

  // 1. Check if user already exists
  let user = await User.findOne({
    where: { email },
    include: [
      { model: StudentProfile, as: 'studentProfile' },
      { model: TeacherProfile, as: 'teacherProfile' },
      { model: ParentProfile, as: 'parentProfile' }
    ]
  });

  if (user) {
    if (!user.isActive) {
      return errorResponse(res, 403, 'Your account has been deactivated. Please contact administration.');
    }
    const token = generateToken(user);
    const responseUser = user.toJSON();
    delete responseUser.password;
    return completeLogin(res, responseUser, token, 'Logged in successfully with Google');
  }

  // 2. If new user, create account
  const validRoles = ['student', 'teacher', 'parent'];
  const userRole = validRoles.includes(role.toLowerCase()) ? role.toLowerCase() : 'student';

  const transaction = await sequelize.transaction();
  try {
    const randomPassword = crypto.randomBytes(24).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);
    const acceptedAt = new Date();

    const newUser = await User.create(
      {
        name,
        email,
        password: hashedPassword,
        role: userRole,
        phone: '',
        profileImage,
        isActive: true,
        termsAcceptedAt: acceptedAt,
        privacyAcceptedAt: acceptedAt
      },
      { transaction }
    );

    let studentProfileData = null;
    let teacherProfileData = null;
    let parentProfileData = null;

    if (userRole === 'student') {
      const studentId = `STU${Date.now()}`;
      studentProfileData = await StudentProfile.create(
        {
          userId: newUser.id,
          studentId,
          className: '',
          section: '',
          rollNumber: ''
        },
        { transaction }
      );
    } else if (userRole === 'teacher') {
      const teacherId = `TCH${Date.now()}`;
      teacherProfileData = await TeacherProfile.create(
        {
          userId: newUser.id,
          teacherId,
          department: '',
          designation: 'Instructor'
        },
        { transaction }
      );
    } else if (userRole === 'parent') {
      const parentId = `PAR${Date.now()}`;
      parentProfileData = await ParentProfile.create(
        {
          userId: newUser.id,
          parentId
        },
        { transaction }
      );
    }

    await transaction.commit();

    const token = generateToken(newUser);
    const responseUser = newUser.toJSON();
    delete responseUser.password;
    if (studentProfileData) responseUser.studentProfile = studentProfileData;
    if (teacherProfileData) responseUser.teacherProfile = teacherProfileData;
    if (parentProfileData) responseUser.parentProfile = parentProfileData;

    return completeLogin(res, responseUser, token, 'Account created and logged in with Google successfully', 201);
  } catch (createErr) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    console.error('[Firebase User Creation Error]:', createErr.message);
    return errorResponse(res, 500, 'Failed to complete registration with Google');
  }
};

module.exports = {
  register,
  login,
  logout,
  getCsrfToken,
  getCurrentUser,
  verifyAdminPassword,
  adminLogin,
  sendRegistrationOtp,
  verifyAndRegisterOtp,
  firebaseLogin
};
