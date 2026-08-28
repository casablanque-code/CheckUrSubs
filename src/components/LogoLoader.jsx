const LogoLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="brand" x1="10" y1="60" x2="70" y2="15" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="50%" stopColor="#d946ef" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d946ef" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#d946ef" stopOpacity="0" />
        </radialGradient>
      </defs>
      <style>{`
        @keyframes bounceIn{from{opacity:0;transform:translateY(14px) scale(.8)}60%{transform:translateY(-2px) scale(1.03)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes ck{from{stroke-dashoffset:36;opacity:0}15%{opacity:1}to{stroke-dashoffset:0;opacity:1}}
        @keyframes spark{from{offset-distance:0%;opacity:0}2%{opacity:1}85%{opacity:1}to{offset-distance:100%;opacity:0}}
        @keyframes pulse{from{opacity:0;transform:scale(.3)}30%{opacity:.85;transform:scale(.6)}to{opacity:0;transform:scale(1.5)}}
        .lc3{transform-box:fill-box;transform-origin:center;animation:bounceIn .35s cubic-bezier(.34,1.56,.64,1) .05s both}
        .lc2{transform-box:fill-box;transform-origin:center;animation:bounceIn .35s cubic-bezier(.34,1.56,.64,1) .2s both}
        .lc1{transform-box:fill-box;transform-origin:center;animation:bounceIn .35s cubic-bezier(.34,1.56,.64,1) .35s both}
        .lck{animation:ck .4s ease-out .75s both;stroke-dasharray:36;stroke-dashoffset:36}
        .lspark{offset-path:path('M44 26 L52 37 L66 20');animation:spark .4s ease-out .75s both;opacity:0}
        .lglow{transform-box:fill-box;transform-origin:center;animation:pulse .3s ease-out 1.15s both;opacity:0}
      `}</style>
      <g className="lc3"><rect x="14" y="38" width="52" height="28" rx="7" fill="#1a1a1a" stroke="url(#brand)" strokeWidth="1.2" strokeOpacity="0.5" /></g>
      <g className="lc2"><rect x="14" y="30" width="52" height="28" rx="7" fill="#141414" stroke="url(#brand)" strokeWidth="1.4" strokeOpacity="0.7" /></g>
      <g className="lc1">
        <rect x="14" y="22" width="52" height="28" rx="7" fill="#0e0e0e" stroke="url(#brand)" strokeWidth="2" />
        <rect x="22" y="32" width="18" height="3" rx="1.5" fill="url(#brand)" />
        <rect x="22" y="38" width="12" height="3" rx="1.5" fill="url(#brand)" fillOpacity="0.75" />
      </g>
      {/* Пульс-вспышка ровно в точке, где заканчивается путь чек-марки (66,20) */}
      <circle className="lglow" cx="66" cy="20" r="16" fill="url(#glow)" />
      {/* Искра летит по тому же пути, что рисуется чек-марка (44,26 → 52,37 → 66,20).
          cx/cy — фоллбэк-позиция (начало пути) на случай, если offset-path не
          поддерживается: тогда искра просто останется неподвижной точкой у
          старта пути, а не улетит в угол вьюбокса. */}
      <circle className="lspark" cx="44" cy="26" r="2.6" fill="#fff" />
      <path className="lck" d="M44 26 L52 37 L66 20" stroke="url(#brand)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  </div>
);

export default LogoLoader;
