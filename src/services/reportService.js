import { fetchCollection } from '../firebase/dbAdapter';
import { classifyScore } from './scoreService';
import { getScoringSettings } from './settingsService';

/**
 * Generate comprehensive Borrowing Report
 */
export async function getBorrowingReport({ startDate, endDate, status, department } = {}) {
  let borrowings = await fetchCollection('borrowings', [], { field: 'createdAt', direction: 'desc' });
  const users = await fetchCollection('users');
  const userMap = new Map(users.map(u => [u.id, u]));

  if (startDate) {
    borrowings = borrowings.filter(b => (b.borrowDate || b.createdAt || '') >= startDate);
  }
  if (endDate) {
    borrowings = borrowings.filter(b => (b.borrowDate || b.createdAt || '') <= endDate);
  }
  if (status && status !== 'all') {
    borrowings = borrowings.filter(b => b.status === status);
  }
  if (department && department !== 'all') {
    borrowings = borrowings.filter(b => {
      const u = userMap.get(b.userId);
      return (u?.department || b.userDepartment) === department;
    });
  }

  const enriched = borrowings.map(b => {
    const u = userMap.get(b.userId);
    return {
      id: b.id,
      bookTitle: b.bookTitle,
      bookCategory: b.bookCategory || 'General',
      userName: u?.name || b.userName || 'Unknown',
      userMatricNo: u?.matricNo || b.userMatricNo || 'N/A',
      department: u?.department || b.userDepartment || 'N/A',
      borrowDate: b.borrowDate || 'Pending',
      dueDate: b.dueDate || 'Pending',
      returnDate: b.returnDate || 'Not Returned',
      status: b.status,
      returnCondition: b.returnCondition || 'N/A',
      lateDays: b.lateDays || 0
    };
  });

  return enriched;
}

/**
 * Generate Defaulters Report
 */
export async function getDefaultersReport({ minDefaults = 1, department } = {}) {
  const scores = await fetchCollection('creditScores', [], { field: 'defaultCount', direction: 'desc' });
  const users = await fetchCollection('users');
  const defaults = await fetchCollection('defaults', [], { field: 'dateRecorded', direction: 'desc' });
  const settings = await getScoringSettings();

  const userMap = new Map(users.map(u => [u.id, u]));
  const defaultsByUser = new Map();

  defaults.forEach(d => {
    if (!defaultsByUser.has(d.userId)) {
      defaultsByUser.set(d.userId, []);
    }
    defaultsByUser.get(d.userId).push(d);
  });

  let defaulters = scores
    .filter(s => (s.defaultCount || 0) >= minDefaults)
    .map(s => {
      const u = userMap.get(s.userId);
      const tier = classifyScore(s.score, settings);
      const userDefaults = defaultsByUser.get(s.userId) || [];
      return {
        userId: s.userId,
        name: u?.name || 'Unknown Student',
        matricNo: u?.matricNo || 'N/A',
        department: u?.department || 'N/A',
        email: u?.email || 'N/A',
        score: s.score,
        tier: tier.label,
        defaultCount: s.defaultCount || 0,
        lateReturns: s.lateReturns || 0,
        damagedReturns: s.damagedReturns || 0,
        lostBooks: s.lostBooks || 0,
        status: u?.status || 'active',
        recentReason: userDefaults[0]?.reason || 'Overdue loan'
      };
    });

  if (department && department !== 'all') {
    defaulters = defaulters.filter(d => d.department === department);
  }

  return defaulters;
}

/**
 * Generate Credit Score Summary Analytics Report
 */
export async function getScoreSummaryReport() {
  const scores = await fetchCollection('creditScores');
  const settings = await getScoringSettings();

  const totalPatrons = scores.length;
  if (totalPatrons === 0) {
    return {
      totalPatrons: 0,
      averageScore: 50,
      distribution: { excellent: 0, good: 0, fair: 0, poor: 0, veryPoor: 0 },
      highestScore: 50,
      lowestScore: 50
    };
  }

  let totalScore = 0;
  let highest = 0;
  let lowest = 100;

  const distribution = {
    excellent: 0,
    good: 0,
    fair: 0,
    poor: 0,
    veryPoor: 0
  };

  scores.forEach(s => {
    const sc = s.score ?? 50;
    totalScore += sc;
    if (sc > highest) highest = sc;
    if (sc < lowest) lowest = sc;

    const classification = classifyScore(sc, settings).tier;
    distribution[classification] = (distribution[classification] || 0) + 1;
  });

  return {
    totalPatrons,
    averageScore: Math.round(totalScore / totalPatrons),
    highestScore: highest,
    lowestScore: lowest,
    distribution
  };
}

/**
 * CSV Export Utility
 */
export function exportToCSV(filename, rows, headers) {
  if (!rows || !rows.length) {
    alert('No data available to export');
    return;
  }

  const headerKeys = Object.keys(headers);
  const headerLabels = Object.values(headers);

  const csvContent = [
    headerLabels.join(','),
    ...rows.map(row =>
      headerKeys
        .map(key => {
          let val = row[key] ?? '';
          if (typeof val === 'string') {
            val = val.replace(/"/g, '""');
            if (val.includes(',') || val.includes('\n')) {
              val = `"${val}"`;
            }
          }
          return val;
        })
        .join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
