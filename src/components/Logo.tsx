import React from 'react';

interface LogoProps {
  className?: string;
  light?: boolean;
  size?: number;
}

export default function Logo({ className = "", light = false, size }: LogoProps) {
  const baseWidth = 200;
  const baseHeight = 140;
  const scale = size ? size / 100 : 1;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div 
        className="relative flex items-center justify-center overflow-visible"
        style={{ width: baseWidth * scale, height: baseHeight * scale }}
      >
        <svg 
          viewBox={`0 0 ${baseWidth} ${baseHeight}`} 
          className="w-full h-full drop-shadow-lg"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Blue Arc */}
          <path 
            d="M 10 100 A 90 90 0 0 1 190 100" 
            fill="none" 
            stroke="#00208F" 
            strokeWidth="10" 
            strokeLinecap="round"
          />
          
          {/* Central Emblem Frame (Diamond + Square) */}
          <g transform="translate(100, 60)">
            {/* Yellow Diamond */}
            <rect x="-30" y="-30" width="60" height="60" fill="#FFD700" rx="4" transform="rotate(45)" />
            {/* Dark Teal Square */}
            <rect x="-25" y="-25" width="50" height="50" fill="#1A4D4D" rx="4" />
            
            {/* JLC Text */}
            <text 
              y="10" 
              textAnchor="middle" 
              className="font-black italic" 
              style={{ fontSize: '28px', fill: 'white', letterSpacing: '-1px' }}
            >
              JLC
            </text>
          </g>

          {/* JONAS Text (Left) */}
          <text 
            x="50" 
            y="85" 
            textAnchor="middle" 
            className="font-black italic" 
            style={{ fontSize: '20px', fill: '#FFD700', stroke: '#00208F', strokeWidth: '0.5px' }}
          >
            JONAS
          </text>

          {/* LOTO Text (Right) */}
          <text 
            x="150" 
            y="85" 
            textAnchor="middle" 
            className="font-black italic" 
            style={{ fontSize: '20px', fill: '#E30613', stroke: '#FFD700', strokeWidth: '0.5px' }}
          >
            LOTO
          </text>

          {/* CENTER Text (Bottom) */}
          <text 
            x="100" 
            y="125" 
            textAnchor="middle" 
            className="font-black" 
            style={{ fontSize: '26px', fill: '#00208F', stroke: '#FFD700', strokeWidth: '0.8px' }}
          >
            CENTER
          </text>
        </svg>
      </div>
    </div>
  );
}
