const LogoLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes c3{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes c2{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes c1{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ck{from{stroke-dashoffset:36;opacity:0}to{stroke-dashoffset:0;opacity:1}}
        .lc3{animation:c3 .3s ease-out .05s both}
        .lc2{animation:c2 .3s ease-out .25s both}
        .lc1{animation:c1 .3s ease-out .45s both}
        .lck{animation:ck .5s ease-out .9s both;stroke-dasharray:36;stroke-dashoffset:36}
      `}</style>
      <g className="lc3"><rect x="14" y="38" width="52" height="28" rx="7" fill="#1a1a1a" stroke="#252525" strokeWidth="1.5"/></g>
      <g className="lc2"><rect x="14" y="30" width="52" height="28" rx="7" fill="#141414" stroke="#333" strokeWidth="1.5"/></g>
      <g className="lc1">
        <rect x="14" y="22" width="52" height="28" rx="7" fill="#0e0e0e" stroke="#484848" strokeWidth="1.5"/>
        <rect x="22" y="32" width="18" height="3" rx="1.5" fill="#2a2a2a"/>
        <rect x="22" y="38" width="12" height="3" rx="1.5" fill="#222"/>
      </g>
      <path className="lck" d="M44 26 L52 37 L66 20" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  </div>
);

export default LogoLoader;
