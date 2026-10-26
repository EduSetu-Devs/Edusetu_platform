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
  async analyzePerformance(profile) {
    const subjects = Array.isArray(profile?.subjects) ? profile.subjects : [];
    const strongSubjects = subjects.filter((item) => item.percentage >= 75).map((item) => item.subject);
    const weakSubjects = subjects.filter((item) => item.percentage < 60).map((item) => item.subject);
    const insights = [];
    if (profile?.attendance?.percentage !== null && profile?.attendance?.percentage !== undefined && profile.attendance.percentage < 75) {
      insights.push(`Attendance is ${profile.attendance.percentage}%, below the recommended 75% threshold.`);
    }
    if (profile?.assignments?.pending > 0) {
      insights.push(`${profile.assignments.pending} assignment(s) have no recorded submission.`);
    }
    if (Array.isArray(profile?.recentPerformance) && profile.recentPerformance.length >= 2) {
      const first = profile.recentPerformance[0].percentage;
      const last = profile.recentPerformance[profile.recentPerformance.length - 1].percentage;
      if (last > first) insights.push(`Recent recorded performance is improving from ${first}% to ${last}%.`);
      else if (last < first) insights.push(`Recent recorded performance declined from ${first}% to ${last}%.`);
    }
    const totalPercentage = subjects.reduce((sum, s) => sum + (s.percentage || 0), 0);
    const averageScore = subjects.length ? Math.round(totalPercentage / subjects.length) : null;
    let grade = 'N/A';
    if (averageScore !== null) {
      if (averageScore >= 90) grade = 'A+';
      else if (averageScore >= 80) grade = 'A';
      else if (averageScore >= 70) grade = 'B';
      else if (averageScore >= 60) grade = 'C';
      else grade = 'D';
    }

    return {
      mode: 'performance',
      overall: profile?.marksCount
        ? `Academic Standing: Grade ${grade} (${averageScore}% Overall). Strong foundation in ${strongSubjects.join(', ') || 'curriculum subjects'} with consistent attendance. Targeted practice recommended in ${weakSubjects.join(', ') || 'core concepts'}.`
        : 'There are not enough recorded marks for an overall performance conclusion.',
      strongSubjects,
      weakSubjects,
      insights,
      focusAreas: weakSubjects.length
        ? weakSubjects.map((subject) => `Review recorded work and complete targeted practice in ${subject}.`)
        : ['Continue reviewing current class notes and completing assigned practice.'],
      subjectBreakdown: subjects,
      averageScore,
      grade,
      attendance: profile?.attendance || { percentage: null, present: 0, total: 0 },
      assignments: profile?.assignments || { total: 0, submitted: 0, pending: 0 }
    };
  }

  async recommendations(profile) {
    const subjects = Array.isArray(profile?.subjects) ? profile.subjects : [];
    const recommendations = subjects
      .filter((item) => item.percentage < 75)
      .map((item) => ({
        subject: item.subject,
        actions: [`Review recent ${item.subject} class notes.`, `Complete additional practice for ${item.subject}.`]
      }));
    if (profile?.assignments?.pending > 0) {
      recommendations.push({ subject: 'Assignments', actions: [`Complete ${profile.assignments.pending} pending assignment(s).`] });
    }
    if (!recommendations.length) {
      recommendations.push({ subject: 'General', actions: ['Maintain the current study routine and review recent feedback.'] });
    }
    return recommendations;
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
    const raw = String(input?.question || '').trim();
    const qLower = raw.toLowerCase();

    // 1. Math Equation Solver: e.g. "solve 2x + 6 = 16" or "3x - 5 = 10"
    const linearMatch = raw.match(/([+-]?\s*\d*)\s*([a-zA-Z])\s*([+-]\s*\d+)\s*=\s*([+-]?\s*\d+)/);
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
        explanation: `To solve the linear equation ${raw}, we use inverse operations to isolate the variable ${varName}.`,
        steps: [
          `Step 1: Write down the equation: ${raw}.`,
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

    // 3. Newton's Laws / Force / Gravity
    if (qLower.includes('newton') || qLower.includes('gravity') || qLower.includes('gurutv') || qLower.includes('force')) {
      const isHindi = qLower.includes('kya') || qLower.includes('kaise') || qLower.includes('batao');
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

    // 4. Ohm's Law & Electricity
    if (qLower.includes('ohm') || qLower.includes('resistance') || qLower.includes('voltage') || qLower.includes('current') || qLower.includes('vidyut')) {
      const isHindi = qLower.includes('kya') || qLower.includes('kaise') || qLower.includes('batao') || qLower.includes('kahiye');
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

    // 5. Conservation of Energy
    if (qLower.includes('conservation of energy') || qLower.includes('energy conservation') || qLower.includes('urja sanrakshan')) {
      const isHindi = qLower.includes('kya') || qLower.includes('kaise') || qLower.includes('batao');
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

    // 6. Cell Biology & Genetics (DNA / RNA / Mitochondria)
    if (qLower.includes('cell') || qLower.includes('mitochondria') || qLower.includes('dna') || qLower.includes('rna') || qLower.includes('gene')) {
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

    // 7. Chemistry: Acids, Bases, pH, and Chemical Bonding
    if (qLower.includes('acid') || qLower.includes('base') || qLower.includes('ph') || qLower.includes('bond') || qLower.includes('atom') || qLower.includes('periodic')) {
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

    // 8. Trigonometry & Geometry
    if (qLower.includes('trigonometry') || qLower.includes('sin') || qLower.includes('cos') || qLower.includes('tan') || qLower.includes('pythagor')) {
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

    // 4. Default Intelligent Academic Explanation
    if (input?.depth === 'deep') {
      return {
        explanation: `[Deep-Dive Concept Masterclass] Here is an exhaustive, rigorous breakdown for "${raw}". We analyze its intuitive foundation, formal mathematical principles, and practical problem-solving strategies.`,
        steps: [
          `1. Intuitive Foundation & Physical Analogy: Consider "${raw}" through physical real-world analogies. Developing mental models allows you to visualize underlying mechanisms before manipulating formal formulas.`,
          `2. Formal Theoretical Framework & Derivations: In standard curricula, this concept is grounded in foundational conservation laws and algebraic relations. Every quantity must preserve strict dimensional and unit consistency (SI units).`,
          `3. Step-by-Step Solved Exemplar: When tackling exam questions, write out all given variables with units, state the governing equation, isolate the target unknown algebraically before plugging in numbers, and simplify methodically.`,
          `4. High-Yield Exam Traps & Misconceptions: Frequent mistakes include sign convention errors (e.g. positive vs negative coordinate axes), missing unit conversions (e.g. cm to meters, grams to kilograms), and confusing instantaneous vs average rates of change.`,
          `5. Summary & Formula Takeaways: Review governing equations, note boundary conditions (limits as variables approach 0 or infinity), and verify that answers make physical sense.`
        ],
        example: 'Pro-Tip: Always sketch a diagram or write out given values before substituting into equations.',
        summary: `Mastering "${raw}" requires connecting physical intuition with algebraic rigor and avoiding frequent calculation traps.`,
        practiceQuestions: [`Explain the core derivation of: ${raw.slice(0, 50)} in your own words.`, `What happens under extreme boundary conditions?`]
      };
    }
    return {
      explanation: `Here is a clear, structured explanation for your question: "${raw}". In education, understanding the fundamental principle first helps connect concepts to practice problems.`,
      steps: [
        'Step 1: Identify the central concept, given values, and target outcome from the problem.',
        'Step 2: Recall the underlying definition, theorem, or scientific rule that governs this concept.',
        'Step 3: Apply the method or formula step-by-step, ensuring correct units and logical reasoning.',
        'Step 4: Verify the result by testing edge cases or reversing the working to confirm accuracy.'
      ],
      example: 'Work through one simple numerical or conceptual case before tackling complex problems.',
      summary: `Focus on mastering the definition of ${raw.slice(0, 40)}, writing down the step-by-step logic, and testing yourself with practice questions.`,
      practiceQuestions: [`Explain the core idea of: ${raw.slice(0, 50)} in your own words.`, `Give a real-life application of this concept.`]
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

    const response = await fetch(process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'EduSetu'
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'gpt-4o-mini',
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
      let providerError;
      try {
        providerError = (await response.json())?.error;
      } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
      }
      const safeCode = (value) => typeof value === 'string' && /^[A-Za-z0-9_.-]{1,80}$/.test(value) ? value : undefined;
      const requestError = new Error(`AI provider request failed (HTTP ${response.status})`);
      requestError.status = response.status;
      requestError.providerCode = safeCode(providerError?.code);
      requestError.providerType = safeCode(providerError?.type);
      throw requestError;
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
  }
}

const mock = new MockAIProvider();
const openai = new OpenAIProvider();
const getAIProvider = () => process.env.AI_PROVIDER === 'openai' ? openai : mock;

module.exports = { MockAIProvider, OpenAIProvider, getAIProvider };
