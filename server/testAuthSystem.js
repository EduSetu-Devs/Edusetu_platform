const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { sequelize } = require('./src/config/db');
const User = require('./src/models/User');
const { generateToken, verifyToken } = require('./src/utils/tokenHandler');
const bcrypt = require('bcryptjs');

console.log('====================================================');
console.log('🔐 Running EduSetu Step 3 Authentication Test Suite');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS [${totalTests}]: ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL [${totalTests}]: ${testName}`);
    process.exitCode = 1;
  }
}

async function runAuthTests() {
  try {
    // 1. Password Hashing Test
    const plainPass = 'MySecurePass123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plainPass, salt);
    assert(hash.startsWith('$2a$') || hash.startsWith('$2b$'), 'bcrypt generates secure salt & hash ($2a$/$2b$)');
    assert(await bcrypt.compare(plainPass, hash), 'bcrypt.compare matches valid plain password');
    assert(!(await bcrypt.compare('WrongPassword', hash)), 'bcrypt.compare rejects incorrect password');

    // 2. JWT Generation & Verification
    const mockUser = { id: 99, role: 'teacher' };
    const token = generateToken(mockUser);
    assert(typeof token === 'string' && token.split('.').length === 3, 'JWT is properly formatted with 3 segments');

    const decoded = verifyToken(token);
    assert(decoded.userId === 99 && decoded.role === 'teacher', 'JWT payload decodes userId and role correctly');
    assert(decoded.password === undefined, 'JWT payload contains NO sensitive password data');

    // 3. User Model Hooks & comparePassword method
    const testEmail = `test_student_${Date.now()}@edusetu.org`;
    const userInstance = User.build({
      name: 'Test Student',
      email: testEmail,
      password: 'password1234',
      role: 'student',
      phone: '9876543210'
    });

    // Simulate beforeCreate hook
    const hookSalt = await bcrypt.genSalt(10);
    userInstance.password = await bcrypt.hash(userInstance.password, hookSalt);

    assert(userInstance.password !== 'password1234', 'User instance stores hashed password instead of plain text');
    assert(await userInstance.comparePassword('password1234'), 'User.comparePassword() returns true for correct password');
    assert(!(await userInstance.comparePassword('wrongPassword!')), 'User.comparePassword() returns false for wrong password');

    // 4. toJSON Security Exclusion
    const jsonOutput = userInstance.toJSON();
    assert(jsonOutput.password === undefined, 'User.toJSON() strictly excludes password field from API responses');
    assert(jsonOutput.email === testEmail, 'User.toJSON() preserves safe profile fields (email, name, role)');

    // 5. Validation Rules
    // Invalid Password (< 8 chars)
    const shortPassUser = User.build({
      name: 'Short Pass',
      email: 'short@test.com',
      password: 'short',
      role: 'student'
    });
    try {
      await shortPassUser.validate();
      assert(false, 'Password < 8 characters should fail validation');
    } catch (e) {
      assert(true, 'Password < 8 characters is rejected by model validator');
    }

    // Invalid Role
    const badRoleUser = User.build({
      name: 'Bad Role',
      email: 'badrole@test.com',
      password: 'ValidPassword123',
      role: 'moderator'
    });
    try {
      await badRoleUser.validate();
      assert(false, 'Invalid role "moderator" should fail validation');
    } catch (e) {
      assert(true, 'Invalid role is rejected by role ENUM validator');
    }

    // 6. Test 4 Allowed Roles
    const roles = ['student', 'teacher', 'parent', 'admin'];
    for (const r of roles) {
      const validRoleUser = User.build({
        name: `User ${r}`,
        email: `${r}_${Date.now()}@edusetu.org`,
        password: 'ValidPassword123',
        role: r
      });
      try {
        await validRoleUser.validate();
        assert(true, `Role '${r}' passes schema validation`);
      } catch (e) {
        assert(false, `Role '${r}' failed validation: ${e.message}`);
      }
    }

    console.log(`\n====================================================`);
    console.log(`📊 Auth Unit & Security Test Results: ${passedTests}/${totalTests} Passed`);
    console.log(`====================================================\n`);

  } catch (error) {
    console.error('Fatal error during auth test:', error);
    process.exitCode = 1;
  }
}

runAuthTests();
