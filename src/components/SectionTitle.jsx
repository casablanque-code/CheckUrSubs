const SectionTitle = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 px-1">
    <Icon className="w-4 h-4 text-zinc-400" strokeWidth={2} />
    <h3 className="font-semibold text-base tracking-tight">{label}</h3>
  </div>
);

export default SectionTitle;
