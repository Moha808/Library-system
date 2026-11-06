import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

export function BorrowingActivityChart({ borrowings = [] }) {
  // Aggregate borrowings by month
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthCounts = {};
  months.forEach(m => { monthCounts[m] = 0; });

  borrowings.forEach(b => {
    const dateStr = b.borrowDate || b.createdAt;
    if (dateStr) {
      const date = new Date(dateStr);
      const mName = months[date.getMonth()];
      if (monthCounts[mName] !== undefined) {
        monthCounts[mName]++;
      }
    }
  });

  // Current year months up to current (say Jan - Nov)
  const data = months.slice(0, 11).map(m => ({
    month: m,
    loans: monthCounts[m]
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorLoans" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#15803d" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#15803d" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis 
            dataKey="month" 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false}
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={12} 
            allowDecimals={false}
            tickLine={false}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-slate-900 text-white px-3 py-2 rounded-md text-xs shadow-lg">
                    <span className="font-semibold">{payload[0].payload.month}: </span>
                    <span className="font-bold">{payload[0].value} book loans</span>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area 
            type="monotone" 
            dataKey="loans" 
            stroke="#15803d" 
            strokeWidth={2.5} 
            fillOpacity={1} 
            fill="url(#colorLoans)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
