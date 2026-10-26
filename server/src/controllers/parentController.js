const { Op } = require('sequelize');
const { User, ParentProfile, StudentProfile, ParentStudent } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Helper to retrieve parent profile for authenticated user
 */
const getParentProfileForUser = async (userId) => {
  let profile = await ParentProfile.findOne({ where: { userId } });
  if (!profile) {
    const timestampPart = Date.now().toString().slice(-4);
    profile = await ParentProfile.create({
      userId,
      parentId: `PAR${String(userId).padStart(3, '0')}${timestampPart}`
    });
  }
  return profile;
};

/**
 * Reusable helper to verify that a parent owns/is linked to a student
 * @param {number} parentProfileId
 * @param {number|string} studentIdentifier - StudentProfile ID or studentId string (e.g. STU001)
 * @returns {Promise<{ student: Object|null, authorized: boolean, mapping: Object|null, reason: string }>}
 */
const verifyParentOwnsStudent = async (parentProfileId, studentIdentifier) => {
  const isNumeric = !isNaN(Number(studentIdentifier));
  const whereClause = {};

  if (isNumeric) {
    whereClause[Op.or] = [{ id: Number(studentIdentifier) }, { studentId: String(studentIdentifier) }];
  } else {
    whereClause.studentId = String(studentIdentifier);
  }

  const student = await StudentProfile.findOne({
    where: whereClause,
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }]
  });

  if (!student) {
    return { student: null, authorized: false, mapping: null, reason: 'Student profile not found' };
  }

  const mapping = await ParentStudent.findOne({
    where: {
      parentProfileId,
      studentProfileId: student.id
    }
  });

  if (!mapping) {
    return {
      student,
      authorized: false,
      mapping: null,
      reason: 'This student is not associated with your parent account'
    };
  }

  return { student, authorized: true, mapping, reason: '' };
};

/**
 * Get Authenticated Parent Profile
 * @route GET /api/parent/profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const parentProfile = await getParentProfileForUser(userId);

    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'role', 'phone', 'profileImage', 'isActive', 'createdAt']
    });

    const responsePayload = {
      id: parentProfile.id,
      userId: user.id,
      parentId: parentProfile.parentId,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: parentProfile.phone || user.phone || '',
      relationship: parentProfile.relationship || 'Parent',
      occupation: parentProfile.occupation || '',
      address: parentProfile.address || '',
      profileImage: user.profileImage || '',
      createdAt: parentProfile.createdAt,
      updatedAt: parentProfile.updatedAt
    };

    return successResponse(res, 200, 'Parent profile retrieved successfully', responsePayload);

  } catch (error) {
    console.error('[Get Parent Profile Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve parent profile');
  }
};

/**
 * Update Authenticated Parent Profile
 * @route PUT /api/parent/profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const parentProfile = await getParentProfileForUser(userId);
    const user = await User.findByPk(userId);

    const { name, phone, relationship, occupation, address, profileImage } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return errorResponse(res, 400, 'Name must be at least 2 characters long');
      }
      user.name = name.trim();
    }

    if (phone !== undefined) {
      user.phone = phone.trim();
      parentProfile.phone = phone.trim();
    }

    if (profileImage !== undefined) {
      user.profileImage = profileImage;
    }

    if (relationship !== undefined) {
      parentProfile.relationship = relationship.trim();
    }

    if (occupation !== undefined) {
      parentProfile.occupation = occupation.trim();
    }

    if (address !== undefined) {
      parentProfile.address = address.trim();
    }

    await user.save();
    await parentProfile.save();

    const responsePayload = {
      id: parentProfile.id,
      userId: user.id,
      parentId: parentProfile.parentId,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: parentProfile.phone,
      relationship: parentProfile.relationship,
      occupation: parentProfile.occupation,
      address: parentProfile.address,
      profileImage: user.profileImage,
      updatedAt: parentProfile.updatedAt
    };

    return successResponse(res, 200, 'Parent profile updated successfully', responsePayload);

  } catch (error) {
    console.error('[Update Parent Profile Error]:', error.message);
    return errorResponse(res, 500, 'Failed to update parent profile');
  }
};

/**
 * Get All Children Linked to Authenticated Parent
 * @route GET /api/parent/children
 */
const getChildren = async (req, res) => {
  try {
    const userId = req.user.id;
    const parentProfile = await getParentProfileForUser(userId);

    const mappings = await ParentStudent.findAll({
      where: { parentProfileId: parentProfile.id },
      include: [
        {
          model: StudentProfile,
          as: 'studentProfile',
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'profileImage'] }]
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    const childrenList = mappings.map((m) => {
      const sp = m.studentProfile;
      return {
        mappingId: m.id,
        relationship: m.relationship || 'Child',
        studentProfileId: sp ? sp.id : null,
        studentId: sp ? sp.studentId : '',
        name: sp?.user?.name || '',
        email: sp?.user?.email || '',
        phone: sp?.user?.phone || '',
        className: sp ? sp.className : '',
        section: sp ? sp.section : '',
        rollNumber: sp ? sp.rollNumber : '',
        dateOfBirth: sp ? sp.dateOfBirth : null,
        bloodGroup: sp ? sp.bloodGroup : '',
        address: sp ? sp.address : '',
        profileImage: sp?.user?.profileImage || ''
      };
    });

    return successResponse(res, 200, 'Linked children retrieved successfully', {
      parent: {
        parentId: parentProfile.parentId,
        relationship: parentProfile.relationship
      },
      count: childrenList.length,
      children: childrenList
    });

  } catch (error) {
    console.error('[Get Parent Children Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve linked children');
  }
};

/**
 * Get Specific Child Profile Details (Verifies Parent Ownership)
 * @route GET /api/parent/children/:studentId
 */
const getChildDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { studentId } = req.params;
    const parentProfile = await getParentProfileForUser(userId);

    const { student, authorized, mapping, reason } = await verifyParentOwnsStudent(
      parentProfile.id,
      studentId
    );

    if (!student) {
      return errorResponse(res, 404, reason || 'Student profile not found');
    }

    if (!authorized) {
      return errorResponse(res, 403, `Access denied. ${reason}`);
    }

    const responsePayload = {
      id: student.id,
      studentId: student.studentId,
      name: student.user?.name || '',
      email: student.user?.email || '',
      phone: student.user?.phone || '',
      className: student.className,
      section: student.section,
      rollNumber: student.rollNumber,
      dateOfBirth: student.dateOfBirth,
      bloodGroup: student.bloodGroup,
      address: student.address,
      relationship: mapping.relationship || 'Child',
      profileImage: student.user?.profileImage || '',
      enrolledAt: student.createdAt
    };

    return successResponse(res, 200, 'Child details retrieved successfully', responsePayload);

  } catch (error) {
    console.error('[Get Child Details Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve child details');
  }
};

/**
 * Link a Student/Child to Authenticated Parent
 * @route POST /api/parent/children/link
 */
const linkChild = async (req, res) => {
  try {
    const userId = req.user.id;
    const { studentId, relationship } = req.body;
    const parentProfile = await getParentProfileForUser(userId);

    if (!studentId) {
      return errorResponse(res, 400, 'Student ID is required to link a child');
    }

    const isNum = !isNaN(Number(studentId));
    const studentWhere = isNum
      ? { [Op.or]: [{ id: Number(studentId) }, { studentId: String(studentId) }] }
      : { studentId: String(studentId) };

    const student = await StudentProfile.findOne({
      where: studentWhere,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
    });

    if (!student) {
      return errorResponse(res, 404, 'Student profile not found');
    }

    const [mapping, created] = await ParentStudent.findOrCreate({
      where: {
        parentProfileId: parentProfile.id,
        studentProfileId: student.id
      },
      defaults: {
        parentProfileId: parentProfile.id,
        studentProfileId: student.id,
        relationship: relationship || 'Child'
      }
    });

    if (!created && relationship) {
      mapping.relationship = relationship;
      await mapping.save();
    }

    return successResponse(res, 200, created ? 'Child linked successfully' : 'Child already linked', {
      studentId: student.studentId,
      name: student.user?.name || '',
      className: student.className,
      section: student.section,
      relationship: mapping.relationship
    });

  } catch (error) {
    console.error('[Link Child Error]:', error.message);
    return errorResponse(res, 500, 'Failed to link child');
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getChildren,
  getChildDetails,
  linkChild,
  verifyParentOwnsStudent
};
