const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sequelize, User, TutorProfile, TutorSubject, TutorAvailability } = require('./src/models');

const tutors = [
  { name: 'Aisha Sharma', email: 'aisha.tutor@edusetu.demo', city: 'Delhi', area: 'Dwarka', headline: 'Maths & Science Tutor (CBSE)', hourlyRate: 450, rating: 4.8, reviewsCount: 12, subjects: [{ subjectName: 'Mathematics', gradeLevels: ['8','9','10'], hourlyRate: 450 }, { subjectName: 'Science', gradeLevels: ['8','9','10'], hourlyRate: 400 }], days: ['monday','wednesday','friday'] },
  { name: 'Rahul Verma', email: 'rahul.tutor@edusetu.demo', city: 'Mumbai', area: 'Andheri', headline: 'English & SST Specialist', hourlyRate: 350, rating: 4.6, reviewsCount: 8, subjects: [{ subjectName: 'English', gradeLevels: ['6','7','8','9'], hourlyRate: 350 }, { subjectName: 'Social Studies', gradeLevels: ['6','7','8'], hourlyRate: 300 }], days: ['tuesday','thursday','saturday'] },
  { name: 'Priya Nair', email: 'priya.tutor@edusetu.demo', city: 'Bengaluru', area: 'Whitefield', headline: 'Physics & Chemistry Expert', hourlyRate: 600, rating: 4.9, reviewsCount: 20, subjects: [{ subjectName: 'Physics', gradeLevels: ['11','12'], hourlyRate: 600 }, { subjectName: 'Chemistry', gradeLevels: ['11','12'], hourlyRate: 550 }], days: ['monday','tuesday','wednesday','thursday'] }
];

(async () => {
  await sequelize.authenticate();
  for (const t of tutors) {
    let user = await User.findOne({ where: { email: t.email } });
    if (!user) {
      user = await User.create({ name: t.name, email: t.email, password: 'Password123', role: 'teacher', phone: '9999999999', isActive: true });
    }
    let profile = await TutorProfile.findOne({ where: { userId: user.id } });
    if (!profile) {
      profile = await TutorProfile.create({
        userId: user.id,
        headline: t.headline,
        bio: `${t.name} is an experienced educator helping students excel.`,
        qualifications: 'B.Ed, M.Sc',
        experienceYears: 5,
        teachingMode: 'both',
        city: t.city,
        area: t.area,
        hourlyRate: t.hourlyRate,
        languages: ['English', 'Hindi'],
        rating: t.rating,
        reviewsCount: t.reviewsCount,
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        isAvailable: true,
        isProfileActive: true
      });
    }
    // subjects
    const existingSubjects = await TutorSubject.count({ where: { tutorProfileId: profile.id } });
    if (existingSubjects === 0) {
      for (const s of t.subjects) {
        await TutorSubject.create({ tutorProfileId: profile.id, subjectName: s.subjectName, gradeLevels: s.gradeLevels, hourlyRate: s.hourlyRate });
      }
    }
    // availability
    const existingAvail = await TutorAvailability.count({ where: { tutorProfileId: profile.id } });
    if (existingAvail === 0) {
      for (const d of t.days) {
        await TutorAvailability.create({ tutorProfileId: profile.id, dayOfWeek: d, startTime: '16:00', endTime: '20:00', mode: 'both', isSlotActive: true });
      }
    }
    console.log('Seeded tutor:', t.name);
  }
  await sequelize.close();
  console.log('Done');
})();
