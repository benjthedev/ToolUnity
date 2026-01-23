'use client';

import { useState } from 'react';

interface ToolOwnerBadgeProps {
  toolsCount?: number;
  subscriptionTier?: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export default function ToolOwnerBadge({
  toolsCount = 0,
  subscriptionTier = 'none',
  size = 'md',
  showTooltip = true,
}: ToolOwnerBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine if user is a tool owner (has at least 1 tool)
  const isToolOwner = toolsCount >= 1;
  
  if (!isToolOwner) {
    return null;
  }

  // Determine badge style based on tier
  const isPaid = subscriptionTier && ['basic', 'standard', 'pro'].includes(subscriptionTier);
  const isSuperOwner = toolsCount >= 3;

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  const iconSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const badgeIcon = isSuperOwner ? '⭐' : '✨';
  const badgeText = isSuperOwner ? 'Tool Legend' : 'Handy Helper';
  
  const badgeStyles = isSuperOwner
    ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:from-amber-500 hover:via-yellow-400 hover:to-amber-500 border-amber-500 text-amber-900 shadow-lg shadow-amber-200/50 hover:shadow-xl hover:shadow-amber-300/60'
    : 'bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 hover:from-blue-500 hover:via-cyan-400 hover:to-blue-500 border-blue-500 text-blue-900 shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-300/60';

  const tooltip = isSuperOwner
    ? '⭐ Tool Legend with 3+ tools shared'
    : '✨ Handy Helper sharing tools with the community';

  return (
    <div className="relative inline-block group">
      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-2px);
          }
        }
        
        .badge-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        
        .badge-float:hover {
          animation: float 0.6s ease-in-out;
        }
      `}</style>
      
      <span
        className={`inline-flex items-center font-bold border-2 rounded-full whitespace-nowrap transition-all duration-300 ${sizeStyles[size]} ${badgeStyles} badge-float ${isHovered ? 'scale-110' : 'scale-100'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span className={`${iconSize[size]} animate-bounce`} style={{animationDuration: '2s'}}>
          {badgeIcon}
        </span>
        <span>{badgeText}</span>
      </span>
      
      {/* Glow effect background */}
      <div
        className={`absolute inset-0 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
          isSuperOwner
            ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
            : 'bg-gradient-to-r from-blue-400 to-cyan-300'
        }`}
        style={{
          transform: 'scale(1.1)',
          zIndex: -1,
        }}
      />
      
      {showTooltip && (
        <div
          className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-gradient-to-r ${
            isSuperOwner
              ? 'from-amber-900 to-amber-800'
              : 'from-blue-900 to-blue-800'
          } text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none z-10 backdrop-blur-sm`}
        >
          {tooltip}
          <div
            className={`absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent ${
              isSuperOwner ? 'border-t-amber-800' : 'border-t-blue-800'
            }`}
          />
        </div>
      )}
    </div>
  );
}
