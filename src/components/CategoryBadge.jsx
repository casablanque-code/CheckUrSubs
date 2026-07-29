const CategoryBadge = ({ cat, tiny = false }) => {
  const Icon = cat.icon;
  if (tiny) return (
    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg ${cat.bg} border ${cat.border}`}>
      <Icon className={`w-2.5 h-2.5 ${cat.color}`} />
    </div>
  );
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl ${cat.bg} border ${cat.border}`}>
      <Icon className={`w-3 h-3 ${cat.color}`} />
      <span className={`text-xs font-medium ${cat.color}`}>{cat.label}</span>
    </div>
  );
};

export default CategoryBadge;
