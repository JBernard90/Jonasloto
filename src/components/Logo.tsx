import React from 'react';

export default function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`relative ${className} flex items-center justify-center`}>
      <svg viewBox="0 0 400 300" className="w-full h-full drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
        {/* L'arche bleue */}
        <path 
          d="M 60 180 A 140 140 0 0 1 340 180" 
          fill="none" 
          stroke="#002B95" 
          strokeWidth="18" 
          strokeLinecap="round"
        />
        
        {/* Losange central (Fond JLC) */}
        <path 
          d="M 200 60 L 260 120 L 200 180 L 140 120 Z" 
          fill="#006666" 
          stroke="#FFD700" 
          strokeWidth="4"
        />
        <path 
          d="M 200 40 L 280 120 L 200 200 L 120 120 Z" 
          fill="none" 
          stroke="#FFD700" 
          strokeWidth="2" 
          opacity="0.5"
        />

        {/* Sigle JLC au centre */}
        <text x="200" y="145" textAnchor="middle" className="font-black" style={{ fontSize: '50px', fill: '#002B95', stroke: '#FFFFFF', strokeWidth: '2px', paintOrder: 'stroke' }}>
          JLC
        </text>

        {/* JONAS (Gauche) */}
        <text x="115" y="165" textAnchor="middle" className="font-black italic" style={{ fontSize: '28px', fill: '#E6FF00', stroke: '#002B95', strokeWidth: '1.5px', paintOrder: 'stroke' }}>
          JONAS
        </text>

        {/* LOTO (Droite) */}
        <text x="295" y="165" textAnchor="middle" className="font-black italic" style={{ fontSize: '28px', fill: '#FF0000', stroke: '#FFD700', strokeWidth: '1.5px', paintOrder: 'stroke' }}>
          LOTO
        </text>

        {/* CENTER (Bas) */}
        <text x="200" y="225" textAnchor="middle" className="font-black" style={{ fontSize: '48px', fill: '#002B95', stroke: '#FFD700', strokeWidth: '2px', paintOrder: 'stroke' }}>
          CENTER
        </text>
      </svg>
    </div>
  );
}
