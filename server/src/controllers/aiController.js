const { Op } = require('sequelize');
const { User, StudentProfile, TeacherProfile, ParentProfile, ParentStudent, TeachingSession, Homework, HomeworkSubmission, AIChatHistory, AISafetyLog } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { getAcademicProfile, teacherCanAccessStudent } = require('../services/studentAcademicProfileService');
const { getAIProvider, MockAIProvider } = require('../services/aiProvider');
const aiCache = require('../services/aiCacheService');
const aiGuardrailService = require('../services/aiGuardrailService');
const mockAI = new MockAIProvider();

const runAI = async (task, payload, method) => {
  const provider = getAIProvider();
  if (process.env.AI_PROVIDER === 'openai' && process.env.AI_API_KEY) {
    try {
      return await provider.generate(task, payload);
    } catch (error) {
      if (error.message && error.message.includes('invalid JSON')) throw error;
      if (error.status === 429 || error.status === 401 || !error.status) {
        console.warn('[AI] provider failed, using mock fallback', error.status || error.message);
        return mockAI[method](payload);
      }
      throw error;
    }
  }
  return provider[method](payload);
};
const extractList = (raw, keys = ['plan', 'tasks', 'questions']) => {
  const seen = new Set();
  const stack = [raw];
  while (stack.length) {
    const current = stack.pop();
    if (Array.isArray(current)) return current;
    if (!current || typeof current !== 'object' || seen.has(current)) continue;
    seen.add(current);
    for (const key of keys) {
      if (Array.isArray(current[key])) return current[key];
    }
    for (const value of Object.values(current)) {
      if (value && typeof value === 'object') stack.push(value);
    }
  }
  return [];
};

const findStudent = (identifier) => StudentProfile.findOne({ where: !isNaN(Number(identifier)) ? { [Op.or]: [{ id: Number(identifier) }, { studentId: String(identifier) }] } : { studentId: String(identifier) } });
const getOwnStudent = (userId) => StudentProfile.findOne({ where: { userId } });
const getOwnTeacher = (userId) => TeacherProfile.findOne({ where: { userId } });
const handleAIError = (res, error) => {
  console.error('[AI Error]', {
    status: Number.isInteger(error.status) ? error.status : undefined,
    providerCode: error.providerCode,
    providerType: error.providerType
  });
  if (error.message.includes('not configured')) return errorResponse(res, 503, 'AI provider is not configured');
  if (error.message.includes('invalid JSON')) return errorResponse(res, 500, 'AI request could not be completed');
  return error.message.includes('provider') ? errorResponse(res, 503, 'AI service is temporarily unavailable. Please try again.') : errorResponse(res, 500, 'AI request could not be completed');
};
const academicSummary = (profile) => ({
  subjects: profile.subjects,
  attendance: profile.attendance,
  assignments: profile.assignments,
  teacherFeedback: profile.feedback.map(({ understandingLevel, feedback, improvementTopics }) => ({ understandingLevel, feedback, improvementTopics }))
});

const studentPerformance = async (req, res) => {
  try { const student = await getOwnStudent(req.user.id); const profile = student && await getAcademicProfile(student.id); if (!profile) return errorResponse(res, 404, 'Student profile not found'); const rawPerformance = await runAI('performance-analysis', profile, 'analyzePerformance'); const performanceResult = rawPerformance && typeof rawPerformance === 'object' && Array.isArray(rawPerformance.strongSubjects) ? rawPerformance : await mockAI.analyzePerformance(profile); return successResponse(res, 200, 'Performance analysis generated', performanceResult); }
  catch (error) { return handleAIError(res, error); }
};

const studentRecommendations = async (req, res) => {
  try { const student = await getOwnStudent(req.user.id); const profile = student && await getAcademicProfile(student.id); if (!profile) return errorResponse(res, 404, 'Student profile not found'); const rawRecommendations = await runAI('study-recommendations', profile, 'recommendations'); const recommendations = Array.isArray(rawRecommendations) ? rawRecommendations : (Array.isArray(rawRecommendations?.recommendations) ? rawRecommendations.recommendations : await mockAI.recommendations(profile)); return successResponse(res, 200, 'Study recommendations generated', { recommendations }); }
  catch (error) { return handleAIError(res, error); }
};

const studyPlan = async (req, res) => {
  try {
    const { subject, topic, availableDays, targetDate, understandingLevel } = req.body || {};
    if (!subject || !topic || !availableDays) return errorResponse(res, 400, 'Subject, topic, and available study days are required');
    
    const subjectGuard = aiGuardrailService.evaluateInput(subject);
    const topicGuard = aiGuardrailService.evaluateInput(topic);
    if (!subjectGuard.safe || !topicGuard.safe) {
      return errorResponse(res, 400, 'Subject or topic contains prohibited or unsafe content');
    }

    const raw = await runAI('study-plan', { subject, topic, availableDays, targetDate, understandingLevel }, 'studyPlan');
    console.log('[studyPlan] raw:', JSON.stringify(raw));

    const rawPlan = extractList(raw, ['plan', 'tasks']);

    console.log('[studyPlan] rawPlan length', rawPlan.length, 'keys', rawPlan.map(t=>Object.keys(t||{})));

    const plan = rawPlan.map((task, index) => {
      const taskList = Array.isArray(task?.tasks) ? task.tasks.map((item) => String(item).trim()).filter(Boolean) : [];
      const activityValue = typeof task?.activity === 'string' ? task.activity.trim()
        : (typeof task?.focus === 'string' ? task.focus.trim()
        : (typeof task?.title === 'string' ? task.title.trim()
        : (typeof task?.task === 'string' ? task.task.trim()
        : (typeof task?.name === 'string' ? task.name.trim()
         : (taskList.length ? taskList[0] : `Study task ${index + 1}`)))));
      const descriptionValue = typeof task?.description === 'string' ? task.description
        : (typeof task?.details === 'string' ? task.details
        : (taskList.length > 1 ? taskList.slice(1).join('; ') : ''));
      return {
        day: Number(task?.day) || index + 1,
        activity: activityValue,
        description: descriptionValue,
        completed: Boolean(task?.completed)
      };
    });
    if (!plan.length || plan.some((task) => !task.activity)) return errorResponse(res, 502, 'AI returned an invalid study plan. Please try again.');
    return successResponse(res, 200, 'Study plan generated', { plan });
  }
  catch (error) { return handleAIError(res, error); }
};

const askDoubt = async (req, res) => {
  try {
    const rawQuestion = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
    if (!rawQuestion || rawQuestion.length > 2000) return errorResponse(res, 400, 'A question up to 2000 characters is required');

    const conversationId = typeof req.body?.conversationId === 'string' && req.body.conversationId.trim()
      ? req.body.conversationId.trim()
      : `conv_${req.user?.id || 'anon'}_${Date.now()}`;
    const depth = req.body?.depth === 'deep' ? 'deep' : 'quick';

    // 1. Safety Guardrail Evaluation (Input Protection)
    const guardResult = aiGuardrailService.evaluateInput(rawQuestion);
    if (!guardResult.safe) {
      try {
        await AISafetyLog.create({
          userId: req.user?.id || null,
          conversationId,
          inputSnippet: rawQuestion.slice(0, 500),
          violationCategory: guardResult.category,
          severity: guardResult.severity || 'medium',
          blocked: true,
          actionTaken: 'BLOCKED_AND_REDIRECTED',
          metadata: JSON.stringify({ reason: guardResult.reason })
        });
      } catch (logErr) {
        console.error('[AISafetyLog] error creating log:', logErr.message);
      }

      const safeData = {
        ...guardResult.safeResponse,
        isGuardrailTriggered: true,
        violationCategory: guardResult.category,
        guardrailReason: guardResult.reason,
        conversationId,
        depth
      };

      try {
        await AIChatHistory.create({
          userId: req.user.id,
          conversationId,
          question: rawQuestion,
          answer: JSON.stringify(safeData)
        });
      } catch (histErr) {
        console.error('[AIChatHistory] error saving safe response:', histErr.message);
      }

      return successResponse(res, 200, 'Safety Guardrail Active', safeData);
    }

    const question = guardResult.cleanText || rawQuestion;

    // 2. Check AI Cache Memory
    const cachedAnswer = await aiCache.get(question, depth);
    if (cachedAnswer) {
      await AIChatHistory.create({
        userId: req.user.id,
        conversationId,
        question,
        answer: JSON.stringify(cachedAnswer)
      });
      const responseData = { ...cachedAnswer };
      if (req.body?.conversationId || req.body?.depth) {
        responseData.conversationId = conversationId;
        responseData.depth = depth;
      }
      return successResponse(res, 200, 'AI answer generated (from cache)', responseData);
    }

    // 3. Retrieve multi-turn conversation memory (last 6 turns)
    let conversationContext = [];
    if (req.body?.conversationId) {
      const historyRows = await AIChatHistory.findAll({
        where: { userId: req.user.id, conversationId },
        order: [['createdAt', 'DESC']],
        limit: 6
      });
      conversationContext = historyRows.reverse().map((row) => {
        let ansObj = {};
        try { ansObj = JSON.parse(row.answer); } catch { ansObj = { summary: row.answer }; }
        return { question: row.question, answer: ansObj.explanation || ansObj.summary || '' };
      });
    }

    const answerRequirements = depth === 'deep'
      ? 'Provide an IN-DEPTH academic masterclass. Include: 1) Physical / Real-world Intuition & Analogy, 2) Formal Scientific / Mathematical Definition & Derivations, 3) Step-by-Step Solved Exemplar, 4) Common Exam Pitfalls & Misconceptions to avoid. Return JSON with explanation (string), steps (array of strings covering the derivation/steps), and summary (string with key formulas/takeaways).'
      : 'Answer accurately in simple Hindi or English, matching the question language. Use short, clear steps and an age-appropriate example when useful. Return JSON with explanation (string), steps (array of strings), and summary (string).';

    let answer;
    if (process.env.AI_API_KEY && process.env.AI_PROVIDER === 'openai') {
      try {
        answer = await getAIProvider().generate('doubt-assistant', { question, depth, conversationContext, answerRequirements });
      } catch (error) {
        console.warn('[AI] doubt provider error, using fallback:', error.message);
        answer = await mockAI.doubt({ question, depth, conversationContext });
      }
    } else {
      answer = await mockAI.doubt({ question, depth, conversationContext });
    }
    if (!answer || typeof answer.explanation !== 'string' || !answer.explanation.trim()
      || !Array.isArray(answer.steps) || answer.steps.some((step) => typeof step !== 'string')
      || typeof answer.summary !== 'string' || !answer.summary.trim()) {
      answer = await mockAI.doubt({ question, depth, conversationContext });
    }

    // 4. Output Guardrail (Ensure AI response is safe and PII-sanitized)
    answer = aiGuardrailService.evaluateOutput(answer);

    // Save to Cache Memory for future quick answers
    await aiCache.set(question, answer, depth);

    // Save to Chat History with conversationId
    await AIChatHistory.create({ userId: req.user.id, conversationId, question, answer: JSON.stringify(answer) });

    const responseData = { ...answer };
    if (req.body?.conversationId || req.body?.depth) {
      responseData.conversationId = conversationId;
      responseData.depth = depth;
    }
    return successResponse(res, 200, 'AI answer generated', responseData);
  }
  catch (error) { return handleAIError(res, error); }
};

const chatHistory = async (req, res) => {
  try {
    const where = { userId: req.user.id };
    if (req.query?.conversationId) {
      where.conversationId = String(req.query.conversationId).trim();
    }
    const rows = await AIChatHistory.findAll({
      where,
      attributes: ['id', 'conversationId', 'question', 'answer', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    return successResponse(res, 200, 'AI chat history retrieved', {
      history: rows.map((row) => ({
        ...row.toJSON(),
        answer: (() => { try { return JSON.parse(row.answer); } catch { return { summary: row.answer }; } })()
      }))
    });
  }
  catch (error) { return handleAIError(res, error); }
};

const studentPractice = async (req, res) => {
  try {
    const { subject, topic, difficulty = 'Easy', count = 5 } = req.body || {};
    if (!subject || !topic) return errorResponse(res, 400, 'Subject and topic are required');
    const subjectGuard = aiGuardrailService.evaluateInput(subject);
    const topicGuard = aiGuardrailService.evaluateInput(topic);
    if (!subjectGuard.safe || !topicGuard.safe) {
      return errorResponse(res, 400, 'Subject or topic contains prohibited or unsafe content');
    }
    const raw = await runAI('practice-questions', { subject, topic, difficulty, count }, 'practice');
    const rawQuestions = extractList(raw, ['questions', 'tasks', 'items']);

    const questions = rawQuestions.map((item, index) => ({
      id: item?.id ?? index + 1,
      question: String(item?.question || item?.prompt || `Practice question ${index + 1}`).trim(),
      difficulty: item?.difficulty || difficulty,
      hint: typeof item?.hint === 'string' ? item.hint : 'Start with the definition and show each step.',
      answer: String(item?.answer || item?.solution || 'Check your working.').trim(),
      explanation: typeof item?.explanation === 'string' ? item.explanation : ''
    }));
    if (!questions.length || questions.some((item) => !item.question || !item.answer)) return errorResponse(res, 502, 'AI returned invalid practice questions. Please try again.');
    return successResponse(res, 200, 'Practice questions generated', { mode: 'practice', subject, topic, questions });
  }
  catch (error) { return handleAIError(res, error); }
};

const studentQuiz = async (req, res) => {
  try {
    const { subject, topic, difficulty = 'Easy' } = req.body || {};
    if (!subject || !topic) return errorResponse(res, 400, 'Subject and topic are required');
    const subjectGuard = aiGuardrailService.evaluateInput(subject);
    const topicGuard = aiGuardrailService.evaluateInput(topic);
    if (!subjectGuard.safe || !topicGuard.safe) {
      return errorResponse(res, 400, 'Subject or topic contains prohibited or unsafe content');
    }
    const raw = await runAI('quiz', { subject, topic, difficulty }, 'quiz');
    const rawQuestions = extractList(raw, ['questions', 'tasks', 'items']);

    const questions = rawQuestions.map((item, index) => ({
      id: item?.id ?? index + 1,
      question: String(item?.question || item?.prompt || `Question ${index + 1}`).trim(),
      answer: String(item?.answer || item?.solution || '').trim(),
      explanation: typeof item?.explanation === 'string' ? item.explanation : ''
    }));
    if (!questions.length || questions.some((item) => !item.question || !item.answer)) return errorResponse(res, 502, 'AI returned an invalid quiz. Please try again.');
    return successResponse(res, 200, 'Quiz generated', { mode: 'quiz', subject, topic, questions });
  }
  catch (error) { return handleAIError(res, error); }
};

const teacherStudentInsights = async (req, res) => {
  try { const teacher = await getOwnTeacher(req.user.id); const student = await findStudent(req.params.studentId); if (!student || !await teacherCanAccessStudent(teacher, student.id)) return errorResponse(res, 404, 'Student is outside your authorized teaching scope'); const profile = await getAcademicProfile(student.id); const insights = await runAI('teacher-student-insights', profile, 'analyzePerformance'); return successResponse(res, 200, 'Student insights generated', { ...insights, academicSummary: academicSummary(profile), advisoryOnly: true }); }
  catch (error) { return handleAIError(res, error); }
};

const teacherClassInsights = async (req, res) => {
  try { const teacher = await getOwnTeacher(req.user.id); const session = await TeachingSession.findOne({ where: { id: req.params.sessionId, teacherProfileId: teacher?.id }, include: [{ model: require('../models').ClassFeedback, as: 'feedback' }, { model: require('../models').TeachingSessionParticipant, as: 'participants' }] }); if (!session) return errorResponse(res, 404, 'Class is not owned by this teacher'); const payload = { topic: session.title, subject: session.subjectName, status: session.status, participants: (session.participants || []).map((item) => ({ role: item.role, joined: Boolean(item.joinedAt), left: Boolean(item.leftAt) })), feedback: session.feedback || null }; return successResponse(res, 200, 'Class insights generated', { summary: `Recorded class topic: ${payload.topic}.`, attendance: payload.participants, topicsCovered: [payload.topic], participation: payload.participants.length ? payload.participants : [], followUp: payload.feedback?.improvementTopics || 'Review the stored class notes and teacher feedback.' }); }
  catch (error) { return handleAIError(res, error); }
};

const teacherAssignmentAnalysis = async (req, res) => {
  try { const teacher = await getOwnTeacher(req.user.id); const submission = await HomeworkSubmission.findByPk(req.params.submissionId, { include: [{ model: Homework, as: 'homework' }, { model: StudentProfile, as: 'studentProfile' }] }); if (!submission || submission.homework?.assignedBy !== teacher?.userId) return errorResponse(res, 404, 'Submission is not owned by this teacher'); if (!submission.submissionText?.trim()) return errorResponse(res, 400, 'Only text submissions can be analyzed'); return successResponse(res, 200, 'Assignment analysis generated', { analysis: { conceptUnderstanding: 'Review the submitted text alongside the official rubric.', mistakeCategories: [], improvementAreas: ['Compare the response with class notes and teacher feedback.'], suggestedTopics: [submission.homework.subject], advisoryOnly: true } }); }
  catch (error) { return handleAIError(res, error); }
};

const parentInsights = async (req, res) => {
  try { const parent = await ParentProfile.findOne({ where: { userId: req.user.id } }); const student = await findStudent(req.params.studentId); if (!parent || !student || !await ParentStudent.findOne({ where: { parentProfileId: parent.id, studentProfileId: student.id } })) return errorResponse(res, 403, 'Access denied for this child'); const profile = await getAcademicProfile(student.id); const insights = await runAI('parent-child-insights', profile, 'analyzePerformance'); return successResponse(res, 200, 'Child insights generated', { insights, academicSummary: academicSummary(profile) }); }
  catch (error) { return handleAIError(res, error); }
};

module.exports = { studentPerformance, studentRecommendations, studyPlan, askDoubt, chatHistory, studentPractice, studentQuiz, teacherStudentInsights, teacherClassInsights, teacherAssignmentAnalysis, parentInsights };
