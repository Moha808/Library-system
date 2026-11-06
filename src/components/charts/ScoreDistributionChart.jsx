import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell 
} from 'recharts';

export function ScoreDistributionChart({ distribution = {} }) {
  const data = [
    { tier: 'Excellent', count: distribution.excellent || 0, color: '#10b981' },
    { tier: 'Good', count: distribution.good || 0, color: '#2563eb' },
    { tier: 'Fair', count: distribution.fair || 0, color: '#f59e0b' },
    { tier: 'Poor', count: distribution.poor || 0, color: '#ea580c' },
    { tier: 'Very Poor', count: distribution.veryPoor || 0, color: '#ef4444' }
  ];

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis 
            dataKey="tier" 
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
            cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-slate-900 text-white px-3 py-2 rounded-md text-xs shadow-lg">
                    <span className="font-semibold">{item.tier} Tier: </span>
                    <span className="font-bold">{item.count} patrons</span>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
