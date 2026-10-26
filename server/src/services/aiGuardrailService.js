/**
 * EduSetu AI Safety, Security & Guardrail Engine
 * 
 * Provides multi-layer, low-latency (<5ms) inline evaluation for AI chats:
 * 1. Toxicity, Profanity & Cyberbullying Protection (English + Hindi/Hinglish)
 * 2. Prompt Injection & Adversarial Jailbreak Neutralization
 * 3. Self-Harm & Violence Emergency Intercept
 * 4. PII Scrubbing & Data Leakage Shield
 * 5. Out-of-Scope / Non-Educational Redirection (Edu-Lock)
 */

// Common offensive/toxic words (English + Hindi/Hinglish)
// Using strict boundary regexes to prevent false positives on words like "assessment", "class", "pass"
const TOXIC_PATTERNS = [
  /\b(?:fuck|fucking|fucked|fucker|motherfucker|bitch|bastard|asshole|bullshit|dick|cock|pussy|whore|slut)\b/i,
  /\b(?:chutiya|chutiye|madarchod|bhenchod|bhosdike|bhosadi|harami|kamina|kamine|gandu|randi|lodu|jhaatu|chodu)\b/i,
  /\b(?:hate you|you are trash|you are useless|you suck|shut the fuck up|kill yourself|go die)\b/i
];

// Adversarial prompt injection & jailbreak patterns
const JAILBREAK_PATTERNS = [
  /(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|prompts|rules|commands|constraints)/i,
  /\b(?:dan\s+mode|do\s+anything\s+now|developer\s+mode|jailbreak|jailbroken)\b/i,
  /\bact\s+as\s+(?:an?\s+)?(?:unrestricted|uncensored|evil|hacked|rogue)\s+(?:ai|model|assistant|bot)\b/i,
  /(?:reveal|output|display|show|leak|print)\s+(?:the\s+)?(?:system\s+prompt|hidden\s+prompt|initial\s+instructions|secret\s+key|api\s+key)/i,
  /\bbypass\s+(?:all\s+)?(?:safety|content|security|policy)\s+(?:filters?|guardrails?|restrictions?)\b/i,
  /\bpretend\s+(?:there\s+are\s+no\s+rules|you\s+have\s+no\s+rules|you\s+are\s+not\s+an\s+ai)\b/i,
  /(?:system\s+prompt\s+override|admin\s+override\s+code)/i
];

// Self-harm and physical violence patterns
const SELF_HARM_PATTERNS = [
  /\b(?:how\s+to\s+commit\s+suicide|how\s+to\s+kill\s+myself|ways\s+to\s+die|want\s+to\s+die|hang\s+myself|cut\s+my\s+wrists?)\b/i,
  /\b(?:how\s+to\s+make\s+a\s+bomb|how\s+to\s+build\s+an?\s+explosive|how\s+to\s+poison\s+someone|create\s+a\s+chemical\s+weapon)\b/i
];

// Explicit non-educational / adult content patterns
const INAPPROPRIATE_OFF_TOPIC_PATTERNS = [
  /\b(?:porn|pornography|xxx\s+videos?|erotic\s+story|strip\s+naked|sexy\s+nude|dating\s+hookup)\b/i,
  /\b(?:online\s+gambling|satta\s+matka|how\s+to\s+hack\s+bank\s+account|steal\s+credit\s+card)\b/i
];

// Sensitive PII regexes (creditCard checked before aadhaar to prevent 12-digit prefix overlap)
const PII_PATTERNS = {
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  aadhaar: /\b\d{4}\s\d{4}\s\d{4}\b/g,
  phone: /(?:(?:\+91|0)?[6-9]\d{9})\b/g
};

class AIGuardrailService {
  /**
   * Evaluates input prompt for safety, toxicity, jailbreaking, and PII
   * @param {string} text - User prompt
   * @param {object} context - Optional user & conversation context
   * @returns {object} Evaluation outcome
   */
  evaluateInput(text, context = {}) {
    if (typeof text !== 'string') {
      return {
        safe: false,
        category: 'INVALID_INPUT',
        severity: 'low',
        reason: 'Input must be a valid text string',
        cleanText: '',
        safeResponse: null
      };
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return {
        safe: true,
        category: null,
        severity: null,
        reason: null,
        cleanText: '',
        safeResponse: null
      };
    }

    // 1. Critical Check: Self-Harm & Violence
    for (const pattern of SELF_HARM_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          safe: false,
          category: 'SELF_HARM',
          severity: 'critical',
          reason: 'Your message has been flagged for safety. If you are experiencing distress or need help, please reach out immediately.',
          cleanText: trimmed,
          safeResponse: {
            explanation: 'Your safety and well-being are the highest priority. If you or someone you know is in distress or feeling overwhelmed, please know that you are not alone and help is available 24/7.',
            steps: [
              'Tele-MANAS (Government of India Mental Health Helpline): Call 14416 or 1800-891-4416 (Toll-Free, 24/7)',
              'Childline India: Call 1098 (24/7 helpline for children and students)',
              'Speak with a trusted parent, school counselor, or teacher right away.'
            ],
            summary: 'EduSetu cares about your safety. Please reach out to trusted adults or use the free 24/7 helplines above.'
          }
        };
      }
    }

    // 2. High Severity Check: Prompt Injection & Jailbreak
    for (const pattern of JAILBREAK_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          safe: false,
          category: 'PROMPT_INJECTION',
          severity: 'high',
          reason: 'Adversarial instruction or system override attempt detected.',
          cleanText: trimmed,
          safeResponse: {
            explanation: 'EduSetu operates under strict academic and safety guardrails. System instructions and platform security parameters cannot be altered or bypassed.',
            steps: [
              'Please ask a legitimate academic question related to your syllabus or coursework.',
              'Supported subjects include Mathematics, Science, Social Studies, English, and more.',
              'You can also request study plans, quizzes, and practice exercises.'
            ],
            summary: 'Safety Guardrail Active: Please keep inquiries focused on educational and curricular topics.'
          }
        };
      }
    }

    // 3. High Severity Check: Toxicity, Abuse & Cyberbullying
    for (const pattern of TOXIC_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          safe: false,
          category: 'TOXICITY',
          severity: 'high',
          reason: 'Inappropriate or abusive language is prohibited on EduSetu.',
          cleanText: trimmed,
          safeResponse: {
            explanation: 'EduSetu is a respectful, safe learning space for students and educators. Offensive, abusive, or vulgar language is not permitted.',
            steps: [
              'Please rephrase your question using polite and respectful language.',
              'Focus on the specific concept, problem, or topic you need help with.',
              'Repeated violations may be flagged for teacher or parental review.'
            ],
            summary: 'Safety Guardrail Active: Respectful communication is required at all times.'
          }
        };
      }
    }

    // 4. Medium Severity Check: Inappropriate Off-Topic / Adult Domains
    for (const pattern of INAPPROPRIATE_OFF_TOPIC_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          safe: false,
          category: 'OFF_TOPIC',
          severity: 'medium',
          reason: 'Non-educational or adult content is outside the scope of EduSetu.',
          cleanText: trimmed,
          safeResponse: {
            explanation: 'I am EduSetu\'s AI Academic Assistant. I am designed exclusively to assist you with school learning, homework problem-solving, and exam preparation.',
            steps: [
              'Ask a question related to your school subjects (e.g., Physics, Chemistry, Algebra, History).',
              'Use the Practice feature to generate revision questions on any syllabus topic.',
              'Ask for a customized study plan or exam revision strategy.'
            ],
            summary: 'Edu-Lock Active: Please stay on educational and school-related topics.'
          }
        };
      }
    }

    // 5. Low/Medium Severity Check: PII Scrubbing
    let cleanText = trimmed;
    let hasPII = false;
    for (const [key, regex] of Object.entries(PII_PATTERNS)) {
      if (regex.test(cleanText)) {
        hasPII = true;
        cleanText = cleanText.replace(regex, `[REDACTED_${key.toUpperCase()}]`);
      }
    }

    return {
      safe: true,
      category: hasPII ? 'PII_SCRUBBED' : null,
      severity: hasPII ? 'low' : null,
      reason: hasPII ? 'Personal identifiable information (phone/card number) was sanitized.' : null,
      cleanText,
      safeResponse: null
    };
  }

  /**
   * Evaluates AI-generated output before delivering to the student
   * Ensures the LLM did not hallucinate toxic text or leak credentials
   * @param {object|string} output - LLM response
   * @returns {object} Sanitized response
   */
  evaluateOutput(output) {
    if (!output) return output;

    let textToCheck = '';
    if (typeof output === 'string') {
      textToCheck = output;
    } else if (typeof output === 'object') {
      textToCheck = [
        output.explanation || '',
        Array.isArray(output.steps) ? output.steps.join(' ') : '',
        output.summary || ''
      ].join(' ');
    }

    // Check for toxicity in model output
    for (const pattern of TOXIC_PATTERNS) {
      if (pattern.test(textToCheck)) {
        return {
          explanation: 'This answer has been replaced by the EduSetu safety guardrail to ensure age-appropriate academic communication.',
          steps: ['Please retry your question with specific academic details.'],
          summary: 'Safety Guardrail Active: Filtered inappropriate output.'
        };
      }
    }

    // Sanitize any accidental PII in output
    if (typeof output === 'object') {
      const sanitized = { ...output };
      if (typeof sanitized.explanation === 'string') {
        sanitized.explanation = this.maskPII(sanitized.explanation);
      }
      if (Array.isArray(sanitized.steps)) {
        sanitized.steps = sanitized.steps.map(s => (typeof s === 'string' ? this.maskPII(s) : s));
      }
      if (typeof sanitized.summary === 'string') {
        sanitized.summary = this.maskPII(sanitized.summary);
      }
      return sanitized;
    }

    return typeof output === 'string' ? this.maskPII(output) : output;
  }

  /**
   * Helper to mask PII in any text
   */
  maskPII(text) {
    if (typeof text !== 'string') return text;
    let result = text;
    for (const [key, regex] of Object.entries(PII_PATTERNS)) {
      result = result.replace(regex, `[REDACTED_${key.toUpperCase()}]`);
    }
    return result;
  }
}

const aiGuardrailService = new AIGuardrailService();
module.exports = aiGuardrailService;
