const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <button type="button" onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 text-xs font-medium tracking-[0.1em] uppercase ${active ? 'text-white' : 'text-zinc-500'}`}>
    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border transition ${active ? 'bg-white text-black border-white' : 'border-zinc-800 bg-zinc-900/60'}`}>
      <Icon className="w-4 h-4" />
    </div>
    <span className="text-[9px]">{label}</span>
  </button>
);

export default NavItem;
