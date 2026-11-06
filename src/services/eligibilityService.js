import { fetchDocument, fetchCollection } from '../firebase/dbAdapter';
import { getPatronScore, classifyScore } from './scoreService';
import { getScoringSettings } from './settingsService';

/**
 * Check if a patron is eligible to borrow a book
 * 
 * Rules:
 * 1. Account status must be active (not suspended).
 * 2. Patron cannot have any overdue / unreturned books.
 * 3. Patron cannot already have borrowed or requested this specific book.
 * 4. Patron credit score tier decides borrowing limit (maxBooks) and loan period (loanDays).
 *    - Very Poor tier is blocked by default.
 * 5. Book must have available copies (> 0).
 */
export async function checkEligibility(userId, bookId, providedData = {}) {
  try {
    // 1. Fetch user profile
    const user = providedData.user || await fetchDocument('users', userId);
    if (!user) {
      return {
        eligible: false,
        reason: 'User account not found',
        code: 'USER_NOT_FOUND',
        maxBooks: 0,
        loanDays: 0
      };
    }

    if (user.status === 'suspended') {
      return {
        eligible: false,
        reason: 'Patron account is suspended due to administrative restrictions. Contact the college library.',
        code: 'ACCOUNT_SUSPENDED',
        maxBooks: 0,
        loanDays: 0
      };
    }

    // 2. Fetch patron credit score & settings
    const settings = providedData.settings || await getScoringSettings();
    const scoreDoc = providedData.scoreDoc || await getPatronScore(userId);
    const score = scoreDoc?.score ?? 50;
    const classification = classifyScore(score, settings);

    // 3. Fetch active borrowings and pending requests for this patron
    const borrowings = providedData.borrowings || await fetchCollection('borrowings', [
      { field: 'userId', op: '==', value: userId }
    ]);

    const activeOrOverdue = borrowings.filter(b => ['issued', 'overdue'].includes(b.status));
    const pendingRequests = borrowings.filter(b => b.status === 'requested');
    const overdueLoans = borrowings.filter(b => b.status === 'overdue');

    // Rule: Any overdue book blocks borrowing
    if (overdueLoans.length > 0) {
      return {
        eligible: false,
        reason: `Borrowing blocked: You have ${overdueLoans.length} overdue ${overdueLoans.length === 1 ? 'book' : 'books'} that must be returned first.`,
        code: 'HAS_OVERDUE_BOOKS',
        maxBooks: classification.maxBooks,
        loanDays: classification.loanDays,
        tier: classification.tier,
        overdueCount: overdueLoans.length
      };
    }

    // Rule: Very Poor tier (0–19 score) is blocked
    if (classification.tier === 'veryPoor') {
      return {
        eligible: false,
        reason: 'Borrowing blocked: Credit score is in the Very Poor tier (0–19). Please resolve existing defaults with library administration.',
        code: 'SCORE_VERY_POOR',
        maxBooks: 0,
        loanDays: 0,
        tier: classification.tier,
        canAdminOverride: true
      };
    }

    // Rule: Already reached maxBooks allowance
    const totalActiveAndPending = activeOrOverdue.length + pendingRequests.length;
    if (totalActiveAndPending >= classification.maxBooks) {
      return {
        eligible: false,
        reason: `Borrowing limit reached: Your current tier (${classification.label}) allows a maximum of ${classification.maxBooks} ${classification.maxBooks === 1 ? 'book' : 'books'}. You currently have ${activeOrOverdue.length} borrowed and ${pendingRequests.length} pending.`,
        code: 'BORROW_LIMIT_REACHED',
        maxBooks: classification.maxBooks,
        loanDays: classification.loanDays,
        tier: classification.tier,
        activeCount: totalActiveAndPending
      };
    }

    // 4. Check book if bookId provided
    if (bookId) {
      const book = providedData.book || await fetchDocument('books', bookId);
      if (!book) {
        return {
          eligible: false,
          reason: 'Book was not found in library catalogue.',
          code: 'BOOK_NOT_FOUND',
          maxBooks: classification.maxBooks,
          loanDays: classification.loanDays
        };
      }

      // Check if user already has an active loan or pending request for this specific book
      const alreadyHasThisBook = borrowings.some(b => 
        b.bookId === bookId && ['issued', 'overdue', 'requested'].includes(b.status)
      );
      if (alreadyHasThisBook) {
        return {
          eligible: false,
          reason: 'You already have an active loan or pending request for this specific title.',
          code: 'DUPLICATE_BORROW_REQUEST',
          maxBooks: classification.maxBooks,
          loanDays: classification.loanDays
        };
      }

      if ((book.availableCopies || 0) <= 0 || book.status === 'borrowed') {
        return {
          eligible: false,
          reason: 'No copies of this book are currently available on the shelf. All copies are on loan.',
          code: 'NO_COPIES_AVAILABLE',
          maxBooks: classification.maxBooks,
          loanDays: classification.loanDays
        };
      }
    }

    // Eligible!
    return {
      eligible: true,
      reason: `Eligible: Patron is cleared to borrow for ${classification.loanDays} days under the ${classification.label} tier.`,
      code: 'ELIGIBLE',
      maxBooks: classification.maxBooks,
      loanDays: classification.loanDays,
      tier: classification.tier,
      tierLabel: classification.label,
      activeCount: totalActiveAndPending,
      needsMonitoring: classification.tier === 'fair'
    };
  } catch (error) {
    console.error('Error in checkEligibility:', error);
    return {
      eligible: false,
      reason: 'Failed to verify eligibility due to an internal system error.',
      code: 'SYSTEM_ERROR',
      maxBooks: 0,
      loanDays: 0
    };
  }
}
