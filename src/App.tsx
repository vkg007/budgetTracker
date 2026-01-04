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
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  CreditCard,
  Banknote,
  Building2,
  Settings2,
  Layers,
  X,
  FileText,
  ArrowRight,
  Pencil,
  Save,
  RefreshCw,
  Tag,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Undo2,
  Lightbulb
} from 'lucide-react';

// --- Types ---
type Category = 'Essential' | 'Wants' | 'Investment' | 'Income';

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
  type: 'debit' | 'credit';
  category: Category;
  subCategoryId: string;
  sourceId: string;
}

interface PendingTransaction {
  id: string;
  date: string;
  originalDescription: string;
  name: string;
  amount: number;
  type: 'debit' | 'credit';
  category: Category;
  subCategoryId: string;
  sourceId: string;
  isSelected: boolean;
}

// --- Components ---

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const Card = ({ children, className = "", style }: CardProps) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`} style={style}>
    {children}
  </div>
);

interface PieData {
  name: string;
  value: number;
  color: string;
  key: string; // unique identifier for click handling
}

const SimplePieChart = ({ 
  data, 
  onSliceClick,
  formatValue
}: { 
  data: PieData[], 
  onSliceClick?: (key: string) => void,
  formatValue: (val: number) => string
}) => {
  const [hoveredSlice, setHoveredSlice] = useState<PieData | null>(null);
  const total = data.reduce((acc, item) => acc + item.value, 0);
  
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

  let cumulativePercent = 0;

  return (
    <div className="relative h-48 w-48 group">
      <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full cursor-pointer">
        {data.map((slice, index) => {
          if (slice.value === 0) return null;
          
          // Handle single slice case (100%)
          if (slice.value === total) {
             return (
               <circle 
                 key={slice.key} 
                 cx="0" 
                 cy="0" 
                 r="1" 
                 fill={slice.color} 
                 onClick={() => onSliceClick && onSliceClick(slice.key)}
                 onMouseEnter={() => setHoveredSlice(slice)}
                 onMouseLeave={() => setHoveredSlice(null)}
                 className="hover:opacity-90 transition-opacity"
               />
             );
          }

          const startPercent = cumulativePercent;
          const endPercent = cumulativePercent + (slice.value / total);
          cumulativePercent = endPercent;

          const [startX, startY] = getCoordinatesForPercent(startPercent);
          const [endX, endY] = getCoordinatesForPercent(endPercent);
          const largeArcFlag = slice.value / total > 0.5 ? 1 : 0;

          const pathData = [
            `M 0 0`,
            `L ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `Z`
          ].join(' ');

          return (
            <path 
              key={slice.key} 
              d={pathData} 
              fill={slice.color} 
              stroke="white" 
              strokeWidth="0.02" 
              onClick={() => onSliceClick && onSliceClick(slice.key)}
              onMouseEnter={() => setHoveredSlice(slice)}
              onMouseLeave={() => setHoveredSlice(null)}
              className="hover:opacity-80 transition-opacity"
            />
          );
        })}
      </svg>
      
      {/* Center Tooltip/Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {hoveredSlice ? (
          <div className="bg-slate-900/90 text-white px-3 py-1.5 rounded-lg text-center backdrop-blur-sm shadow-xl z-10 animate-in fade-in zoom-in-95 duration-150">
            <p className="text-[10px] font-medium text-slate-300 uppercase tracking-wider">{hoveredSlice.name}</p>
            <p className="text-sm font-bold">{formatValue(hoveredSlice.value)}</p>
            <p className="text-[9px] text-slate-400">({Math.round((hoveredSlice.value / total) * 100)}%)</p>
          </div>
        ) : (
          // Optional: Show total when nothing hovered, or leave empty to see donut hole
          <div className="w-2 h-2 rounded-full bg-slate-200" />
        )}
      </div>
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
    { id: 'src-axis', name: 'Axis', type: 'Bank', isDefault: false }
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
    { id: 'sub-9', name: 'OTT', parentId: 'Essential' },
    { id: 'sub-10', name: 'Credit Card Bill', parentId: 'Essential' },
    { id: 'sub-11', name: 'Car EMI', parentId: 'Essential' },
    { id: 'sub-12', name: 'Gold ETF', parentId: 'Investment' },
    { id: 'sub-13', name: 'Credit Card EMI', parentId: 'Wants' },
    { id: 'sub-inc-1', name: 'Salary', parentId: 'Income' },
    { id: 'sub-inc-2', name: 'Refund', parentId: 'Income' },
    { id: 'sub-inc-3', name: 'Interest', parentId: 'Income' },
    { id: '134f7977', name: 'shopping', parentId: 'Wants' },
    { id: 'd48e1753', name: 'movie', parentId: 'Wants' },
    { id: 'ecee0eb3', name: 'cab', parentId: 'Wants' },
    { id: '66df4e0a', name: 'bhaiya car emi', parentId: 'Income' }, // Assuming income adjustment or reimbursement
    { id: '0e3c4bd6', name: 'saving', parentId: 'Investment' },
    { id: 'dd336905', name: 'miscellenous', parentId: 'Wants' },
    { id: '4c9cf381', name: 'family', parentId: 'Essential' },
    { id: '0f3d1fad', name: 'bike', parentId: 'Essential' },
    { id: 'e725664d', name: 'house', parentId: 'Essential' },
    { id: '6bbaa599', name: 'mobile', parentId: 'Essential' },
    { id: '9d9fb193', name: 'travel', parentId: 'Wants' },
    { id: '537129a3', name: 'saloon', parentId: 'Essential' },
    { id: 'd48e8ca8', name: 'cash', parentId: 'Investment' }
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [expandedCategory, setExpandedCategory] = useState<Category | null>('Essential');
  const [showSettings, setShowSettings] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Chart & Import State
  const [chartView, setChartView] = useState<'All' | Category>('All');
  const [importText, setImportText] = useState('');
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [importStep, setImportStep] = useState<1 | 2>(1);
  const [newSubCatName, setNewSubCatName] = useState('');
  const [addingSubCatForId, setAddingSubCatForId] = useState<string | null>(null);
  
  const defaultSourceId = useMemo(() => sources.find(s => s.isDefault)?.id || sources[0].id, [sources]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '',
    amount: '',
    type: 'debit' as 'debit' | 'credit',
    category: 'Essential' as Category,
    subCategoryId: '',
    sourceId: defaultSourceId
  });

  useEffect(() => {
    if (!editingId) {
      const validSub = subCategories.find(s => s.parentId === formData.category);
      setFormData(prev => ({ ...prev, subCategoryId: validSub?.id || '' }));
    }
  }, [formData.category, subCategories, editingId]);

  useEffect(() => {
    if (!editingId) {
      setFormData(prev => ({ ...prev, sourceId: defaultSourceId }));
    }
  }, [defaultSourceId, editingId]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Calculations ---
  const totalIncome = transactions
    .filter(t => t.type === 'credit')
    .reduce((acc, t) => acc + t.amount, 0) + (income || 0);

  const netIncome = Math.max(0, totalIncome - savings);

  const summary = useMemo(() => {
    const totals = { Essential: 0, Wants: 0, Investment: 0, Income: 0 };
    transactions.forEach(t => { 
      if (t.type === 'debit' && t.category !== 'Income') {
        totals[t.category as keyof typeof totals] += t.amount; 
      }
    });
    const totalSpent = totals.Essential + totals.Wants + totals.Investment;
    return { totals, totalSpent };
  }, [transactions]);

  const targets = {
    Essential: netIncome * 0.5,
    Wants: netIncome * 0.25,
    Investment: netIncome * 0.25
  };

  // --- Insights Calculation ---
  const insights = useMemo(() => {
    // 1. Highest Spending Sub-Category
    const subCatTotals: Record<string, number> = {};
    transactions.filter(t => t.type === 'debit').forEach(t => {
      subCatTotals[t.subCategoryId] = (subCatTotals[t.subCategoryId] || 0) + t.amount;
    });
    
    let highestSubId = '';
    let highestSubAmount = 0;
    Object.entries(subCatTotals).forEach(([id, amount]) => {
      if (amount > highestSubAmount) {
        highestSubAmount = amount;
        highestSubId = id;
      }
    });
    const highestSubName = subCategories.find(s => s.id === highestSubId)?.name || 'None';

    // 2. Overspending Checks
    const alerts: string[] = [];
    if (summary.totals.Essential > targets.Essential && targets.Essential > 0) {
      const diff = summary.totals.Essential - targets.Essential;
      const pct = Math.round((diff / targets.Essential) * 100);
      alerts.push(`Essential spending is ${pct}% over target.`);
    }
    if (summary.totals.Wants > targets.Wants && targets.Wants > 0) {
      const diff = summary.totals.Wants - targets.Wants;
      const pct = Math.round((diff / targets.Wants) * 100);
      alerts.push(`'Wants' budget exceeded by ${pct}%.`);
    }

    // 3. Savings Rate (Investment / Total Income)
    const investmentRate = totalIncome > 0 ? Math.round((summary.totals.Investment / totalIncome) * 100) : 0;

    return { highestSubName, highestSubAmount, alerts, investmentRate };
  }, [transactions, subCategories, summary, targets, totalIncome]);


  // --- Dynamic Chart Data ---
  const chartData = useMemo(() => {
    if (chartView === 'All') {
      return [
        { name: 'Essential', value: summary.totals.Essential, color: '#3b82f6', key: 'Essential' },
        { name: 'Wants', value: summary.totals.Wants, color: '#f43f5e', key: 'Wants' },
        { name: 'Investment', value: summary.totals.Investment, color: '#10b981', key: 'Investment' }
      ].filter(d => d.value > 0);
    } else {
      // Sub-category drilldown
      const relevantTxns = transactions.filter(t => t.category === chartView && t.type === 'debit');
      const groups: Record<string, number> = {};
      relevantTxns.forEach(t => {
        const subName = subCategories.find(s => s.id === t.subCategoryId)?.name || 'Uncategorized';
        groups[subName] = (groups[subName] || 0) + t.amount;
      });

      const palette = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];
      return Object.entries(groups).map(([name, value], index) => ({
        name,
        value,
        color: palette[index % palette.length],
        key: name
      })).sort((a, b) => b.value - a.value);
    }
  }, [summary, transactions, chartView, subCategories]);

  // --- Helper: Format INR ---
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(amount);
  };

  // --- Handlers ---
  const handleChartClick = (key: string) => {
    if (chartView === 'All') {
      if (key === 'Essential' || key === 'Wants' || key === 'Investment') {
        setChartView(key as Category);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount || !formData.subCategoryId) return;

    const newTxnData = {
      date: formData.date,
      name: formData.name,
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      subCategoryId: formData.subCategoryId,
      sourceId: formData.sourceId
    };

    if (editingId) {
      setTransactions(transactions.map(t => t.id === editingId ? { ...t, ...newTxnData } : t));
      setEditingId(null);
    } else {
      setTransactions([...transactions, { id: crypto.randomUUID(), ...newTxnData }]);
    }
    
    setFormData({ 
      date: new Date().toISOString().split('T')[0],
      name: '', 
      amount: '', 
      type: 'debit',
      category: 'Essential',
      subCategoryId: subCategories.find(s => s.parentId === 'Essential')?.id || '',
      sourceId: defaultSourceId
    });
  };

  const handleEditTransaction = (t: Transaction) => {
    setEditingId(t.id);
    setFormData({
      date: t.date,
      name: t.name,
      amount: t.amount.toString(),
      type: t.type,
      category: t.category,
      subCategoryId: t.subCategoryId,
      sourceId: t.sourceId
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const setDefaultSource = (id: string) => {
    setSources(sources.map(s => ({ ...s, isDefault: s.id === id })));
  };

  const handleDeleteSubCategory = (id: string) => {
    setSubCategories(subCategories.filter(s => s.id !== id));
  };

  const handleResetData = () => {
    if (window.confirm("Are you sure you want to delete ALL transactions? This cannot be undone. Categories and sources will be kept.")) {
      setTransactions([]);
      if (editingId) {
        setEditingId(null);
        setFormData({ 
          date: new Date().toISOString().split('T')[0],
          name: '', 
          amount: '', 
          type: 'debit',
          category: 'Essential',
          subCategoryId: subCategories.find(s => s.parentId === 'Essential')?.id || '',
          sourceId: defaultSourceId
        });
      }
    }
  };

  // --- Smart Import Parser (Axis Fixed) ---
  const parseStatementText = () => {
    if (!importText) return;

    const dateRegex = /(\d{2}[-/]\d{2}[-/]\d{4})/;
    const decimalMoneyRegex = /[\d,]+\.\d{2}/g;
    
    const transactionsFound: PendingTransaction[] = [];
    const text = importText;
    let match;
    const indices: number[] = [];
    
    const globalDateRegex = /(\d{2}[-/]\d{2}[-/]\d{4})/g;
    while ((match = globalDateRegex.exec(text)) !== null) {
      indices.push(match.index);
    }
    
    if (indices.length === 0) {
      alert("No dates found. Please ensure you pasted the statement text including dates like 28-11-2025.");
      return;
    }

    for (let i = 0; i < indices.length; i++) {
      const start = indices[i];
      let nextIndex = text.length;
      for (let j = i + 1; j < indices.length; j++) {
          const checkBlock = text.substring(start, indices[j]);
          if (checkBlock.trim().length > 15) {
              nextIndex = indices[j];
              break;
          }
      }
      
      const block = text.substring(start, nextIndex).trim();
      if (block.length < 5) continue;

      const dateMatch = block.match(dateRegex);
      if (!dateMatch) continue;

      const [d, m, y] = dateMatch[0].replace(/\//g, '-').split('-');
      const isoDate = `${y}-${m}-${d}`;

      const allNumbers = block.match(decimalMoneyRegex);
      
      if (allNumbers && allNumbers.length >= 1) {
        const parsedNumbers = allNumbers.map(n => parseFloat(n.replace(/,/g, '')));
        
        let amount = 0;
        let type: 'debit' | 'credit' = 'debit';
        
        if (parsedNumbers.length >= 2) {
           amount = parsedNumbers[parsedNumbers.length - 2];
           if (block.toUpperCase().includes("SALARY") || block.toUpperCase().includes("CREDIT") || block.toUpperCase().includes("REFUND")) {
             type = 'credit';
           }
        } else {
           amount = parsedNumbers[0];
        }

        let rawDesc = block.replace(new RegExp(dateRegex, 'g'), '');
        allNumbers.forEach(numStr => {
          rawDesc = rawDesc.replace(numStr, '');
        });
        
        let cleanDesc = rawDesc
          .replace(/UPI\/P2M\/\d+\//g, '')
          .replace(/UPI\/P2A\/\d+\//g, '')
          .replace(/NEFT\/[A-Z0-9]+\//g, '')
          .replace(/\/Paymen\/.*/gi, '')
          .replace(/YES BANK LIMITED YBS/gi, '')
          .replace(/HDFC BANK LTD/gi, '')
          .replace(/AXIS BANK/gi, '')
          .replace(/[^\w\s]/g, ' ') 
          .replace(/\s+/g, ' ')
          .trim();

        if (cleanDesc.length < 3) cleanDesc = "Imported Transaction";

        // Logic for Auto Categorization of Small Debits
        let autoCategory: Category = 'Essential';
        let autoSubCatId = '';

        if (type === 'debit') {
          if (amount < 100) {
            autoCategory = 'Wants';
            autoSubCatId = subCategories.find(s => s.name === 'miscellenous' && s.parentId === 'Wants')?.id || '';
          }
          if (!autoSubCatId) {
             // Default fallback
             autoCategory = 'Essential';
             autoSubCatId = subCategories.find(s => s.parentId === 'Essential')?.id || '';
          }
        } else {
          autoCategory = 'Income';
          autoSubCatId = subCategories.find(s => s.parentId === 'Income')?.id || '';
        }

        transactionsFound.push({
          id: crypto.randomUUID(),
          date: isoDate,
          originalDescription: block.substring(0, 100).replace(/\n/g, ' ') + "...",
          name: cleanDesc.substring(0, 30),
          amount: amount,
          type: type,
          category: autoCategory,
          subCategoryId: autoSubCatId,
          sourceId: defaultSourceId,
          isSelected: true
        });
      }
    }

    setPendingTransactions(transactionsFound);
    setImportStep(2);
  };

  const confirmImport = () => {
    const toAdd = pendingTransactions
      .filter(t => t.isSelected)
      .map(t => ({
        id: crypto.randomUUID(),
        date: t.date,
        name: t.name,
        amount: t.amount,
        type: t.type,
        category: t.category,
        subCategoryId: t.subCategoryId,
        sourceId: t.sourceId
      }));
    
    setTransactions([...transactions, ...toAdd]);
    setPendingTransactions([]);
    setImportText('');
    setImportStep(1);
    setShowImport(false);
  };

  const updatePending = (id: string, field: keyof PendingTransaction, value: any) => {
    setPendingTransactions(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  // --- Inline Add SubCategory ---
  const handleInlineAddSubCat = (parentId: Category) => {
    if (!newSubCatName.trim()) return;
    const newSub: SubCategory = {
      id: crypto.randomUUID(),
      name: newSubCatName,
      parentId
    };
    setSubCategories([...subCategories, newSub]);
    if (addingSubCatForId) {
      updatePending(addingSubCatForId, 'subCategoryId', newSub.id);
    }
    setNewSubCatName('');
    setAddingSubCatForId(null);
  };

  const handleExport = () => {
    const dataToExport = { income, savings, sources, subCategories, transactions };
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
        if (Array.isArray(parsed.sources)) setSources(parsed.sources);
        if (Array.isArray(parsed.subCategories)) setSubCategories(parsed.subCategories);
      } catch (err) {
        console.error("Import failed:", err);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; 
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
              onClick={() => setShowImport(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <FileText className="w-4 h-4" /> Import Statement
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`flex-none p-2 rounded-lg transition-colors border ${showSettings ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-800 border-slate-600'}`}
              title="Settings & Custom Categories"
            >
              <Settings2 className="w-5 h-5" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Upload className="w-4 h-4" /> Load JSON
            </button>
            <button onClick={handleExport} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Download className="w-4 h-4" /> Save JSON
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        
        {/* --- IMPORT MODAL --- */}
        {showImport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" /> 
                  Import Bank Statement
                </h3>
                <button onClick={() => setShowImport(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {importStep === 1 ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-800">
                      <p className="font-bold mb-1">Instructions:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Open your Bank Statement PDF.</li>
                        <li>Select the table text (Ctrl+A / Cmd+A) and Copy.</li>
                        <li>Paste the text below. We will try to auto-detect the transactions.</li>
                      </ol>
                    </div>
                    <textarea 
                      className="w-full h-64 p-4 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Paste statement text here...
Ex:
28-11-2025  UPI/P2M/AMAZON  479.05
01-12-2025  Rent Payment    19000.00"
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                    ></textarea>
                    <div className="flex justify-end">
                      <button 
                        onClick={parseStatementText}
                        disabled={!importText.trim()}
                        className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-500 disabled:opacity-50 transition-all flex items-center gap-2"
                      >
                        Process Text <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-slate-500 font-medium">Found {pendingTransactions.length} items. Please categorize them.</p>
                      <button 
                        onClick={() => setPendingTransactions([])} 
                        className="text-xs text-rose-500 font-bold hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Clear All
                      </button>
                    </div>
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="max-h-[60vh] overflow-y-auto">
                        <table className="w-full text-sm text-left relative">
                          <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs sticky top-0 z-10 shadow-sm">
                            <tr>
                              <th className="p-3 w-8 text-center bg-slate-100"><input type="checkbox" checked={pendingTransactions.every(t => t.isSelected)} onChange={(e) => setPendingTransactions(prev => prev.map(t => ({...t, isSelected: e.target.checked})))} /></th>
                              <th className="p-3 bg-slate-100">Date</th>
                              <th className="p-3 bg-slate-100">Description</th>
                              <th className="p-3 bg-slate-100">Type</th>
                              <th className="p-3 text-right bg-slate-100">Amount</th>
                              <th className="p-3 bg-slate-100">Category</th>
                              <th className="p-3 bg-slate-100">Sub-Category</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {pendingTransactions.map((t) => (
                              <tr key={t.id} className={`hover:bg-indigo-50 transition-colors ${!t.isSelected ? 'opacity-50 bg-slate-50' : ''}`}>
                                <td className="p-3 text-center">
                                  <input 
                                    type="checkbox" 
                                    checked={t.isSelected} 
                                    onChange={(e) => updatePending(t.id, 'isSelected', e.target.checked)} 
                                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                                  />
                                </td>
                                <td className="p-3 whitespace-nowrap text-xs font-mono text-slate-500">{t.date}</td>
                                <td className="p-3">
                                  <input 
                                    type="text" 
                                    value={t.name} 
                                    onChange={(e) => updatePending(t.id, 'name', e.target.value)}
                                    className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none text-xs font-bold text-slate-700"
                                  />
                                </td>
                                <td className="p-3">
                                  <select 
                                    value={t.type} 
                                    onChange={(e) => {
                                      const newType = e.target.value as 'debit' | 'credit';
                                      updatePending(t.id, 'type', newType);
                                      if (newType === 'credit') {
                                        updatePending(t.id, 'category', 'Income');
                                        const sub = subCategories.find(s => s.parentId === 'Income')?.id || '';
                                        updatePending(t.id, 'subCategoryId', sub);
                                      } else {
                                        updatePending(t.id, 'category', 'Essential');
                                        const sub = subCategories.find(s => s.parentId === 'Essential')?.id || '';
                                        updatePending(t.id, 'subCategoryId', sub);
                                      }
                                    }}
                                    className={`border rounded px-2 py-1 text-xs outline-none font-bold ${t.type === 'credit' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-rose-600 border-rose-200 bg-rose-50'}`}
                                  >
                                    <option value="debit">Expense</option>
                                    <option value="credit">Income</option>
                                  </select>
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-slate-800">{t.amount}</td>
                                <td className="p-3">
                                  <select 
                                    value={t.category} 
                                    onChange={(e) => {
                                      const cat = e.target.value as Category;
                                      const firstSub = subCategories.find(s => s.parentId === cat)?.id || '';
                                      updatePending(t.id, 'category', cat);
                                      updatePending(t.id, 'subCategoryId', firstSub);
                                    }}
                                    className="bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-indigo-500 w-24"
                                  >
                                    {t.type === 'credit' ? (
                                      <option value="Income">Income</option>
                                    ) : (
                                      <>
                                        <option value="Essential">Essential</option>
                                        <option value="Wants">Wants</option>
                                        <option value="Investment">Investment</option>
                                      </>
                                    )}
                                  </select>
                                </td>
                                <td className="p-3">
                                  <div className="flex gap-1 items-center">
                                    <select 
                                      value={t.subCategoryId} 
                                      onChange={(e) => {
                                        if (e.target.value === 'new') {
                                          setAddingSubCatForId(t.id);
                                        } else {
                                          updatePending(t.id, 'subCategoryId', e.target.value);
                                        }
                                      }}
                                      className="bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-indigo-500 w-28"
                                    >
                                      {subCategories.filter(s => s.parentId === t.category).map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                      ))}
                                      <option value="new" className="text-indigo-600 font-bold">+ New</option>
                                    </select>
                                    
                                    {addingSubCatForId === t.id && (
                                      <div className="absolute z-50 bg-white shadow-xl border border-slate-200 p-2 rounded-lg flex gap-1 -mt-10 ml-2">
                                        <input 
                                          autoFocus
                                          placeholder="New Name"
                                          className="border rounded px-2 py-1 text-xs w-24"
                                          value={newSubCatName}
                                          onChange={e => setNewSubCatName(e.target.value)}
                                          onKeyDown={e => {
                                            if(e.key === 'Enter') handleInlineAddSubCat(t.category);
                                            if(e.key === 'Escape') setAddingSubCatForId(null);
                                          }}
                                        />
                                        <button onClick={() => handleInlineAddSubCat(t.category)} className="bg-indigo-600 text-white px-2 rounded text-xs">Add</button>
                                        <button onClick={() => setAddingSubCatForId(null)} className="text-slate-400 hover:text-rose-500"><X className="w-3 h-3"/></button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                {importStep === 2 ? (
                  <>
                    <button onClick={() => setImportStep(1)} className="text-slate-500 font-bold text-sm hover:text-slate-700">← Back</button>
                    <button 
                      onClick={confirmImport}
                      className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-500 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
                    >
                      Import {pendingTransactions.filter(t => t.isSelected).length} Transactions <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div></div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- SETTINGS PANEL --- */}
        {showSettings && (
          <div className="col-span-1 lg:col-span-12">
            <Card className="p-6 bg-slate-100 border-2 border-indigo-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-700 flex items-center gap-2 text-lg">
                  <Settings2 className="w-5 h-5 text-indigo-500" /> Settings & Customization
                </h3>
                <button onClick={() => setShowSettings(false)} className="bg-white px-3 py-1 rounded-md border border-slate-300 shadow-sm text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors">Close</button>
              </div>
              
              {/* Reset Data Section */}
              <div className="mb-8 p-4 bg-white border border-rose-100 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-rose-500" /> Reset Data
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">Clear all <strong>{transactions.length}</strong> transactions but keep my categories and sources.</p>
                </div>
                <button 
                  onClick={handleResetData}
                  className="bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 rounded-lg text-xs font-bold hover:bg-rose-100 hover:border-rose-300 transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-3 h-3" /> Clear All Transactions
                </button>
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
                    <input name="subName" placeholder="e.g. Salary, Rent" className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required />
                    <select name="parentCategory" className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none">
                      <option value="Essential">Essential</option>
                      <option value="Wants">Wants</option>
                      <option value="Investment">Investment</option>
                      <option value="Income">Income</option>
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
                             sub.parentId === 'Wants' ? 'bg-rose-100 text-rose-700' : 
                             sub.parentId === 'Income' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
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

        {/* LEFT COLUMN: Input Panels */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-5 border-t-4 border-t-indigo-500 shadow-lg">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Coins className="w-4 h-4" /> Financial Setup
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Base Monthly Income (INR)</label>
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
              {editingId ? <Pencil className="w-4 h-4 text-indigo-600" /> : <Plus className="w-4 h-4" />} 
              {editingId ? 'Edit Transaction' : 'Log Transaction'}
            </h2>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <input type="text" name="name" placeholder="Description" required value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" />
              
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm">₹</span>
                  <input type="number" name="amount" placeholder="Amount" required value={formData.amount} onChange={handleInputChange} className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold" />
                </div>
                <input type="date" name="date" required value={formData.date} onChange={handleInputChange} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Type</label>
                  <select 
                    name="type" 
                    value={formData.type} 
                    onChange={(e) => {
                      const newType = e.target.value as 'debit' | 'credit';
                      const newCat = newType === 'credit' ? 'Income' : 'Essential';
                      setFormData({ 
                        ...formData, 
                        type: newType, 
                        category: newCat,
                        subCategoryId: subCategories.find(s => s.parentId === newCat)?.id || ''
                      });
                    }} 
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none"
                  >
                    <option value="debit">Expense</option>
                    <option value="credit">Income</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Category</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none">
                    {formData.type === 'credit' ? (
                      <option value="Income">Income</option>
                    ) : (
                      <>
                        <option value="Essential">Essential</option>
                        <option value="Wants">Wants</option>
                        <option value="Investment">Investment</option>
                      </>
                    )}
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

              <div className="flex gap-2 mt-2">
                {editingId && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ 
                        date: new Date().toISOString().split('T')[0],
                        name: '', 
                        amount: '', 
                        type: 'debit',
                        category: 'Essential',
                        subCategoryId: subCategories.find(s => s.parentId === 'Essential')?.id || '',
                        sourceId: defaultSourceId
                      });
                    }}
                    className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all text-xs"
                  >
                    Cancel
                  </button>
                )}
                <button 
                  type="submit" 
                  className={`flex-1 text-white font-black py-3 rounded-xl transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 ${editingId ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-slate-900 hover:bg-slate-800'}`}
                >
                  {editingId ? <Save className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />} 
                  {editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </Card>
        </div>

        {/* MIDDLE COLUMN: Visualization */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 bg-slate-900 text-white overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <TrendingUp className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-1">
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Net Disposable Income</p>
                <div className="bg-emerald-500/20 px-2 py-1 rounded text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  Total Income: {formatINR(totalIncome)}
                </div>
              </div>
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
                 <PieChart className="w-4 h-4 text-indigo-500" /> {chartView === 'All' ? 'Expense Breakdown' : `${chartView} Breakdown`}
               </h3>
               <div className="flex items-center gap-2">
                 {chartView !== 'All' && (
                   <button 
                     onClick={() => setChartView('All')}
                     className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-200 flex items-center gap-1"
                   >
                     <Undo2 className="w-3 h-3" /> Back
                   </button>
                 )}
                 {chartView === 'All' && (
                   <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg">
                     TOTAL: {formatINR(summary.totalSpent)}
                   </span>
                 )}
               </div>
            </div>
            
            <SimplePieChart 
              data={chartData} 
              onSliceClick={handleChartClick} 
              formatValue={formatINR}
            />
            
            {chartView === 'All' && <p className="text-[10px] text-slate-400 mt-4 italic">Click slices for details</p>}

            <div className="grid grid-cols-3 gap-3 mt-6 w-full">
               {chartData.map((item, i) => (
                 <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all group cursor-pointer" onClick={() => handleChartClick(item.key)}>
                   <div className="w-4 h-1 rounded-full mb-1" style={{ backgroundColor: item.color }}></div>
                   <span className="text-[9px] font-black text-slate-400 uppercase group-hover:text-slate-600 text-center leading-tight">{item.name}</span>
                   <span className="text-xs font-black text-slate-800">
                     {summary.totalSpent > 0 || (chartView !== 'All' && chartData.reduce((a,b) => a + b.value, 0) > 0) 
                       ? Math.round((item.value / (chartView === 'All' ? summary.totalSpent : chartData.reduce((a,b) => a + b.value, 0))) * 100) 
                       : 0}%
                   </span>
                 </div>
               ))}
            </div>
          </Card>

          {/* New Insights Section */}
          <Card className="p-5 border-t-4 border-emerald-500 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Financial Insights</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Top Spending Area</p>
                <p className="text-sm font-black text-slate-800">{insights.highestSubName}</p>
                <p className="text-xs font-bold text-rose-500">{formatINR(insights.highestSubAmount)}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Investment Rate</p>
                <p className="text-sm font-black text-emerald-600">{insights.investmentRate}%</p>
                <p className="text-[9px] text-slate-400">of total income invested</p>
              </div>
            </div>
            
            {insights.alerts.length > 0 && (
              <div className="mt-4 space-y-2">
                {insights.alerts.map((alert, i) => (
                  <div key={i} className="bg-rose-50 border border-rose-100 p-2 rounded-lg flex items-center gap-2 text-xs text-rose-700 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {alert}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: Details */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1 text-center">Ledger Details</h3>
          
          <div className="space-y-3 overflow-y-auto max-h-[85vh] pb-6 pr-1 custom-scrollbar">
            {/* Income Section */}
            <div className="space-y-2">
              <button 
                onClick={() => setExpandedCategory(expandedCategory === 'Income' ? null : 'Income')}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                  expandedCategory === 'Income' 
                    ? 'bg-emerald-900 text-white border-emerald-900 shadow-xl scale-[1.02]' 
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 rounded-full bg-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-tight">Income</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black tracking-tight">{formatINR(transactions.filter(t => t.type === 'credit').reduce((a, b) => a + b.amount, 0))}</span>
                  {expandedCategory === 'Income' ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-30" />}
                </div>
              </button>
              
              {expandedCategory === 'Income' && (
                <div className="space-y-2 pl-2 animate-in slide-in-from-top-3 duration-300">
                  {transactions.filter(t => t.type === 'credit').map((t) => (
                    <div key={t.id} className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col gap-3 group relative hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-xs font-black text-slate-800 truncate leading-tight uppercase tracking-tight">{t.name}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                              <ArrowDownLeft className="w-2.5 h-2.5" /> Credit
                            </span>
                            <span className="text-[9px] font-bold text-slate-400">{t.date}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-emerald-600">+{formatINR(t.amount)}</p>
                        </div>
                      </div>
                      <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditTransaction(t)} className="bg-indigo-500 text-white p-1.5 rounded-full shadow-lg hover:bg-indigo-600"><Pencil className="w-3 h-3" /></button>
                        <button onClick={() => setTransactions(transactions.filter(tr => tr.id !== t.id))} className="bg-rose-500 text-white p-1.5 rounded-full shadow-lg hover:bg-rose-600"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expenses */}
            {(['Essential', 'Wants', 'Investment'] as Category[]).map((cat) => {
              const catTransactions = transactions.filter(t => t.category === cat && t.type === 'debit');
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
                              <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleEditTransaction(t)}
                                  className="bg-indigo-500 text-white p-1.5 rounded-full shadow-lg hover:bg-indigo-600"
                                  title="Edit"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button 
                                  onClick={() => setTransactions(transactions.filter(tr => tr.id !== t.id))}
                                  className="bg-rose-500 text-white p-1.5 rounded-full shadow-lg hover:bg-rose-600"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
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