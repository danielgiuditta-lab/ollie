import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface StatusIndicatorProps {
  status: 'working' | 'done' | 'blocked' | string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  const norm = status ? status.toLowerCase() : '';
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      width: '24px', 
      height: '24px', 
      position: 'relative' 
    }}>
      {/* Dynamic Keyframes Injection to guarantee beautiful dash loop on the ring */}
      <style>{`
        @keyframes fillRing {
          0% {
            stroke-dashoffset: 85;
          }
          50% {
            stroke-dashoffset: 15;
          }
          100% {
            stroke-dashoffset: 85;
          }
        }
        @keyframes rotateRing {
          0% {
            transform: rotate(-90deg);
          }
          100% {
            transform: rotate(270deg);
          }
        }
      `}</style>
      
      {norm === 'idle' || norm === '' ? null : norm === 'working' || norm === 'pending' ? (
        <>
          {/* Animated SVG loader ring */}
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 36 36" 
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              zIndex: 2,
              overflow: 'visible'
            }}
          >
            <defs>
              <linearGradient id="workGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3186FF" />
                <stop offset="100%" stopColor="#0EBC5F" />
              </linearGradient>
            </defs>
            {/* Elegant background indicator track */}
            <circle 
              cx="18" 
              cy="18" 
              r="13.5" 
              fill="none" 
              stroke="rgba(148, 163, 184, 0.15)" 
              strokeWidth="3.5" 
            />
            {/* Real circular animated stroke that fills exactly */}
            <circle 
              cx="18" 
              cy="18" 
              r="13.5" 
              fill="none" 
              stroke="url(#workGrad)" 
              strokeWidth="3.5" 
              strokeDasharray="85" 
              style={{ 
                transformOrigin: '18px 18px',
                animation: 'fillRing 2.2s ease-in-out infinite, rotateRing 1.8s linear infinite',
                strokeLinecap: 'round' 
              }} 
            />
          </svg>
        </>
      ) : norm === 'blocked' ? (
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
      ) : (
        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
      )}
    </div>
  );
};

export default StatusIndicator;
