import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  Sparkles, 
  Users, 
  ShoppingBag, 
  Flame, 
  Award, 
  Receipt,
  ArrowUpRight
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { transactions, customers, products, profile } = useStore();
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('7d');

  // Product map lookup for fast O(1) cost calculations
  const productCostMap = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach(p => {
      if (p.name) map.set(p.name.toLowerCase().trim(), p.costPrice || 0);
    });
    return map;
  }, [products]);

  // Memoized analytics calculations for optimal performance
  const analyticsData = useMemo(() => {
    const now = Date.now();
    
    // 1. Filter transactions
    const filteredTx = transactions.filter(t => {
      if (!t.createdAt) return false;
      const txTime = new Date(t.createdAt).getTime();
      if (isNaN(txTime)) return false;
      if (timeframe === '7d') return (now - txTime) <= 7 * 86400000;
      if (timeframe === '30d') return (now - txTime) <= 30 * 86400000;
      return true;
    });

    // 2. Metrics
    const totalRevenue = filteredTx.reduce((sum, t) => sum + (t.type === 'sale' ? (Number(t.totalAmount) || 0) : 0), 0);
    const totalCreditIssued = filteredTx.reduce((sum, t) => sum + (Number(t.creditAmount) || 0), 0);
    const totalCollected = filteredTx.reduce((sum, t) => sum + (t.type === 'payment_received' ? (Number(t.paidAmount) || 0) : 0), 0);
    const salesCount = filteredTx.filter(t => t.type === 'sale').length;
    const avgOrderValue = salesCount > 0 ? (totalRevenue / salesCount).toFixed(2) : '0.00';

    const defaultMargin = (profile.defaultProfitMargin || 28) / 100;
    
    // 3. Net Profit Calculation
    const estimatedProfit = filteredTx.reduce((sum, t) => {
      if (t.type !== 'sale') return sum;
      if (t.items && t.items.length > 0) {
        let totalCost = 0;
        t.items.forEach(item => {
          const costPrice = productCostMap.get(item.name.toLowerCase().trim());
          if (costPrice !== undefined && costPrice > 0) {
            totalCost += costPrice * (item.quantity || 1);
          } else {
            const itemTotal = Number(item.totalPrice) || ((item.quantity || 1) * (item.unitPrice || 0));
            totalCost += itemTotal * (1 - defaultMargin);
          }
        });
        return sum + (t.totalAmount - totalCost);
      }
      return sum + (t.totalAmount * defaultMargin);
    }, 0);

    // 4. Customer Retention & Credit Recovery
    const totalCustCount = customers.length;
    const repeatCustCount = customers.filter(c => (c.visitCount || 0) > 1).length;
    const repeatRate = totalCustCount > 0 ? Math.round((repeatCustCount / totalCustCount) * 100) : 0;

    const totalCreditEver = transactions.reduce((sum, t) => sum + (Number(t.creditAmount) || 0), 0);
    const totalCollectedEver = transactions.reduce((sum, t) => sum + (t.type === 'payment_received' ? (Number(t.paidAmount) || 0) : 0), 0);
    const recoveryRate = totalCreditEver > 0 ? Math.min(100, Math.round((totalCollectedEver / totalCreditEver) * 100)) : 100;

    // 5. Daily Trend Data
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const chartData = days.map(day => {
      const dayTxs = filteredTx.filter(t => {
        const d = new Date(t.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
        return d === day;
      });

      const daySales = dayTxs.reduce((sum, t) => sum + (t.type === 'sale' ? (Number(t.totalAmount) || 0) : 0), 0);
      const dayProfit = Math.round(daySales * defaultMargin);
      const dayCredit = dayTxs.reduce((sum, t) => sum + (Number(t.creditAmount) || 0), 0);

      return {
        day,
        Sales: daySales,
        Profit: dayProfit,
        Credit: dayCredit
      };
    });

    // 6. Cash vs Credit Ratio
    const cashSales = Math.max(0, totalRevenue - totalCreditIssued);
    const pieData = [
      { name: 'Cash Sales', value: Math.round(cashSales), color: '#10B981' },
      { name: 'Khata Credit', value: Math.round(totalCreditIssued), color: '#F97316' }
    ];

    // 7. Top Customers
    const sortedCustomers = [...customers].sort((a, b) => (b.totalPurchases || 0) - (a.totalPurchases || 0)).slice(0, 4);

    return {
      totalRevenue,
      totalCreditIssued,
      totalCollected,
      salesCount,
      avgOrderValue,
      estimatedProfit,
      repeatRate,
      recoveryRate,
      chartData,
      pieData,
      sortedCustomers
    };
  }, [transactions, customers, timeframe, profile.defaultProfitMargin, productCostMap]);

  const {
    totalRevenue,
    avgOrderValue,
    estimatedProfit,
    repeatRate,
    recoveryRate,
    chartData,
    pieData,
    sortedCustomers
  } = analyticsData;

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Business Analytics & Growth
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time sales, net profit, credit distribution & store peak hours
          </p>
        </div>

        {/* Timeframe Toggle */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto shadow-sm">
          {(['7d', '30d', 'all'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeframe === tf
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tf === '7d' ? 'Last 7 Days' : tf === '30d' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* AI Performance Card */}
      <div className="p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl shadow-xl border border-blue-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            AI Store Health Summary
          </span>
          <h2 className="text-xl font-extrabold mt-1">
            Period Revenue: {profile.currency}{totalRevenue.toFixed(2)}
          </h2>
          <p className="text-xs text-blue-200 mt-1">
            Average order size: {profile.currency}{avgOrderValue} • Est. Net Profit: {profile.currency}{estimatedProfit.toFixed(2)} ({profile.defaultProfitMargin || 28}% margin)
          </p>
        </div>

        <div className="flex gap-4 border-t sm:border-t-0 sm:border-l border-blue-800/80 pt-3 sm:pt-0 sm:pl-4">
          <div>
            <span className="text-[10px] text-blue-300 uppercase font-semibold block">Repeat Buyers</span>
            <span className="text-lg font-extrabold text-emerald-400">{repeatRate}%</span>
          </div>
          <div>
            <span className="text-[10px] text-blue-300 uppercase font-semibold block">Credit Recovery</span>
            <span className="text-lg font-extrabold text-blue-400">{recoveryRate}%</span>
          </div>
        </div>
      </div>

      {/* Main Trend Chart */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Revenue & Profit Trends
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daily revenue compared against estimated net profit
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400" /> Sales
            </span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Profit
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0F172A', 
                  borderRadius: '16px', 
                  border: 'none', 
                  color: '#FFF',
                  fontSize: '12px'
                }} 
              />
              <Area type="monotone" dataKey="Sales" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
              <Area type="monotone" dataKey="Profit" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#profitGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cash vs Credit Ratio & Top Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cash vs Credit Ratio */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Cash Sales vs Khata Credit Ratio
          </h3>

          <div className="h-44 flex items-center justify-center">
            {totalRevenue > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                No transaction data available yet.
              </div>
            )}
          </div>

          <div className="flex items-center justify-around text-xs font-semibold pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Cash: {profile.currency}{pieData[0].value}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Credit: {profile.currency}{pieData[1].value}</span>
            </div>
          </div>
        </div>

        {/* Top Customer Buyers */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Top Customers by Volume
          </h3>

          {sortedCustomers.length > 0 ? (
            <div className="space-y-2">
              {sortedCustomers.map((c, i) => (
                <div key={c.id} className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 font-extrabold text-[10px] flex items-center justify-center">
                      #{i + 1}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{c.name}</span>
                  </div>

                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {profile.currency}{c.totalPurchases}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-xs text-center py-8">No customer records found.</p>
          )}
        </div>
      </div>
    </div>
  );
};
