/**
 * Centralized Grading Scale and Percentage Utilities
 * 
 * Grading Scale:
 * - 90.00% to 100.00%: A+
 * - 80.00% to 89.99%:  A
 * - 70.00% to 79.99%:  B+
 * - 60.00% to 69.99%:  B
 * - 50.00% to 59.99%:  C
 * - 40.00% to 49.99%:  D
 * - Below 40.00%:      F
 */

/**
 * Calculates accurate rounded percentage
 * @param {number} obtainedMarks 
 * @param {number} maxMarks 
 * @returns {number} percentage rounded to 2 decimal places
 */
const calculatePercentage = (obtainedMarks, maxMarks) => {
  const obtained = Number(obtainedMarks);
  const max = Number(maxMarks);

  if (isNaN(obtained) || isNaN(max) || max <= 0) {
    return 0;
  }

  const rawPercent = (obtained / max) * 100;
  return Math.round(rawPercent * 100) / 100;
};

/**
 * Maps percentage to letter grade
 * @param {number|null|undefined} percentage 
 * @returns {string} Letter grade
 */
const calculateGrade = (percentage) => {
  if (percentage === null || percentage === undefined || isNaN(Number(percentage))) {
    return 'N/A';
  }

  const percent = Number(percentage);

  if (percent >= 90) return 'A+';
  if (percent >= 80) return 'A';
  if (percent >= 70) return 'B+';
  if (percent >= 60) return 'B';
  if (percent >= 50) return 'C';
  if (percent >= 40) return 'D';
  return 'F';
};

module.exports = {
  calculatePercentage,
  calculateGrade
};
