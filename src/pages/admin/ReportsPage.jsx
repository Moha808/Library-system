import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Filter, 
  Calendar, 
  BookOpen, 
  ShieldAlert, 
  Award,
  Users
} from 'lucide-react';
import { 
  getBorrowingReport, 
  getDefaultersReport, 
  getScoreSummaryReport, 
  exportToCSV 
} from '../../services/reportService';
import { BOOK_CATEGORIES } from '../../services/bookService';
import { ClassificationBadge } from '../../components/ui/ClassificationBadge';
import toast from 'react-hot-toast';

export function ReportsPage() {
  const [activeReport, setActiveReport] = useState('borrowing'); // 'borrowing' | 'defaulters' | 'summary'

  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('all');
  const [department, setDepartment] = useState('all');

  // Report Data
  const [borrowingData, setBorrowingData] = useState([]);
  const [defaultersData, setDefaultersData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [activeReport, startDate, endDate, status, department]);

  async function loadReport() {
    setLoading(true);
    try {
      if (activeReport === 'borrowing') {
        const data = await getBorrowingReport({ startDate, endDate, status, department });
        setBorrowingData(data);
      } else if (activeReport === 'defaulters') {
        const data = await getDefaultersReport({ department });
        setDefaultersData(data);
      } else if (activeReport === 'summary') {
        const data = await getScoreSummaryReport();
        setSummaryData(data);
      }
    } catch (e) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleExportCSV() {
    if (activeReport === 'borrowing') {
      const headers = {
        bookTitle: 'Book Title',
        bookCategory: 'Category',
        userName: 'Student Name',
        userMatricNo: 'Matric No',
        department: 'Department',
        borrowDate: 'Borrow Date',
        dueDate: 'Due Date',
        returnDate: 'Return Date',
        status: 'Status',
        returnCondition: 'Condition',
        lateDays: 'Late Days'
      };
      exportToCSV('FCAHPT_Borrowing_Report', borrowingData, headers);
    } else if (activeReport === 'defaulters') {
      const headers = {
        name: 'Patron Name',
        matricNo: 'Matric No',
        department: 'Department',
        score: 'Credit Score',
        tier: 'Tier',
        defaultCount: 'Total Defaults',
        lateReturns: 'Late Returns',
        damagedReturns: 'Damaged Returns',
        lostBooks: 'Lost Books',
        status: 'Account Status',
        recentReason: 'Recent Reason'
      };
      exportToCSV('FCAHPT_Defaulters_Report', defaultersData, headers);
    } else if (activeReport === 'summary') {
      const rows = [
        { metric: 'Total Registered Patrons', value: summaryData?.totalPatrons },
        { metric: 'College Average Credit Score', value: summaryData?.averageScore },
        { metric: 'Highest Recorded Score', value: summaryData?.highestScore },
        { metric: 'Lowest Recorded Score', value: summaryData?.lowestScore },
        { metric: 'Excellent Tier Patrons', value: summaryData?.distribution.excellent },
        { metric: 'Good Tier Patrons', value: summaryData?.distribution.good },
        { metric: 'Fair Tier Patrons', value: summaryData?.distribution.fair },
        { metric: 'Poor Tier Patrons', value: summaryData?.distribution.poor },
        { metric: 'Very Poor Tier Patrons', value: summaryData?.distribution.veryPoor }
      ];
      exportToCSV('FCAHPT_Score_Summary_Report', rows, { metric: 'Metric', value: 'Value' });
    }
  }

  return (
    <div className="space-y-6">
      {/* Non-print Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 m-0">Institutional Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate and export official library circulation logs, default summaries, and credit score metrics
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print View</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Selection Tabs (no-print) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 no-print text-xs font-bold">
        <button
          onClick={() => setActiveReport('borrowing')}
          className={`py-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeReport === 'borrowing' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Borrowing Activity Report</span>
        </button>

        <button
          onClick={() => setActiveReport('defaulters')}
          className={`py-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeReport === 'defaulters' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Defaulters Report</span>
        </button>

        <button
          onClick={() => setActiveReport('summary')}
          className={`py-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeReport === 'summary' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Score Summary Analytics</span>
        </button>
      </div>

      {/* Filter Bar (no-print) */}
      {activeReport !== 'summary' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 no-print text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-3xs uppercase font-bold">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="p-1.5 rounded-lg border border-slate-200 text-xs font-mono"
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-3xs uppercase font-bold">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="p-1.5 rounded-lg border border-slate-200 text-xs font-mono"
            />
          </div>

          {activeReport === 'borrowing' && (
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-xs"
            >
              <option value="all">All Statuses</option>
              <option value="issued">Active Loans</option>
              <option value="overdue">Overdue</option>
              <option value="returned">Returned</option>
              <option value="lost">Lost</option>
            </select>
          )}

          <select
            value={department}
            onChange={e => setDepartment(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-xs max-w-[200px]"
          >
            <option value="all">All Academic Departments</option>
            <option value="Public Health & Disease Surveillance">Public Health</option>
            <option value="Environmental Health Technology">Environmental Health</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Home and Rural Economics">Home & Rural Economics</option>
            <option value="Statistics & Data Analytics">Statistics</option>
            <option value="Fisheries Technology">Fisheries</option>
            <option value="Animal Health & Technology">Animal Health</option>
            <option value="Animal Production Technology">Animal Production</option>
            <option value="Veterinary Laboratory Technology">Vet Lab Tech</option>
          </select>
        </div>
      )}

      {/* Official Printable Header */}
      <div className="hidden print-only text-center border-b pb-4 mb-4">
        <h2 className="text-lg font-black uppercase text-slate-900 m-0">
          Federal College of Animal Health and Production Technology (FCAHPT), Vom
        </h2>
        <p className="text-xs text-slate-600">College Library Services &bull; LibCredit Automated Scoring Engine</p>
        <p className="text-xs font-bold text-slate-800 mt-2">
          {activeReport === 'borrowing' ? 'Official Books Borrowing & Return Ledger' :
           activeReport === 'defaulters' ? 'Official Library Defaulters Audit List' :
           'Credit Score Performance & Tier Distribution Summary'}
        </p>
        <p className="text-3xs text-slate-400 font-mono mt-1">Generated: {new Date().toLocaleString()}</p>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeReport === 'borrowing' ? (
        /* Borrowing Report Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4 text-left">Patron</th>
                  <th className="py-3 px-4 text-left">Book Title</th>
                  <th className="py-3 px-4 text-left">Category</th>
                  <th className="py-3 px-4 text-left">Borrowed</th>
                  <th className="py-3 px-4 text-left">Due Date</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-center">Late Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {borrowingData.map((b, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {b.userName}
                      <span className="block text-[11px] font-mono text-slate-400 font-normal">{b.userMatricNo}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">{b.bookTitle}</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{b.bookCategory}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{b.borrowDate}</td>
                    <td className="py-3 px-4 text-slate-700 font-mono text-[11px] font-semibold">{b.dueDate}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        b.status === 'returned' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        b.status === 'overdue' ? 'bg-red-100 text-red-800 border border-red-200' :
                        'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs">
                      {b.lateDays > 0 ? <strong className="text-red-700 bg-red-50 px-2 py-0.5 rounded-md font-bold">{b.lateDays}</strong> : <span className="text-slate-400">0</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeReport === 'defaulters' ? (
        /* Defaulters Report Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4 text-left">Patron Name</th>
                  <th className="py-3 px-4 text-left">Matric No & Dept</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">Defaults</th>
                  <th className="py-3 px-4 text-left">Default Breakdown</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {defaultersData.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{d.name}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {d.matricNo} &bull; {d.department}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                      {d.score} ({d.tier})
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-red-700">
                      {d.defaultCount}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500 font-mono">
                      {d.lateReturns} late, {d.damagedReturns} dmg, {d.lostBooks} lost
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        d.status === 'suspended' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Summary Report KPI Cards & Table */
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-xs">
              <span className="text-3xs uppercase font-bold text-slate-400">Total Patrons</span>
              <p className="text-3xl font-extrabold font-mono text-slate-900 mt-1">{summaryData?.totalPatrons}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-xs">
              <span className="text-3xs uppercase font-bold text-slate-400">Average Score</span>
              <p className="text-3xl font-extrabold font-mono text-emerald-700 mt-1">{summaryData?.averageScore}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-xs">
              <span className="text-3xs uppercase font-bold text-slate-400">Highest Score</span>
              <p className="text-3xl font-extrabold font-mono text-blue-700 mt-1">{summaryData?.highestScore}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-xs">
              <span className="text-3xs uppercase font-bold text-slate-400">Lowest Score</span>
              <p className="text-3xl font-extrabold font-mono text-red-700 mt-1">{summaryData?.lowestScore}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Score Tier Distribution Table</h3>
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50 font-bold uppercase text-slate-500">
                <tr>
                  <th className="py-2.5 px-3 text-left">Tier</th>
                  <th className="py-2.5 px-3 text-left">Score Range</th>
                  <th className="py-2.5 px-3 text-center">Patrons Count</th>
                  <th className="py-2.5 px-3 text-center">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {Object.entries(summaryData?.distribution || {}).map(([k, count]) => {
                  const pct = summaryData?.totalPatrons ? Math.round((count / summaryData.totalPatrons) * 100) : 0;
                  return (
                    <tr key={k}>
                      <td className="py-2.5 px-3 font-bold capitalize text-slate-900">{k}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">
                        {k === 'excellent' ? '80–100' :
                         k === 'good' ? '60–79' :
                         k === 'fair' ? '40–59' :
                         k === 'poor' ? '20–39' : '0–19'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">{count}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
