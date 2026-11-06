import React from 'react';
import { ShieldCheck, Award, AlertCircle, AlertTriangle, XCircle } from 'lucide-react';

export function ClassificationBadge({ tier = 'fair', score = null, size = 'md' }) {
  const normalized = (tier || '').toLowerCase();

  const configs = {
    excellent: {
      label: 'Excellent',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-300',
      dot: 'bg-emerald-500',
      icon: Award
    },
    good: {
      label: 'Good',
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-300',
      dot: 'bg-blue-500',
      icon: ShieldCheck
    },
    fair: {
      label: 'Fair',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-300',
      dot: 'bg-amber-500',
      icon: AlertCircle
    },
    poor: {
      label: 'Poor',
      bg: 'bg-orange-50',
      text: 'text-orange-800',
      border: 'border-orange-300',
      dot: 'bg-orange-500',
      icon: AlertTriangle
    },
    verypoor: {
      label: 'Very Poor',
      bg: 'bg-red-50',
      text: 'text-red-800',
      border: 'border-red-300',
      dot: 'bg-red-500',
      icon: XCircle
    }
  };

  const key = normalized.includes('very') ? 'verypoor' : normalized;
  const cfg = configs[key] || configs.fair;
  const IconComponent = cfg.icon;

  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5 gap-1' 
    : size === 'lg' 
    ? 'text-sm px-3.5 py-1.5 gap-2' 
    : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span className={`inline-flex items-center font-semibold rounded-full border shadow-2xs ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeClasses}`}>
      <IconComponent className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      <span>{cfg.label}</span>
      {score !== null && (
        <span className="font-mono text-slate-500 font-normal">({score})</span>
      )}
    </span>
  );
}
