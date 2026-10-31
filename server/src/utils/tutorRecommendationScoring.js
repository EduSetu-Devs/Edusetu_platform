const normalize = value => String(value ?? '').trim().toLowerCase();
const normalizeGrade = value => normalize(value).replace(/^(class|grade)\s*/, '').replace(/\s+/g, '');

const expandSubjectKeywords = (query) => {
  const norm = normalize(query);
  if (!norm) return [];
  const words = norm.split(/[\s,&+/]+/).filter(Boolean);
  const synonyms = new Set([norm, ...words]);

  if (norm.includes('math')) {
    synonyms.add('mathematics');
    synonyms.add('math');
    synonyms.add('maths');
    synonyms.add('calculus');
    synonyms.add('algebra');
  }
  if (norm.includes('phy')) {
    synonyms.add('physics');
    synonyms.add('science');
  }
  if (norm.includes('chem')) {
    synonyms.add('chemistry');
    synonyms.add('science');
  }
  if (norm.includes('bio')) {
    synonyms.add('biology');
    synonyms.add('botany');
    synonyms.add('zoology');
    synonyms.add('neet');
    synonyms.add('science');
  }
  if (norm.includes('code') || norm.includes('python') || norm.includes('cs') || norm.includes('comp')) {
    synonyms.add('computer science');
    synonyms.add('python');
    synonyms.add('coding');
    synonyms.add('computer');
  }
  if (norm.includes('commerce') || norm.includes('account') || norm.includes('eco')) {
    synonyms.add('accountancy');
    synonyms.add('accounts');
    synonyms.add('economics');
    synonyms.add('business studies');
    synonyms.add('commerce');
  }
  if (norm.includes('jee')) {
    synonyms.add('physics');
    synonyms.add('mathematics');
    synonyms.add('chemistry');
  }
  if (norm.includes('eng') || norm.includes('lit')) {
    synonyms.add('english');
    synonyms.add('grammar');
    synonyms.add('literature');
  }
  if (norm.includes('hin')) {
    synonyms.add('hindi');
    synonyms.add('vyakaran');
  }
  if (norm.includes('social') || norm.includes('sst') || norm.includes('hist') || norm.includes('geo')) {
    synonyms.add('social studies');
    synonyms.add('history');
    synonyms.add('geography');
    synonyms.add('civics');
  }
  return [...synonyms];
};

const scoreTutorRecommendations = (tutors, preferences = {}, studentClass = '') => {
  const prefCity = normalize(preferences.city);
  const prefArea = normalize(preferences.area);
  const prefMode = normalize(preferences.teachingMode);
  const subjectKeywords = preferences.subject ? expandSubjectKeywords(preferences.subject) : [];
  const prefBudget = preferences.budget !== null && preferences.budget !== undefined && Number.isFinite(Number(preferences.budget)) && Number(preferences.budget) > 0
    ? Number(preferences.budget)
    : null;

  // STRICT FILTERING: Recommend ONLY what matches the user's searched location and subject
  const candidates = tutors.filter(tutor => {
    const tutorCity = normalize(tutor.city);
    const tutorArea = normalize(tutor.area);
    const tutorMode = normalize(tutor.teachingMode || 'both');
    const subjects = Array.isArray(tutor.subjects) ? tutor.subjects : [];

    // 1. Strict City Filter: If city searched, exclude tutors not located in that city
    if (prefCity) {
      const isCityMatch = Boolean(tutorCity && (tutorCity.includes(prefCity) || prefCity.includes(tutorCity)));
      if (!isCityMatch) return false;
    }

    // 2. Strict Area Filter (if area searched and no city specified)
    if (prefArea && !prefCity) {
      const isAreaMatch = Boolean(
        (tutorArea && (tutorArea.includes(prefArea) || prefArea.includes(tutorArea))) ||
        (tutorCity && (tutorCity.includes(prefArea) || prefArea.includes(tutorCity)))
      );
      if (!isAreaMatch) return false;
    }

    // 3. Strict Subject Filter: If subject searched, exclude tutors who don't teach that subject
    if (subjectKeywords.length > 0) {
      const hasSubject = subjects.some(item => {
        const itemNorm = normalize(typeof item === 'string' ? item : item?.subjectName);
        return subjectKeywords.some(kw => itemNorm.includes(kw) || kw.includes(itemNorm));
      });
      if (!hasSubject) return false;
    }

    // 4. Strict Mode Filter: If user explicitly chose online / offline only
    if (prefMode && ['online', 'offline'].includes(prefMode)) {
      if (tutorMode !== 'both' && tutorMode !== prefMode) return false;
    }

    // 5. Strict Budget Filter: If maximum fee specified
    if (prefBudget !== null) {
      const rate = Number(tutor.hourlyRate) || 0;
      if (rate > 0 && rate > prefBudget) return false;
    }

    return true;
  });

  return candidates
    .map(tutor => {
      const reasons = [];
      let score = 50; // Base score for passing search filters
      const subjects = Array.isArray(tutor.subjects) ? tutor.subjects : [];
      const availabilities = Array.isArray(tutor.availabilities) ? tutor.availabilities : [];

      // 1. Location Matching: City & Locality / Area
      const tutorCity = normalize(tutor.city);
      const tutorArea = normalize(tutor.area);
      const isCityMatch = Boolean(prefCity && tutorCity && (tutorCity.includes(prefCity) || prefCity.includes(tutorCity)));
      const isAreaMatch = Boolean(prefArea && tutorArea && (tutorArea.includes(prefArea) || prefArea.includes(tutorArea)));

      if (isAreaMatch) {
        score += 35;
        reasons.push(`In your locality (${tutor.area})`);
      }

      if (isCityMatch) {
        score += 30;
        reasons.push(`Located in ${tutor.city}`);
        if (tutor.teachingMode === 'both' || tutor.teachingMode === 'offline') {
          score += 10;
          reasons.push(`Available for home / in-person tutoring in ${tutor.city}`);
        }
      }

      // 2. Subject Matching with Synonyms
      const matchingSubject = subjects.find(item => {
        const itemNorm = normalize(typeof item === 'string' ? item : item?.subjectName);
        return subjectKeywords.some(kw => itemNorm.includes(kw) || kw.includes(itemNorm));
      });

      if (matchingSubject) {
        score += 30;
        const subjName = typeof matchingSubject === 'string' ? matchingSubject : matchingSubject.subjectName;
        reasons.push(`Matches your ${subjName || preferences.subject} subject`);
      } else if (preferences.subject) {
        score += 20;
        reasons.push(`Matches ${preferences.subject}`);
      }

      // 3. Grade Level Matching
      const gradeLevels = Array.isArray(matchingSubject?.gradeLevels)
        ? matchingSubject.gradeLevels
        : subjects.flatMap(item => Array.isArray(item?.gradeLevels) ? item.gradeLevels : []);
      if (studentClass && gradeLevels.some(grade => normalizeGrade(grade) === normalizeGrade(studentClass))) {
        score += 20;
        reasons.push(/^class\s/i.test(studentClass) ? `Supports ${studentClass}` : `Supports class ${studentClass}`);
      }

      // 4. Budget Constraint
      const subjectRate = typeof matchingSubject === 'object' ? matchingSubject?.hourlyRate : null;
      const hourlyRate = Number(subjectRate ?? tutor.hourlyRate);
      if (prefBudget !== null && Number.isFinite(hourlyRate) && hourlyRate > 0 && hourlyRate <= prefBudget) {
        score += 20;
        reasons.push(`Within your budget (₹${hourlyRate}/hr)`);
      }

      // 5. Language Preference
      if (preferences.language && (Array.isArray(tutor.languages) ? tutor.languages : [])
        .some(item => normalize(item) === normalize(preferences.language))) {
        score += 10;
        reasons.push(`Speaks ${preferences.language}`);
      }

      // 6. Day Availability
      if (preferences.availability && availabilities.some(item =>
        item.isSlotActive && normalize(item.dayOfWeek) === preferences.availability
      )) {
        score += 10;
        reasons.push(`Available on ${preferences.availability}`);
      }

      // 7. Verification & Rating
      if (tutor.verificationStatus === 'verified') {
        score += 10;
        reasons.push('Verified teacher profile');
      }
      const rating = Number(tutor.rating);
      if (Number(tutor.reviewsCount) > 0 && Number.isFinite(rating) && rating >= 4) {
        score += 10;
        reasons.push(`Rated ${rating.toFixed(1)}★ by students`);
      }

      return {
        id: tutor.id,
        name: tutor.user?.name || tutor.name || 'Teacher',
        profilePicture: tutor.user?.profileImage || tutor.profilePicture || null,
        headline: tutor.headline || 'Dedicated Educator',
        city: tutor.city || '',
        area: tutor.area || '',
        teachingMode: tutor.teachingMode || 'both',
        experienceYears: Number(tutor.experienceYears) || 0,
        hourlyRate: Number(tutor.hourlyRate) || 0,
        rating: Number(tutor.reviewsCount) ? Number(tutor.rating) || 0 : 0,
        reviewsCount: Number(tutor.reviewsCount) || 0,
        verificationStatus: tutor.verificationStatus,
        isVerified: tutor.verificationStatus === 'verified',
        subjects: subjects.map(item => typeof item === 'string' ? item : item?.subjectName).filter(Boolean),
        matchingReasons: reasons,
        score: Math.max(0, score)
      };
    })
    .sort((first, second) => {
      // Area match ranks highest
      if (prefArea) {
        const firstAreaMatch = normalize(first.area).includes(prefArea) || prefArea.includes(normalize(first.area)) ? 1 : 0;
        const secondAreaMatch = normalize(second.area).includes(prefArea) || prefArea.includes(normalize(second.area)) ? 1 : 0;
        if (firstAreaMatch !== secondAreaMatch) return secondAreaMatch - firstAreaMatch;
      }
      return second.score - first.score || second.rating - first.rating || second.experienceYears - first.experienceYears;
    });
};

module.exports = { scoreTutorRecommendations, expandSubjectKeywords };
