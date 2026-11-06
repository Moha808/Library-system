import { describe, it, expect } from 'vitest';
import { 
  clampScore, 
  classifyScore, 
  calculatePoints 
} from '../services/scoreService';
import { checkEligibility } from '../services/eligibilityService';
import { DEFAULT_SCORING_SETTINGS } from '../firebase/dbAdapter';

describe('Credit Scoring Logic - LibCredit FCAHPT Vom', () => {

  describe('clampScore', () => {
    it('should clamp scores below 0 to 0', () => {
      expect(clampScore(-15)).toBe(0);
      expect(clampScore(-1)).toBe(0);
    });

    it('should clamp scores above 100 to 100', () => {
      expect(clampScore(105)).toBe(100);
      expect(clampScore(250)).toBe(100);
    });

    it('should preserve scores within 0 to 100', () => {
      expect(clampScore(0)).toBe(0);
      expect(clampScore(50)).toBe(50);
      expect(clampScore(85)).toBe(85);
      expect(clampScore(100)).toBe(100);
    });

    it('should fallback to 50 for invalid or non-numeric inputs', () => {
      expect(clampScore(null)).toBe(50);
      expect(clampScore(undefined)).toBe(50);
      expect(clampScore('abc')).toBe(50);
      expect(clampScore(NaN)).toBe(50);
    });
  });

  describe('classifyScore', () => {
    it('should classify 80-100 as Excellent', () => {
      const res80 = classifyScore(80);
      expect(res80.tier).toBe('excellent');
      expect(res80.maxBooks).toBe(5);
      expect(res80.loanDays).toBe(21);

      const res100 = classifyScore(100);
      expect(res100.tier).toBe('excellent');
    });

    it('should classify 60-79 as Good', () => {
      const res60 = classifyScore(60);
      expect(res60.tier).toBe('good');
      expect(res60.maxBooks).toBe(4);
      expect(res60.loanDays).toBe(14);

      const res79 = classifyScore(79);
      expect(res79.tier).toBe('good');
    });

    it('should classify 40-59 as Fair', () => {
      const res40 = classifyScore(40);
      expect(res40.tier).toBe('fair');
      expect(res40.maxBooks).toBe(3);
      expect(res40.loanDays).toBe(14);

      const res55 = classifyScore(55);
      expect(res55.tier).toBe('fair');
    });

    it('should classify 20-39 as Poor', () => {
      const res20 = classifyScore(20);
      expect(res20.tier).toBe('poor');
      expect(res20.maxBooks).toBe(1);
      expect(res20.loanDays).toBe(7);

      const res39 = classifyScore(39);
      expect(res39.tier).toBe('poor');
    });

    it('should classify 0-19 as Very Poor (blocked)', () => {
      const res0 = classifyScore(0);
      expect(res0.tier).toBe('veryPoor');
      expect(res0.maxBooks).toBe(0);
      expect(res0.loanDays).toBe(0);

      const res19 = classifyScore(19);
      expect(res19.tier).toBe('veryPoor');
    });
  });

  describe('calculatePoints', () => {
    it('calculates points for on-time return in good condition (+10 punctuality, +5 condition = +15)', () => {
      const result = calculatePoints({
        dueDate: '2026-11-05',
        returnDate: '2026-11-05',
        returnCondition: 'good',
        currentDefaultCount: 0
      });

      expect(result.isOnTime).toBe(true);
      expect(result.isLate).toBe(false);
      expect(result.lateDays).toBe(0);
      expect(result.totalPointsChange).toBe(15);
      expect(result.hasDefault).toBe(false);
      expect(result.breakdown).toHaveLength(2); // on-time (+10), good condition (+5)
    });

    it('calculates points for early return in good condition (+10 early, +5 condition = +15)', () => {
      const result = calculatePoints({
        dueDate: '2026-11-10',
        returnDate: '2026-11-05',
        returnCondition: 'good',
        currentDefaultCount: 0
      });

      expect(result.isEarly).toBe(true);
      expect(result.totalPointsChange).toBe(15);
      expect(result.hasDefault).toBe(false);
    });

    it('calculates points for late return in good condition (-5 late, +5 condition = 0)', () => {
      const result = calculatePoints({
        dueDate: '2026-11-01',
        returnDate: '2026-11-05',
        returnCondition: 'good',
        currentDefaultCount: 0
      });

      expect(result.isLate).toBe(true);
      expect(result.lateDays).toBe(4);
      expect(result.totalPointsChange).toBe(0);
      expect(result.hasDefault).toBe(true);
      expect(result.defaultReasons).toContain('late');
    });

    it('calculates points for on-time return with damaged book (+10 on-time, -10 damaged = 0, default recorded)', () => {
      const result = calculatePoints({
        dueDate: '2026-11-05',
        returnDate: '2026-11-05',
        returnCondition: 'damaged',
        currentDefaultCount: 0
      });

      expect(result.isOnTime).toBe(true);
      expect(result.totalPointsChange).toBe(0);
      expect(result.hasDefault).toBe(true);
      expect(result.defaultReasons).toContain('damaged');
    });

    it('calculates points for late return with damaged book (-5 late, -10 damaged = -15)', () => {
      const result = calculatePoints({
        dueDate: '2026-11-02',
        returnDate: '2026-11-05',
        returnCondition: 'damaged',
        currentDefaultCount: 0
      });

      expect(result.isLate).toBe(true);
      expect(result.lateDays).toBe(3);
      expect(result.totalPointsChange).toBe(-15);
      expect(result.hasDefault).toBe(true);
      expect(result.defaultReasons).toContain('late');
      expect(result.defaultReasons).toContain('damaged');
    });

    it('calculates points for lost book (-20 condition penalty and default event)', () => {
      const result = calculatePoints({
        dueDate: '2026-11-05',
        returnDate: '2026-11-05',
        returnCondition: 'lost',
        currentDefaultCount: 0
      });

      // +10 on-time, -20 lost = -10
      expect(result.totalPointsChange).toBe(-10);
      expect(result.hasDefault).toBe(true);
      expect(result.defaultReasons).toContain('lost');
    });

    it('applies repeated default penalty (-10) when patron already has >= 3 defaults and commits a new default', () => {
      // 3 existing defaults + late return = -5 late + 5 good - 10 repeated = -10
      const result = calculatePoints({
        dueDate: '2026-11-01',
        returnDate: '2026-11-05',
        returnCondition: 'good',
        currentDefaultCount: 3
      });

      expect(result.isLate).toBe(true);
      expect(result.hasDefault).toBe(true);
      expect(result.isRepeatedDefault).toBe(true);
      expect(result.defaultReasons).toContain('repeated');
      expect(result.totalPointsChange).toBe(-10);
    });

    it('does NOT apply repeated default penalty if return is on-time with good condition (no new default)', () => {
      const result = calculatePoints({
        dueDate: '2026-11-05',
        returnDate: '2026-11-05',
        returnCondition: 'good',
        currentDefaultCount: 5
      });

      expect(result.totalPointsChange).toBe(15);
      expect(result.hasDefault).toBe(false);
      expect(result.isRepeatedDefault).toBe(false);
      expect(result.defaultReasons).toHaveLength(0);
    });
  });

  describe('checkEligibility', () => {
    const mockUser = {
      id: 'student_123',
      name: 'John Doe',
      status: 'active',
      role: 'patron'
    };

    const mockBook = {
      id: 'book_456',
      title: 'Veterinary Clinical Pathology',
      availableCopies: 2,
      totalCopies: 3,
      status: 'available'
    };

    it('clears eligible patron with available book', async () => {
      const res = await checkEligibility('student_123', 'book_456', {
        user: mockUser,
        book: mockBook,
        scoreDoc: { score: 70 },
        borrowings: [],
        settings: DEFAULT_SCORING_SETTINGS
      });

      expect(res.eligible).toBe(true);
      expect(res.code).toBe('ELIGIBLE');
      expect(res.maxBooks).toBe(4);
      expect(res.loanDays).toBe(14);
    });

    it('blocks suspended patron accounts', async () => {
      const res = await checkEligibility('student_123', 'book_456', {
        user: { ...mockUser, status: 'suspended' },
        book: mockBook,
        scoreDoc: { score: 75 },
        borrowings: [],
        settings: DEFAULT_SCORING_SETTINGS
      });

      expect(res.eligible).toBe(false);
      expect(res.code).toBe('ACCOUNT_SUSPENDED');
      expect(res.reason).toMatch(/suspended/i);
    });

    it('blocks patron with overdue books', async () => {
      const res = await checkEligibility('student_123', 'book_456', {
        user: mockUser,
        book: mockBook,
        scoreDoc: { score: 75 },
        borrowings: [
          { id: 'b_1', userId: 'student_123', bookId: 'other_book', status: 'overdue' }
        ],
        settings: DEFAULT_SCORING_SETTINGS
      });

      expect(res.eligible).toBe(false);
      expect(res.code).toBe('HAS_OVERDUE_BOOKS');
      expect(res.reason).toMatch(/overdue/i);
    });

    it('blocks patron in Very Poor credit tier (0-19)', async () => {
      const res = await checkEligibility('student_123', 'book_456', {
        user: mockUser,
        book: mockBook,
        scoreDoc: { score: 15 },
        borrowings: [],
        settings: DEFAULT_SCORING_SETTINGS
      });

      expect(res.eligible).toBe(false);
      expect(res.code).toBe('SCORE_VERY_POOR');
      expect(res.reason).toMatch(/Very Poor/i);
    });

    it('blocks patron who reached their maximum borrowing limit', async () => {
      // Poor tier (score 30) allows 1 book
      const res = await checkEligibility('student_123', 'book_456', {
        user: mockUser,
        book: mockBook,
        scoreDoc: { score: 30 },
        borrowings: [
          { id: 'b_1', userId: 'student_123', bookId: 'another_book', status: 'issued' }
        ],
        settings: DEFAULT_SCORING_SETTINGS
      });

      expect(res.eligible).toBe(false);
      expect(res.code).toBe('BORROW_LIMIT_REACHED');
      expect(res.reason).toMatch(/limit reached/i);
    });

    it('blocks request when book has zero available copies', async () => {
      const res = await checkEligibility('student_123', 'book_456', {
        user: mockUser,
        book: { ...mockBook, availableCopies: 0, status: 'borrowed' },
        scoreDoc: { score: 85 },
        borrowings: [],
        settings: DEFAULT_SCORING_SETTINGS
      });

      expect(res.eligible).toBe(false);
      expect(res.code).toBe('NO_COPIES_AVAILABLE');
      expect(res.reason).toMatch(/No copies/i);
    });

    it('blocks duplicate request if patron already has the same book issued or requested', async () => {
      const res = await checkEligibility('student_123', 'book_456', {
        user: mockUser,
        book: mockBook,
        scoreDoc: { score: 85 },
        borrowings: [
          { id: 'b_1', userId: 'student_123', bookId: 'book_456', status: 'requested' }
        ],
        settings: DEFAULT_SCORING_SETTINGS
      });

      expect(res.eligible).toBe(false);
      expect(res.code).toBe('DUPLICATE_BORROW_REQUEST');
      expect(res.reason).toMatch(/already have an active loan/i);
    });
  });

});
