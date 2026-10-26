const normalize = value => String(value ?? '').trim().toLowerCase();
const normalizeGrade = value => normalize(value).replace(/^(class|grade)\s*/, '').replace(/\s+/g, '');

const scoreTutorRecommendations = (tutors, preferences, studentClass) => tutors
  .map(tutor => {
    const reasons = [];
    let score = 0;
    const subjects = Array.isArray(tutor.subjects) ? tutor.subjects : [];
    const availabilities = Array.isArray(tutor.availabilities) ? tutor.availabilities : [];
    const subjectMatch = preferences.subject
      ? subjects.some(item => normalize(item.subjectName) === normalize(preferences.subject))
      : false;
    if (subjectMatch) {
      score += 30;
      reasons.push(`Matches your ${preferences.subject} subject`);
    }

    const matchingSubject = subjects.find(item => normalize(item.subjectName) === normalize(preferences.subject));
    const gradeLevels = Array.isArray(matchingSubject?.gradeLevels)
      ? matchingSubject.gradeLevels
      : subjects.flatMap(item => Array.isArray(item.gradeLevels) ? item.gradeLevels : []);
    if (studentClass && gradeLevels.some(grade => normalizeGrade(grade) === normalizeGrade(studentClass))) {
      score += 20;
      reasons.push(/^class\s/i.test(studentClass) ? `Supports ${studentClass}` : `Supports class ${studentClass}`);
    }

    const subjectRate = matchingSubject?.hourlyRate ?? tutor.hourlyRate;
    const hourlyRate = Number(subjectRate);
    if (preferences.budget !== null && Number.isFinite(hourlyRate) && hourlyRate > 0 && hourlyRate <= preferences.budget) {
      score += 20;
      reasons.push('Within your budget');
    }

    if (preferences.language && (Array.isArray(tutor.languages) ? tutor.languages : [])
      .some(item => normalize(item) === normalize(preferences.language))) {
      score += 10;
      reasons.push(`Speaks ${preferences.language}`);
    }

    if (preferences.availability && availabilities.some(item =>
      item.isSlotActive && normalize(item.dayOfWeek) === preferences.availability
    )) {
      score += 10;
      reasons.push(`Available on ${preferences.availability}`);
    }

    if (tutor.verificationStatus === 'verified') {
      score += 5;
      reasons.push('Verified teacher profile');
    }
    const rating = Number(tutor.rating);
    if (Number(tutor.reviewsCount) > 0 && Number.isFinite(rating) && rating >= 4) {
      score += 5;
      reasons.push(`Rated ${rating.toFixed(1)} by students`);
    }

    return {
      id: tutor.id,
      name: tutor.user?.name || 'Teacher',
      profilePicture: tutor.user?.profileImage || null,
      headline: tutor.headline || 'Dedicated Educator',
      experienceYears: Number(tutor.experienceYears) || 0,
      hourlyRate: Number(tutor.hourlyRate) || 0,
      rating: Number(tutor.reviewsCount) ? Number(tutor.rating) || 0 : 0,
      reviewsCount: Number(tutor.reviewsCount) || 0,
      verificationStatus: tutor.verificationStatus,
      isVerified: tutor.verificationStatus === 'verified',
      subjects: subjects.map(item => item.subjectName).filter(Boolean),
      matchingReasons: reasons,
      score
    };
  })
  .sort((first, second) => second.score - first.score || second.rating - first.rating || second.experienceYears - first.experienceYears);

module.exports = { scoreTutorRecommendations };
