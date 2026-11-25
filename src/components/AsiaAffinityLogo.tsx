import React from 'react';

interface AsiaAffinityLogoProps {
  compact?: boolean;
}

export const AsiaAffinityLogo: React.FC<AsiaAffinityLogoProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 shrink-0">
        <svg
          width="28"
          height="28"
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          <circle cx="32" cy="32" r="28" stroke="#C7AC2D" strokeWidth="5.5" />
          <path
            d="M17 41L24.5 22H28L34.5 41H30.8L29.4 36.6H22.8L21.3 41H17ZM23.8 33.4H28.4L26.1 26.2L23.8 33.4Z"
            fill="#C7AC2D"
          />
          <path
            d="M32 41L39.5 22H43L49.5 41H45.8L44.4 36.6H37.8L36.3 41H32ZM38.8 33.4H43.4L41.1 26.2L38.8 33.4Z"
            fill="#C7AC2D"
          />
        </svg>
        <div className="leading-none">
          <span className="block font-display text-xs font-extrabold tracking-tight text-slate-900">
            ASIA AFFINITY
          </span>
          <span className="block text-[9px] font-semibold tracking-wider text-[#B6981E]">
            MANCOM AR REPORT
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-3.5 rounded bg-[#F5F5F4] px-4 py-3 border border-slate-200/80">
      <svg
        width="54"
        height="54"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <circle cx="32" cy="32" r="28" stroke="#C7AC2D" strokeWidth="5" />
        <path
          d="M16.5 41L24 22H27.6L34 41H30.3L28.9 36.5H22.4L20.9 41H16.5ZM23.3 33.4H27.9L25.6 26.2L23.3 33.4Z"
          fill="#C7AC2D"
        />
        <path
          d="M31.5 41L39 22H42.6L49 41H45.3L43.9 36.5H37.4L35.9 41H31.5ZM38.3 33.4H42.9L40.6 26.2L38.3 33.4Z"
          fill="#C7AC2D"
        />
      </svg>
      <div className="leading-tight">
        <div className="font-display text-xl font-extrabold tracking-[0.04em] text-slate-900">
          ASIA
        </div>
        <div className="font-display text-xl font-extrabold tracking-[0.04em] text-slate-900 -mt-1">
          AFFINITY<sup className="text-[10px] font-bold align-super ml-0.5">®</sup>
        </div>
        <div className="mt-0.5 text-[8.5px] font-bold tracking-[0.08em] text-slate-700">
          PROPERTY MANAGEMENT, INC.
        </div>
      </div>
    </div>
  );
};
