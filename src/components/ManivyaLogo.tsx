import React from 'react';

interface ManivyaLogoProps {
  className?: string;
  showSubtext?: boolean;
}

export const ManivyaLogo: React.FC<ManivyaLogoProps> = ({
  className = "w-10 h-10",
  showSubtext = false,
}) => {
  return (
    <div className="inline-flex items-center gap-2.5">
      {/* 1:1 Equal Height and Width Circular Logo */}
      <div className={`relative aspect-square flex-shrink-0 flex items-center justify-center rounded-full bg-white shadow-lg border border-zinc-200/40 overflow-hidden ${className}`}>
        <svg
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-contain p-1"
        >
          <defs>
            {/* Deep Royal Purple Gradient for Letters */}
            <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2E0A48" />
              <stop offset="50%" stopColor="#230738" />
              <stop offset="100%" stopColor="#180428" />
            </linearGradient>

            {/* Saffron / Orange Gradient for Ganesha & Accent */}
            <linearGradient id="saffronGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FB923C" />
              <stop offset="50%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>

            {/* Golden Gradient for Ā Macron */}
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>

          {/* White Circular Backdrop */}
          <circle cx="200" cy="200" r="195" fill="#FFFFFF" />

          {/* Group for perfectly centered wordmark: M Ā N Ī V Y A */}
          <g transform="translate(200, 200) scale(0.75) translate(-258, -166.5)">
            
            {/* 1. Letter M */}
            <path
              d="M 42 225 C 40 225 36 220 38 212 L 52 142 C 54 132 62 132 66 142 L 78 182 L 90 142 C 94 132 102 132 104 142 L 118 212 C 120 220 116 225 114 225 C 110 225 106 220 106 212 L 98 168 L 84 216 C 81 224 75 224 72 216 L 58 168 L 50 212 C 50 220 46 225 42 225 Z"
              fill="url(#purpleGradient)"
            />

            {/* 2. Letter Ā */}
            {/* Saffron Macron (Ā Bar) */}
            <rect x="132" y="122" width="28" height="6" rx="3" fill="url(#goldGradient)" />
            {/* A body */}
            <path
              d="M 120 225 C 120 225 125 225 128 218 L 143 142 C 145 133 151 133 153 142 L 168 218 C 171 225 176 225 176 225 C 172 225 166 222 163 212 L 159 194 L 137 194 L 133 212 C 130 222 124 225 120 225 Z M 140 180 L 156 180 L 148 152 Z"
              fill="url(#purpleGradient)"
            />

            {/* 3. Letter N */}
            <path
              d="M 184 225 C 180 225 176 220 176 210 L 176 145 C 176 135 180 130 184 130 C 188 130 192 133 195 139 L 217 190 L 217 145 C 217 135 221 130 225 130 C 229 130 233 135 233 145 L 233 210 C 233 220 229 225 225 225 C 221 225 217 222 214 216 L 192 165 L 192 210 C 192 220 188 225 184 225 Z"
              fill="url(#purpleGradient)"
            />

            {/* 4. Letter Ī (Divine Vel Spear) */}
            {/* Spear Blade */}
            <path
              d="M 248 108 C 238 126 233 142 233 156 C 233 170 242 180 248 186 C 254 180 263 170 263 156 C 263 142 258 126 248 108 Z"
              fill="url(#purpleGradient)"
            />
            {/* Vibhuti Lines (3 Horizontal White Lines) */}
            <line x1="238" y1="148" x2="258" y2="148" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
            <line x1="239" y1="156" x2="257" y2="156" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
            <line x1="241" y1="164" x2="255" y2="164" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
            {/* Kumkum Red Dot */}
            <circle cx="248" cy="156" r="3" fill="#EF4444" />
            {/* Spear Shaft */}
            <rect x="245" y="183" width="6" height="42" rx="3" fill="url(#purpleGradient)" />

            {/* 5. Letter V */}
            <path
              d="M 270 135 C 270 128 276 128 280 135 L 295 210 C 298 222 304 225 306 225 C 308 225 314 222 317 210 L 332 135 C 336 128 342 128 342 135 C 342 138 340 142 338 150 L 321 216 C 316 228 308 228 306 228 C 304 228 296 228 291 216 L 274 150 C 272 142 270 138 270 135 Z"
              fill="url(#purpleGradient)"
            />

            {/* 6. Letter Y */}
            <path
              d="M 328 135 C 328 128 334 128 338 135 L 352 172 L 366 135 C 370 128 376 128 376 135 C 376 138 374 142 372 148 L 357 185 L 357 212 C 357 220 351 225 347 225 C 343 225 337 220 337 212 L 337 185 L 322 148 C 320 142 328 138 328 135 Z"
              fill="url(#purpleGradient)"
            />

            {/* 7. Letter A with Integrated Ganesha */}
            {/* A Left leg and crossbar */}
            <path
              d="M 358 225 C 358 225 362 225 365 218 L 378 142 C 380 133 386 133 388 142 L 398 190 L 388 190 L 382 160 L 371 212 C 368 222 362 225 358 225 Z M 377 180 L 386 180 L 382 160 Z"
              fill="url(#purpleGradient)"
            />
            {/* Orange/Saffron Ganesha Face, Ear & Curling Trunk */}
            <path
              d="M 390 152 C 398 152 408 146 418 136 C 428 126 438 120 450 126 C 466 133 478 155 468 175 C 460 189 442 195 428 187 C 418 181 418 169 426 167 C 432 165 438 171 443 175 C 451 179 460 174 463 165 C 467 154 457 139 445 137 C 435 135 425 139 416 149 C 406 160 396 168 390 168 Z"
              fill="url(#saffronGradient)"
            />
            {/* Ganesha Eye */}
            <circle cx="454" cy="146" r="3.5" fill="#FFFFFF" />
            <circle cx="454" cy="146" r="2" fill="#EA580C" />
          </g>
        </svg>
      </div>

      {showSubtext && (
        <div className="flex flex-col text-left">
          <span className="text-sm font-black tracking-tight text-white font-sans leading-none">
            MANIVYA
          </span>
          <span className="text-[10px] tracking-wider uppercase text-zinc-400 font-medium font-sans mt-0.5">
            Manojavam Multi Enterprises
          </span>
        </div>
      )}
    </div>
  );
};
