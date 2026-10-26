require('dotenv').config();
const { User, StudentProfile, sequelize } = require('./src/models');

const port = Number(process.env.TEST_PORT || 5001);
const baseUrl = `http://127.0.0.1:${port}/api`;
const password = 'Password123';
const emails = [];

const request = async (method, path, body, token) => {
  console.log(`REQUEST ${method} ${path}`);
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000)
  });
  console.log(`RESPONSE ${method} ${path}: ${response.status}`);
  let data = {};
  try { data = await response.json(); } catch {}
  return { status: response.status, data };
};

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
};

const register = async (role, label, profileData = {}) => {
  const email = `phase6_${label}_${Date.now()}_${Math.random().toString(36).slice(2)}@edusetu.test`;
  emails.push(email);
  const result = await request('POST', '/auth/register', {
    name: `Phase 6 ${label}`,
    email,
    password,
    role,
    className: 'Phase 6',
    section: 'A',
    ...profileData
  });
  assert(result.status === 201, `${role} account registration`);
  return { token: result.data.data.token, profile: result.data.data.user };
};

const nextDate = () => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 8);
  const dateText = date.toISOString().slice(0, 10);
  const weekday = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getUTCDay()];
  return { dateText, weekday };
};

const dobForAge = age => `${new Date().getUTCFullYear() - age}-01-01`;
const verifiedDob = age => ({
  dateOfBirth: dobForAge(age),
  ageVerificationStatus: 'verified',
  ageVerifiedAt: new Date()
});

(async () => {
  try {
    const tutor = await register('teacher', 'tutor');
    const learner = await register('student', 'learner');
    const otherLearner = await register('student', 'other');
    await StudentProfile.update(verifiedDob(19), { where: { id: learner.profile.studentProfile.id } });
    await StudentProfile.update(verifiedDob(19), { where: { id: otherLearner.profile.studentProfile.id } });
    const parent = await register('parent', 'parent', {
      studentId: learner.profile.studentProfile.studentId
    });
    const minor17 = await register('student', 'minor17');
    await StudentProfile.update(verifiedDob(17), { where: { id: minor17.profile.studentProfile.id } });
    const parent17 = await register('parent', 'parent17', {
      studentId: minor17.profile.studentProfile.studentId
    });
    const minor18 = await register('student', 'minor18');
    await StudentProfile.update(verifiedDob(18), { where: { id: minor18.profile.studentProfile.id } });
    const parent18 = await register('parent', 'parent18', {
      studentId: minor18.profile.studentProfile.studentId
    });
    const missingDob = await register('student', 'missingdob');
    const missingDobParent = await register('parent', 'missingdobparent', {
      studentId: missingDob.profile.studentProfile.studentId
    });

    const profileResult = await request('POST', '/tutor/profile', {
      headline: 'Phase 6 Tutor',
      teachingMode: 'online',
      hourlyRate: 500,
      city: 'Test City',
      area: 'Central',
      isAvailable: true,
      isProfileActive: true
    }, tutor.token);
    assert(profileResult.status === 200, 'tutor saves marketplace profile');
    const tutorProfileId = profileResult.data.data.id;

    const { dateText, weekday } = nextDate();
    const availability = await request('POST', '/tutor/availability', {
      availabilities: [{ dayOfWeek: weekday, startTime: '09:00', endTime: '12:00', mode: 'online', isSlotActive: true }]
    }, tutor.token);
    assert(availability.status === 200, 'tutor saves weekly availability');

    const createRequest = async (learnerToken, extra = {}) => request('POST', '/tutor/requests', {
      tutorProfileId,
      subject: 'Mathematics',
      preferredMode: 'online',
      message: 'Phase 6 booking test',
      ...extra
    }, learnerToken);
    const adultEligibility = await request('GET', '/tutor/assignment-eligibility', null, learner.token);
    assert(adultEligibility.status === 200 && adultEligibility.data.data.canRequest, 'adult student eligibility is calculated by the backend');
    const minor17Eligibility = await request('GET', '/tutor/assignment-eligibility', null, minor17.token);
    assert(minor17Eligibility.status === 200 && !minor17Eligibility.data.data.canRequest &&
      minor17Eligibility.data.data.reason === 'parent_required', '17-year-old student is directed to a linked parent');
    const minor18Eligibility = await request('GET', '/tutor/assignment-eligibility', null, minor18.token);
    assert(minor18Eligibility.status === 200 && !minor18Eligibility.data.data.canRequest, '18-year-old student requires a parent');
    const missingEligibility = await request('GET', '/tutor/assignment-eligibility', null, missingDob.token);
    assert(missingEligibility.status === 200 && !missingEligibility.data.data.canRequest &&
      missingEligibility.data.data.reason === 'age_unverified', 'missing and unverified date of birth is not treated as adult');
    const parentEligibility = await request('GET', '/tutor/assignment-eligibility', null, parent17.token);
    assert(parentEligibility.status === 200 &&
      parentEligibility.data.data.children.some(child => child.studentProfileId === minor17.profile.studentProfile.id && child.canRequest) &&
      !Object.prototype.hasOwnProperty.call(parentEligibility.data.data.children[0], 'dateOfBirth'),
    'parent eligibility includes linked-child permission without exposing date of birth');
    const student17Bypass = await createRequest(minor17.token, { studentProfileId: learner.profile.studentProfile.id });
    assert(student17Bypass.status === 403, 'minor cannot bypass parent assignment by spoofing an adult student profile ID');
    const parentIdentitySpoof = await createRequest(minor17.token, {
      requesterRole: 'parent',
      requesterUserId: parent17.profile.id,
      studentProfileId: minor17.profile.studentProfile.id,
      ageVerificationStatus: 'verified',
      verifiedDateOfBirth: '2000-01-01'
    });
    assert(parentIdentitySpoof.status === 403, 'student cannot claim parent role or user ID in tutor request payload');
    const student18Request = await createRequest(minor18.token);
    assert(student18Request.status === 403, '18-year-old student cannot directly request a tutor');
    const missingDobRequest = await createRequest(missingDob.token);
    assert(missingDobRequest.status === 403, 'student with missing and unverified date of birth cannot request a tutor');
    const invalidDobUpdate = await request('PUT', '/student/profile', { dateOfBirth: '2026-02-30' }, missingDob.token);
    assert(invalidDobUpdate.status === 400, 'student profile rejects an invalid date of birth');
    const adultParentRequest = await createRequest(parent.token, {
      studentProfileId: learner.profile.studentProfile.id
    });
    assert(adultParentRequest.status === 403, 'parent cannot request or manage a tutor for an adult student');
    const unrelatedParent = await register('parent', 'unrelatedparent', {
      studentId: otherLearner.profile.studentProfile.studentId
    });
    const unrelatedChildRequest = await createRequest(unrelatedParent.token, {
      studentProfileId: minor17.profile.studentProfile.id
    });
    assert(unrelatedChildRequest.status === 400, 'parent cannot submit a request for an unlinked student');
    const missingDobParentRequest = await createRequest(missingDobParent.token, {
      studentProfileId: missingDob.profile.studentProfile.id
    });
    assert(missingDobParentRequest.status === 403, 'linked parent cannot request a tutor while the student DOB is unverified');

    const acceptedMinorRequest = await createRequest(parent17.token, {
      studentProfileId: minor17.profile.studentProfile.id
    });
    assert(acceptedMinorRequest.status === 201, 'linked parent can request a tutor for a 17-year-old');
    const minorBookingBypass = await request('POST', '/tutor/bookings', {
      tutorRequestId: acceptedMinorRequest.data.data.id,
      date: dateText,
      startTime: '09:00',
      durationMinutes: 60,
      mode: 'ONLINE'
    }, minor17.token);
    assert(minorBookingBypass.status === 404, 'student cannot book a parent-created tutor request by calling the booking API');
    const accepted18Request = await createRequest(parent18.token, {
      studentProfileId: minor18.profile.studentProfile.id
    });
    assert(accepted18Request.status === 201, 'linked parent can request a tutor for an 18-year-old');
    const pendingRequest = await createRequest(learner.token);
    assert(pendingRequest.status === 201, 'student submits a tutor request');
    assert(pendingRequest.data.data.studentProfileId === learner.profile.studentProfile.id,
      'adult student request always targets the authenticated student profile');
    const rejectedRequest = await request('PUT', `/tutor/requests/${pendingRequest.data.data.id}/reject`, {
      responseMessage: 'No availability for this request'
    }, tutor.token);
    assert(rejectedRequest.status === 200 && rejectedRequest.data.data.status === 'rejected', 'tutor rejects an incoming tutor request');

    const firstRequest = await createRequest(learner.token);
    if (firstRequest.status !== 201) {
      throw new Error(`FAIL: student requests an accepted tutor (${JSON.stringify(firstRequest.data)})`);
    }
    assert(true, 'student requests an accepted tutor');
    const accepted = await request('PUT', `/tutor/requests/${firstRequest.data.data.id}/accept`, {}, tutor.token);
    assert(accepted.status === 200 && !accepted.data.data.teachingSessionId, 'acceptance opens the separate booking step');

    const slotResponse = await request(
      'GET',
      `/tutor/requests/${firstRequest.data.data.id}/available-slots?date=${dateText}&durationMinutes=60&mode=ONLINE`,
      null,
      learner.token
    );
    assert(slotResponse.status === 200 && slotResponse.data.data.slots.includes('09:00'), 'learner sees slots inside active availability');
    const bookingResponse = await request('POST', '/tutor/bookings', {
      tutorRequestId: firstRequest.data.data.id,
      date: dateText,
      startTime: '09:00',
      durationMinutes: 60,
      mode: 'ONLINE',
      topic: 'Linear equations'
    }, learner.token);
    assert(bookingResponse.status === 201 && bookingResponse.data.data.bookingStatus === 'REQUESTED', 'learner requests a TeachingSession booking');
    const bookingId = bookingResponse.data.data.id;

    const confirmed = await request('PATCH', `/tutor/bookings/${bookingId}/confirm`, {}, tutor.token);
    assert(confirmed.status === 200 && confirmed.data.data.bookingStatus === 'CONFIRMED', 'tutor confirms booking');
    const history = await request('GET', '/tutor/bookings', null, learner.token);
    assert(history.status === 200 && history.data.data.some(item => item.id === bookingId), 'learner can view booking history');
    const duplicate = await request('POST', '/tutor/bookings', {
      tutorRequestId: firstRequest.data.data.id,
      date: dateText,
      startTime: '09:00',
      durationMinutes: 60,
      mode: 'ONLINE'
    }, learner.token);
    assert(duplicate.status === 409, 'same tutor request cannot create duplicate booking');
    const pastBooking = await request('POST', '/tutor/bookings', {
      tutorRequestId: firstRequest.data.data.id,
      date: '2000-01-01',
      startTime: '09:00',
      durationMinutes: 60,
      mode: 'ONLINE'
    }, learner.token);
    assert(pastBooking.status === 400, 'server rejects a booking with a past date');

    const otherRequest = await createRequest(otherLearner.token);
    assert(otherRequest.status === 201, 'second student can request same tutor');
    const otherAccepted = await request('PUT', `/tutor/requests/${otherRequest.data.data.id}/accept`, {}, tutor.token);
    assert(otherAccepted.status === 200, 'tutor accepts second request');
    const blockedSlots = await request(
      'GET',
      `/tutor/requests/${otherRequest.data.data.id}/available-slots?date=${dateText}&durationMinutes=60&mode=ONLINE`,
      null,
      otherLearner.token
    );
    assert(blockedSlots.status === 200 && !blockedSlots.data.data.slots.includes('09:00'), 'confirmed sessions are removed from availability');
    const overlap = await request('POST', '/tutor/bookings', {
      tutorRequestId: otherRequest.data.data.id,
      date: dateText,
      startTime: '09:00',
      durationMinutes: 60,
      mode: 'ONLINE'
    }, otherLearner.token);
    assert(overlap.status === 409, 'backend rejects overlapping booking');

    const hidden = await request('GET', `/tutor/bookings/${bookingId}`, null, otherLearner.token);
    assert(hidden.status === 404, 'unrelated student cannot view booking');

    const rescheduled = await request('PATCH', `/tutor/bookings/${bookingId}/reschedule`, {
      date: dateText,
      startTime: '10:00',
      durationMinutes: 60,
      mode: 'ONLINE',
      topic: 'Rescheduled linear equations'
    }, learner.token);
    assert(rescheduled.status === 200 && rescheduled.data.data.bookingStatus === 'REQUESTED' &&
      rescheduled.data.data.startTime === '10:00', 'learner reschedules a booking for tutor confirmation');
    const reconfirmed = await request('PATCH', `/tutor/bookings/${bookingId}/confirm`, {}, tutor.token);
    assert(reconfirmed.status === 200 && reconfirmed.data.data.bookingStatus === 'CONFIRMED', 'tutor confirms the rescheduled booking');
    const rescheduledSlots = await request(
      'GET',
      `/tutor/requests/${otherRequest.data.data.id}/available-slots?date=${dateText}&durationMinutes=60&mode=ONLINE`,
      null,
      otherLearner.token
    );
    assert(rescheduledSlots.status === 200 && rescheduledSlots.data.data.slots.includes('09:00') &&
      !rescheduledSlots.data.data.slots.includes('10:00'), 'availability follows the rescheduled session time');
    const rescheduledOverlap = await request('POST', '/tutor/bookings', {
      tutorRequestId: otherRequest.data.data.id,
      date: dateText,
      startTime: '10:00',
      durationMinutes: 60,
      mode: 'ONLINE'
    }, otherLearner.token);
    assert(rescheduledOverlap.status === 409, 'backend rejects overlap at the rescheduled time');

    const competingBookings = await Promise.all([
      request('POST', '/tutor/bookings', {
        tutorRequestId: otherRequest.data.data.id,
        date: dateText,
        startTime: '09:00',
        durationMinutes: 60,
        mode: 'ONLINE'
      }, otherLearner.token),
      request('POST', '/tutor/bookings', {
        tutorRequestId: otherRequest.data.data.id,
        date: dateText,
        startTime: '09:00',
        durationMinutes: 60,
        mode: 'ONLINE'
      }, otherLearner.token)
    ]);
    const createdCompetingBookings = competingBookings.filter(result => result.status === 201);
    assert(createdCompetingBookings.length === 1 && competingBookings.filter(result => result.status === 409).length === 1,
      'concurrent booking submissions create only one session');
    const competingBookingId = createdCompetingBookings[0].data.data.id;
    const competingDecisions = await Promise.all([
      request('PATCH', `/tutor/bookings/${competingBookingId}/confirm`, {}, tutor.token),
      request('PATCH', `/tutor/bookings/${competingBookingId}/reject`, { reason: 'Decision race test' }, tutor.token)
    ]);
    assert(competingDecisions.filter(result => result.status === 200).length === 1 &&
      competingDecisions.filter(result => result.status === 409).length === 1,
    'concurrent tutor decisions allow only one state transition');
    const competingBooking = await request('GET', `/tutor/bookings/${competingBookingId}`, null, otherLearner.token);
    assert(competingBooking.status === 200 &&
      ['CONFIRMED', 'REJECTED'].includes(competingBooking.data.data.bookingStatus), 'booking retains the winning tutor decision');
    if (competingBooking.data.data.bookingStatus === 'CONFIRMED') {
      const raceBookingCancelled = await request('PATCH', `/tutor/bookings/${competingBookingId}/cancel`, {}, otherLearner.token);
      assert(raceBookingCancelled.status === 200, 'confirmed race-test booking can be cancelled');
    }

    const report = await request('POST', `/tutor/bookings/${bookingId}/reports`, {
      category: 'TUTOR_ISSUE',
      description: 'Test issue for the booking report workflow'
    }, learner.token);
    assert(report.status === 201 && report.data.data.status === 'OPEN', 'participant can report a booking issue');
    const cancelled = await request('PATCH', `/tutor/bookings/${bookingId}/cancel`, { reason: 'Test complete' }, learner.token);
    assert(cancelled.status === 200 && cancelled.data.data.status === 'CANCELLED', 'learner cancels without deleting history');

    const parentRequest = await createRequest(parent17.token, {
      studentProfileId: minor17.profile.studentProfile.id
    });
    assert(parentRequest.status === 201, 'linked parent can request a tutor for their child');
    const parentAccepted = await request('PUT', `/tutor/requests/${parentRequest.data.data.id}/accept`, {}, tutor.token);
    assert(parentAccepted.status === 200, 'tutor accepts linked-parent request');
    const parentBookingResponse = await request('POST', '/tutor/bookings', {
      tutorRequestId: parentRequest.data.data.id,
      date: dateText,
      startTime: '10:00',
      durationMinutes: 60,
      mode: 'ONLINE'
    }, parent17.token);
    assert(parentBookingResponse.status === 201, 'linked parent can schedule their child after tutor acceptance');
    const parentBookingId = parentBookingResponse.data.data.id;
    const minorBookingCancel = await request('PATCH', `/tutor/bookings/${parentBookingId}/cancel`, {}, minor17.token);
    assert(minorBookingCancel.status === 403, 'minor student cannot cancel a parent-managed booking directly');
    const minorBookingReschedule = await request('PATCH', `/tutor/bookings/${parentBookingId}/reschedule`, {
      date: dateText,
      startTime: '11:00',
      durationMinutes: 60,
      mode: 'ONLINE'
    }, minor17.token);
    assert(minorBookingReschedule.status === 403, 'minor student cannot reschedule a parent-managed booking directly');
    const parentHistory = await request('GET', '/tutor/bookings', null, parent17.token);
    assert(parentHistory.status === 200 && parentHistory.data.data.some(item => item.id === parentBookingId), 'parent sees only their linked-child bookings');
    const parentReschedule = await request('PATCH', `/tutor/bookings/${parentBookingId}/reschedule`, {
      date: dateText,
      startTime: '11:00',
      durationMinutes: 60,
      mode: 'ONLINE'
    }, parent17.token);
    assert(parentReschedule.status === 200 && parentReschedule.data.data.bookingStatus === 'REQUESTED',
      'linked parent can manage their underage child booking');
    const parentPendingRequest = await createRequest(parent17.token, {
      studentProfileId: minor17.profile.studentProfile.id
    });
    assert(parentPendingRequest.status === 201, 'linked parent creates a pending request before DOB edit');
    const editedAdultDob = await request('PUT', '/student/profile', {
      dateOfBirth: '2000-01-01',
      ageVerificationStatus: 'verified',
      verifiedDateOfBirth: '2000-01-01'
    }, minor17.token);
    assert(editedAdultDob.status === 200 &&
      editedAdultDob.data.data.ageVerificationStatus === 'pending',
    'student DOB edit invalidates prior verification and enters pending state');
    const staleRequestAcceptance = await request('PUT', `/tutor/requests/${parentPendingRequest.data.data.id}/accept`, {}, tutor.token);
    assert(staleRequestAcceptance.status === 403, 'tutor cannot accept a request after its student age verification is invalidated');
    const adultDobRequestBypass = await createRequest(minor17.token);
    assert(adultDobRequestBypass.status === 403, 'editable adult DOB does not grant independent tutor-request eligibility');
    const adultDobBookingBypass = await request('POST', '/tutor/bookings', {
      tutorRequestId: parentRequest.data.data.id,
      date: dateText,
      startTime: '10:00',
      durationMinutes: 60,
      mode: 'ONLINE'
    }, minor17.token);
    assert(adultDobBookingBypass.status === 404, 'student cannot book a parent-owned request after editable DOB change');
    const minorCancelAfterDobEdit = await request('PATCH', `/tutor/bookings/${parentBookingId}/cancel`, {}, minor17.token);
    assert(minorCancelAfterDobEdit.status === 403, 'student cannot cancel a booking while DOB verification is pending');
    const minorRescheduleAfterDobEdit = await request('PATCH', `/tutor/bookings/${parentBookingId}/reschedule`, {
      date: dateText,
      startTime: '11:00',
      durationMinutes: 60,
      mode: 'ONLINE'
    }, minor17.token);
    assert(minorRescheduleAfterDobEdit.status === 403, 'student cannot reschedule a booking while DOB verification is pending');
    const parentRequestCancelAfterDobEdit = await request(
      'PUT',
      `/tutor/requests/${parentPendingRequest.data.data.id}/cancel`,
      {},
      parent17.token
    );
    assert(parentRequestCancelAfterDobEdit.status === 403, 'parent cannot cancel a request while DOB verification is pending');
    const parentCancelAfterDobEdit = await request('PATCH', `/tutor/bookings/${parentBookingId}/cancel`, {}, parent17.token);
    assert(parentCancelAfterDobEdit.status === 404, 'parent cannot cancel a booking while DOB verification is pending');
    const parentRescheduleAfterDobEdit = await request('PATCH', `/tutor/bookings/${parentBookingId}/reschedule`, {
      date: dateText,
      startTime: '11:00',
      durationMinutes: 60,
      mode: 'ONLINE'
    }, parent17.token);
    assert(parentRescheduleAfterDobEdit.status === 403, 'parent cannot reschedule a booking while DOB verification is pending');
    await StudentProfile.update(verifiedDob(17), { where: { id: minor17.profile.studentProfile.id } });
    const parentReport = await request('POST', `/tutor/bookings/${parentBookingId}/reports`, {
      category: 'BOOKING_ISSUE',
      description: 'Parent booking issue workflow'
    }, parent17.token);
    assert(parentReport.status === 201, 'linked parent can report their booking issue');
    const tutorRejectsBooking = await request('PATCH', `/tutor/bookings/${parentBookingId}/reject`, {
      reason: 'Unable to teach at the requested time'
    }, tutor.token);
    assert(tutorRejectsBooking.status === 200 &&
      tutorRejectsBooking.data.data.bookingStatus === 'REJECTED' &&
      tutorRejectsBooking.data.data.status === 'CANCELLED', 'tutor rejects a booking and preserves its class history');
    const unrelatedParentBooking = await request('GET', `/tutor/bookings/${parentBookingId}`, null, otherLearner.token);
    assert(unrelatedParentBooking.status === 404, 'unrelated learner cannot view a linked-parent booking');

    const classRequest = await createRequest(learner.token);
    assert(classRequest.status === 201, 'learner creates a request for a teaching session');
    const classAccepted = await request('PUT', `/tutor/requests/${classRequest.data.data.id}/accept`, {}, tutor.token);
    assert(classAccepted.status === 200, 'tutor accepts class-session request');
    const classBooking = await request('POST', '/tutor/bookings', {
      tutorRequestId: classRequest.data.data.id,
      date: dateText,
      startTime: '11:00',
      durationMinutes: 60,
      mode: 'ONLINE'
    }, learner.token);
    assert(classBooking.status === 201, 'learner schedules a teaching session');
    const classBookingId = classBooking.data.data.id;
    const classConfirmed = await request('PATCH', `/tutor/bookings/${classBookingId}/confirm`, {}, tutor.token);
    assert(classConfirmed.status === 200 && classConfirmed.data.data.bookingStatus === 'CONFIRMED', 'tutor confirms class session');
    const startedClass = await request('PATCH', `/teacher/sessions/${classBookingId}/start`, {}, tutor.token);
    assert(startedClass.status === 200 && startedClass.data.data.status === 'LIVE', 'confirmed marketplace class can start');
    const joinedClass = await request('POST', `/student/sessions/${classBookingId}/join`, {}, learner.token);
    assert(joinedClass.status === 200 && joinedClass.data.data.status === 'LIVE', 'scheduled student can join the live class');
    const completedClass = await request('PATCH', `/teacher/sessions/${classBookingId}/complete`, {}, tutor.token);
    assert(completedClass.status === 200 && completedClass.data.data.status === 'COMPLETED', 'existing teaching-session lifecycle completes the marketplace class');

    const admin = await register('admin', 'admin');
    const adminBookings = await request('GET', '/admin/marketplace/bookings', null, admin.token);
    assert(adminBookings.status === 200 && adminBookings.data.data.bookings.some(item => item.id === parentBookingId), 'admin can monitor marketplace bookings');
    const adminReports = await request('GET', '/admin/marketplace/reports', null, admin.token);
    assert(adminReports.status === 200 && adminReports.data.data.reports.some(item => item.id === parentReport.data.data.id), 'admin can review booking reports');
    const reviewed = await request('PATCH', `/admin/marketplace/reports/${parentReport.data.data.id}`, {
      status: 'REVIEWED',
      adminNote: 'Reviewed by Phase 6 integration test'
    }, admin.token);
    assert(reviewed.status === 200 && reviewed.data.data.status === 'REVIEWED', 'admin updates booking report status');
  } finally {
    if (emails.length) await User.destroy({ where: { email: emails } });
    await sequelize.close();
  }
})().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
