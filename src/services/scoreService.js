import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';
import { 
  DEFAULT_SCORING_SETTINGS 
} from '../firebase/dbAdapter';
import { 
  fetchDocument, 
  saveDocument, 
  insertDocument, 
  batchWrite, 
  generateId 
} from '../firebase/dbAdapter';
import { getScoringSettings } from './settingsService';

/**
 * Clamp score between 0 and 100
 */
export function clampScore(score) {
  if (typeof score !== 'number' || isNaN(score)) return 50;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Classify a credit score into FCAHPT tier categories
 * 80–100 Excellent | 60–79 Good | 40–59 Fair | 20–39 Poor | 0–19 Very Poor
 */
export function classifyScore(score, settings = DEFAULT_SCORING_SETTINGS) {
  const numericScore = clampScore(score);
  const tiers = settings.tiers || DEFAULT_SCORING_SETTINGS.tiers;

  if (numericScore >= tiers.excellent.minScore) {
    return {
      tier: 'excellent',
      label: tiers.excellent.label || 'Excellent',
      color: 'emerald',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      description: tiers.excellent.description || 'Priority borrowing',
      maxBooks: tiers.excellent.maxBooks,
      loanDays: tiers.excellent.loanDays
    };
  }

  if (numericScore >= tiers.good.minScore) {
    return {
      tier: 'good',
      label: tiers.good.label || 'Good',
      color: 'blue',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
      description: tiers.good.description || 'Normal borrowing',
      maxBooks: tiers.good.maxBooks,
      loanDays: tiers.good.loanDays
    };
  }

  if (numericScore >= tiers.fair.minScore) {
    return {
      tier: 'fair',
      label: tiers.fair.label || 'Fair',
      color: 'amber',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      description: tiers.fair.description || 'Normal with monitoring',
      maxBooks: tiers.fair.maxBooks,
      loanDays: tiers.fair.loanDays
    };
  }

  if (numericScore >= tiers.poor.minScore) {
    return {
      tier: 'poor',
      label: tiers.poor.label || 'Poor',
      color: 'orange',
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
      description: tiers.poor.description || 'Restricted borrowing',
      maxBooks: tiers.poor.maxBooks,
      loanDays: tiers.poor.loanDays
    };
  }

  return {
    tier: 'veryPoor',
    label: tiers.veryPoor.label || 'Very Poor',
    color: 'red',
    badgeClass: 'bg-red-100 text-red-800 border-red-300',
    description: tiers.veryPoor.description || 'Borrowing blocked',
    maxBooks: tiers.veryPoor.maxBooks,
    loanDays: tiers.veryPoor.loanDays
  };
}

/**
 * Pure function to calculate score points and breakdown for a book return.
 * 
 * Rules:
 * - On-time / early return: +10
 * - Late return: -5
 * - Good condition: +5
 * - Fair condition: 0
 * - Damaged condition: -10 (counts as default)
 * - Lost condition: -20 (counts as default)
 * - Repeated default penalty: -10 (if patron already has >= repeatedDefaultThreshold defaults, default 3)
 */
export function calculatePoints({
  dueDate,
  returnDate,
  returnCondition = 'good',
  currentDefaultCount = 0,
  settings = DEFAULT_SCORING_SETTINGS
}) {
  const cfg = { ...DEFAULT_SCORING_SETTINGS, ...(settings || {}) };

  // Parse dates
  const due = typeof dueDate === 'string' ? startOfDay(parseISO(dueDate)) : startOfDay(dueDate);
  const returned = typeof returnDate === 'string' ? startOfDay(parseISO(returnDate)) : startOfDay(returnDate);

  const diffDays = differenceInCalendarDays(returned, due);
  const lateDays = Math.max(0, diffDays);
  const isLate = diffDays > 0;
  const isEarly = diffDays < 0;
  const isOnTime = diffDays === 0;

  const breakdown = [];
  const defaultReasons = [];
  let totalPointsChange = 0;

  // 1. Punctuality rule
  if (isLate) {
    const penalty = -Math.abs(cfg.latePenalty);
    totalPointsChange += penalty;
    breakdown.push({
      rule: 'punctuality',
      event: 'RETURN_LATE',
      points: penalty,
      reason: `Returned ${lateDays} ${lateDays === 1 ? 'day' : 'days'} late: ${penalty}`
    });
    defaultReasons.push('late');
  } else if (isEarly) {
    const bonus = Math.abs(cfg.earlyBonus);
    totalPointsChange += bonus;
    breakdown.push({
      rule: 'punctuality',
      event: 'RETURN_EARLY',
      points: bonus,
      reason: `Returned before due date (${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'} early): +${bonus}`
    });
  } else {
    const bonus = Math.abs(cfg.onTimeBonus);
    totalPointsChange += bonus;
    breakdown.push({
      rule: 'punctuality',
      event: 'RETURN_ON_TIME',
      points: bonus,
      reason: `Returned on time: +${bonus}`
    });
  }

  // 2. Physical Condition rule
  const cond = (returnCondition || 'good').toLowerCase();
  if (cond === 'good') {
    const bonus = Math.abs(cfg.goodConditionBonus);
    totalPointsChange += bonus;
    breakdown.push({
      rule: 'condition',
      event: 'CONDITION_GOOD',
      points: bonus,
      reason: `Returned in good condition: +${bonus}`
    });
  } else if (cond === 'damaged') {
    const penalty = -Math.abs(cfg.damagedConditionPenalty);
    totalPointsChange += penalty;
    breakdown.push({
      rule: 'condition',
      event: 'CONDITION_DAMAGED',
      points: penalty,
      reason: `Book returned with damage: ${penalty}`
    });
    defaultReasons.push('damaged');
  } else if (cond === 'lost') {
    const penalty = -Math.abs(cfg.lostConditionPenalty);
    totalPointsChange += penalty;
    breakdown.push({
      rule: 'condition',
      event: 'CONDITION_LOST',
      points: penalty,
      reason: `Book reported lost/unreturned: ${penalty}`
    });
    defaultReasons.push('lost');
  } else {
    // 'fair' condition - neutral 0 points
    breakdown.push({
      rule: 'condition',
      event: 'CONDITION_FAIR',
      points: 0,
      reason: 'Returned in fair condition (normal wear): 0'
    });
  }

  // 3. Repeated default rule
  // If the return incurred any new default (late, damaged, or lost) AND the patron already has >= repeatedDefaultThreshold
  const hasNewDefault = defaultReasons.length > 0;
  const isRepeatedDefault = hasNewDefault && (currentDefaultCount >= (cfg.repeatedDefaultThreshold || 3));

  if (isRepeatedDefault) {
    const repeatPenalty = -Math.abs(cfg.repeatedDefaultPenalty);
    totalPointsChange += repeatPenalty;
    breakdown.push({
      rule: 'repeated_default',
      event: 'REPEATED_DEFAULT',
      points: repeatPenalty,
      reason: `Repeated default penalty (patron already has ${currentDefaultCount} defaults): ${repeatPenalty}`
    });
    defaultReasons.push('repeated');
  }

  return {
    totalPointsChange,
    isLate,
    isEarly,
    isOnTime,
    lateDays,
    hasDefault: hasNewDefault,
    isRepeatedDefault,
    breakdown,
    defaultReasons
  };
}

/**
 * Initialize a credit score profile for a newly registered patron
 */
export async function initializePatronScore(userId, initialScore = 50) {
  const existing = await fetchDocument('creditScores', userId);
  if (existing) return existing;

  const scoreDoc = {
    userId,
    score: clampScore(initialScore),
    classification: 'fair',
    totalBorrowed: 0,
    onTimeReturns: 0,
    lateReturns: 0,
    damagedReturns: 0,
    lostBooks: 0,
    defaultCount: 0,
    updatedAt: new Date().toISOString()
  };

  const saved = await saveDocument('creditScores', userId, scoreDoc);

  // Write initial log
  await insertDocument('scoreLogs', {
    userId,
    borrowId: 'INITIAL_REGISTRATION',
    event: 'ACCOUNT_INITIALIZED',
    points: 0,
    scoreBefore: initialScore,
    scoreAfter: initialScore,
    reason: 'Initial account baseline credit score granted',
    createdAt: new Date().toISOString(),
    createdBy: 'SYSTEM'
  });

  return saved;
}

/**
 * Fetch a patron's credit score document
 */
export async function getPatronScore(userId) {
  if (!userId) return null;
  let scoreDoc = await fetchDocument('creditScores', userId);
  if (!scoreDoc) {
    scoreDoc = await initializePatronScore(userId);
  }
  return scoreDoc;
}

/**
 * Atomic return processor
 * Atomically updates:
 * 1. Borrowing doc (status: 'returned' or 'lost', returnDate, returnCondition, lateDays, receivedBy)
 * 2. Book doc (increments availableCopies if not lost)
 * 3. CreditScores doc (updates score, classification, stats counters)
 * 4. ScoreLogs doc (creates audit log per applied rule)
 * 5. Defaults doc (creates default entry if late, damaged, lost, or repeated)
 */
export async function processReturn({
  borrowId,
  returnDate = new Date().toISOString().slice(0, 10),
  returnCondition = 'good',
  adminUid = 'ADMIN'
}) {
  const borrowing = await fetchDocument('borrowings', borrowId);
  if (!borrowing) throw new Error('Borrowing record not found');
  if (borrowing.status === 'returned') throw new Error('Book has already been returned');

  const { userId, bookId, dueDate } = borrowing;
  const settings = await getScoringSettings();
  const currentScoreDoc = await getPatronScore(userId);
  const book = await fetchDocument('books', bookId);

  const currentScore = currentScoreDoc.score || 50;
  const currentDefaults = currentScoreDoc.defaultCount || 0;

  // Calculate score impact
  const calculation = calculatePoints({
    dueDate,
    returnDate,
    returnCondition,
    currentDefaultCount: currentDefaults,
    settings
  });

  const newScore = clampScore(currentScore + calculation.totalPointsChange);
  const classification = classifyScore(newScore, settings).tier;

  // Prepare stats increments
  const isConditionDamaged = returnCondition === 'damaged';
  const isConditionLost = returnCondition === 'lost';

  const updatedScoreDoc = {
    ...currentScoreDoc,
    score: newScore,
    classification,
    onTimeReturns: (currentScoreDoc.onTimeReturns || 0) + (calculation.isOnTime || calculation.isEarly ? 1 : 0),
    lateReturns: (currentScoreDoc.lateReturns || 0) + (calculation.isLate ? 1 : 0),
    damagedReturns: (currentScoreDoc.damagedReturns || 0) + (isConditionDamaged ? 1 : 0),
    lostBooks: (currentScoreDoc.lostBooks || 0) + (isConditionLost ? 1 : 0),
    defaultCount: currentDefaults + (calculation.hasDefault ? 1 : 0),
    updatedAt: new Date().toISOString()
  };

  const operations = [];

  // 1. Update borrowing record
  const newBorrowStatus = isConditionLost ? 'lost' : 'returned';
  operations.push({
    type: 'update',
    collection: 'borrowings',
    id: borrowId,
    data: {
      status: newBorrowStatus,
      returnDate,
      returnCondition,
      lateDays: calculation.lateDays,
      receivedBy: adminUid,
      scoreChangeApplied: calculation.totalPointsChange
    }
  });

  // 2. Update book available copies (only return to inventory if not lost)
  if (book && !isConditionLost) {
    const newAvailable = Math.min(book.totalCopies, (book.availableCopies || 0) + 1);
    operations.push({
      type: 'update',
      collection: 'books',
      id: bookId,
      data: {
        availableCopies: newAvailable,
        status: newAvailable > 0 ? 'available' : 'borrowed'
      }
    });
  }

  // 3. Update patron credit score doc
  operations.push({
    type: 'set',
    collection: 'creditScores',
    id: userId,
    data: updatedScoreDoc
  });

  // 4. Create scoreLogs entry for each rule applied
  let runningScore = currentScore;
  for (const item of calculation.breakdown) {
    const nextScore = clampScore(runningScore + item.points);
    const logId = generateId('log');
    operations.push({
      type: 'set',
      collection: 'scoreLogs',
      id: logId,
      data: {
        id: logId,
        userId,
        borrowId,
        bookTitle: borrowing.bookTitle || book?.title || 'Unknown Title',
        event: item.event,
        points: item.points,
        scoreBefore: runningScore,
        scoreAfter: nextScore,
        reason: item.reason,
        createdAt: new Date().toISOString(),
        createdBy: adminUid
      }
    });
    runningScore = nextScore;
  }

  // 5. Create default entry if defaults occurred
  if (calculation.hasDefault) {
    const defaultId = generateId('def');
    operations.push({
      type: 'set',
      collection: 'defaults',
      id: defaultId,
      data: {
        id: defaultId,
        userId,
        borrowId,
        bookTitle: borrowing.bookTitle || book?.title || 'Unknown Title',
        reason: calculation.defaultReasons.join(', '),
        dateRecorded: new Date().toISOString()
      }
    });
  }

  // Execute atomically
  await batchWrite(operations);

  return {
    success: true,
    previousScore: currentScore,
    newScore,
    classification,
    pointsChange: calculation.totalPointsChange,
    breakdown: calculation.breakdown
  };
}

/**
 * Manual score adjustment by Administrator (requires explicit audit reason)
 */
export async function manualAdjustScore({
  userId,
  pointsChange,
  reason,
  adminUid = 'ADMIN'
}) {
  if (!reason || reason.trim().length < 5) {
    throw new Error('A valid reason (minimum 5 characters) is required for manual score adjustments');
  }

  const currentScoreDoc = await getPatronScore(userId);
  const settings = await getScoringSettings();
  const currentScore = currentScoreDoc.score || 50;
  const newScore = clampScore(currentScore + pointsChange);
  const classification = classifyScore(newScore, settings).tier;

  const logId = generateId('log');
  const operations = [
    {
      type: 'update',
      collection: 'creditScores',
      id: userId,
      data: {
        score: newScore,
        classification,
        updatedAt: new Date().toISOString()
      }
    },
    {
      type: 'set',
      collection: 'scoreLogs',
      id: logId,
      data: {
        id: logId,
        userId,
        borrowId: 'MANUAL_ADJUSTMENT',
        bookTitle: 'Administrative Adjustment',
        event: 'MANUAL_ADJUSTMENT',
        points: pointsChange,
        scoreBefore: currentScore,
        scoreAfter: newScore,
        reason: `Manual Admin Adjustment: ${reason}`,
        createdAt: new Date().toISOString(),
        createdBy: adminUid
      }
    }
  ];

  await batchWrite(operations);

  return {
    success: true,
    previousScore: currentScore,
    newScore,
    classification
  };
}
