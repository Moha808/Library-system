import React from 'react';
import { ShieldCheck, Award, AlertCircle, AlertTriangle, XCircle } from 'lucide-react';

export function ScoreGauge({ score = 50, size = 180, showLabel = true }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  
  // Radius and circumference
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // We use a 240 degree arc (from 150deg to 390deg)
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * clamped) / 100;

  // Color selection
  let color = '#10b981'; // emerald
  let label = 'Excellent';
  let Icon = ShieldCheck;
  let bgClass = 'text-emerald-600 bg-emerald-50';

  if (clamped >= 80) {
    color = '#10b981'; // green / emerald
    label = 'Excellent';
    Icon = Award;
    bgClass = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  } else if (clamped >= 60) {
    color = '#2563eb'; // blue
    label = 'Good';
    Icon = ShieldCheck;
    bgClass = 'text-blue-700 bg-blue-50 border-blue-200';
  } else if (clamped >= 40) {
    color = '#d97706'; // amber
    label = 'Fair';
    Icon = AlertCircle;
    bgClass = 'text-amber-700 bg-amber-50 border-amber-200';
  } else if (clamped >= 20) {
    color = '#ea580c'; // orange
    label = 'Poor';
    Icon = AlertTriangle;
    bgClass = 'text-orange-700 bg-orange-50 border-orange-200';
  } else {
    color = '#dc2626'; // red
    label = 'Very Poor';
    Icon = XCircle;
    bgClass = 'text-red-700 bg-red-50 border-red-200';
  }

  return (
    <div className="flex flex-col items-center justify-center p-3">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-135 transition-all duration-700 ease-out"
        >
          {/* Background Track Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Active Animated Score Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1s ease-in-out, stroke 0.5s ease',
            }}
          />
        </svg>

        {/* Center Score & Icon Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <Icon className="w-6 h-6 mb-1" style={{ color }} />
          <span className="text-4xl font-extrabold tracking-tight text-slate-900 font-mono">
            {clamped}
          </span>
          <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
            out of 100
          </span>
        </div>
      </div>

      {showLabel && (
        <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold border ${bgClass} flex items-center gap-1.5 shadow-xs`}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          {label} Patron Tier
        </div>
      )}
    </div>
  );
}
