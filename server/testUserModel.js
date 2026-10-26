const { sequelize } = require('./src/config/db');
const User = require('./src/models/User');

console.log('--- Running EduSetu Sequelize User Model Unit Verification ---');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

async function runTests() {
  // Test 1: Table Name
  assert(User.getTableName() === 'users', 'Table name is configured as "users"');

  // Test 2: Valid user instance creation
  const validUser = User.build({
    name: '  Aarav Patel  ',
    email: 'AARAV.Patel@School.EDU  ',
    password: 'securePassword123'
  });

  try {
    await validUser.validate();
    assert(true, 'Valid user passes Sequelize schema validation');
  } catch (err) {
    assert(false, `Valid user validation failed: ${err.message}`);
  }

  assert(validUser.name === 'Aarav Patel', 'Name is trimmed automatically');
  assert(validUser.email === 'aarav.patel@school.edu', 'Email is trimmed and converted to lowercase');
  assert(validUser.role === 'student', 'Default role is set to "student"');
  assert(validUser.isActive === true, 'Default isActive is true');

  // Test 3: Missing required fields
  const emptyUser = User.build({});
  try {
    await emptyUser.validate();
    assert(false, 'Empty user should fail validation');
  } catch (err) {
    const errorFields = err.errors?.map((e) => e.path) || [];
    assert(errorFields.includes('name'), 'Name is required');
    assert(errorFields.includes('email'), 'Email is required');
    assert(errorFields.includes('password'), 'Password is required');
  }

  // Test 4: Invalid role
  const invalidRoleUser = User.build({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'superadmin'
  });
  try {
    await invalidRoleUser.validate();
    assert(false, 'Invalid role "superadmin" should be rejected');
  } catch (err) {
    const roleErr = err.errors?.find((e) => e.path === 'role');
    assert(!!roleErr, 'Invalid role is rejected by Sequelize ENUM validator');
  }

  // Test 5: Valid roles
  const validRoles = ['student', 'teacher', 'parent', 'admin'];
  for (const role of validRoles) {
    const roleUser = User.build({
      name: 'User ' + role,
      email: `${role}@example.com`,
      password: 'password123',
      role: role
    });
    try {
      await roleUser.validate();
      assert(true, `Role "${role}" is accepted`);
    } catch (err) {
      assert(false, `Role "${role}" failed: ${err.message}`);
    }
  }

  // Test 6: Invalid email format
  const invalidEmailUser = User.build({
    name: 'Jane Doe',
    email: 'not-an-email',
    password: 'password123'
  });
  try {
    await invalidEmailUser.validate();
    assert(false, 'Invalid email should be rejected');
  } catch (err) {
    const emailErr = err.errors?.find((e) => e.path === 'email');
    assert(!!emailErr, 'Invalid email format is rejected by isEmail validator');
  }

  // Test 7: toJSON omits password
  const safeJson = validUser.toJSON();
  assert(safeJson.password === undefined, 'toJSON() omits password from JSON responses');
  assert(safeJson.email === 'aarav.patel@school.edu', 'toJSON() preserves other attributes');

  console.log(`\nResults: ${passedTests}/${totalTests} tests passed.`);
}

runTests();
