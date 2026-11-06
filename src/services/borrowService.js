import { addDays, format, isPast, parseISO, startOfDay } from 'date-fns';
import { 
  fetchDocument, 
  fetchCollection, 
  insertDocument, 
  modifyDocument, 
  batchWrite, 
  generateId 
} from '../firebase/dbAdapter';
import { checkEligibility } from './eligibilityService';
import { getPatronScore, classifyScore } from './scoreService';
import { getScoringSettings } from './settingsService';

/**
 * Patron requests to borrow a book
 */
export async function requestBorrow(userId, bookId) {
  // 1. Run eligibility verification
  const eligibility = await checkEligibility(userId, bookId);
  if (!eligibility.eligible) {
    throw new Error(eligibility.reason);
  }

  const book = await fetchDocument('books', bookId);
  const user = await fetchDocument('users', userId);

  const borrowPayload = {
    userId,
    userName: user?.name || 'Unknown Student',
    userMatricNo: user?.matricNo || 'N/A',
    userDepartment: user?.department || 'N/A',
    bookId,
    bookTitle: book?.title || 'Academic Monograph',
    bookAuthor: book?.author || 'FCAHPT Vom Library',
    bookCategory: book?.category || 'General',
    requestDate: new Date().toISOString(),
    borrowDate: null,
    dueDate: null,
    returnDate: null,
    status: 'requested', // requested | issued | returned | overdue | lost | rejected
    returnCondition: null,
    lateDays: 0,
    requestedDays: eligibility.loanDays,
    issuedBy: null,
    receivedBy: null,
    rejectionReason: null
  };

  const created = await insertDocument('borrowings', borrowPayload);
  return { success: true, borrowing: created, eligibility };
}

/**
 * Admin approves a pending borrow request and issues the book
 */
export async function approveRequest(borrowId, adminUid = 'ADMIN') {
  const borrowing = await fetchDocument('borrowings', borrowId);
  if (!borrowing) throw new Error('Request record not found');
  if (borrowing.status !== 'requested') throw new Error(`Request is already in '${borrowing.status}' status`);

  const book = await fetchDocument('books', borrowing.bookId);
  if (!book || (book.availableCopies || 0) <= 0) {
    throw new Error('No physical copies currently available on shelf to issue');
  }

  // Get loan days from patron's score tier
  const settings = await getScoringSettings();
  const scoreDoc = await getPatronScore(borrowing.userId);
  const tierInfo = classifyScore(scoreDoc?.score ?? 50, settings);
  const loanDays = tierInfo.loanDays || 14;

  const today = new Date();
  const dueDate = addDays(today, loanDays);

  const operations = [
    {
      type: 'update',
      collection: 'borrowings',
      id: borrowId,
      data: {
        status: 'issued',
        borrowDate: format(today, 'yyyy-MM-dd'),
        dueDate: format(dueDate, 'yyyy-MM-dd'),
        issuedBy: adminUid,
        loanDays
      }
    },
    {
      type: 'update',
      collection: 'books',
      id: borrowing.bookId,
      data: {
        availableCopies: Math.max(0, (book.availableCopies || 1) - 1),
        status: (book.availableCopies - 1) > 0 ? 'available' : 'borrowed'
      }
    },
    {
      type: 'update',
      collection: 'creditScores',
      id: borrowing.userId,
      data: {
        totalBorrowed: (scoreDoc.totalBorrowed || 0) + 1
      }
    }
  ];

  await batchWrite(operations);

  return { success: true, dueDate: format(dueDate, 'yyyy-MM-dd') };
}

/**
 * Admin rejects a borrow request with an explainable reason
 */
export async function rejectRequest(borrowId, rejectionReason, adminUid = 'ADMIN') {
  const borrowing = await fetchDocument('borrowings', borrowId);
  if (!borrowing) throw new Error('Request record not found');
  if (borrowing.status !== 'requested') throw new Error('Only pending requests can be rejected');

  return await modifyDocument('borrowings', borrowId, {
    status: 'rejected',
    rejectionReason: rejectionReason || 'Request declined by college library administration',
    rejectedBy: adminUid,
    rejectedAt: new Date().toISOString()
  });
}

/**
 * Direct issue a book to a patron by Admin (supports override with logged reason)
 */
export async function directIssueBook({
  userId,
  bookId,
  adminUid = 'ADMIN',
  overrideReason = null
}) {
  const book = await fetchDocument('books', bookId);
  if (!book) throw new Error('Book not found');
  if ((book.availableCopies || 0) <= 0) throw new Error('No physical copies available on shelf');

  const user = await fetchDocument('users', userId);
  if (!user) throw new Error('Patron user not found');

  const eligibility = await checkEligibility(userId, bookId);
  
  if (!eligibility.eligible && !overrideReason) {
    throw new Error(`Ineligible to borrow: ${eligibility.reason} (Admin override reason required to proceed)`);
  }

  const settings = await getScoringSettings();
  const scoreDoc = await getPatronScore(userId);
  const tierInfo = classifyScore(scoreDoc?.score ?? 50, settings);
  const loanDays = eligibility.loanDays || tierInfo.loanDays || 14;

  const today = new Date();
  const dueDate = addDays(today, loanDays);
  const borrowId = generateId('brw');

  const operations = [
    {
      type: 'set',
      collection: 'borrowings',
      id: borrowId,
      data: {
        id: borrowId,
        userId,
        userName: user.name,
        userMatricNo: user.matricNo || 'N/A',
        userDepartment: user.department || 'N/A',
        bookId,
        bookTitle: book.title,
        bookAuthor: book.author,
        bookCategory: book.category,
        borrowDate: format(today, 'yyyy-MM-dd'),
        dueDate: format(dueDate, 'yyyy-MM-dd'),
        returnDate: null,
        status: 'issued',
        returnCondition: null,
        lateDays: 0,
        loanDays,
        issuedBy: adminUid,
        adminOverrideReason: overrideReason || null
      }
    },
    {
      type: 'update',
      collection: 'books',
      id: bookId,
      data: {
        availableCopies: Math.max(0, (book.availableCopies || 1) - 1),
        status: (book.availableCopies - 1) > 0 ? 'available' : 'borrowed'
      }
    },
    {
      type: 'update',
      collection: 'creditScores',
      id: userId,
      data: {
        totalBorrowed: (scoreDoc.totalBorrowed || 0) + 1
      }
    }
  ];

  if (overrideReason) {
    const logId = generateId('log');
    operations.push({
      type: 'set',
      collection: 'scoreLogs',
      id: logId,
      data: {
        id: logId,
        userId,
        borrowId,
        bookTitle: book.title,
        event: 'ADMIN_OVERRIDE_ISSUE',
        points: 0,
        scoreBefore: scoreDoc.score,
        scoreAfter: scoreDoc.score,
        reason: `Librarian issued loan via administrative override: ${overrideReason}`,
        createdAt: new Date().toISOString(),
        createdBy: adminUid
      }
    });
  }

  await batchWrite(operations);
  return { success: true, borrowId, dueDate: format(dueDate, 'yyyy-MM-dd') };
}

/**
 * Scan active borrowings and flag past-due loans as overdue + record default without duplicates
 */
export async function runOverdueCheck(adminUid = 'SYSTEM') {
  const activeLoans = await fetchCollection('borrowings', [
    { field: 'status', op: 'in', value: ['issued', 'overdue'] }
  ]);

  const existingDefaults = await fetchCollection('defaults');
  const defaultsByBorrow = new Set(existingDefaults.map(d => `${d.borrowId}_overdue`));

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const today = startOfDay(new Date());

  let updatedLoansCount = 0;
  let newDefaultsCount = 0;
  const operations = [];

  for (const loan of activeLoans) {
    if (!loan.dueDate) continue;
    const due = startOfDay(parseISO(loan.dueDate));

    if (loan.dueDate < todayStr) {
      // It's overdue!
      if (loan.status !== 'overdue') {
        operations.push({
          type: 'update',
          collection: 'borrowings',
          id: loan.id,
          data: {
            status: 'overdue'
          }
        });
        updatedLoansCount++;
      }

      // Record default if not already recorded for this loan
      const defaultKey = `${loan.id}_overdue`;
      if (!defaultsByBorrow.has(defaultKey)) {
        const defaultId = generateId('def');
        operations.push({
          type: 'set',
          collection: 'defaults',
          id: defaultId,
          data: {
            id: defaultId,
            userId: loan.userId,
            borrowId: loan.id,
            bookTitle: loan.bookTitle,
            reason: 'overdue',
            dateRecorded: new Date().toISOString()
          }
        });
        defaultsByBorrow.add(defaultKey);
        newDefaultsCount++;
      }
    }
  }

  if (operations.length > 0) {
    await batchWrite(operations);
  }

  return {
    checkedTotal: activeLoans.length,
    overdueFlagged: updatedLoansCount,
    defaultsRecorded: newDefaultsCount
  };
}

/**
 * Get borrowing history for a specific patron
 */
export async function getPatronBorrowings(userId) {
  return await fetchCollection('borrowings', [
    { field: 'userId', op: '==', value: userId }
  ], { field: 'createdAt', direction: 'desc' });
}

/**
 * Get all borrowings for admin management
 */
export async function getAllBorrowings(filters = {}) {
  let items = await fetchCollection('borrowings', [], { field: 'createdAt', direction: 'desc' });

  if (filters.status) {
    items = items.filter(b => b.status === filters.status);
  }
  if (filters.userId) {
    items = items.filter(b => b.userId === filters.userId);
  }
  if (filters.search) {
    const term = filters.search.toLowerCase().trim();
    items = items.filter(b => 
      (b.bookTitle && b.bookTitle.toLowerCase().includes(term)) ||
      (b.userName && b.userName.toLowerCase().includes(term)) ||
      (b.userMatricNo && b.userMatricNo.toLowerCase().includes(term))
    );
  }

  return items;
}
