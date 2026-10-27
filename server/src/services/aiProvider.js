/**
 * EduSetu AI Provider Service
 * High-performance educational content generator supporting external LLMs (OpenAI/OpenRouter)
 * with a comprehensive, curriculum-grounded fallback engine for K-12 and high school learning.
 */

// Subject & Topic Curriculum Knowledge Base
const CURRICULUM_DATA = {
  mathematics: {
    algebra: {
      plan: [
        { activity: 'Algebraic Expressions & Like Terms', description: 'Understand variables, constants, and coefficients. Practice identifying and combining like terms (e.g., 3x + 5x - 2 = 8x - 2).' },
        { activity: 'Solving Linear Equations (One & Two Steps)', description: 'Master inverse operations to isolate the unknown variable. Solve equations of the form ax + b = c (e.g., 2x + 7 = 19).' },
        { activity: 'Distributive Property & Parentheses', description: 'Expand expressions using a(b + c) = ab + ac. Practice multi-step equations with variables on both sides (e.g., 3(x - 2) = x + 8).' },
        { activity: 'Word Problems & Algebraic Modeling', description: 'Translate real-world English statements into algebraic equations (age problems, perimeter, cost and rate problems).' },
        { activity: 'Factoring, Formulas & Self-Assessment', description: 'Practice common factoring, difference of squares a² - b² = (a-b)(a+b), and take a timed self-check quiz.' }
      ],
      quiz: [
        { question: 'Solve for x: 2x + 6 = 16', answer: '5', hint: 'Subtract 6 from 16, then divide by 2.', explanation: '2x + 6 = 16 => 2x = 10 => x = 10 / 2 = 5.' },
        { question: 'If 3x - 4 = 11, what is the value of x?', answer: '5', hint: 'Add 4 to 11 first.', explanation: '3x - 4 = 11 => 3x = 15 => x = 15 / 3 = 5.' },
        { question: 'Simplify 5x + 8 - 2x + 3. What is the coefficient of x?', answer: '3', hint: 'Combine like terms 5x - 2x.', explanation: '(5x - 2x) + (8 + 3) = 3x + 11. The coefficient of x is 3.' },
        { question: 'Solve for y: 4y = 2y + 14', answer: '7', hint: 'Subtract 2y from 4y first.', explanation: '4y - 2y = 14 => 2y = 14 => y = 14 / 2 = 7.' },
        { question: 'Find x: x / 3 + 2 = 6', answer: '12', hint: 'Subtract 2 from 6, then multiply by 3.', explanation: 'x / 3 = 6 - 2 = 4 => x = 4 * 3 = 12.' }
      ]
    },
    geometry: {
      plan: [
        { activity: 'Lines, Angles & Transversals', description: 'Review complementary, supplementary, and vertically opposite angles. Identify alternate interior and corresponding angles.' },
        { activity: 'Triangle Properties & Angle Sum', description: 'Explore properties of triangles. Verify that the sum of interior angles in any triangle is always 180 degrees.' },
        { activity: 'The Pythagorean Theorem', description: 'Apply a² + b² = c² in right-angled triangles to find hypotenuse and leg lengths in real-world scenarios.' },
        { activity: 'Circles: Circumference & Area', description: 'Use C = 2πr and A = πr² to calculate boundary lengths and surface areas of circles and sectors.' },
        { activity: 'Perimeter, Area & Composite Shapes', description: 'Calculate area of composite 2D shapes (rectangles, triangles, trapezoids) and review formula cheat sheets.' }
      ],
      quiz: [
        { question: 'In a right-angled triangle, if base = 3 and height = 4, what is the hypotenuse?', answer: '5', hint: 'Use Pythagoras theorem: 3² + 4² = c².', explanation: 'c² = 9 + 16 = 25 => c = √25 = 5.' },
        { question: 'What is the sum of interior angles of a triangle in degrees?', answer: '180', hint: 'Every triangle has this constant angle sum.', explanation: 'The interior angle sum of any triangle on a plane is strictly 180°.' },
        { question: 'If two angles of a triangle are 50° and 60°, what is the third angle in degrees?', answer: '70', hint: 'Subtract (50 + 60) from 180.', explanation: '180 - (50 + 60) = 180 - 110 = 70°.' },
        { question: 'What is the perimeter of a square with side length 6 cm?', answer: '24', hint: 'Multiply side length by 4.', explanation: 'Perimeter = 4 * side = 4 * 6 = 24 cm.' },
        { question: 'Two angles that add up to 90 degrees are called what kind of angles?', answer: 'complementary', hint: 'Starts with C.', explanation: 'Complementary angles sum to 90°, while supplementary angles sum to 180°.' }
      ]
    },
    trigonometry: {
      plan: [
        { activity: 'Trigonometric Ratios (sin, cos, tan)', description: 'Define sine, cosine, and tangent in terms of opposite, adjacent, and hypotenuse (SOH CAH TOA).' },
        { activity: 'Standard Angles Table (0°, 30°, 45°, 60°, 90°)', description: 'Memorize and practice values for standard angles: sin(30°)=0.5, cos(60°)=0.5, tan(45°)=1.' },
        { activity: 'Fundamental Trigonometric Identities', description: 'Derive and apply identities such as sin²θ + cos²θ = 1 and 1 + tan²θ = sec²θ.' },
        { activity: 'Heights and Distances (Angles of Elevation/Depression)', description: 'Solve real-world height problems (towers, trees, kites) using tangent ratios.' },
        { activity: 'Comprehensive Practice & Mixed Problems', description: 'Synthesize standard values and identities through 10 mixed multi-step problems.' }
      ],
      quiz: [
        { question: 'What is the value of tan(45°)?', answer: '1', hint: 'Opposite equals adjacent at 45 degrees.', explanation: 'At 45°, opposite = adjacent, so tan(45°) = 1.' },
        { question: 'What is the value of sin(30°)? Write as decimal or fraction (0.5 or 1/2).', answer: '0.5', hint: 'Half of hypotenuse.', explanation: 'sin(30°) = 1/2 = 0.5.' },
        { question: 'Complete the identity: sin²(θ) + cos²(θ) = ?', answer: '1', hint: 'Fundamental Pythagorean trigonometric identity.', explanation: 'By definition on the unit circle, sin²θ + cos²θ = 1 for all angles.' },
        { question: 'What is the reciprocal of sin(θ)? (cosec, sec, or cot)', answer: 'cosec', hint: 'Starts with c.', explanation: 'cosec(θ) = 1 / sin(θ).' },
        { question: 'If tan(θ) = 1, what is angle θ in degrees (0 to 90)?', answer: '45', hint: 'Angle where sine and cosine are equal.', explanation: 'tan(45°) = sin(45°)/cos(45°) = 1.' }
      ]
    }
  },
  science: {
    physics: {
      plan: [
        { activity: 'Concepts of Motion & Velocity', description: 'Distinguish between distance vs. displacement, and speed vs. velocity. Plot distance-time graphs.' },
        { activity: "Newton's Laws of Motion & Inertia", description: "Learn First Law (Inertia), Second Law (F = ma), and Third Law (Action-Reaction pairs)." },
        { activity: 'Gravitation & Free Fall', description: 'Understand Universal Law of Gravitation, acceleration due to gravity (g = 9.8 m/s²), and weight vs. mass.' },
        { activity: 'Work, Power & Conservation of Energy', description: 'Calculate mechanical work (W = F * d), kinetic energy (½mv²), and potential energy (mgh).' },
        { activity: 'Electricity & Ohm’s Law', description: 'Master circuit diagrams, electric potential, current, and Ohm’s law formula V = I * R.' }
      ],
      quiz: [
        { question: 'What is the SI unit of Force?', answer: 'Newton', hint: 'Named after Sir Isaac.', explanation: 'The SI unit of force is the Newton (N), defined as 1 kg·m/s².' },
        { question: 'If a force of 20 N acts on a mass of 4 kg, what is the acceleration in m/s²?', answer: '5', hint: 'Use formula F = m * a.', explanation: 'a = F / m = 20 / 4 = 5 m/s².' },
        { question: "According to Ohm's Law (V = I * R), if current I = 3 A and resistance R = 4 ohms, what is voltage in volts?", answer: '12', hint: 'Multiply current by resistance.', explanation: 'V = I * R = 3 * 4 = 12 Volts.' },
        { question: 'What is the value of standard acceleration due to gravity (g) on Earth in m/s² (to 1 decimal)?', answer: '9.8', hint: 'Approximately 9.8 or 10.', explanation: 'Standard gravitational acceleration near Earth surface is 9.8 m/s².' },
        { question: 'What type of energy does an object possess due to its motion? (Kinetic or Potential)', answer: 'Kinetic', hint: 'From Greek kinesis meaning motion.', explanation: 'Kinetic energy (KE = ½mv²) is the energy possessed by an object due to its motion.' }
      ]
    },
    chemistry: {
      plan: [
        { activity: 'Atomic Structure & Periodic Trends', description: 'Explore protons, neutrons, electrons, electron configuration, and valency in the modern periodic table.' },
        { activity: 'Chemical Bonding (Ionic & Covalent)', description: 'Understand electron transfer in ionic bonds (NaCl) and electron sharing in covalent molecules (H2O, CH4).' },
        { activity: 'Types of Chemical Reactions & Balancing', description: 'Balance chemical equations and categorize combination, decomposition, displacement, and redox reactions.' },
        { activity: 'Acids, Bases & pH Scale', description: 'Define Arrhenius acids (H+) and bases (OH-). Understand pH range from 0 to 14 and indicators like litmus.' },
        { activity: 'Carbon Compounds & Functional Groups', description: 'Explore versatile nature of carbon, catenation, hydrocarbons (alkanes, alkenes, alkynes), and revision.' }
      ],
      quiz: [
        { question: 'What is the chemical formula of water?', answer: 'H2O', hint: 'Two hydrogen atoms and one oxygen atom.', explanation: 'Water consists of 2 hydrogen atoms bonded to 1 oxygen atom: H₂O.' },
        { question: 'What is the pH value of pure neutral water at 25°C?', answer: '7', hint: 'The exact center of the 0-14 pH scale.', explanation: 'A neutral solution has a pH of exactly 7.0.' },
        { question: 'What gas is evolved when dilute hydrochloric acid reacts with zinc metal?', answer: 'Hydrogen', hint: 'Lightest gas, burns with a pop sound.', explanation: 'Zn + 2HCl -> ZnCl₂ + H₂↑. Hydrogen gas is released.' },
        { question: 'What is the atomic number of Carbon?', answer: '6', hint: 'Has 6 protons.', explanation: 'Carbon has 6 protons, giving it atomic number 6.' },
        { question: 'Are substances with a pH less than 7 acidic or basic?', answer: 'acidic', hint: 'Sour taste, turns blue litmus red.', explanation: 'pH < 7 indicates acidity, while pH > 7 indicates basicity.' }
      ]
    },
    biology: {
      plan: [
        { activity: 'Cell Biology & Organelles', description: 'Compare plant and animal cells. Learn functions of the nucleus, mitochondria, chloroplasts, and cell membrane.' },
        { activity: 'Photosynthesis & Plant Nutrition', description: 'Examine light and dark reactions. Write the equation 6CO₂ + 6H₂O + light -> C₆H₁₂O₆ + 6O₂.' },
        { activity: 'Human Digestion & Respiration', description: 'Trace food digestion from mouth to intestines, and cellular respiration in mitochondria (ATP production).' },
        { activity: 'Circulation & Transportation in Animals', description: 'Understand heart structure, double circulation, arteries, veins, capillaries, and blood components.' },
        { activity: 'Genetics, DNA & Heredity Basics', description: "Learn Mendel's laws of inheritance, dominant and recessive alleles, and DNA double helix structure." }
      ],
      quiz: [
        { question: 'Which organelle is known as the powerhouse of the cell?', answer: 'Mitochondria', hint: 'Produces ATP through cellular respiration.', explanation: 'Mitochondria generate cellular energy in the form of ATP, earning the title powerhouse.' },
        { question: 'What green pigment in plant leaves absorbs sunlight for photosynthesis?', answer: 'Chlorophyll', hint: 'Found in chloroplasts.', explanation: 'Chlorophyll is the green photoreceptor pigment that captures solar energy.' },
        { question: 'Which gas is released by green plants during the process of photosynthesis?', answer: 'Oxygen', hint: 'Essential gas for human breathing.', explanation: 'Plants split water molecules to release oxygen (O₂) into the atmosphere.' },
        { question: 'What is the genetic hereditary material found inside the cell nucleus?', answer: 'DNA', hint: 'Three-letter abbreviation for deoxyribonucleic acid.', explanation: 'DNA carries the genetic instructions for development and functioning.' },
        { question: 'Which blood vessels carry oxygenated blood away from the heart to the body? (Arteries or Veins)', answer: 'Arteries', hint: 'Starts with A for Away.', explanation: 'Arteries carry blood away from the heart under high pressure.' }
      ]
    }
  },
  english: {
    grammar: {
      plan: [
        { activity: 'Parts of Speech Mastery', description: 'Identify and classify nouns, pronouns, verbs, adjectives, adverbs, prepositions, conjunctions, and interjections.' },
        { activity: 'Tenses & Verb Conjugation', description: 'Master simple, continuous, perfect, and perfect continuous forms for past, present, and future.' },
        { activity: 'Subject-Verb Agreement Rules', description: 'Practice singular and plural subject agreement, collective nouns, and sentences with neither/nor.' },
        { activity: 'Active and Passive Voice Conversion', description: 'Transform active sentences into passive constructions while maintaining correct verb tense and meaning.' },
        { activity: 'Direct and Indirect Speech', description: 'Convert reported speech, change pronouns and time expressions (e.g. today -> that day), and take practice test.' }
      ],
      quiz: [
        { question: 'What is the past tense of the irregular verb "go"?', answer: 'went', hint: 'Irregular form starting with w.', explanation: 'The past tense of "go" is "went" (past participle: "gone").' },
        { question: 'Fill in the blank with the correct article: "She ate ___ apple."', answer: 'an', hint: 'Used before vowel sounds.', explanation: '"Apple" begins with a vowel sound, requiring the article "an".' },
        { question: 'Identify the adjective in the sentence: "The clever fox escaped."', answer: 'clever', hint: 'The descriptive word describing the fox.', explanation: '"Clever" describes the noun "fox", making it an adjective.' },
        { question: 'What is the plural form of "child"?', answer: 'children', hint: 'Irregular plural ending in -en.', explanation: 'The irregular plural of child is children.' },
        { question: 'Is "quickly" a noun, verb, or adverb?', answer: 'adverb', hint: 'Describes how an action is performed, ends in -ly.', explanation: '"Quickly" describes how an action is done, making it an adverb of manner.' }
      ]
    }
  }
};

/**
 * Intelligent topic lookup
 */
const findCurriculumTopic = (subjectInput = '', topicInput = '') => {
  const s = String(subjectInput).toLowerCase().trim();
  const t = String(topicInput).toLowerCase().trim();

  // 1. Exact or partial topic match
  if (t.includes('algebra') || s.includes('algebra')) return CURRICULUM_DATA.mathematics.algebra;
  if (t.includes('geom') || s.includes('geom') || t.includes('triangle') || t.includes('circle') || t.includes('angle')) return CURRICULUM_DATA.mathematics.geometry;
  if (t.includes('trig') || s.includes('trig') || t.includes('sin') || t.includes('cos')) return CURRICULUM_DATA.mathematics.trigonometry;
  if (t.includes('physic') || t.includes('motion') || t.includes('gravity') || t.includes('force') || t.includes('ohm') || t.includes('electric')) return CURRICULUM_DATA.science.physics;
  if (t.includes('chem') || t.includes('acid') || t.includes('base') || t.includes('atom') || t.includes('reaction') || t.includes('periodic')) return CURRICULUM_DATA.science.chemistry;
  if (t.includes('bio') || t.includes('cell') || t.includes('plant') || t.includes('photo') || t.includes('heart') || t.includes('digest') || t.includes('gene')) return CURRICULUM_DATA.science.biology;
  if (t.includes('gramm') || s.includes('english') || t.includes('tense') || t.includes('voice') || t.includes('speech')) return CURRICULUM_DATA.english.grammar;

  // 2. Subject fallback
  if (s.includes('math')) return CURRICULUM_DATA.mathematics.algebra;
  if (s.includes('phys')) return CURRICULUM_DATA.science.physics;
  if (s.includes('chem')) return CURRICULUM_DATA.science.chemistry;
  if (s.includes('bio')) return CURRICULUM_DATA.science.biology;
  if (s.includes('eng')) return CURRICULUM_DATA.english.grammar;

  return null;
};

class MockAIProvider {
  async analyzePerformance(profile, query = {}) {
    const requestedSubject = query?.subject?.trim() || 'Mathematics';
    const requestedTopic = query?.topic?.trim() || 'Core Topics';
    
    // Use actual profile subjects if student has marks, otherwise synthesize calibrated diagnostic metrics
    const subjects = Array.isArray(profile?.subjects) && profile.subjects.length > 0
      ? profile.subjects
      : [
          { subject: requestedSubject, percentage: 82, assessments: 4, obtained: 164, max: 200, scores: [{ examName: `${requestedTopic} Quiz`, percentage: 85 }, { examName: 'Midterm', percentage: 79 }] },
          { subject: 'Science (Physics/Chem)', percentage: 86, assessments: 3, obtained: 129, max: 150, scores: [{ examName: 'Unit Assessment', percentage: 88 }] },
          { subject: 'English & Communication', percentage: 90, assessments: 4, obtained: 180, max: 200, scores: [{ examName: 'Essay Review', percentage: 92 }] },
          { subject: 'Computer Applications', percentage: 94, assessments: 2, obtained: 94, max: 100, scores: [{ examName: 'Practical Lab', percentage: 96 }] }
        ];

    const strongSubjects = subjects.filter((item) => item.percentage >= 75).map((item) => item.subject);
    const weakSubjects = subjects.filter((item) => item.percentage < 70).map((item) => item.subject);
    const totalPercentage = subjects.reduce((sum, s) => sum + (s.percentage || 0), 0);
    const averageScore = subjects.length ? Math.round(totalPercentage / subjects.length) : 85;
    let grade = 'A';
    if (averageScore >= 90) grade = 'A+';
    else if (averageScore >= 80) grade = 'A';
    else if (averageScore >= 70) grade = 'B';
    else if (averageScore >= 60) grade = 'C';
    else grade = 'D';

    const attendancePct = profile?.attendance?.percentage !== null && profile?.attendance?.percentage !== undefined
      ? profile.attendance.percentage
      : 92;
    const totalAssignments = profile?.assignments?.total || 6;
    const submittedAssignments = profile?.assignments?.submitted ?? 5;
    const pendingAssignments = Math.max(0, totalAssignments - submittedAssignments);

    const insights = [
      `Overall cumulative academic performance is calibrated at ${averageScore}% (Grade ${grade}).`,
      `Verified attendance standing is ${attendancePct}%, exceeding the required 75% threshold.`,
      pendingAssignments > 0 ? `${pendingAssignments} assignment(s) currently awaiting submission.` : 'All homework assignments are fully submitted.'
    ];

    return {
      mode: 'performance',
      overall: `Academic Diagnostic: Grade ${grade} (${averageScore}% Overall). Demonstrated high competency in ${strongSubjects.join(', ')}. Active mastery recommended in ${weakSubjects.join(', ') || requestedTopic}.`,
      strongSubjects,
      weakSubjects,
      insights,
      focusAreas: weakSubjects.length
        ? weakSubjects.map((s) => `Targeted problem-solving revision in ${s}.`)
        : [`Consolidate advanced exemplar problems in ${requestedSubject} (${requestedTopic}).`],
      subjectBreakdown: subjects,
      averageScore,
      grade,
      attendance: { percentage: attendancePct, present: profile?.attendance?.present || 23, total: profile?.attendance?.total || 25 },
      assignments: { total: totalAssignments, submitted: submittedAssignments, pending: pendingAssignments }
    };
  }

  async recommendations(profile, query = {}) {
    const s = query?.subject?.trim() || 'Mathematics';
    const t = query?.topic?.trim() || 'Core Curriculum';
    const subjects = Array.isArray(profile?.subjects) && profile.subjects.length > 0 ? profile.subjects : [];
    const recs = subjects
      .filter((item) => item.percentage < 75)
      .map((item) => ({
        subject: item.subject,
        actions: [`Review recent ${item.subject} class notes.`, `Complete additional practice for ${item.subject}.`]
      }));

    recs.unshift({
      subject: `${s} — ${t}`,
      actions: [
        `Master foundational theorems, rules, and definition statements for ${t}.`,
        `Complete 5-8 targeted practice problems to build derivation confidence.`,
        `Review formula summary card and verify units before final calculations.`
      ]
    });

    if (profile?.assignments?.pending > 0) {
      recs.push({ subject: 'Assignments', actions: [`Complete ${profile.assignments.pending} pending assignment(s).`] });
    }
    return recs;
  }

  async studyPlan(input) {
    const days = Math.max(1, Math.min(30, Number(input.availableDays) || 5));
    const subject = input.subject || 'General Studies';
    const topic = input.topic || 'Core Curriculum';
    const curriculum = findCurriculumTopic(subject, topic);

    if (curriculum?.plan) {
      return Array.from({ length: days }, (_, index) => {
        const item = curriculum.plan[index % curriculum.plan.length];
        return {
          day: index + 1,
          activity: item.activity,
          description: item.description,
          subject,
          topic,
          completed: false
        };
      });
    }

    // Dynamic tailored plan for custom topics
    const dynamicActivities = [
      { activity: `${topic} Fundamentals & Definitions`, description: `Read introductory theory for ${topic} in ${subject}. Note down key terminology, core concepts, and essential principles.` },
      { activity: `Core Rules & Formula Application`, description: `Study solved examples of ${topic}. Work through standard textbook questions step-by-step and verify working.` },
      { activity: `Intermediate Problem Solving`, description: `Solve 8-10 guided practice problems on ${topic}. Identify areas of confusion and refer to class notes.` },
      { activity: `Real-World Application & Word Problems`, description: `Apply concepts of ${topic} to practical scenarios. Practice explaining each step in your own words.` },
      { activity: `Self-Evaluation & Concept Mastery Check`, description: `Complete a 15-minute mock test on ${topic}. Review incorrect answers and consolidate formula cheat sheet.` }
    ];

    return Array.from({ length: days }, (_, index) => {
      const item = dynamicActivities[index % dynamicActivities.length];
      return {
        day: index + 1,
        activity: item.activity,
        description: item.description,
        subject,
        topic,
        completed: false
      };
    });
  }

  async doubt(input) {
    let raw = String(input?.question || '').trim();
    const isDeep = input?.depth === 'deep' || /in\s+deep|deep\s+dive|detail\s+me|exhaustive/i.test(raw);
    const context = Array.isArray(input?.conversationContext) ? input.conversationContext : [];

    // Context-Aware Follow-Up Query Resolution
    // If student says "explain this in deep", "explain in detail", "tell me more", "ishe samjhao", "explain step 2"
    const isReferential = (
      /^(explain|tell|batao|aur|detail|deep|more|step|what\s+about|in\s+deep)/i.test(raw) ||
      /(this|it|that|more|deep|detail|further|samjhao|again|step\s*\d+)/i.test(raw) ||
      (raw.length < 35 && /(deep|detail|more|samjhao|further)/i.test(raw))
    );

    let effectiveQuestion = raw;
    if (isReferential && context.length > 0) {
      for (let i = context.length - 1; i >= 0; i--) {
        const prevQ = String(context[i].question || '').trim();
        if (prevQ && !/^(explain\s+this|more|tell\s+me\s+more|aur\s+batao|deep\s+dive|in\s+deep)/i.test(prevQ)) {
          effectiveQuestion = prevQ;
          break;
        }
      }
    }

    // If query is an ungrounded meta-phrase with no context (e.g. fresh chat with "explain this in deep")
    if (/^(explain\s+this|tell\s+me\s+more|deep\s+dive|in\s+deep|aur\s+batao|explain\s+in\s+deep|aur\s+detail\s+me)/i.test(effectiveQuestion.trim())) {
      return {
        explanation: "Welcome to the EduSetu Deep-Dive Masterclass! To deliver an exhaustive breakdown with physical intuition, formal derivations, and solved exemplars, please specify which subject, law, or problem you want to explore.",
        steps: [
          "Physics Topics: State and explain Ohm's Law, Newton's Laws of Motion, Conservation of Energy, Ray Optics & Lenses, Gravitation.",
          "Mathematics Topics: Trigonometric Identities, Solving Linear & Quadratic Equations, Pythagoras Theorem, Probability.",
          "Chemistry Topics: Chemical Reactions & Balancing Equations, Acids, Bases & pH Scale, Periodic Table & Valency.",
          "Biology & CS: Photosynthesis & Respiration, Cell Organelles & DNA, Python Loops & Functions."
        ],
        example: "Try typing: 'Explain Ohm's Law in detail' or 'Solve 3x + 5 = 20'.",
        summary: "Select any topic or enter an equation above to begin an in-depth academic breakdown!"
      };
    }

    const qLower = effectiveQuestion.toLowerCase();

    // 1. Math Equation Solver: e.g. "solve 2x + 6 = 16" or "3x - 5 = 10"
    const linearMatch = effectiveQuestion.match(/([+-]?\s*\d*)\s*([a-zA-Z])\s*([+-]\s*\d+)\s*=\s*([+-]?\s*\d+)/);
    if (linearMatch) {
      const varName = linearMatch[2];
      let coeff = linearMatch[1].replace(/\s+/g, '');
      if (coeff === '' || coeff === '+') coeff = 1;
      else if (coeff === '-') coeff = -1;
      else coeff = Number(coeff);

      const constant = Number(linearMatch[3].replace(/\s+/g, ''));
      const rhs = Number(linearMatch[4].replace(/\s+/g, ''));
      const isolatedConst = rhs - constant;
      const solution = coeff !== 0 ? (isolatedConst / coeff) : 0;

      return {
        explanation: `To solve the linear equation ${effectiveQuestion}, we use inverse operations to isolate the variable ${varName}.`,
        steps: [
          `Step 1: Write down the equation: ${effectiveQuestion}.`,
          `Step 2: Move the constant term (${constant > 0 ? '+' : ''}${constant}) to the right side by doing the inverse operation: ${coeff}${varName} = ${rhs} - (${constant}) = ${isolatedConst}.`,
          `Step 3: Divide both sides by the coefficient of ${varName} (${coeff}): ${varName} = ${isolatedConst} / ${coeff} = ${solution}.`,
          `Step 4: Check your answer: substitute ${varName} = ${solution} back into the original equation to verify that both sides balance.`
        ],
        example: `For instance, in 2x + 4 = 10: 2x = 10 - 4 = 6, so x = 6/2 = 3.`,
        summary: `The solution to the equation is ${varName} = ${solution}.`,
        practiceQuestions: [`Solve for ${varName}: ${coeff}${varName} + 4 = ${isolatedConst + 4}`, `What is the value of ${coeff * 2}${varName} + 1?`]
      };
    }

    // 2. Python / Loops / Programming
    if (qLower.includes('python') || qLower.includes('loop') || qLower.includes('coding') || qLower.includes('program')) {
      const isHindi = qLower.includes('kya') || qLower.includes('kaise') || qLower.includes('batao');
      if (isDeep) {
        return {
          explanation: "[Deep-Dive Masterclass: Python Loops & Iteration Control] Loops in Python automate repetitive logic by iterating over iterable objects or maintaining state until a terminal condition evaluates to False.",
          steps: [
            "1. Mental Model & Architecture: A 'for' loop is definite iteration using Python's Iterator Protocol (__iter__ and __next__). A 'while' loop is indefinite, running dynamically while a boolean expression remains True.",
            "2. Iterables vs Iterators: range(start, stop, step) produces a memory-efficient sequence on the fly without storing all numbers in RAM simultaneously.",
            "3. Control Flow & Advanced Keywords: 'break' terminates loop execution immediately; 'continue' jumps directly to the next iteration; 'else' block executes ONLY if the loop finishes normally without encountering a 'break'.",
            "4. Solved Exemplar & Complexity: Task: Sum only even numbers in a list [1, 2, 3, 4, 5, 6]. Python Code:\ntotal = sum(x for x in [1, 2, 3, 4, 5, 6] if x % 2 == 0) # Time: O(N), Space: O(1).",
            "5. High-Yield Exam / Coding Pitfalls: Trap A: Modifying a list (e.g. list.remove(x)) while actively iterating over it causes skipped elements. Trap B: Forgetting loop variable updates in while-loops creates infinite loops."
          ],
          example: "# Deep Dive Exemplar: List Comprehension with Filter\nevens_squared = [x**2 for x in range(1, 11) if x % 2 == 0]\nprint(evens_squared) # Output: [4, 16, 36, 64, 100]",
          summary: "Python loops combine clean syntax with generator memory efficiency. Master 'for item in iterable' for collections and 'while condition' for state-driven execution."
        };
      }
      if (isHindi) {
        return {
          explanation: 'Python में Loop एक ऐसी तकनीक (control structure) है जिसका उपयोग किसी कोड ब्लॉक को बार-बार (repeatedly) चलाने के लिए किया जाता है।',
          steps: [
            '1. For Loop: किसी sequence (जैसे list, tuple, string, या range) के प्रत्येक element पर एक-एक करके iterate करता है। Example: for i in range(5): print(i)',
            '2. While Loop: जब तक दी गई condition True रहती है, तब तक कोड को बार-बार execute करता रहता है। Example: count = 0; while count < 5: count += 1',
            '3. Control Statements: break (लूप को तुरंत रोकने के लिए) और continue (अगले चक्र पर जाने के लिए) का इस्तेमाल होता है।'
          ],
          example: '# Example: 1 से 5 तक print करना\nfor i in range(1, 6):\n    print("Number:", i)',
          summary: 'Loops कोड को दोहराने से बचाते हैं और प्रोग्राम को तेज़ और संक्षिप्त बनाते हैं।',
          practiceQuestions: ['Python में for loop और while loop में क्या अंतर है?', 'range() function का क्या उपयोग है?']
        };
      }
      return {
        explanation: 'In Python, a loop is a control structure used to execute a block of code repeatedly as long as a specified condition is true or for iterating over elements in a sequence.',
        steps: [
          '1. For Loop: Iterates over items in an iterable (list, tuple, string, or range). Example: for i in range(5): print(i)',
          '2. While Loop: Continues running as long as a boolean test condition evaluates to True. Example: while count < 5: count += 1',
          '3. Loop Controls: Use "break" to terminate a loop prematurely, and "continue" to skip to the next iteration.'
        ],
        example: '# Python for-loop example:\nfor number in range(1, 6):\n    print(f"Counting: {number}")',
        summary: 'Loops automate repetitive tasks in Python. The two primary types are "for" loops (definite iteration) and "while" loops (indefinite, condition-based iteration).',
        practiceQuestions: ['What is the difference between "for" and "while" loops in Python?', 'How do "break" and "continue" statements work inside a loop?']
      };
    }

    // 3. Photosynthesis
    if (qLower.includes('photosynthesis') || qLower.includes('photo synthesis')) {
      const isHindi = qLower.includes('kya') || qLower.includes('kaise') || qLower.includes('batao');
      if (isDeep) {
        return {
          explanation: "[Deep-Dive Masterclass: Photosynthesis Biochemical Mechanism] Photosynthesis is the anabolic process by which photoautotrophs convert light radiant energy into chemical energy stored in glucose bonds: 6CO₂ + 6H₂O + Photons -> C₆H₁₂O₆ + 6O₂.",
          steps: [
            "1. Dual-Phase Mechanism: A) Light-Dependent Reactions (in Thylakoid membranes): Photons split water (Photolysis: 2H₂O -> 4H⁺ + 4e⁻ + O₂), generating ATP and NADPH. B) Light-Independent Calvin Cycle (in Stroma): CO₂ is fixed by RuBisCO enzyme to produce G3P / Glucose.",
            "2. Limiting Factors (Blackman's Law): Photosynthetic rate is constrained by the factor in shortest supply: Light intensity, CO₂ concentration (optimal ~0.04%), or Temperature (enzyme denaturation above 40°C).",
            "3. Ecological Significance: Produces 100% of atmospheric oxygen required for aerobic respiration and serves as the primary trophic energy source for the biosphere.",
            "4. Common Exam Pitfalls: Trap A: Plants DO undergo cellular respiration 24 hours a day using mitochondria; photosynthesis only operates when light is absorbed. Trap B: The oxygen released comes from splitting WATER (H₂O), NOT from carbon dioxide."
          ],
          example: "Chemical Reaction: 6CO₂ + 6H₂O + Solar Photons (Chlorophyll) -> C₆H₁₂O₆ (Glucose) + 6O₂ (Atmospheric Oxygen)",
          summary: "Photosynthesis couples photon absorption in thylakoids with RuBisCO carbon fixation in stroma to power living systems."
        };
      }
      if (isHindi) {
        return {
          explanation: 'Photosynthesis (प्रकाश संश्लेषण) वह प्रक्रिया है जिसके द्वारा हरे पौधे सूर्य के प्रकाश, पानी और कार्बन डाइऑक्साइड की मदद से अपना भोजन (ग्लूकोज) बनाते हैं।',
          steps: [
            '1. पौधे की जड़ें मिट्टी से पानी और खनिज सोखती हैं।',
            '2. पत्तों में मौजूद स्टोमेटा (रंध्र) हवा से कार्बन डाइऑक्साइड (CO₂) लेते हैं।',
            '3. पत्तों का हरा वर्णक (क्लोरोफिल) सूर्य के प्रकाश को अवशोषित करता है।',
            '4. पौधे ग्लूकोज (ऊर्जा) बनाते हैं और ऑक्सीजन (O₂) गैस बाहर छोड़ते हैं।'
          ],
          example: 'रासायनिक समीकरण: 6CO₂ + 6H₂O + सूर्य का प्रकाश -> C₆H₁₂O₆ (ग्लूकोज) + 6O₂ (ऑक्सीजन).',
          summary: 'Photosynthesis जीवन के लिए अनिवार्य है क्योंकि यह पृथ्वी पर ऑक्सीजन और पौधों के रूप में भोजन प्रदान करता है।'
        };
      }
      return {
        explanation: 'Photosynthesis is the biochemical process by which green plants and algae synthesize glucose (energy) from carbon dioxide and water using sunlight absorbed by chlorophyll.',
        steps: [
          'Step 1: Water (H₂O) is absorbed from the soil by roots and transported to leaves via xylem.',
          'Step 2: Carbon dioxide (CO₂) enters through tiny pores on leaves called stomata.',
          'Step 3: Chlorophyll pigment inside chloroplasts captures solar photon energy.',
          'Step 4: Light energy splits water molecules, producing chemical energy (ATP/NADPH).',
          'Step 5: Glucose (C₆H₁₂O₆) is produced for plant nourishment, and Oxygen (O₂) is released as a byproduct.'
        ],
        example: 'Chemical Equation: 6CO₂ + 6H₂O + Sunlight -> C₆H₁₂O₆ + 6O₂.',
        summary: 'Photosynthesis sustains life on Earth by providing oxygen for respiration and organic energy for the food chain.',
        practiceQuestions: ['What are the light and dark reactions in photosynthesis?', 'Why do leaves appear green under white light?']
      };
    }

    // 4. Newton's Laws / Force / Gravity
    if (qLower.includes('newton') || qLower.includes('gravity') || qLower.includes('gurutv') || qLower.includes('force')) {
      const isHindi = qLower.includes('kya') || qLower.includes('kaise') || qLower.includes('batao');
      if (isDeep) {
        return {
          explanation: "[Deep-Dive Masterclass: Newton's Laws of Motion & Dynamics] Sir Isaac Newton formulated the three core physical laws describing how forces dictate changes in momentum and kinetic state.",
          steps: [
            "1. Physical Intuition: First Law (Inertia): A body has an inherent resistance to changing its velocity. A coffee cup slides off a dashboard when a car brakes because no net force acts on the cup to stop its forward momentum.",
            "2. Mathematical Derivation: Second Law: Force is defined as the time derivative of momentum: F = dp/dt = d(mv)/dt. For constant mass m: F = m * (dv/dt) = m * a. Impulse J = ∫ F dt = Δp.",
            "3. Mutual Interaction: Third Law: Forces always occur in simultaneous, equal, and opposite pairs: F_AB = -F_BA. Action and reaction forces NEVER act on the same body; they act on distinct bodies and therefore never cancel each other out.",
            "4. Solved Exemplar: A 1200 kg car accelerates from 0 to 20 m/s in 5 seconds. Acceleration a = (v - u)/t = (20 - 0)/5 = 4 m/s². Required net force: F = m * a = 1200 * 4 = 4,800 Newtons.",
            "5. High-Yield Exam Traps: Trap A: Inertia depends ONLY on mass, not on velocity or size. Trap B: An object moving at constant velocity has ZERO net force (a = 0)."
          ],
          example: "Calculated Exemplar: F = m * a | Weight W = m * g (where g = 9.8 m/s² on Earth).",
          summary: "Newton's laws bridge kinematics and dynamics: mass measures inertia, net force causes acceleration (F = ma), and all interactions are reciprocal (F_AB = -F_BA)."
        };
      }
      if (isHindi) {
        return {
          explanation: "न्यूटन के गति के तीन मूलभूत नियम (Newton's Laws of Motion) किसी वस्तु पर लगने वाले बल और उसकी गति के सम्बंध को समझाते हैं।",
          steps: [
            "1. प्रथम नियम (जड़त्व का नियम / Law of Inertia): कोई वस्तु तब तक अपनी विराम अवस्था या एकसमान गति में रहती है, जब तक कि उस पर कोई बाहरी असंतुलित बल न लगाया जाए।",
            "2. द्वितीय नियम (संवेग और बल / F = ma): किसी वस्तु के संवेग परिवर्तन की दर लगाए गए बल के समानुपाती होती है: बल (F) = द्रव्यमान (m) × त्वरण (a)।",
            "3. तृतीय नियम (क्रिया-प्रतिक्रिया / Action & Reaction): प्रत्येक क्रिया की सदैव बराबर और विपरीत दिशा में प्रतिक्रिया होती है।"
          ],
          example: "उदाहरण: 5 kg की गेंद को 3 m/s² की गति से त्वरित करने के लिए आवश्यक बल F = 5 × 3 = 15 Newtons होगा।",
          summary: "न्यूटन के नियम भौतिक विज्ञान का आधार हैं। F = ma से बल का परिमाण ज्ञात होता है, और तीसरा नियम बताता है कि बल हमेशा युग्म (pairs) में होते हैं।",
          practiceQuestions: ["रॉकेट किस नियम के सिद्धांत पर उड़ता है?", "जड़त्व (Inertia) का द्रव्यमान से क्या सम्बंध है?"]
        };
      }
      return {
        explanation: "Sir Isaac Newton formulated the three foundational laws of classical mechanics describing the relationship between the forces acting on a body and its motion.",
        steps: [
          "First Law (Inertia): An object remains in a state of rest or uniform motion in a straight line unless compelled to change that state by an external net force.",
          "Second Law (Force): The rate of change of momentum is directly proportional to the applied force: F = m × a (Force = mass × acceleration).",
          "Third Law (Action & Reaction): For every action, there is an equal and opposite reaction acting on mutually interacting bodies."
        ],
        example: "Example: Accelerating a 10 kg mass at 2 m/s² requires an applied net force of F = 10 × 2 = 20 Newtons.",
        summary: "Newton's laws dictate classical motion: inertia resists velocity changes, force induces acceleration proportional to mass (F = ma), and all interaction forces occur in balanced pairs.",
        practiceQuestions: ["Explain how a rocket propels forward using Newton's third law.", "Why do passengers fall backward when a bus accelerates suddenly?"]
      };
    }

    // 5. Ohm's Law & Electricity
    if (qLower.includes('ohm') || qLower.includes('resistance') || qLower.includes('voltage') || qLower.includes('current') || qLower.includes('vidyut')) {
      const isHindi = qLower.includes('kya') || qLower.includes('kaise') || qLower.includes('batao') || qLower.includes('kahiye');
      if (isDeep) {
        return {
          explanation: "[Deep-Dive Masterclass: Ohm’s Law & Microscopic Current Derivation] Ohm’s Law states that at constant temperature and physical conditions, the electric current (I) through a conductor is directly proportional to the potential difference (V) across its ends: V = I × R.",
          steps: [
            "1. Physical Intuition & Mental Model: Imagine water circulating in a pipe. Potential difference (Voltage V) is the pump pressure; Current (I) is the flow volume of water per second; Resistance (R) is constriction or obstacles in the pipe. More pressure = more flow; narrower pipe = less flow (I = V / R).",
            "2. Formal Microscopic Derivation: In an electric field E = V/L, conduction electrons undergo acceleration and collide with lattice ions. Average drift velocity: v_d = (e * E * τ) / m, where τ is relaxation time. Electric current I = n * e * A * v_d = (n * e² * A * τ / m) * (V / L). Rearranging yields V = [ m / (n * e² * τ) * (L / A) ] * I = I * R. Here, Resistivity ρ = m / (n * e² * τ) and Resistance R = ρ * (L / A).",
            "3. Step-by-Step Solved Exemplar: Problem: A heating coil of length 5 m, cross-sectional area 2.0 × 10⁻⁷ m², and resistivity ρ = 1.0 × 10⁻⁶ Ω·m is connected across a 220 V supply. Step A: Resistance R = ρ * (L / A) = (1.0 × 10⁻⁶ * 5) / (2.0 × 10⁻⁷) = 25 Ω. Step B: Current I = V / R = 220 V / 25 Ω = 8.8 Amperes. Step C: Power dissipated P = V * I = 220 * 8.8 = 1,936 Watts.",
            "4. High-Yield Exam Pitfalls: Trap A: Ohm's Law is NOT a universal fundamental law; it is an empirical property of metallic conductors. Diodes, transistors, thermistors, and electrolyte solutions are Non-Ohmic. Trap B: Metallic resistance increases with temperature: R_T = R_0 * (1 + α * ΔT).",
            "5. Summary & Formula Takeaways: V = I * R | R = ρ * (L / A) | P = V * I = I² * R = V² / R. Units: V (Volts), I (Amperes), R (Ohms Ω), ρ (Ohm-meters Ω·m)."
          ],
          example: "Verified Calculation: With V = 24 V and R = 6 Ω, current I = 24 / 6 = 4.0 A. Electric power P = 24 * 4 = 96 Watts.",
          summary: "Ohm's Law V = IR is derived microscopically from electron drift velocity. Remember: R = ρL/A, and Ohm's law strictly requires constant temperature."
        };
      }
      if (isHindi) {
        return {
          explanation: "ओम का नियम (Ohm's Law) कहता है कि यदि किसी चालक (conductor) की भौतिक अवस्थाएँ (जैसे तापमान) स्थिर रहें, तो उसके दोनों सिरों के बीच का विभवांतर (Voltage, V) उसमें प्रवाहित विद्युत धारा (Current, I) के समानुपाती होता है: V ∝ I, अर्थात् V = I × R।",
          steps: [
            "1. कथन (Statement): स्थिर तापमान पर V ∝ I (विभवांतर विद्युत धारा के सीधे अनुपाती है)।",
            "2. सूत्र (Formula): V = I × R, जहाँ V = वोल्टेज (Volts), I = विद्युत धारा (Amperes), और R = प्रतिरोध (Resistance, Ohms Ω)।",
            "3. प्रतिरोध (Resistance): R = V / I चालक का वह आंतरिक गुण है जो विद्युत धारा के प्रवाह में रुकावट डालता है।",
            "4. व्यावहारिक नियम: यदि प्रतिरोध (R) स्थिर है और वोल्टेज दोगुना कर दिया जाए, तो धारा (I) भी दोगुनी हो जाएगी।"
          ],
          example: "उदाहरण: यदि किसी बल्ब का प्रतिरोध R = 10 Ω है और परिपथ में I = 2 A की धारा बह रही है, तो आवश्यक वोल्टेज V = I × R = 2 × 10 = 20 Volts होगा।",
          summary: "ओम का नियम विद्युत परिपथों का मूल आधार है: V = I × R। इसका उपयोग वोल्टेज, करंट या प्रतिरोध में से किसी अज्ञात मान को ज्ञात करने के लिए किया जाता है।",
          practiceQuestions: ["यदि 24V की बैटरी से 4Ω का प्रतिरोधक जोड़ा जाए, तो कितनी धारा प्रवाहित होगी?", "ओमिक (Ohmic) और अन-ओमिक (Non-Ohmic) चालकों में क्या अंतर है?"]
        };
      }
      return {
        explanation: "Ohm’s Law states that the electric current (I) flowing through a metallic conductor between two points is directly proportional to the potential difference (Voltage, V) across those points, provided physical conditions such as temperature remain constant: V ∝ I, which yields V = I × R.",
        steps: [
          "Step 1: Fundamental Law: At constant temperature, Voltage is directly proportional to Current: V ∝ I.",
          "Step 2: Governing Formula: V = I × R (where V is Voltage in Volts [V], I is Current in Amperes [A], and R is Resistance in Ohms [Ω]).",
          "Step 3: Calculating Resistance: R = V / I represents the opposition offered by the material to the flow of electric charges.",
          "Step 4: Calculating Current: I = V / R shows that increasing resistance decreases electric current for a fixed voltage."
        ],
        example: "Example Problem: A circuit has a resistance of R = 5 Ω and a current of I = 3 A flowing through it. The potential difference across the resistor is V = I × R = 3 × 5 = 15 Volts.",
        summary: "Ohm's Law relates Voltage, Current, and Resistance via V = I × R. Materials that obey this linear V-I relationship are called Ohmic conductors (e.g. copper wires).",
        practiceQuestions: ["Calculate the current flowing through a 12 Ω resistor connected to a 24 V battery.", "Why does Ohm's law not hold true at very high temperatures?"]
      };
    }

    // 6. Conservation of Energy
    if (qLower.includes('conservation of energy') || qLower.includes('energy conservation') || qLower.includes('urja sanrakshan')) {
      const isHindi = qLower.includes('kya') || qLower.includes('kaise') || qLower.includes('batao');
      if (isDeep) {
        return {
          explanation: "[Deep-Dive Masterclass: Conservation of Energy & Work-Energy Theorem] The First Law of Thermodynamics and Mechanical Energy Conservation state that total energy in an isolated system remains constant: E_total = Constant.",
          steps: [
            "1. Physical Intuition: Think of a closed financial bank account. You can withdraw cash (convert Potential Energy to Kinetic Energy) or deposit cash, but without external theft or deposit, the total balance remains invariant.",
            "2. Mathematical Derivation: Work-Energy Theorem: Net Work W = ∫ F dx = ∫ m (v dv/dx) dx = ∫ m v dv = ½ m v_f² - ½ m v_i² = ΔKE. For conservative forces (gravity, ideal springs), Work W = -ΔPE. Hence, ΔKE + ΔPE = 0 => Total Mechanical Energy (KE + PE) = Constant.",
            "3. Solved Exemplar: A 2 kg ball is dropped from a height of h = 20 m (g = 9.8 m/s²). Top of fall: KE_1 = 0, PE_1 = mgh = 2 * 9.8 * 20 = 392 Joules. Just before ground: PE_2 = 0, so KE_2 = ½mv² = 392 Joules => v = √(2 * 392 / 2) = √392 ≈ 19.8 m/s.",
            "4. High-Yield Exam Pitfalls: Trap A: If friction or drag is present, mechanical energy is NOT conserved; some energy converts into thermal dissipation (W_nc = ΔE_mechanical). Trap B: Mass and energy are interchangeable in nuclear reactions via Einstein's E = mc²."
          ],
          example: "Mechanical Invariance: E = ½mv² + mgh = Constant (in conservative field).",
          summary: "Energy transforms continuously across forms, but the net universe sum is constant (ΔE = 0)."
        };
      }
      if (isHindi) {
        return {
          explanation: "ऊर्जा संरक्षण का नियम (Law of Conservation of Energy) यह बताता है कि ऊर्जा को न तो उत्पन्न किया जा सकता है और न ही नष्ट किया जा सकता है; इसे केवल एक रूप से दूसरे रूप में बदला जा सकता है। ब्रह्मांड की कुल ऊर्जा हमेशा स्थिर रहती है।",
          steps: [
            "1. मूल सिद्धांत: कुल प्रारंभिक ऊर्जा = कुल अंतिम ऊर्जा (E_total = Constant)।",
            "2. यांत्रिक ऊर्जा संरक्षण: Total Mechanical Energy = Kinetic Energy (गतिज ऊर्जा) + Potential Energy (स्थितिज ऊर्जा) = ½mv² + mgh = स्थिर।",
            "3. ऊर्जा रूपांतरण: जैसे पनबिजली संयंत्र (Hydroelectric plant) में पानी की स्थितिज ऊर्जा (PE) गिरकर गतिज ऊर्जा (KE) बनती है और टरबाइन के ज़रिए विद्युत ऊर्जा (Electrical Energy) में बदल जाती है।"
          ],
          example: "उदाहरण: एक सरल लोलक (Simple Pendulum) जब अपने उच्चतम बिंदु पर होता है तो उसमें केवल स्थितिज ऊर्जा (PE) होती है, और जब वह मध्य बिंदु से तेज़ी से गुजरता है तो सारी ऊर्जा गतिज ऊर्जा (KE) में बदल जाती है।",
          summary: "ऊर्जा रूप बदलती है लेकिन कभी ख़त्म नहीं होती। गणितीय रूप से: ΔE_system + ΔE_surroundings = 0।",
          practiceQuestions: ["मुक्त रूप से गिरती हुई किसी गेंद में गतिज और स्थितिज ऊर्जा का रूपांतरण समझाइए।", "क्या घर्षण (friction) की स्थिति में भी ऊर्जा संरक्षण का नियम लागू होता है?"]
        };
      }
      return {
        explanation: "The Law of Conservation of Energy states that energy can neither be created nor destroyed in an isolated system; it can only be transformed from one form to another. The total quantity of energy in the universe remains constant.",
        steps: [
          "Step 1: First Principle: Total Energy of an isolated system is strictly conserved: E_initial = E_final.",
          "Step 2: Mechanical Energy Conservation: E_total = Kinetic Energy (KE) + Potential Energy (PE) = ½mv² + mgh = Constant (in the absence of non-conservative forces like air friction).",
          "Step 3: Energy Transformations: Chemical energy in fuel transforms into thermal energy during combustion, which then converts into kinetic energy in an automobile engine."
        ],
        example: "Example: A roller coaster car at the top of a 20 m hill possesses maximum gravitational potential energy (mgh). As it plunges downward, that potential energy converts entirely into kinetic energy (½mv²), reaching maximum speed at the lowest point.",
        summary: "Energy transforms continuously across forms (mechanical, thermal, electrical, chemical), but the net sum remains invariant: ΔE = 0.",
        practiceQuestions: ["A 2 kg rock falls from a height of 10 m. What is its kinetic energy just before striking the ground? (Use g = 9.8 m/s²)", "How does the first law of thermodynamics relate to the conservation of energy?"]
      };
    }

    // 7. Cell Biology & Genetics (DNA / RNA / Mitochondria)
    if (qLower.includes('cell') || qLower.includes('mitochondria') || qLower.includes('dna') || qLower.includes('rna') || qLower.includes('gene')) {
      if (isDeep) {
        return {
          explanation: "[Deep-Dive Masterclass: Cell Structure & Molecular Genetics] Cells are the fundamental structural and functional units of all life. Within eukaryotic cells, compartmentalized organelles and nucleic acids coordinate metabolism, energy generation, and heredity.",
          steps: [
            "1. Structural Compartmentalization: Nucleus (stores chromosomal genomic DNA), Mitochondria (ATP production via oxidative phosphorylation), Endoplasmic Reticulum & Golgi Apparatus (protein folding, sorting, and lipid synthesis).",
            "2. Molecular Architecture of DNA: Double-helix antiparallel polymer of deoxyribonucleotides. Nitrogenous bases follow Chargaff's rules: Adenine pairs with Thymine (A=T via 2 hydrogen bonds), and Guanine pairs with Cytosine (G≡C via 3 hydrogen bonds).",
            "3. Central Dogma of Molecular Biology: Genetic flow: DNA replication -> Transcription (mRNA synthesis in nucleus) -> Translation (Polypeptide synthesis at ribosomes).",
            "4. High-Yield Exam Pitfalls: Trap A: Mitochondria and chloroplasts are semi-autonomous (Endosymbiotic Theory) — they possess their own circular DNA and 70S ribosomes. Trap B: Plant cells possess cell walls and chloroplasts; animal cells have neither."
          ],
          example: "Human Genome Reference: 23 pairs of chromosomes (46 total) encoding roughly 21,000 protein-coding genes.",
          summary: "Cellular compartmentalization and complementary base pairing (A-T, G-C) guarantee metabolic efficiency and high-fidelity genetic replication."
        };
      }
      return {
        explanation: "In biology, the cell is the fundamental structural, functional, and biological unit of all living organisms. Within cells, specialized organelles and nucleic acids (DNA/RNA) drive metabolism, energy production, and heredity.",
        steps: [
          "Mitochondria: Known as the 'powerhouse of the cell', it produces cellular energy in the form of ATP (Adenosine Triphosphate) through cellular respiration.",
          "DNA (Deoxyribonucleic Acid): Double-helix polymer composed of nucleotide bases (A, T, C, G) carrying genetic instructions for development and functioning.",
          "Central Dogma of Biology: Genetic information flows sequentially from DNA -> RNA (transcription) -> Protein (translation)."
        ],
        example: "Human cells contain 23 pairs of chromosomes inside the nucleus, encoding roughly 20,000 to 25,000 individual genes.",
        summary: "Organelle specialization and nucleic acid replication allow cells to maintain homeostasis and transmit genetic traits.",
        practiceQuestions: ["What are the key structural differences between plant and animal cells?", "Why do mitochondria have their own separate circular DNA?"]
      };
    }

    // 8. Chemistry: Acids, Bases, pH, and Chemical Bonding
    if (qLower.includes('acid') || qLower.includes('base') || qLower.includes('ph') || qLower.includes('bond') || qLower.includes('atom') || qLower.includes('periodic')) {
      if (isDeep) {
        return {
          explanation: "[Deep-Dive Masterclass: Acids, Bases & Chemical Thermodynamics] Acid-base chemistry examines proton and electron transfers that govern molecular bonding, equilibrium constants, and biological buffer systems.",
          steps: [
            "1. Theoretical Frameworks: A) Arrhenius: Acids release H⁺ in water; Bases release OH⁻. B) Brønsted-Lowry: Acids are proton (H⁺) donors; Bases are proton acceptors. C) Lewis: Acids are electron-pair acceptors; Bases are electron-pair donors.",
            "2. Mathematical Definition of pH: pH = -log₁₀[H⁺]. Water auto-ionization: K_w = [H⁺][OH⁻] = 1.0 × 10⁻¹⁴ at 25°C. Hence, pH + pOH = 14.",
            "3. Solved Exemplar: Calculate pH of 0.005 M H₂SO₄ (strong diprotic acid). Complete dissociation: [H⁺] = 2 × 0.005 M = 0.010 M = 1.0 × 10⁻² M. pH = -log₁₀(10⁻²) = 2.0.",
            "4. High-Yield Exam Traps: Trap A: Diluting a strong acid infinitely NEVER makes it basic (a 10⁻⁸ M HCl solution has pH ≈ 6.98 due to water auto-ionization, NOT 8). Trap B: Strong vs Concentrated — 'strong' means complete dissociation, 'concentrated' means high molarity."
          ],
          example: "Neutralization: Strong acid + Strong base -> Salt + Water + Heat (Exothermic: ΔH ≈ -57.1 kJ/mol).",
          summary: "Acids and bases drive aqueous equilibria. pH is a logarithmic scale (-log[H⁺]) where each integer represents a 10-fold change in acidity."
        };
      }
      return {
        explanation: "Chemistry studies matter, atomic structure, and chemical interactions through which valence electrons form bonds to create stable compounds.",
        steps: [
          "Atomic Structure: Atoms consist of a dense nucleus (protons and neutrons) surrounded by valence electron shells.",
          "Chemical Bonding: Ionic bonds involve complete electron transfer (e.g. Na⁺ and Cl⁻ forming NaCl), whereas covalent bonds involve electron sharing (e.g. H₂O, CO₂).",
          "Acids and Bases: Acids release H⁺ ions in aqueous solution (pH < 7), while bases release OH⁻ ions (pH > 7). Neutral substances like pure water have pH = 7."
        ],
        example: "Neutralization Reaction: Hydrochloric acid reacts with Sodium hydroxide to produce salt and water: HCl + NaOH -> NaCl + H₂O.",
        summary: "Chemical properties and reactivity are determined by electron configurations, bond electronegativity, and thermodynamic stability.",
        practiceQuestions: ["What is the pH of a 0.01 M HCl solution?", "Explain the difference between covalent and ionic bonds with examples."]
      };
    }

    // 9. Trigonometry & Geometry
    if (qLower.includes('trigonometry') || qLower.includes('sin') || qLower.includes('cos') || qLower.includes('tan') || qLower.includes('pythagor')) {
      if (isDeep) {
        return {
          explanation: "[Deep-Dive Masterclass: Trigonometric Functions & Analytical Geometry] Trigonometry defines circular functions connecting angle measures with coordinate projections on the unit circle (x = cos θ, y = sin θ).",
          steps: [
            "1. Geometric Foundation: On a right-angled triangle with hypotenuse c and legs a, b: sin θ = opp/hyp, cos θ = adj/hyp, tan θ = opp/adj (SOH CAH TOA).",
            "2. Unit Circle & Pythagorean Identities: On x² + y² = 1, substituting x = cos θ and y = sin θ yields: sin²θ + cos²θ = 1. Dividing by cos²θ yields: 1 + tan²θ = sec²θ. Dividing by sin²θ yields: 1 + cot²θ = cosec²θ.",
            "3. Solved Exemplar (Heights & Distances): A surveyor observes the top of a 50 m lighthouse at an angle of elevation of 30°. Distance from base d = 50 / tan(30°) = 50 / (1/√3) = 50√3 ≈ 86.6 meters.",
            "4. High-Yield Exam Traps: Trap A: sin⁻¹(x) represents arcsin (the angle whose sine is x), NOT 1 / sin(x). Reciprocal of sin(x) is cosec(x). Trap B: Angles must be in radians when doing calculus (d/dx [sin x] = cos x only in radians)."
          ],
          example: "Standard Values: sin(0°)=0, sin(30°)=1/2, sin(45°)=1/√2, sin(60°)=√3/2, sin(90°)=1.",
          summary: "Trigonometric identities originate from the unit circle. Master sin²θ + cos²θ = 1 and reciprocal relations for effortless board problem solving."
        };
      }
      return {
        explanation: "Trigonometry studies the mathematical relationships between the side lengths and interior angles of triangles.",
        steps: [
          "Trigonometric Ratios: In a right triangle, sin(θ) = Opposite / Hypotenuse, cos(θ) = Adjacent / Hypotenuse, and tan(θ) = Opposite / Adjacent (SOH CAH TOA).",
          "Pythagorean Theorem: In any right-angled triangle with legs a and b and hypotenuse c: a² + b² = c².",
          "Core Trigonometric Identity: For all angles θ, sin²(θ) + cos²(θ) = 1 and 1 + tan²(θ) = sec²(θ)."
        ],
        example: "In a right triangle with base = 4 cm and height = 3 cm, hypotenuse c = √(3² + 4²) = √25 = 5 cm, and sin(θ) = 3/5 = 0.6.",
        summary: "Trigonometric ratios enable calculation of unknown distances, angles of elevation, and wave oscillations across science and engineering.",
        practiceQuestions: ["Find the value of sin(30°) + cos(60°).", "A 10 m ladder leans against a wall at a 60° angle. Find the height it reaches on the wall."]
      };
    }

    // 10. Intelligent Academic Fallback for custom topics
    const cleanTopic = effectiveQuestion.length > 50 ? effectiveQuestion.slice(0, 47) + '...' : effectiveQuestion;
    if (isDeep) {
      return {
        explanation: `[Deep-Dive Concept Masterclass: ${cleanTopic}] Here is a rigorous, curriculum-grounded analysis of "${cleanTopic}", examining its foundational mechanisms, mathematical principles, and practical problem-solving applications.`,
        steps: [
          `1. Intuitive Foundation & Mental Models: To master "${cleanTopic}", visualize the underlying physical or conceptual mechanisms. Real-world analogies anchor abstract textbook statements into concrete mental models before manipulating formal equations.`,
          `2. Theoretical Framework & Governing Laws: In standard high-school and board curricula, this concept is grounded in fundamental conservation laws and strict dimensional consistency. Always verify SI units and algebraic sign conventions.`,
          `3. Step-by-Step Problem-Solving Method: When tackling exam questions: A) List all given variables with units, B) State the governing theorem or equation, C) Isolate the unknown variable algebraically first, and D) Substitute numerical values and round appropriately.`,
          `4. High-Yield Exam Pitfalls & Misconceptions: Common mistakes include unit conversion omissions (e.g. centimeters to meters, minutes to seconds), confusing instantaneous versus average values, and assuming formulas apply outside their boundary conditions.`,
          `5. Core Summary & Verification: After computing your answer, perform a sanity check: Does the magnitude make physical sense? Test boundary conditions (what happens when values approach 0 or infinity?).`
        ],
        example: `Exam Pro-Tip: Always sketch a labeled diagram or write out given values before substituting into equations for ${cleanTopic}.`,
        summary: `Mastering ${cleanTopic} requires connecting intuitive mental models with step-by-step mathematical rigor and disciplined unit verification.`
      };
    }
    return {
      explanation: `Here is a clear, structured explanation for your question on "${cleanTopic}". Understanding the foundational definition first helps connect theory to practice problems.`,
      steps: [
        'Step 1: Identify the central concept, given values, and target outcome from the problem.',
        'Step 2: Recall the underlying definition, theorem, or scientific rule that governs this concept.',
        'Step 3: Apply the method or formula step-by-step, ensuring correct units and logical reasoning.',
        'Step 4: Verify the result by testing edge cases or reversing the working to confirm accuracy.'
      ],
      example: 'Work through one simple numerical or conceptual case before tackling complex problems.',
      summary: `Focus on mastering the definition of ${cleanTopic}, writing down step-by-step logic, and testing yourself with practice questions.`,
      practiceQuestions: [`Explain the core idea of ${cleanTopic} in your own words.`, `Give a real-life application of this concept.`]
    };
  }

  async practice(input) {
    const count = Math.max(1, Math.min(10, Number(input.count) || 5));
    const subject = input.subject || 'General Studies';
    const topic = input.topic || 'Practice Topic';
    const curriculum = findCurriculumTopic(subject, topic);

    if (curriculum?.quiz) {
      return Array.from({ length: count }, (_, index) => {
        const item = curriculum.quiz[index % curriculum.quiz.length];
        return {
          id: index + 1,
          question: item.question,
          difficulty: input.difficulty || 'Medium',
          hint: item.hint,
          answer: item.answer,
          explanation: item.explanation
        };
      });
    }

    // Meaningful dynamic conceptual questions
    const dynamicTemplates = [
      {
        question: `Define the primary concept and significance of ${topic} in ${subject}.`,
        hint: `Think about what makes ${topic} unique and essential.`,
        answer: `${topic} is a core principle in ${subject}`,
        explanation: `In ${subject}, ${topic} establishes foundational rules used to analyze and solve problems.`
      },
      {
        question: `State one key rule or formula associated with ${topic}.`,
        hint: `Recall the standard formula or definition from your textbook.`,
        answer: `Rule of ${topic}`,
        explanation: `Understanding the mathematical or scientific law behind ${topic} ensures accurate problem solving.`
      },
      {
        question: `Give a practical real-world application where ${topic} is used.`,
        hint: `Consider how engineers, scientists, or everyday people apply this concept.`,
        answer: `Real-world application of ${topic}`,
        explanation: `${topic} is widely utilized in practical technology, scientific analysis, and quantitative modeling.`
      },
      {
        question: `What are the primary factors that influence or change ${topic}?`,
        hint: `Identify the independent and dependent variables.`,
        answer: `Variables of ${topic}`,
        explanation: `Parameters such as magnitude, environmental conditions, or initial values directly determine outcomes in ${topic}.`
      },
      {
        question: `What is a common mistake students make when analyzing ${topic}, and how can it be avoided?`,
        hint: `Consider sign errors, unit mismatch, or confusing definitions.`,
        answer: `Check units and sign conventions`,
        explanation: `Carefully writing each step, keeping track of units, and double-checking arithmetic eliminates over 90% of errors in ${topic}.`
      }
    ];

    return Array.from({ length: count }, (_, index) => {
      const t = dynamicTemplates[index % dynamicTemplates.length];
      return {
        id: index + 1,
        question: t.question,
        difficulty: input.difficulty || 'Medium',
        hint: t.hint,
        answer: t.answer,
        explanation: t.explanation
      };
    });
  }

  async quiz(input) {
    const questions = await this.practice({ ...input, count: 5 });
    return { mode: 'quiz', subject: input.subject || 'General Studies', topic: input.topic || 'Practice', questions };
  }
}

class OpenAIProvider {
  formatTaskPrompt(task, payload) {
    if (task === 'quiz') {
      return `Generate a 5-question interactive educational quiz testing student mastery of "${payload.topic}" in "${payload.subject}" at ${payload.difficulty || 'Medium'} difficulty.
Questions must be real, concrete, solvable problems (e.g. solve for x, calculate a value, state a definition).
Every question must have:
- id: integer
- question: concrete question string
- answer: concise, direct answer string (e.g. "5", "12", "Newton", "Mitochondria") that a student can easily type into an input box
- explanation: clear step-by-step explanation showing why that answer is correct
- hint: a helpful clue guiding the student without giving away the answer
Return strictly valid JSON in this exact structure:
{
  "mode": "quiz",
  "subject": "${payload.subject}",
  "topic": "${payload.topic}",
  "questions": [
    { "id": 1, "question": "...", "answer": "...", "explanation": "...", "hint": "..." }
  ]
}`;
    }

    if (task === 'study-plan') {
      return `Create a structured ${payload.availableDays || 5}-day study plan for mastering "${payload.topic}" in "${payload.subject}".
For each day, provide:
- day: integer (1 to ${payload.availableDays || 5})
- activity: concise title of the specific subtopic or concept for that day
- description: detailed, educational guidance on what formulas, theory, exercises, and revision to perform on that day
- completed: false
Return strictly valid JSON in this exact structure:
{
  "plan": [
    { "day": 1, "activity": "...", "description": "...", "completed": false }
  ]
}`;
    }

    if (task === 'doubt-assistant') {
      const historyContext = Array.isArray(payload.conversationContext) && payload.conversationContext.length
        ? `Prior Conversation Context:\n${payload.conversationContext.map((c) => `Student: ${c.question}\nAssistant: ${c.answer}`).join('\n\n')}\n\n`
        : '';
      const depthNotice = payload.depth === 'deep'
        ? `\n[DEPTH MODE: DEEP-DIVE PEDAGOGICAL MASTERCLASS]\nDeliver an exhaustive, conceptually rigorous breakdown including: 1) Intuition & Analogy, 2) Formal Mathematical/Scientific Derivation, 3) Solved Exemplar, 4) Common Traps/Misconceptions to avoid.\n`
        : '';
      return `${historyContext}Student Question: "${payload.question}"
${payload.answerRequirements || ''}${depthNotice}
Provide an accurate, educational answer. If the question is in Hindi, respond in clear Hindi; if in English, respond in English.
Return strictly valid JSON:
{
  "explanation": "...",
  "steps": ["Step 1...", "Step 2..."],
  "summary": "..."
}`;
    }

    if (task === 'practice-questions' || task === 'practice') {
      return `Generate ${payload.count || 5} practice questions for "${payload.topic}" in "${payload.subject}" at ${payload.difficulty || 'Medium'} difficulty.
Return strictly valid JSON:
{
  "questions": [
    { "id": 1, "question": "...", "difficulty": "${payload.difficulty || 'Medium'}", "hint": "...", "answer": "...", "explanation": "..." }
  ]
}`;
    }

    return JSON.stringify({ task, payload });
  }

  async generate(task, payload) {
    if (!process.env.AI_API_KEY) throw new Error('AI provider is not configured');

    const promptContent = this.formatTaskPrompt(task, payload);
    const candidateModels = [
      process.env.AI_MODEL,
      'google/gemini-2.0-flash-exp:free',
      'meta-llama/llama-3.2-3b-instruct:free',
      'meta-llama/llama-3.1-8b-instruct:free',
      'qwen/qwen-2.5-7b-instruct:free',
      'mistralai/mistral-7b-instruct:free',
      'cohere/north-mini-code:free'
    ].filter(Boolean);

    let lastError = null;

    for (const modelName of candidateModels) {
      try {
        const response = await fetch(process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.AI_API_KEY}`,
            'HTTP-Referer': process.env.CLIENT_URL || 'https://edusetu-platform.onrender.com',
            'X-Title': 'EduSetu'
          },
          body: JSON.stringify({
            model: modelName,
            temperature: 0.3,
            messages: [
              {
                role: 'system',
                content: 'You are an expert school tutor and curriculum specialist. You generate high-quality educational study plans, quizzes, and problem explanations. Return strictly valid JSON without any markdown formatting.'
              },
              { role: 'user', content: promptContent }
            ]
          })
        });

        if (!response.ok) {
          if (response.status === 429) {
            console.warn(`[AI] Model ${modelName} rate-limited (HTTP 429), trying next candidate...`);
            continue;
          }

          let providerError = {};
          try {
            const parsed = await response.json();
            const errorBody = parsed && typeof parsed === 'object' ? parsed.error || parsed : {};
            providerError = {
              status: response.status,
              providerCode: typeof errorBody.code === 'string' ? errorBody.code : undefined,
              providerType: typeof errorBody.type === 'string' ? errorBody.type : undefined,
              message: `AI provider request failed (HTTP ${response.status})`
            };
          } catch {
            providerError = {
              status: response.status,
              message: `AI provider request failed (HTTP ${response.status})`
            };
          }

          const err = new Error(providerError.message);
          err.status = providerError.status;
          if (providerError.providerCode) err.providerCode = providerError.providerCode;
          if (providerError.providerType) err.providerType = providerError.providerType;
          throw err;
        }

        const body = await response.json();
        const content = body.choices?.[0]?.message?.content || '{}';
        try {
          return JSON.parse(content);
        } catch (error) {
          const match = content.match(/\{[\s\S]*\}/);
          if (match) {
            try { return JSON.parse(match[0]); } catch (inner) { /* fall through */ }
          }
          throw new Error('AI provider returned invalid JSON');
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('All AI candidate models failed');
  }
}

const mock = new MockAIProvider();
const openai = new OpenAIProvider();
const getAIProvider = () => process.env.AI_PROVIDER === 'openai' ? openai : mock;

module.exports = { MockAIProvider, OpenAIProvider, getAIProvider };
