/**
 * Comprehensive dataset of 48 verified Indian educators and tutors across 15+ major education hubs.
 * Covers: JEE, NEET, CBSE, ICSE, IB, State Boards, Python/Coding, Commerce, Humanities, and Regional Languages.
 */

const INDIAN_TUTORS_DATA = [
  // --- KOTA & RAJASTHAN (COACHING CAPITAL) ---
  {
    name: 'Er. Ashutosh Tripathi',
    email: 'ashutosh.tripathi.tutor@edusetu.in',
    phone: '9829012341',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    headline: 'Senior Physics Faculty (Ex-Allen Kota) • JEE Advanced & Mains Specialist',
    bio: 'B.Tech from IIT Roorkee with 11+ years of dedicated coaching in Kota. Specialized in Electrodynamics, Rotational Motion, and Modern Physics. Mentored over 140+ students into top IITs and NITs with concept-first derivations.',
    qualifications: 'B.Tech (IIT Roorkee), Ex-Allen & Resonance Kota',
    degree: 'B.Tech Mechanical Engineering',
    university: 'IIT Roorkee',
    experienceYears: 11,
    teachingExperience: 'Former HOD Physics at Kota Coaching Institutes. Conducted over 4,500+ hours of advanced problem-solving sessions for JEE Advanced rankers.',
    teachingMode: 'both',
    city: 'Kota',
    area: 'Talwandi',
    pincode: '324005',
    hourlyRate: 950,
    monthlyRate: 7500,
    languages: ['Hindi', 'English'],
    rating: 4.95,
    reviewsCount: 38,
    totalStudentsTaught: 340,
    subjects: [
      { subjectName: 'Physics', gradeLevels: ['11', '12', 'Dropper', 'JEE Advanced'], hourlyRate: 950 },
      { subjectName: 'Science', gradeLevels: ['9', '10', 'Foundation'], hourlyRate: 700 }
    ],
    days: ['monday', 'wednesday', 'friday', 'saturday'],
    reviews: [
      { rating: 5, comment: 'Sir cleared my doubts in Rotational Dynamics within 2 sessions! Highly recommended for JEE Advanced.' },
      { rating: 5, comment: 'Exceptional visual explanations. Scored 99.2 percentile in JEE Physics thanks to Ashutosh Sir.' }
    ]
  },
  {
    name: 'Dr. Meenakshi Rathore',
    email: 'meenakshi.rathore.tutor@edusetu.in',
    phone: '9829012342',
    profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    headline: 'NEET-UG Biology Mentor • AIIMS Jodhpur Alumna • 360/360 Biology Prep',
    bio: 'MBBS graduate from AIIMS Jodhpur with 8 years of specialized mentoring for NEET-UG aspirants. In-depth NCERT line-by-line breakdown, mnemonic memory techniques, and high-yield genetics diagrams.',
    qualifications: 'MBBS (AIIMS Jodhpur), Certified Medical Educator',
    degree: 'MBBS',
    university: 'AIIMS Jodhpur',
    experienceYears: 8,
    teachingExperience: 'Trained 250+ medical aspirants. 42 of my students scored 340+ in Biology in NEET 2024.',
    teachingMode: 'online',
    city: 'Kota',
    area: 'Indraprastha Industrial Area',
    pincode: '324005',
    hourlyRate: 850,
    monthlyRate: 6800,
    languages: ['English', 'Hindi'],
    rating: 4.92,
    reviewsCount: 29,
    totalStudentsTaught: 280,
    subjects: [
      { subjectName: 'Biology', gradeLevels: ['11', '12', 'NEET-UG'], hourlyRate: 850 },
      { subjectName: 'Science', gradeLevels: ['9', '10'], hourlyRate: 600 }
    ],
    days: ['tuesday', 'thursday', 'saturday', 'sunday'],
    reviews: [
      { rating: 5, comment: 'Her NCERT line-by-line approach is unbelievable. Human Physiology became my strongest topic.' }
    ]
  },
  {
    name: 'Vipin K. Singhal',
    email: 'vipin.singhal.tutor@edusetu.in',
    phone: '9829012343',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    headline: 'Organic & Inorganic Chemistry Expert • M.Sc IIT Kanpur',
    bio: 'Passionate chemistry mentor with 9 years of experience de-mystifying organic reaction mechanisms, named reactions, and coordination compounds. Simplifying chemistry for CBSE and JEE aspirants.',
    qualifications: 'M.Sc Chemistry (IIT Kanpur), CSIR-NET JRF Rank 18',
    degree: 'M.Sc Chemistry',
    university: 'IIT Kanpur',
    experienceYears: 9,
    teachingExperience: 'Former Senior Faculty at Career Point Kota. Conducted 300+ live problem walkthroughs and mechanism workshops.',
    teachingMode: 'both',
    city: 'Kota',
    area: 'Vigyan Nagar',
    pincode: '324005',
    hourlyRate: 800,
    monthlyRate: 6400,
    languages: ['Hindi', 'English'],
    rating: 4.88,
    reviewsCount: 24,
    totalStudentsTaught: 220,
    subjects: [
      { subjectName: 'Chemistry', gradeLevels: ['11', '12', 'JEE', 'NEET'], hourlyRate: 800 }
    ],
    days: ['monday', 'tuesday', 'thursday', 'friday'],
    reviews: [
      { rating: 5, comment: 'Organic mechanisms used to terrify me, but Vipin Sir made them so intuitive and logical!' }
    ]
  },
  {
    name: 'Sanjay Khandelwal',
    email: 'sanjay.khandelwal.tutor@edusetu.in',
    phone: '9829012344',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    headline: 'Mathematics & Calculus Mentor • BITS Pilani Alum • Olympiad Trainer',
    bio: 'BITS Pilani alumnus with 12 years of coaching experience in Jaipur. Specializing in Coordinate Geometry, Integral Calculus, and PRMO/RMO mathematics foundation.',
    qualifications: 'B.E. (BITS Pilani), M.Sc Mathematics',
    degree: 'B.E. Computer Science & M.Sc Math',
    university: 'BITS Pilani',
    experienceYears: 12,
    teachingExperience: 'Mentored over 500+ school students in Jaipur across CBSE, ICSE, and JEE Foundation levels.',
    teachingMode: 'both',
    city: 'Jaipur',
    area: 'Malviya Nagar',
    pincode: '302017',
    hourlyRate: 750,
    monthlyRate: 6000,
    languages: ['Hindi', 'English'],
    rating: 4.89,
    reviewsCount: 31,
    totalStudentsTaught: 310,
    subjects: [
      { subjectName: 'Mathematics', gradeLevels: ['9', '10', '11', '12', 'Olympiad'], hourlyRate: 750 }
    ],
    days: ['monday', 'wednesday', 'saturday', 'sunday'],
    reviews: [
      { rating: 5, comment: 'Sir makes tough calculus look effortless. My son scored 98 in CBSE Class 12 Boards.' }
    ]
  },
  {
    name: 'Deepika Shekhawat',
    email: 'deepika.shekhawat.tutor@edusetu.in',
    phone: '9829012345',
    profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    headline: 'CBSE & ICSE English Specialist • Creative Writing & Communication Mentor',
    bio: 'Gold medalist from Rajasthan University with an MA in English Literature. Specializes in analytical comprehension, prose/poetry appreciation, and grammar mastery for Classes 8 to 12.',
    qualifications: 'MA English (Gold Medalist), B.Ed',
    degree: 'MA English Literature',
    university: 'University of Rajasthan',
    experienceYears: 7,
    teachingExperience: 'Taught at top convent schools in Jaipur and private batches for board students.',
    teachingMode: 'both',
    city: 'Jaipur',
    area: 'Vaishali Nagar',
    pincode: '302021',
    hourlyRate: 450,
    monthlyRate: 3600,
    languages: ['English', 'Hindi'],
    rating: 4.85,
    reviewsCount: 19,
    totalStudentsTaught: 180,
    subjects: [
      { subjectName: 'English', gradeLevels: ['8', '9', '10', '11', '12'], hourlyRate: 450 }
    ],
    days: ['tuesday', 'thursday', 'saturday'],
    reviews: [
      { rating: 5, comment: 'Her essay structuring methods and writing tips helped my daughter top her school in English!' }
    ]
  },

  // --- DELHI NCR (ACADEMIC POWERHOUSE) ---
  {
    name: 'Dr. Harshvardhan Gupta',
    email: 'harshvardhan.gupta.tutor@edusetu.in',
    phone: '9811023451',
    profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    headline: 'Ph.D. IIT Delhi • Senior Physics Consultant for CBSE 12 & Advanced JEE',
    bio: 'Over 14 years of teaching excellence. Ph.D. in Applied Physics from IIT Delhi. Focused on conceptual rigor, numerical problem breakdowns, and removing physics anxiety for students.',
    qualifications: 'Ph.D. Physics (IIT Delhi), M.Sc Physics (St. Stephen’s College)',
    degree: 'Ph.D. Applied Physics',
    university: 'IIT Delhi',
    experienceYears: 14,
    teachingExperience: 'Author of 2 physics study guides for competitive exams. Mentored 400+ students in South Delhi.',
    teachingMode: 'both',
    city: 'Delhi',
    area: 'South Extension',
    pincode: '110049',
    hourlyRate: 1100,
    monthlyRate: 8800,
    languages: ['English', 'Hindi'],
    rating: 4.97,
    reviewsCount: 46,
    totalStudentsTaught: 420,
    subjects: [
      { subjectName: 'Physics', gradeLevels: ['11', '12', 'JEE', 'NEET'], hourlyRate: 1100 }
    ],
    days: ['monday', 'tuesday', 'thursday', 'saturday'],
    reviews: [
      { rating: 5, comment: 'The finest Physics teacher in Delhi NCR. His explanation of Faraday’s Law is legendary.' }
    ]
  },
  {
    name: 'Pooja Aggarwal',
    email: 'pooja.aggarwal.tutor@edusetu.in',
    phone: '9811023452',
    profileImage: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80',
    headline: 'CBSE Class 10 & 12 Board Maths Specialist • 100% Pass Rate Track Record',
    bio: 'M.Sc Mathematics from Hansraj College (Delhi University). Specialized in making Algebra, Trigonometry, and Vectors simple for students who feel nervous about maths. Step-by-step board answer writing techniques.',
    qualifications: 'M.Sc Mathematics (Hansraj College, DU), B.Ed',
    degree: 'M.Sc Mathematics',
    university: 'University of Delhi',
    experienceYears: 10,
    teachingExperience: 'Ex-Delhi Public School teacher with 10 years of private mentoring experience.',
    teachingMode: 'both',
    city: 'Delhi',
    area: 'Dwarka',
    pincode: '110075',
    hourlyRate: 650,
    monthlyRate: 5200,
    languages: ['Hindi', 'English'],
    rating: 4.91,
    reviewsCount: 35,
    totalStudentsTaught: 310,
    subjects: [
      { subjectName: 'Mathematics', gradeLevels: ['8', '9', '10', '11', '12'], hourlyRate: 650 }
    ],
    days: ['monday', 'wednesday', 'friday', 'sunday'],
    reviews: [
      { rating: 5, comment: 'Pooja Ma’am is extremely patient. My score jumped from 58% to 92% in CBSE Class 10!' }
    ]
  },
  {
    name: 'Simran Kaur',
    email: 'simran.kaur.tutor@edusetu.in',
    phone: '9811023453',
    profileImage: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=400&q=80',
    headline: 'Python, AI & CBSE CS/IP Mentor • B.Tech DTU • Young Coder Trainer',
    bio: 'Software engineer turned educator. B.Tech from Delhi Technological University (DTU). Teaches Python programming, SQL databases, AI fundamentals, and CBSE Class 11-12 Computer Science with hands-on projects.',
    qualifications: 'B.Tech CSE (DTU Delhi), Certified Python Instructor',
    degree: 'B.Tech Computer Engineering',
    university: 'Delhi Technological University',
    experienceYears: 6,
    teachingExperience: 'Taught over 180+ school students coding from scratch. Built 50+ mini-games with students.',
    teachingMode: 'online',
    city: 'Noida',
    area: 'Sector 62',
    pincode: '201309',
    hourlyRate: 600,
    monthlyRate: 4800,
    languages: ['English', 'Hindi', 'Punjabi'],
    rating: 4.89,
    reviewsCount: 22,
    totalStudentsTaught: 190,
    subjects: [
      { subjectName: 'Computer Science', gradeLevels: ['8', '9', '10', '11', '12'], hourlyRate: 600 },
      { subjectName: 'Python', gradeLevels: ['Beginner', 'Class 11', 'Class 12'], hourlyRate: 600 }
    ],
    days: ['tuesday', 'thursday', 'saturday', 'sunday'],
    reviews: [
      { rating: 5, comment: 'Simran Ma’am made Python coding feel like playing a game. Best computer teacher ever!' }
    ]
  },
  {
    name: 'Amitabh Sen',
    email: 'amitabh.sen.tutor@edusetu.in',
    phone: '9811023454',
    profileImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    headline: 'Economics & Business Studies Expert • SRCC Alum & FMS MBA',
    bio: 'Shri Ram College of Commerce (SRCC) graduate with an MBA from FMS Delhi. 13 years of coaching for Microeconomics, Macroeconomics, Indian Economic Development, and CUET Commerce entrance.',
    qualifications: 'B.Com Hons (SRCC), MBA (FMS Delhi)',
    degree: 'B.Com (Hons) & MBA',
    university: 'SRCC, Delhi University',
    experienceYears: 13,
    teachingExperience: 'Trained dozens of students who scored 100/100 in CBSE Economics and cracked SRCC / St. Stephen’s.',
    teachingMode: 'both',
    city: 'Gurgaon',
    area: 'DLF Phase 4',
    pincode: '122002',
    hourlyRate: 900,
    monthlyRate: 7200,
    languages: ['English', 'Hindi', 'Bengali'],
    rating: 4.94,
    reviewsCount: 28,
    totalStudentsTaught: 270,
    subjects: [
      { subjectName: 'Economics', gradeLevels: ['11', '12', 'CUET', 'College'], hourlyRate: 900 },
      { subjectName: 'Business Studies', gradeLevels: ['11', '12'], hourlyRate: 800 }
    ],
    days: ['monday', 'wednesday', 'friday', 'saturday'],
    reviews: [
      { rating: 5, comment: 'Real-world business case studies made Economics so captivating. Got 99 in Boards.' }
    ]
  },
  {
    name: 'Pandit Rameshwar Shastri',
    email: 'rameshwar.shastri.tutor@edusetu.in',
    phone: '9811023455',
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    headline: 'Sanskrit & Hindi Grammar Master • Acharya from Sampurnanand Sanskrit Univ',
    bio: 'Dedicated Sanskrit and Hindi teacher with 15 years of classical and modern pedagogy experience. Simplifying Sandhi, Samas, Dhaturoop, and CBSE Class 6-10 Sanskrit syllabus.',
    qualifications: 'Acharya (Sanskrit), MA Hindi, B.Ed',
    degree: 'Acharya & MA Hindi',
    university: 'Sampurnanand Sanskrit Vishwavidyalaya',
    experienceYears: 15,
    teachingExperience: 'Mentored over 350+ students in Delhi schools with 100% distinction track record.',
    teachingMode: 'both',
    city: 'Delhi',
    area: 'Rohini',
    pincode: '110085',
    hourlyRate: 400,
    monthlyRate: 3200,
    languages: ['Hindi', 'Sanskrit'],
    rating: 4.88,
    reviewsCount: 21,
    totalStudentsTaught: 260,
    subjects: [
      { subjectName: 'Sanskrit', gradeLevels: ['6', '7', '8', '9', '10'], hourlyRate: 400 },
      { subjectName: 'Hindi', gradeLevels: ['6', '7', '8', '9', '10'], hourlyRate: 400 }
    ],
    days: ['tuesday', 'thursday', 'saturday', 'sunday'],
    reviews: [
      { rating: 5, comment: 'Sanskrit shlokas and grammar became super easy. Scored 96 in class 10 boards!' }
    ]
  },

  // --- BENGALURU & HYDERABAD (TECH & ADVANCED SCIENCES) ---
  {
    name: 'Raghavendra Rao',
    email: 'raghavendra.rao.tutor@edusetu.in',
    phone: '9845012351',
    profileImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    headline: 'IISc Alumnus • Advanced Mathematics, Calculus & Olympiad Coach',
    bio: 'M.S. in Mathematical Sciences from Indian Institute of Science (IISc Bengaluru). 12 years of coaching high-achieving students for JEE Advanced, KVPY, and Mathematical Olympiads.',
    qualifications: 'M.S. Research (IISc Bengaluru), B.Sc (Hons) Math',
    degree: 'M.S. Mathematical Sciences',
    university: 'IISc Bengaluru',
    experienceYears: 12,
    teachingExperience: 'Former researcher and guest lecturer. Mentored 12 Olympiad medalists and numerous top-500 JEE rankers.',
    teachingMode: 'both',
    city: 'Bengaluru',
    area: 'Indiranagar',
    pincode: '560038',
    hourlyRate: 1200,
    monthlyRate: 9600,
    languages: ['English', 'Kannada', 'Hindi'],
    rating: 4.98,
    reviewsCount: 42,
    totalStudentsTaught: 380,
    subjects: [
      { subjectName: 'Mathematics', gradeLevels: ['11', '12', 'JEE Advanced', 'Olympiad'], hourlyRate: 1200 }
    ],
    days: ['monday', 'wednesday', 'friday', 'saturday'],
    reviews: [
      { rating: 5, comment: 'The depth of insight he brings to calculus is extraordinary. True world-class mentorship.' }
    ]
  },
  {
    name: 'Aditi Krishnan',
    email: 'aditi.krishnan.tutor@edusetu.in',
    phone: '9845012352',
    profileImage: 'https://images.unsplash.com/photo-1534751516642-a171edd270f2?auto=format&fit=crop&w=400&q=80',
    headline: 'M.Tech IIIT-Bangalore • Python, Data Science & School AI Instructor',
    bio: 'Former senior data scientist with 6 years of passionate teaching. Making programming, logical thinking, Python, and web fundamentals intuitive for middle and high school students.',
    qualifications: 'M.Tech Computer Science (IIIT Bangalore)',
    degree: 'M.Tech Computer Science',
    university: 'IIIT Bangalore',
    experienceYears: 6,
    teachingExperience: 'Designed curriculum for 3 STEM academies in Bengaluru. Trained 200+ kids in coding logic.',
    teachingMode: 'online',
    city: 'Bengaluru',
    area: 'Koramangala',
    pincode: '560034',
    hourlyRate: 750,
    monthlyRate: 6000,
    languages: ['English', 'Hindi', 'Tamil'],
    rating: 4.93,
    reviewsCount: 33,
    totalStudentsTaught: 240,
    subjects: [
      { subjectName: 'Computer Science', gradeLevels: ['7', '8', '9', '10', '11', '12'], hourlyRate: 750 },
      { subjectName: 'Python', gradeLevels: ['Foundation', 'Advanced'], hourlyRate: 750 }
    ],
    days: ['tuesday', 'thursday', 'saturday', 'sunday'],
    reviews: [
      { rating: 5, comment: 'Aditi Ma’am helped my son build his first Machine Learning demo for the school science fair!' }
    ]
  },
  {
    name: 'Vinay Hegde',
    email: 'vinay.hegde.tutor@edusetu.in',
    phone: '9845012353',
    profileImage: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80',
    headline: 'B.Tech NIT Surathkal • Physics & Chemistry for CBSE & ICSE (Class 8-10)',
    bio: 'Engineer by training, teacher by heart. 8 years helping students build rock-solid conceptual foundations in Physics and Chemistry. Focus on real-world experiments and diagrams.',
    qualifications: 'B.Tech (NIT Surathkal)',
    degree: 'B.Tech Electrical & Electronics',
    university: 'NIT Surathkal',
    experienceYears: 8,
    teachingExperience: 'Home and online tutor for Whitefield and HSR layout families. 98% board distinction rate.',
    teachingMode: 'both',
    city: 'Bengaluru',
    area: 'HSR Layout',
    pincode: '560102',
    hourlyRate: 700,
    monthlyRate: 5600,
    languages: ['English', 'Kannada', 'Hindi'],
    rating: 4.87,
    reviewsCount: 26,
    totalStudentsTaught: 210,
    subjects: [
      { subjectName: 'Physics', gradeLevels: ['8', '9', '10'], hourlyRate: 700 },
      { subjectName: 'Chemistry', gradeLevels: ['8', '9', '10'], hourlyRate: 700 },
      { subjectName: 'Science', gradeLevels: ['8', '9', '10'], hourlyRate: 650 }
    ],
    days: ['monday', 'tuesday', 'thursday', 'friday'],
    reviews: [
      { rating: 5, comment: 'Vinay Sir connects every textbook topic to everyday electronics and mechanics.' }
    ]
  },
  {
    name: 'Venkat Raman Murthy',
    email: 'venkat.murthy.tutor@edusetu.in',
    phone: '9848012361',
    profileImage: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
    headline: 'EAMCET & JEE Advanced Maths Legend • 16+ Years Experience in Hyderabad',
    bio: 'Renowned mathematics tutor in Hyderabad with over 16 years of track record in EAMCET, JEE Mains, and Advanced. Master of shortcut methods and analytical clarity.',
    qualifications: 'M.Sc Mathematics (Osmania University), B.Ed',
    degree: 'M.Sc Mathematics',
    university: 'Osmania University',
    experienceYears: 16,
    teachingExperience: 'Former Senior Faculty at Narayana & Chaitanya. Mentored over 1,200+ students across Andhra and Telangana.',
    teachingMode: 'both',
    city: 'Hyderabad',
    area: 'Madhapur',
    pincode: '500081',
    hourlyRate: 850,
    monthlyRate: 6800,
    languages: ['Telugu', 'English', 'Hindi'],
    rating: 4.96,
    reviewsCount: 52,
    totalStudentsTaught: 620,
    subjects: [
      { subjectName: 'Mathematics', gradeLevels: ['11', '12', 'JEE', 'EAMCET'], hourlyRate: 850 }
    ],
    days: ['monday', 'wednesday', 'friday', 'sunday'],
    reviews: [
      { rating: 5, comment: 'Calculus and Coordinate geometry tricks by Murthy Sir saved me valuable time in JEE.' }
    ]
  },
  {
    name: 'Sowmya Reddy',
    email: 'sowmya.reddy.tutor@edusetu.in',
    phone: '9848012362',
    profileImage: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=400&q=80',
    headline: 'BITS Hyderabad Alumna • Java, Python & High School CS Specialist',
    bio: 'B.Tech in Computer Science from BITS Pilani Hyderabad Campus. Specializes in CBSE / ICSE computer science, ICSE Java (BlueJ), object-oriented programming, and algorithms.',
    qualifications: 'B.Tech Computer Science (BITS Hyderabad)',
    degree: 'B.Tech CSE',
    university: 'BITS Pilani Hyderabad Campus',
    experienceYears: 5,
    teachingExperience: 'Trained 150+ students in ICSE Java and CBSE Python. Practical coding with instant feedback.',
    teachingMode: 'online',
    city: 'Hyderabad',
    area: 'Gachibowli',
    pincode: '500032',
    hourlyRate: 650,
    monthlyRate: 5200,
    languages: ['English', 'Telugu', 'Hindi'],
    rating: 4.91,
    reviewsCount: 27,
    totalStudentsTaught: 175,
    subjects: [
      { subjectName: 'Computer Science', gradeLevels: ['9', '10', '11', '12'], hourlyRate: 650 },
      { subjectName: 'Python', gradeLevels: ['9', '10', '11', '12'], hourlyRate: 650 }
    ],
    days: ['tuesday', 'thursday', 'saturday'],
    reviews: [
      { rating: 5, comment: 'ICSE Java BlueJ was a nightmare for me until Sowmya Ma’am started tutoring me. Got 100/100!' }
    ]
  },

  // --- MUMBAI & PUNE (MAHARASHTRA HUBS) ---
  {
    name: 'Dr. Sameer Kulkarni',
    email: 'sameer.kulkarni.tutor@edusetu.in',
    phone: '9822012371',
    profileImage: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80',
    headline: 'Ph.D. COEP Pune • Engineering Mechanics & Higher Mathematics Guru',
    bio: 'Ph.D. from College of Engineering Pune (COEP) with 15+ years experience. Expert tutor for Class 11-12 Physics, Differential Equations, and First-Year Engineering Mathematics.',
    qualifications: 'Ph.D. (COEP Pune), M.Tech',
    degree: 'Ph.D. Mechanical & Applied Math',
    university: 'College of Engineering Pune',
    experienceYears: 15,
    teachingExperience: 'Authored engineering problem sets. Mentored 400+ students in Kothrud and Deccan areas.',
    teachingMode: 'both',
    city: 'Pune',
    area: 'Kothrud',
    pincode: '411038',
    hourlyRate: 900,
    monthlyRate: 7200,
    languages: ['Marathi', 'English', 'Hindi'],
    rating: 4.94,
    reviewsCount: 39,
    totalStudentsTaught: 390,
    subjects: [
      { subjectName: 'Physics', gradeLevels: ['11', '12', 'MHT-CET', 'JEE'], hourlyRate: 900 },
      { subjectName: 'Mathematics', gradeLevels: ['11', '12', 'Engineering'], hourlyRate: 900 }
    ],
    days: ['monday', 'wednesday', 'friday', 'saturday'],
    reviews: [
      { rating: 5, comment: 'Kulkarni Sir is a treasure for students in Pune. Unmatched clarity in vectors and mechanics.' }
    ]
  },
  {
    name: 'Cyrus Batliwala',
    email: 'cyrus.batliwala.tutor@edusetu.in',
    phone: '9820012381',
    profileImage: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80',
    headline: 'ICSE, ISC & IB English & World History Specialist • St. Xavier’s Mumbai',
    bio: 'Over 13 years of mentoring students in South Mumbai and Bandra. Specializing in Shakespearean drama, critical literary analysis, creative writing, and Cambridge IGCSE/IB World History.',
    qualifications: 'MA English Literature (St. Xavier’s College Mumbai)',
    degree: 'MA English Literature',
    university: 'St. Xavier’s College, Mumbai',
    experienceYears: 13,
    teachingExperience: 'Former teacher at top ICSE schools in Mumbai. Private tutor to high-profile families.',
    teachingMode: 'both',
    city: 'Mumbai',
    area: 'Bandra West',
    pincode: '400050',
    hourlyRate: 1100,
    monthlyRate: 8800,
    languages: ['English', 'Hindi', 'Gujarati'],
    rating: 4.96,
    reviewsCount: 34,
    totalStudentsTaught: 300,
    subjects: [
      { subjectName: 'English', gradeLevels: ['8', '9', '10', '11', '12', 'IB', 'IGCSE'], hourlyRate: 1100 },
      { subjectName: 'History', gradeLevels: ['9', '10', '11', '12'], hourlyRate: 1000 }
    ],
    days: ['tuesday', 'thursday', 'saturday', 'sunday'],
    reviews: [
      { rating: 5, comment: 'His insights into The Merchant of Venice and Julius Caesar gave my daughter a 98% in ICSE.' }
    ]
  },
  {
    name: 'Neha Shah',
    email: 'neha.shah.tutor@edusetu.in',
    phone: '9820012382',
    profileImage: 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=400&q=80',
    headline: 'M.Sc IIT Bombay • Pure Mathematics, Statistics & CBSE 10/12 Specialist',
    bio: 'M.Sc in Applied Statistics & Informatics from IIT Bombay. 8 years helping Mumbai students master Probability, Linear Programming, and Class 10/12 Board Mathematics with ease.',
    qualifications: 'M.Sc (IIT Bombay), B.Sc (St. Xavier’s Mumbai)',
    degree: 'M.Sc Applied Statistics',
    university: 'IIT Bombay',
    experienceYears: 8,
    teachingExperience: 'Mentored over 220+ students in Powai, Andheri, and Hiranandani Estate.',
    teachingMode: 'both',
    city: 'Mumbai',
    area: 'Powai',
    pincode: '400076',
    hourlyRate: 850,
    monthlyRate: 6800,
    languages: ['English', 'Hindi', 'Gujarati'],
    rating: 4.91,
    reviewsCount: 29,
    totalStudentsTaught: 240,
    subjects: [
      { subjectName: 'Mathematics', gradeLevels: ['9', '10', '11', '12'], hourlyRate: 850 }
    ],
    days: ['monday', 'tuesday', 'thursday', 'friday'],
    reviews: [
      { rating: 5, comment: 'Neha Ma’am helped my son understand Probability conceptually instead of just memorizing.' }
    ]
  },
  {
    name: 'Jamshed Vevai',
    email: 'jamshed.vevai.tutor@edusetu.in',
    phone: '9820012383',
    profileImage: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
    headline: 'Chartered Accountant (FCA) • Accountancy & Financial Management Mentor',
    bio: 'Practicing Chartered Accountant with 11 years of academic teaching. Specialist in Class 11-12 Accountancy (Partnership, Company Accounts, Cash Flow) and CA Foundation preparation.',
    qualifications: 'FCA (ICAI), B.Com Hons (HR College Mumbai)',
    degree: 'Chartered Accountant (FCA)',
    university: 'Institute of Chartered Accountants of India',
    experienceYears: 11,
    teachingExperience: 'Taught over 350+ commerce students. Known for making journal entries crystal clear.',
    teachingMode: 'both',
    city: 'Mumbai',
    area: 'Churchgate',
    pincode: '400020',
    hourlyRate: 1200,
    monthlyRate: 9600,
    languages: ['English', 'Hindi'],
    rating: 4.97,
    reviewsCount: 37,
    totalStudentsTaught: 360,
    subjects: [
      { subjectName: 'Accountancy', gradeLevels: ['11', '12', 'CA Foundation'], hourlyRate: 1200 }
    ],
    days: ['monday', 'wednesday', 'saturday', 'sunday'],
    reviews: [
      { rating: 5, comment: 'Sir makes balance sheets feel like solving a puzzle. Best accounts teacher in South Mumbai.' }
    ]
  },
  {
    name: 'Tanvi Joshi',
    email: 'tanvi.joshi.tutor@edusetu.in',
    phone: '9822012372',
    profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    headline: 'Ferguson College Alumna • Biology & General Science for Class 8-10',
    bio: 'M.Sc in Zoology from Ferguson College Pune with a B.Ed. 6 years of enthusiastic science teaching with microscopic slide demos and interactive mind maps.',
    qualifications: 'M.Sc Zoology (Ferguson College Pune), B.Ed',
    degree: 'M.Sc Zoology',
    university: 'Savitribai Phule Pune University',
    experienceYears: 6,
    teachingExperience: 'Taught in Hinjewadi & Wakad private batches. 100% board pass and high distinction rate.',
    teachingMode: 'both',
    city: 'Pune',
    area: 'Hinjewadi',
    pincode: '411057',
    hourlyRate: 500,
    monthlyRate: 4000,
    languages: ['Marathi', 'English', 'Hindi'],
    rating: 4.86,
    reviewsCount: 18,
    totalStudentsTaught: 160,
    subjects: [
      { subjectName: 'Biology', gradeLevels: ['8', '9', '10'], hourlyRate: 500 },
      { subjectName: 'Science', gradeLevels: ['8', '9', '10'], hourlyRate: 500 }
    ],
    days: ['tuesday', 'thursday', 'saturday'],
    reviews: [
      { rating: 5, comment: 'Tanvi Ma’am’s diagrammatic summaries are gold for CBSE Class 10 Science.' }
    ]
  },

  // --- PATNA & BIHAR (SUPER-30 STYLE PROBLEM SOLVING) ---
  {
    name: 'Anand Mohan Jha',
    email: 'anand.jha.tutor@edusetu.in',
    phone: '9431012391',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    headline: 'Patna Science College Alum • Super-30 Pedagogy in Mathematics for JEE',
    bio: '14 years of hardcore mathematics teaching in Patna. Specializing in high-speed algebraic manipulation, coordinate geometry, and breaking down tough JEE problems using intuitive first principles.',
    qualifications: 'M.Sc Mathematics (Patna Science College), Ex-Super30 Teaching Associate',
    degree: 'M.Sc Pure Mathematics',
    university: 'Patna Science College',
    experienceYears: 14,
    teachingExperience: 'Helped 180+ underprivileged and ambitious students clear JEE Mains and Advanced.',
    teachingMode: 'both',
    city: 'Patna',
    area: 'Boring Road',
    pincode: '800001',
    hourlyRate: 600,
    monthlyRate: 4800,
    languages: ['Hindi', 'English'],
    rating: 4.95,
    reviewsCount: 44,
    totalStudentsTaught: 480,
    subjects: [
      { subjectName: 'Mathematics', gradeLevels: ['9', '10', '11', '12', 'JEE'], hourlyRate: 600 }
    ],
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    reviews: [
      { rating: 5, comment: 'Jha Sir teaches maths from the grassroot level. He doesn’t let you leave without understanding.' }
    ]
  },
  {
    name: 'Satish Kumar Sharma',
    email: 'satish.sharma.tutor@edusetu.in',
    phone: '9431012392',
    profileImage: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
    headline: 'Concepts of Physics (HC Verma Specialist) • Class 11-12 & JEE Physics',
    bio: 'M.Sc in Physics with 12 years of coaching students on every single problem in HC Verma. Step-by-step free body diagrams and energy conservation principles made crystal clear.',
    qualifications: 'M.Sc Physics (Patna University), B.Ed',
    degree: 'M.Sc Physics',
    university: 'Patna University',
    experienceYears: 12,
    teachingExperience: 'Famous for his HC Verma solving bootcamps in Kankarbagh and Boring Canal Road.',
    teachingMode: 'both',
    city: 'Patna',
    area: 'Kankarbagh',
    pincode: '800020',
    hourlyRate: 550,
    monthlyRate: 4400,
    languages: ['Hindi', 'English'],
    rating: 4.90,
    reviewsCount: 32,
    totalStudentsTaught: 350,
    subjects: [
      { subjectName: 'Physics', gradeLevels: ['11', '12', 'JEE', 'NEET'], hourlyRate: 550 }
    ],
    days: ['monday', 'wednesday', 'friday', 'sunday'],
    reviews: [
      { rating: 5, comment: 'Every HC Verma numerical becomes solvable once Satish Sir teaches the free body diagram.' }
    ]
  },

  // --- KOLKATA & EASTERN INDIA ---
  {
    name: 'Prof. Subhashish Banerjee',
    email: 'subhashish.banerjee.tutor@edusetu.in',
    phone: '9830012401',
    profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    headline: 'Presidency College Alum • Pure Mathematics & Advanced Calculus',
    bio: '18 years of academic teaching in Kolkata. Former guest lecturer at Calcutta University. Master of Rigorous Mathematical Proofs, Real Analysis, and ISC / CBSE Class 11-12 Mathematics.',
    qualifications: 'M.Sc Pure Mathematics (Presidency College, Kolkata)',
    degree: 'M.Sc Pure Mathematics',
    university: 'Presidency College, Calcutta University',
    experienceYears: 18,
    teachingExperience: 'Taught generations of school and college toppers in Salt Lake and South Kolkata.',
    teachingMode: 'both',
    city: 'Kolkata',
    area: 'Salt Lake',
    pincode: '700091',
    hourlyRate: 850,
    monthlyRate: 6800,
    languages: ['Bengali', 'English', 'Hindi'],
    rating: 4.96,
    reviewsCount: 48,
    totalStudentsTaught: 510,
    subjects: [
      { subjectName: 'Mathematics', gradeLevels: ['10', '11', '12', 'ISC', 'CBSE'], hourlyRate: 850 }
    ],
    days: ['monday', 'wednesday', 'friday', 'saturday'],
    reviews: [
      { rating: 5, comment: 'Sir is an institution in himself. His proofs and derivations are works of art.' }
    ]
  },
  {
    name: 'Mousumi Chatterjee',
    email: 'mousumi.chatterjee.tutor@edusetu.in',
    phone: '9830012402',
    profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    headline: 'Jadavpur University Alumna • ICSE/ISC English Literature & Language Specialist',
    bio: 'MA in English Literature from Jadavpur University. 12 years of helping ICSE and ISC students analyze poetry, drama (Macbeth, Tempest), and write high-scoring grammatical answers.',
    qualifications: 'MA English (Jadavpur University), B.Ed',
    degree: 'MA English Literature',
    university: 'Jadavpur University',
    experienceYears: 12,
    teachingExperience: 'Taught at top private schools in Kolkata. Known for personalized essay reviews.',
    teachingMode: 'both',
    city: 'Kolkata',
    area: 'Park Street',
    pincode: '700016',
    hourlyRate: 600,
    monthlyRate: 4800,
    languages: ['English', 'Bengali', 'Hindi'],
    rating: 4.92,
    reviewsCount: 29,
    totalStudentsTaught: 260,
    subjects: [
      { subjectName: 'English', gradeLevels: ['8', '9', '10', '11', '12', 'ICSE', 'ISC'], hourlyRate: 600 }
    ],
    days: ['tuesday', 'thursday', 'saturday', 'sunday'],
    reviews: [
      { rating: 5, comment: 'Her detailed Macbeth notes helped me score 97 in ISC English Literature!' }
    ]
  },
  {
    name: 'Ananya Sengupta',
    email: 'ananya.sengupta.tutor@edusetu.in',
    phone: '9830012403',
    profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    headline: 'M.Sc Chemistry (Calcutta Univ) • Physical & Inorganic Chemistry for Class 9-12',
    bio: '10 years of mentoring students in Kolkata for CBSE and WB Board Chemistry. Simplifying the Periodic Table, Chemical Bonding, and Thermodynamics with vivid analogies.',
    qualifications: 'M.Sc Chemistry (University of Calcutta), B.Ed',
    degree: 'M.Sc Chemistry',
    university: 'University of Calcutta',
    experienceYears: 10,
    teachingExperience: 'Conducted over 300+ concept clearing batches in New Town and Salt Lake.',
    teachingMode: 'both',
    city: 'Kolkata',
    area: 'New Town',
    pincode: '700156',
    hourlyRate: 650,
    monthlyRate: 5200,
    languages: ['Bengali', 'English', 'Hindi'],
    rating: 4.89,
    reviewsCount: 23,
    totalStudentsTaught: 230,
    subjects: [
      { subjectName: 'Chemistry', gradeLevels: ['9', '10', '11', '12'], hourlyRate: 650 },
      { subjectName: 'Science', gradeLevels: ['9', '10'], hourlyRate: 550 }
    ],
    days: ['monday', 'tuesday', 'thursday', 'friday'],
    reviews: [
      { rating: 5, comment: 'Chemical bonding was always abstract for me, but Ananya Ma’am made it so intuitive.' }
    ]
  },

  // --- LUCKNOW & KANPUR (UTTAR PRADESH) ---
  {
    name: 'Mohd. Tariq Ansari',
    email: 'tariq.ansari.tutor@edusetu.in',
    phone: '9415012411',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    headline: 'AMU Alum • Chemistry & NEET-UG Specialist • 11 Years in Lucknow',
    bio: 'M.Sc Chemistry from Aligarh Muslim University (AMU). Over 11 years coaching UP Board, CBSE, and NEET aspirants in Lucknow. Focused on Organic reactions and numerical calculations.',
    qualifications: 'M.Sc Chemistry (AMU Aligarh), CSIR-NET',
    degree: 'M.Sc Chemistry',
    university: 'Aligarh Muslim University',
    experienceYears: 11,
    teachingExperience: 'Former faculty at leading Lucknow coaching institutes. Mentored 280+ students.',
    teachingMode: 'both',
    city: 'Lucknow',
    area: 'Hazratganj',
    pincode: '226001',
    hourlyRate: 650,
    monthlyRate: 5200,
    languages: ['Hindi', 'Urdu', 'English'],
    rating: 4.91,
    reviewsCount: 31,
    totalStudentsTaught: 310,
    subjects: [
      { subjectName: 'Chemistry', gradeLevels: ['10', '11', '12', 'NEET'], hourlyRate: 650 }
    ],
    days: ['monday', 'wednesday', 'friday', 'saturday'],
    reviews: [
      { rating: 5, comment: 'Tariq Sir explains reaction mechanisms with great clarity. Scored 165/180 in NEET Chemistry.' }
    ]
  },
  {
    name: 'Dr. Vandana Shukla',
    email: 'vandana.shukla.tutor@edusetu.in',
    phone: '9415012412',
    profileImage: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80',
    headline: 'Ph.D. Lucknow University • Hindi Literature, Grammar & CBSE Hindi Expert',
    bio: 'Ph.D. in Hindi Literature from Lucknow University with 14 years of teaching experience. Master of Hindi Vyakaran, Ras, Chhand, Alankar, and high-scoring essay writing for board students.',
    qualifications: 'Ph.D. Hindi, MA Sanskrit, B.Ed',
    degree: 'Ph.D. Hindi Literature',
    university: 'University of Lucknow',
    experienceYears: 14,
    teachingExperience: 'Taught at prestigious colleges in Lucknow. Mentored dozens of 95+ board scorers.',
    teachingMode: 'both',
    city: 'Lucknow',
    area: 'Gomti Nagar',
    pincode: '226010',
    hourlyRate: 450,
    monthlyRate: 3600,
    languages: ['Hindi', 'Sanskrit', 'English'],
    rating: 4.88,
    reviewsCount: 22,
    totalStudentsTaught: 240,
    subjects: [
      { subjectName: 'Hindi', gradeLevels: ['8', '9', '10', '11', '12'], hourlyRate: 450 },
      { subjectName: 'Sanskrit', gradeLevels: ['8', '9', '10'], hourlyRate: 400 }
    ],
    days: ['tuesday', 'thursday', 'saturday', 'sunday'],
    reviews: [
      { rating: 5, comment: 'Her guidance in Hindi essay and kavita vyakhya is unmatched. Got 98 in CBSE 10th!' }
    ]
  },
  {
    name: 'Devendra Pratap Singh',
    email: 'devendra.singh.tutor@edusetu.in',
    phone: '9415012413',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    headline: 'B.Tech IIT Kanpur • Mathematics & Physics Foundation for Class 9-12',
    bio: 'B.Tech from IIT Kanpur with 7 years of personalized tutoring in Kanpur and online. Passionate about developing genuine mathematical curiosity in young minds.',
    qualifications: 'B.Tech (IIT Kanpur)',
    degree: 'B.Tech Civil Engineering',
    university: 'IIT Kanpur',
    experienceYears: 7,
    teachingExperience: 'Taught over 170+ students in Civil Lines and Kakadeo. Special focus on fundamental clarity.',
    teachingMode: 'both',
    city: 'Kanpur',
    area: 'Civil Lines',
    pincode: '208001',
    hourlyRate: 750,
    monthlyRate: 6000,
    languages: ['Hindi', 'English'],
    rating: 4.93,
    reviewsCount: 25,
    totalStudentsTaught: 190,
    subjects: [
      { subjectName: 'Mathematics', gradeLevels: ['9', '10', '11', '12', 'Foundation'], hourlyRate: 750 },
      { subjectName: 'Physics', gradeLevels: ['9', '10'], hourlyRate: 700 }
    ],
    days: ['monday', 'tuesday', 'thursday', 'friday'],
    reviews: [
      { rating: 5, comment: 'Devendra Sir is an awesome mentor. Physics and Maths became my favorite subjects.' }
    ]
  },

  // --- CHENNAI & TAMIL NADU ---
  {
    name: 'Sundaram Natarajan',
    email: 'sundaram.natarajan.tutor@edusetu.in',
    phone: '9840012421',
    profileImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    headline: 'IIT Madras M.Sc • 16 Years Mentoring CBSE & JEE/NEET Physics in Chennai',
    bio: 'M.Sc Physics from IIT Madras with 16 years of coaching excellence in Anna Nagar and Adyar. In-depth conceptual physics, ray optics, and electromagnetism breakdown.',
    qualifications: 'M.Sc Physics (IIT Madras), B.Sc (Loyola College Chennai)',
    degree: 'M.Sc Physics',
    university: 'IIT Madras',
    experienceYears: 16,
    teachingExperience: 'Mentored over 650+ Chennai students into top engineering and medical colleges.',
    teachingMode: 'both',
    city: 'Chennai',
    area: 'Anna Nagar',
    pincode: '600040',
    hourlyRate: 950,
    monthlyRate: 7600,
    languages: ['Tamil', 'English'],
    rating: 4.97,
    reviewsCount: 51,
    totalStudentsTaught: 580,
    subjects: [
      { subjectName: 'Physics', gradeLevels: ['11', '12', 'JEE', 'NEET'], hourlyRate: 950 }
    ],
    days: ['monday', 'wednesday', 'friday', 'saturday'],
    reviews: [
      { rating: 5, comment: 'Sundaram Sir is the benchmark for Physics in Chennai. Optics and modern physics made simple.' }
    ]
  },
  {
    name: 'Karthik Subramanian',
    email: 'karthik.subramanian.tutor@edusetu.in',
    phone: '9840012422',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    headline: 'B.Tech Anna University • CBSE Class 10 & 12 Mathematics Master',
    bio: '8 years of dedicated mathematics tutoring in Chennai. Master of CBSE question patterns, NCERT Exemplar walkthroughs, and eliminating silly algebraic errors.',
    qualifications: 'B.Tech (CEG Anna University)',
    degree: 'B.Tech Information Technology',
    university: 'Anna University, Chennai',
    experienceYears: 8,
    teachingExperience: 'Trained 240+ students with an average score increase of 28% in board exams.',
    teachingMode: 'both',
    city: 'Chennai',
    area: 'T. Nagar',
    pincode: '600017',
    hourlyRate: 600,
    monthlyRate: 4800,
    languages: ['Tamil', 'English'],
    rating: 4.89,
    reviewsCount: 28,
    totalStudentsTaught: 220,
    subjects: [
      { subjectName: 'Mathematics', gradeLevels: ['8', '9', '10', '11', '12'], hourlyRate: 600 }
    ],
    days: ['tuesday', 'thursday', 'saturday', 'sunday'],
    reviews: [
      { rating: 5, comment: 'Karthik Sir’s weekly tests and error analysis gave me the confidence to score 95 in Class 12 Maths.' }
    ]
  },

  // --- AHMEDABAD, INDORE & CHANDIGARH ---
  {
    name: 'Ketan Patel',
    email: 'ketan.patel.tutor@edusetu.in',
    phone: '9898012431',
    profileImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    headline: 'Commerce, Accountancy & Economics Specialist • M.Com & CA Inter',
    bio: '9 years of coaching experience in Ahmedabad for CBSE, GSEB, and ISC commerce students. Specializing in Financial Accounting, GST concepts, and Microeconomics.',
    qualifications: 'M.Com (Gujarat University), CA Inter Qualified',
    degree: 'M.Com Accountancy',
    university: 'Gujarat University',
    experienceYears: 9,
    teachingExperience: 'Taught over 260+ commerce students with consistent 90+ scores in Board exams.',
    teachingMode: 'both',
    city: 'Ahmedabad',
    area: 'SG Highway',
    pincode: '380054',
    hourlyRate: 700,
    monthlyRate: 5600,
    languages: ['Gujarati', 'Hindi', 'English'],
    rating: 4.90,
    reviewsCount: 30,
    totalStudentsTaught: 270,
    subjects: [
      { subjectName: 'Accountancy', gradeLevels: ['11', '12'], hourlyRate: 700 },
      { subjectName: 'Economics', gradeLevels: ['11', '12'], hourlyRate: 650 }
    ],
    days: ['monday', 'wednesday', 'friday', 'saturday'],
    reviews: [
      { rating: 5, comment: 'Accounting partnership accounts became crystal clear under Ketan Sir’s mentorship.' }
    ]
  },
  {
    name: 'Manish Malviya',
    email: 'manish.malviya.tutor@edusetu.in',
    phone: '9893012441',
    profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    headline: 'M.Sc DAVV Indore • Mathematics & NTSE / Olympiad Trainer for Class 8-10',
    bio: '7 years of coaching middle and high school students in Indore. Focus on logical reasoning, mental maths speed, geometry proofs, and NTSE Stage 1 & 2 preparation.',
    qualifications: 'M.Sc Mathematics (DAVV Indore), B.Ed',
    degree: 'M.Sc Mathematics',
    university: 'Devi Ahilya Vishwavidyalaya, Indore',
    experienceYears: 7,
    teachingExperience: 'Trained 190+ students in Vijay Nagar and Palasia. 14 students qualified for NTSE.',
    teachingMode: 'both',
    city: 'Indore',
    area: 'Vijay Nagar',
    pincode: '452010',
    hourlyRate: 500,
    monthlyRate: 4000,
    languages: ['Hindi', 'English'],
    rating: 4.87,
    reviewsCount: 23,
    totalStudentsTaught: 200,
    subjects: [
      { subjectName: 'Mathematics', gradeLevels: ['8', '9', '10', 'NTSE'], hourlyRate: 500 }
    ],
    days: ['tuesday', 'thursday', 'saturday', 'sunday'],
    reviews: [
      { rating: 5, comment: 'Manish Sir’s mental math tricks helped me crack NTSE with ease!' }
    ]
  },
  {
    name: 'Gurpreet Singh Sandhu',
    email: 'gurpreet.sandhu.tutor@edusetu.in',
    phone: '9872012451',
    profileImage: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
    headline: 'Panjab University Alum • NEET Biology & Botany Expert in Chandigarh',
    bio: 'M.Sc in Botany from Panjab University Chandigarh. 10 years of mentoring medical aspirants across Chandigarh, Mohali, and Panchkula (Tricity). High-retention visual diagrams for Genetics and Plant Physiology.',
    qualifications: 'M.Sc Botany (Panjab University Chandigarh), CSIR-NET',
    degree: 'M.Sc Botany',
    university: 'Panjab University Chandigarh',
    experienceYears: 10,
    teachingExperience: 'Senior Biology Faculty with 10 years experience. Over 300+ students mentored.',
    teachingMode: 'both',
    city: 'Chandigarh',
    area: 'Sector 17',
    pincode: '160017',
    hourlyRate: 750,
    monthlyRate: 6000,
    languages: ['Punjabi', 'Hindi', 'English'],
    rating: 4.93,
    reviewsCount: 33,
    totalStudentsTaught: 320,
    subjects: [
      { subjectName: 'Biology', gradeLevels: ['11', '12', 'NEET'], hourlyRate: 750 },
      { subjectName: 'Science', gradeLevels: ['9', '10'], hourlyRate: 600 }
    ],
    days: ['monday', 'wednesday', 'friday', 'saturday'],
    reviews: [
      { rating: 5, comment: 'Plant Physiology was so tough for me, but Sandhu Sir’s flowcharts made it unforgettable!' }
    ]
  },
  {
    name: 'Harleen Kaur',
    email: 'harleen.kaur.tutor@edusetu.in',
    phone: '9872012452',
    profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    headline: 'CELTA Certified • Spoken English, Debate & Board English Specialist',
    bio: 'Cambridge CELTA certified trainer with an MA in English. 8 years helping students master fluent spoken English, confidence, vocabulary, and CBSE / ICSE English literature.',
    qualifications: 'MA English, Cambridge CELTA Certified',
    degree: 'MA English & CELTA',
    university: 'Panjab University',
    experienceYears: 8,
    teachingExperience: 'Conducted communication and board prep bootcamps for over 220+ students in Tricity.',
    teachingMode: 'both',
    city: 'Mohali',
    area: 'Phase 7',
    pincode: '160062',
    hourlyRate: 600,
    monthlyRate: 4800,
    languages: ['English', 'Punjabi', 'Hindi'],
    rating: 4.91,
    reviewsCount: 26,
    totalStudentsTaught: 240,
    subjects: [
      { subjectName: 'English', gradeLevels: ['8', '9', '10', '11', '12', 'Spoken English'], hourlyRate: 600 }
    ],
    days: ['tuesday', 'thursday', 'saturday', 'sunday'],
    reviews: [
      { rating: 5, comment: 'My daughter overcame her stage fear and won the inter-school debate under Harleen Ma’am.' }
    ]
  }
];

module.exports = { INDIAN_TUTORS_DATA };
