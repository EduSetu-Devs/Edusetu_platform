const { User, TutorProfile, TutorSubject, TutorAvailability, TutorReview } = require('../models');
const { INDIAN_TUTORS_DATA } = require('./indianTutorsData');

/**
 * Idempotently seeds comprehensive Indian tutor profiles into TiDB / MySQL.
 * Safe to run multiple times without duplicating profiles.
 */
const seedIndianTutorsIfNeeded = async (force = false) => {
  try {
    const existingCount = await TutorProfile.count({
      where: { isProfileActive: true }
    });

    // If we already have 35+ tutors and force is not set, no need to re-seed
    if (existingCount >= 35 && !force) {
      console.log(`[Tutor Seeder] Database already populated with ${existingCount} active tutors. Skipping.`);
      return { seeded: false, count: existingCount };
    }

    console.log(`[Tutor Seeder] Seeding rich Indian tutor profiles (current count: ${existingCount})...`);

    // Ensure we have a default demo reviewer student and parent for reviews if needed
    let demoStudent = await User.findOne({ where: { email: 'student.demo@edusetu.in' } });
    if (!demoStudent) {
      demoStudent = await User.create({
        name: 'Aarav Sharma',
        email: 'student.demo@edusetu.in',
        password: 'Password123',
        role: 'student',
        phone: '9800000001',
        isActive: true
      });
    }

    let demoParent = await User.findOne({ where: { email: 'parent.demo@edusetu.in' } });
    if (!demoParent) {
      demoParent = await User.create({
        name: 'Sunita Sharma',
        email: 'parent.demo@edusetu.in',
        password: 'Password123',
        role: 'parent',
        phone: '9800000002',
        isActive: true
      });
    }

    let addedCount = 0;
    for (const tutorData of INDIAN_TUTORS_DATA) {
      // 1. Create or update User
      let user = await User.findOne({ where: { email: tutorData.email } });
      if (!user) {
        user = await User.create({
          name: tutorData.name,
          email: tutorData.email,
          password: 'Password123',
          role: 'teacher',
          phone: tutorData.phone,
          profileImage: tutorData.profileImage,
          isActive: true
        });
      } else {
        await user.update({
          name: tutorData.name,
          profileImage: tutorData.profileImage,
          phone: tutorData.phone
        });
      }

      // 2. Create or update TutorProfile
      let profile = await TutorProfile.findOne({ where: { userId: user.id } });
      const profilePayload = {
        userId: user.id,
        headline: tutorData.headline,
        bio: tutorData.bio,
        qualifications: tutorData.qualifications,
        degree: tutorData.degree,
        university: tutorData.university,
        experienceYears: tutorData.experienceYears,
        teachingExperience: tutorData.teachingExperience,
        teachingMode: tutorData.teachingMode,
        city: tutorData.city,
        area: tutorData.area,
        pincode: tutorData.pincode,
        hourlyRate: tutorData.hourlyRate,
        monthlyRate: tutorData.monthlyRate,
        languages: tutorData.languages,
        rating: tutorData.rating,
        reviewsCount: tutorData.reviewsCount,
        totalStudentsTaught: tutorData.totalStudentsTaught,
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        isAvailable: true,
        isProfileActive: true
      };

      if (!profile) {
        profile = await TutorProfile.create(profilePayload);
        addedCount++;
      } else {
        await profile.update(profilePayload);
      }

      // 3. Populate Subjects
      if (Array.isArray(tutorData.subjects)) {
        for (const sub of tutorData.subjects) {
          const existingSub = await TutorSubject.findOne({
            where: {
              tutorProfileId: profile.id,
              subjectName: sub.subjectName
            }
          });
          if (!existingSub) {
            await TutorSubject.create({
              tutorProfileId: profile.id,
              subjectName: sub.subjectName,
              gradeLevels: sub.gradeLevels,
              hourlyRate: sub.hourlyRate
            });
          }
        }
      }

      // 4. Populate Availabilities
      if (Array.isArray(tutorData.days)) {
        for (const day of tutorData.days) {
          const existingSlot = await TutorAvailability.findOne({
            where: {
              tutorProfileId: profile.id,
              dayOfWeek: day
            }
          });
          if (!existingSlot) {
            await TutorAvailability.create({
              tutorProfileId: profile.id,
              dayOfWeek: day,
              startTime: '16:00',
              endTime: '20:30',
              mode: tutorData.teachingMode,
              isSlotActive: true
            });
          }
        }
      }

      // 5. Populate Reviews
      if (Array.isArray(tutorData.reviews)) {
        for (let i = 0; i < tutorData.reviews.length; i++) {
          const rev = tutorData.reviews[i];
          const reviewer = i % 2 === 0 ? demoStudent : demoParent;
          const reviewerRole = i % 2 === 0 ? 'student' : 'parent';

          const existingReview = await TutorReview.findOne({
            where: {
              tutorProfileId: profile.id,
              reviewerUserId: reviewer.id
            }
          });
          if (!existingReview) {
            await TutorReview.create({
              tutorProfileId: profile.id,
              tutorUserId: user.id,
              reviewerUserId: reviewer.id,
              reviewerRole: reviewerRole,
              rating: rev.rating || 5,
              comment: rev.comment,
              isVerifiedPurchase: true,
              isPublic: true
            });
          }
        }
      }
    }

    const totalNow = await TutorProfile.count({ where: { isProfileActive: true } });
    console.log(`[Tutor Seeder] Successfully seeded ${addedCount} new tutors. Total active tutors: ${totalNow}`);
    return { seeded: true, total: totalNow, added: addedCount };
  } catch (err) {
    console.warn('[Tutor Seeder] Notice while seeding tutors:', err.message);
    return { seeded: false, error: err.message };
  }
};

module.exports = { seedIndianTutorsIfNeeded };
