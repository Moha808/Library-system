import { 
  fetchCollection, 
  fetchDocument, 
  insertDocument, 
  batchWrite, 
  generateId 
} from '../firebase/dbAdapter';
import { manualAdjustScore } from './scoreService';

/**
 * Patron files a dispute regarding a borrowing record or score deduction
 */
export async function createDispute({ userId, borrowId, message }) {
  if (!message || message.trim().length < 5) {
    throw new Error('Please enter a clear explanation for your dispute (at least 5 characters).');
  }

  const borrowing = borrowId ? await fetchDocument('borrowings', borrowId) : null;
  const user = await fetchDocument('users', userId);

  const disputeData = {
    userId,
    userName: user?.name || 'Patron',
    userMatricNo: user?.matricNo || 'N/A',
    borrowId: borrowId || null,
    bookTitle: borrowing?.bookTitle || 'General Score Dispute',
    message: message.trim(),
    status: 'open', // open | resolved | rejected
    adminResponse: null,
    resolvedBy: null,
    resolvedAt: null,
    createdAt: new Date().toISOString()
  };

  return await insertDocument('disputes', disputeData);
}

/**
 * Admin resolves or rejects a dispute, optionally applying a score correction
 */
export async function resolveDispute({
  disputeId,
  status, // 'resolved' | 'rejected'
  adminResponse,
  scoreAdjustment = 0,
  adminUid = 'ADMIN'
}) {
  const dispute = await fetchDocument('disputes', disputeId);
  if (!dispute) throw new Error('Dispute record not found');

  const operations = [
    {
      type: 'update',
      collection: 'disputes',
      id: disputeId,
      data: {
        status,
        adminResponse: adminResponse || `Dispute marked as ${status} by library administration.`,
        resolvedBy: adminUid,
        resolvedAt: new Date().toISOString(),
        scoreAdjustmentApplied: scoreAdjustment || 0
      }
    }
  ];

  await batchWrite(operations);

  // If a score adjustment was approved, run manualAdjustScore to update score and log audit trail
  if (status === 'resolved' && scoreAdjustment !== 0) {
    await manualAdjustScore({
      userId: dispute.userId,
      pointsChange: Number(scoreAdjustment),
      reason: `Dispute Resolution #${disputeId.slice(-6)}: ${adminResponse || 'Score corrected upon dispute review'}`,
      adminUid
    });
  }

  return { success: true };
}

export async function getPatronDisputes(userId) {
  return await fetchCollection('disputes', [
    { field: 'userId', op: '==', value: userId }
  ], { field: 'createdAt', direction: 'desc' });
}

export async function getAllDisputes(statusFilter = '') {
  let list = await fetchCollection('disputes', [], { field: 'createdAt', direction: 'desc' });
  if (statusFilter) {
    list = list.filter(d => d.status === statusFilter);
  }
  return list;
}
