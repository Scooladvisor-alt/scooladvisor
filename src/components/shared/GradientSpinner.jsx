import React from "react";

export default function GradientSpinner({ size = "w-12 h-12", className = "" }) {
  return (
    <div className={`relative ${size} ${className}`}>
       <svg className="animate-spin w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF4D8D" />
              <stop offset="100%" stopColor="#60A5FA" />
            </linearGradient>
          </defs>
          <path 
            d="M21 12a9 9 0 1 1-6.219-8.56" 
            stroke="url(#spinner-gradient)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
       </svg>
    </div>
  );
}