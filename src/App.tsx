import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  PieChart, 
  Wallet, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  TrendingUp, 
  AlertCircle,
  Coins,
  PiggyBank,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  CreditCard,
  Banknote,
  Building2,
  Settings2,
  Tag,
  Layers,
  X
} from 'lucide-react';

// --- Types ---
type Category = 'Essential' | 'Wants' | 'Investment';

interface SpendingSource {
  id: string;
  name: string;
  type: 'Bank' | 'Card' | 'Cash';
  isDefault: boolean;
}

interface SubCategory {
  id: string;
  name: string;
  parentId: Category;
}

interface Transaction {
  id: string;
  date: string;
  name: string;
  amount: number;
  category: Category;
  subCategoryId: string;
  sourceId: string;
}

// --- Components ---

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card = ({ children, className = "" }: CardProps) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
    {children}
  </div>
);

const SimplePieChart = ({ data }: { data: { name: string; value: number; color: string }[] }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  let cumulativePercent = 0;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 w-48 rounded-full bg-slate-100 text-slate-400 text-xs text-center p-4">
        No Spending Data Yet
      </div>
    );
  }

  function getCoordinatesForPercent(percent: number) {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  }

  return (
    <div className="relative h-48 w-48">
      <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full">
        {data.map((slice, index) => {
          if (slice.value === 0) return null;
          if (slice.value === total) return <circle key={index} cx="0" cy="0" r="1" fill={slice.color} />;

          const startPercent = cumulativePercent;
          const endPercent = cumulativePercent + (slice.value / total);
          cumulativePercent = endPercent;

          const [startX, startY] = getCoordinatesForPercent(startPercent);
          const [endX, endY] = getCoordinatesForPercent(endPercent);
          const largeArcFlag = slice.value / total > 0.5 ? 1 : 0;

          const pathData = [`M 0 0`, `L ${startX} ${startY}`, `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, `Z`].join(' ');
          return <path key={index} d={pathData} fill={slice.color} stroke="white" strokeWidth="0.02" />;
        })}
      </svg>
    </div>
  );
};

export default function BudgetTracker() {
  // --- State ---
  const [income, setIncome] = useState<number>(0);
  const [savings, setSavings] = useState<number>(0);
  
  const [sources, setSources] = useState<SpendingSource[]>([
    { id: 'src-1', name: 'Main Bank', type: 'Bank', isDefault: true },
    { id: 'src-2', name: 'Credit Card', type: 'Card', isDefault: false },
    { id: 'src-3', name: 'Cash', type: 'Cash', isDefault: false },
  ]);

  const [subCategories, setSubCategories] = useState<SubCategory[]>([
    { id: 'sub-1', name: 'Rent', parentId: 'Essential' },
    { id: 'sub-2', name: 'Electricity', parentId: 'Essential' },
    { id: 'sub-3', name: 'Grocery', parentId: 'Essential' },
    { id: 'sub-4', name: 'Mutual Fund', parentId: 'Investment' },
    { id: 'sub-5', name: 'Stocks', parentId: 'Investment' },
    { id: 'sub-6', name: 'RD', parentId: 'Investment' },
    { id: 'sub-7', name: 'Outside Food', parentId: 'Wants' },
    { id: 'sub-8', name: 'Entertainment', parentId: 'Wants' },
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<Category | null>('Essential');
  const [showSettings, setShowSettings] = useState(false);
  
  const defaultSourceId = useMemo(() => sources.find(s => s.isDefault)?.id || sources[0].id, [sources]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '',
    amount: '',
    category: 'Essential' as Category,
    subCategoryId: '',
    sourceId: defaultSourceId
  });

  // Set initial subcategory for current category
  useEffect(() => {
    const validSub = subCategories.find(s => s.parentId === formData.category);
    setFormData(prev => ({ ...prev, subCategoryId: validSub?.id || '' }));
  }, [formData.category, subCategories]);

  // Update form source when default changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, sourceId: defaultSourceId }));
  }, [defaultSourceId]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Calculations ---
  const netIncome = Math.max(0, income - savings);

  const summary = useMemo(() => {
    const totals = { Essential: 0, Wants: 0, Investment: 0 };
    transactions.forEach(t => { totals[t.category] += t.amount; });
    const totalSpent = Object.values(totals).reduce((a, b) => a + b, 0);
    return { totals, totalSpent };
  }, [transactions]);

  const targets = {
    Essential: netIncome * 0.5,
    Wants: netIncome * 0.25,
    Investment: netIncome * 0.25
  };

  const pieData = [
    { name: 'Essential', value: summary.totals.Essential, color: '#3b82f6' },
    { name: 'Wants', value: summary.totals.Wants, color: '#f43f5e' },
    { name: 'Investment', value: summary.totals.Investment, color: '#10b981' }
  ];

  // --- Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount || !formData.subCategoryId) return;
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      date: formData.date,
      name: formData.name,
      amount: parseFloat(formData.amount),
      category: formData.category,
      subCategoryId: formData.subCategoryId,
      sourceId: formData.sourceId
    };
    setTransactions([...transactions, newTransaction]);
    setFormData({ ...formData, name: '', amount: '' });
  };

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    const name = (e.target as any).sourceName.value;
    const type = (e.target as any).sourceType.value;
    if (!name) return;
    setSources([...sources, { id: crypto.randomUUID(), name, type, isDefault: false }]);
    (e.target as any).reset();
  };

  const handleAddSubCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const name = (e.target as any).subName.value;
    const parentId = (e.target as any).parentCategory.value;
    if (!name) return;
    setSubCategories([...subCategories, { id: crypto.randomUUID(), name, parentId }]);
    (e.target as any).reset();
  };

  const handleDeleteSubCategory = (id: string) => {
    setSubCategories(subCategories.filter(s => s.id !== id));
  };

  const setDefaultSource = (id: string) => {
    setSources(sources.map(s => ({ ...s, isDefault: s.id === id })));
  };

  const handleExport = () => {
    const dataToExport = { 
      income, 
      savings, 
      sources,
      subCategories,
      transactions
    };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `budget_tracker_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (typeof parsed.income === 'number') setIncome(parsed.income);
        if (typeof parsed.savings === 'number') setSavings(parsed.savings);
        if (Array.isArray(parsed.sources) && parsed.sources.length > 0) setSources(parsed.sources);
        if (Array.isArray(parsed.subCategories) && parsed.subCategories.length > 0) setSubCategories(parsed.subCategories);
      } catch (err) {
        console.error("Import failed:", err);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(amount);
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'Bank': return <Building2 className="w-3 h-3" />;
      case 'Card': return <CreditCard className="w-3 h-3" />;
      case 'Cash': return <Banknote className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12">
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-20 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-left w-full md:w-auto">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-none">BudgetTracker</h1>
              <p className="text-slate-400 text-xs mt-1">50-25-25 Expense Manager</p>
            </div>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`flex-none p-2 rounded-lg transition-colors border ${showSettings ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-800 border-slate-600'}`}
              title="Settings & Custom Categories"
            >
              <Settings2 className="w-5 h-5" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Upload className="w-4 h-4" /> Import
            </button>
            <button onClick={handleExport} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Download className="w-4 h-4" /> Export JSON
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {showSettings && (
          <div className="col-span-1 lg:col-span-12">
            <Card className="p-6 bg-slate-100 border-2 border-indigo-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-700 flex items-center gap-2 text-lg">
                  <Settings2 className="w-5 h-5 text-indigo-500" /> Settings & Customization
                </h3>
                <button onClick={() => setShowSettings(false)} className="bg-white px-3 py-1 rounded-md border border-slate-300 shadow-sm text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors">Close</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-xs font-black text-indigo-600 uppercase mb-3 tracking-widest flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5" /> Spending Sources
                  </p>
                  <form onSubmit={handleAddSource} className="flex gap-2 mb-4">
                    <input name="sourceName" placeholder="Bank/Card Name" className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required />
                    <select name="sourceType" className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none">
                      <option value="Bank">Bank</option>
                      <option value="Card">Card</option>
                      <option value="Cash">Cash</option>
                    </select>
                    <button type="submit" className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-indigo-500 transition-colors">Add</button>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    {sources.map(s => (
                      <button key={s.id} onClick={() => setDefaultSource(s.id)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${s.isDefault ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'}`}>
                        {getSourceIcon(s.type)} {s.name} {s.isDefault && <span className="ml-1 text-[8px] bg-indigo-500/20 px-1 rounded">DEFAULT</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-black text-indigo-600 uppercase mb-3 tracking-widest flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" /> Custom Sub-Categories
                  </p>
                  <form onSubmit={handleAddSubCategory} className="flex gap-2 mb-4">
                    <input name="subName" placeholder="e.g. Gym, Internet" className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required />
                    <select name="parentCategory" className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none">
                      <option value="Essential">Essential</option>
                      <option value="Wants">Wants</option>
                      <option value="Investment">Investment</option>
                    </select>
                    <button type="submit" className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-indigo-500 transition-colors">Create</button>
                  </form>
                  <div className="max-h-48 overflow-y-auto space-y-1 pr-2">
                    {subCategories.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs group">
                        <div className="flex items-center gap-2">
                           <span className="font-bold">{sub.name}</span>
                           <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase ${
                             sub.parentId === 'Essential' ? 'bg-blue-100 text-blue-700' :
                             sub.parentId === 'Wants' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                           }`}>{sub.parentId}</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteSubCategory(sub.id)}
                          className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className="lg:col-span-4 space-y-6">
          <Card className="p-5 border-t-4 border-t-indigo-500 shadow-lg">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Coins className="w-4 h-4" /> Financial Setup
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Monthly Income (INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                  <input type="number" value={income || ''} onChange={(e) => setIncome(Number(e.target.value))} placeholder="0.00" className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-lg" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Savings/Debt (Deducted First)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                  <input type="number" value={savings || ''} onChange={(e) => setSavings(Number(e.target.value))} placeholder="0.00" className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-lg" />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">Available for Allocation: <span className="text-indigo-600 font-bold">{formatINR(netIncome)}</span></p>
              </div>
            </div>
          </Card>

          <Card className="p-5 shadow-lg">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Log Expense
            </h2>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <input type="text" name="name" placeholder="Expense description..." required value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" />
              
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm">₹</span>
                  <input type="number" name="amount" placeholder="Amount" required value={formData.amount} onChange={handleInputChange} className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold" />
                </div>
                <input type="date" name="date" required value={formData.date} onChange={handleInputChange} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Source</label>
                  <select name="sourceId" value={formData.sourceId} onChange={handleInputChange} className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none">
                    {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Category</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none">
                    <option value="Essential">Essential</option>
                    <option value="Wants">Wants</option>
                    <option value="Investment">Investment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Sub-Category</label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-100 rounded-xl min-h-[40px] border border-slate-200">
                  {subCategories.filter(s => s.parentId === formData.category).map(sub => (
                    <button 
                      key={sub.id} 
                      type="button" 
                      onClick={() => setFormData({...formData, subCategoryId: sub.id})}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border ${
                        formData.subCategoryId === sub.id 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'
                      }`}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white font-black py-3 rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 mt-2">
                <CheckCircle2 className="w-5 h-5" /> Save Record
              </button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 bg-slate-900 text-white overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <TrendingUp className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Disposable Surplus</p>
              <h2 className="text-4xl font-black mb-8 text-indigo-400 tracking-tighter">{formatINR(netIncome)}</h2>
              
              <div className="space-y-6">
                {[
                  { label: 'Essential', target: '50%', color: 'bg-blue-400', spent: summary.totals.Essential, max: targets.Essential },
                  { label: 'Wants', target: '25%', color: 'bg-rose-400', spent: summary.totals.Wants, max: targets.Wants },
                  { label: 'Investment', target: '25%', color: 'bg-emerald-400', spent: summary.totals.Investment, max: targets.Investment },
                ].map((item) => {
                  const percent = item.max > 0 ? (item.spent / item.max) * 100 : 0;
                  const isOver = item.spent > item.max;
                  return (
                    <div key={item.label} className="group">
                      <div className="flex justify-between text-[11px] mb-2 font-black uppercase tracking-wider">
                        <span className="text-slate-400 group-hover:text-white transition-colors">{item.label} ({item.target})</span>
                        <span className={isOver ? "text-rose-400" : "text-slate-200"}>
                          {formatINR(item.spent)} <span className="text-slate-500 font-medium">/ {formatINR(item.max)}</span>
                        </span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={`${isOver ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]' : item.color} h-full rounded-full transition-all duration-1000 ease-out`} 
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card className="p-8 flex flex-col items-center shadow-lg">
            <div className="w-full flex justify-between items-center mb-8">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <PieChart className="w-4 h-4 text-indigo-500" /> Category Distribution
               </h3>
               {summary.totalSpent > 0 && (
                 <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg">
                   TOTAL: {formatINR(summary.totalSpent)}
                 </span>
               )}
            </div>
            <SimplePieChart data={pieData} />
            <div className="grid grid-cols-3 gap-3 mt-10 w-full">
               {pieData.map((item, i) => (
                 <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all group">
                   <div className="w-4 h-1 rounded-full mb-1" style={{ backgroundColor: item.color }}></div>
                   <span className="text-[9px] font-black text-slate-400 uppercase group-hover:text-slate-600">{item.name}</span>
                   <span className="text-xs font-black text-slate-800">{Math.round((item.value / (summary.totalSpent || 1)) * 100)}%</span>
                 </div>
               ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1 text-center">Ledger Details</h3>
          
          <div className="space-y-3 overflow-y-auto max-h-[85vh] pb-6 pr-1 custom-scrollbar">
            {(['Essential', 'Wants', 'Investment'] as Category[]).map((cat) => {
              const catTransactions = transactions.filter(t => t.category === cat);
              const isExpanded = expandedCategory === cat;
              
              return (
                <div key={cat} className="space-y-2">
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === cat ? null : cat)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                      isExpanded 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xl scale-[1.02]' 
                        : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-6 rounded-full ${
                        cat === 'Essential' ? 'bg-blue-400' :
                        cat === 'Wants' ? 'bg-rose-400' : 'bg-emerald-400'
                      }`} />
                      <span className="text-xs font-black uppercase tracking-tight">{cat}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black tracking-tight">{formatINR(summary.totals[cat])}</span>
                      {isExpanded ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-30" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="space-y-2 pl-2 animate-in slide-in-from-top-3 duration-300">
                      {catTransactions.length === 0 ? (
                        <div className="bg-slate-100/50 rounded-2xl p-6 text-center">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No entries found</p>
                        </div>
                      ) : (
                        catTransactions.slice().reverse().map((t) => {
                          const source = sources.find(s => s.id === t.sourceId);
                          const sub = subCategories.find(s => s.id === t.subCategoryId);
                          return (
                            <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 group relative hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0 pr-2">
                                  <p className="text-xs font-black text-slate-800 truncate leading-tight uppercase tracking-tight">{t.name}</p>
                                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                    <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1">
                                      <Tag className="w-2.5 h-2.5" /> {sub?.name || 'Uncategorized'}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400">{t.date}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-black text-slate-900">{formatINR(t.amount)}</p>
                                  <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                                    {source?.name}
                                  </div>
                                </div>
                              </div>
                              <button 
                                onClick={() => setTransactions(transactions.filter(tr => tr.id !== t.id))}
                                className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-rose-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {netIncome > 0 && summary.totalSpent < netIncome && (
             <div className="p-4 bg-emerald-900 text-white rounded-2xl flex gap-3 items-center shadow-lg">
               <div className="bg-emerald-500/20 p-2 rounded-xl">
                 <CheckCircle2 className="w-5 h-5 text-emerald-400" />
               </div>
               <div>
                 <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Surplus</p>
                 <p className="text-sm font-black">{formatINR(netIncome - summary.totalSpent)} <span className="text-[10px] text-emerald-500 uppercase">Left</span></p>
               </div>
             </div>
          )}
        </div>
      </main>
    </div>
  );
}