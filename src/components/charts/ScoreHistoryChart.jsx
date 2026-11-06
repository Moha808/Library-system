import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine 
} from 'recharts';

export function ScoreHistoryChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <p className="text-sm font-medium">No score history records yet</p>
        <span className="text-xs text-slate-400">Score timeline will update as books are borrowed and returned</span>
      </div>
    );
  }

  // Format data for chart
  const formattedData = data.map((item, index) => ({
    name: item.createdAt ? item.createdAt.slice(5, 10) : `#${index + 1}`,
    score: item.scoreAfter !== undefined ? item.scoreAfter : item.score,
    event: item.event,
    reason: item.reason,
    points: item.points
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 15, right: 20, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey="name" 
            stroke="#94a3b8" 
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            domain={[0, 100]} 
            ticks={[0, 20, 40, 60, 80, 100]} 
            stroke="#94a3b8" 
            fontSize={12}
            tickLine={false}
          />
          {/* Threshold marker lines */}
          <ReferenceLine y={80} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Excellent', fill: '#10b981', fontSize: 10, position: 'insideTopRight' }} />
          <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Fair', fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }} />
          <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Poor', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />

          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const info = payload[0].payload;
                return (
                  <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs max-w-xs border border-slate-700">
                    <div className="flex items-center justify-between gap-4 font-bold border-b border-slate-700 pb-1 mb-1.5">
                      <span>Score: {info.score}</span>
                      <span className={info.points > 0 ? 'text-emerald-400' : info.points < 0 ? 'text-rose-400' : 'text-slate-400'}>
                        {info.points > 0 ? `+${info.points}` : info.points}
                      </span>
                    </div>
                    <p className="text-slate-300 font-medium mb-1">{info.event}</p>
                    <p className="text-slate-400 text-2xs leading-relaxed">{info.reason}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="#15803d" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#15803d', stroke: '#ffffff', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#166534', stroke: '#ffffff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
