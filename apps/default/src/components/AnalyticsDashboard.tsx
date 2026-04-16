import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Eye, Package, Users, Zap, Loader2, Calendar } from 'lucide-react';
import { getSellerStats, getOrders } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useLangStore } from '../store/langStore';
import { formatNPR, formatNumber } from '../lib/images';
import { cn } from '../lib/utils';

// Generate realistic 30-day data
function genTimeData(base: number, variance: number, days = 30) {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.now() - (days - i - 1) * 86400000);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { date: label, value: Math.max(0, base + (Math.random() - 0.4) * variance) | 0 };
  });
}

const REVENUE_DATA   = genTimeData(8500, 4000);
const VIEWS_DATA     = genTimeData(35000, 20000);
const ORDERS_DATA    = genTimeData(12, 8);

const TRAFFIC_SOURCES = [
  { name: 'Video Feed',  value: 52, color: '#ef4444' },
  { name: 'Discover',   value: 24, color: '#f97316' },
  { name: 'Direct',     value: 14, color: '#a855f7' },
  { name: 'Referral',   value: 10, color: '#3b82f6' },
];

const PRODUCT_PERF = [
  { name: 'Dhaka Topi',     sales: 48, revenue: 40800  },
  { name: 'Pashmina Shawl', sales: 22, revenue: 77000  },
  { name: 'Momo Masala',    sales: 180, revenue: 68400 },
  { name: 'Dhaka Scarf',    sales: 35, revenue: 42000  },
  { name: 'Thangka Art',    sales: 8,  revenue: 33600  },
];

const RANGE_OPTIONS = ['7D', '14D', '30D', '90D'] as const;
type Range = typeof RANGE_OPTIONS[number];
const RANGE_DAYS: Record<Range, number> = { '7D': 7, '14D': 14, '30D': 30, '90D': 90 };

export default function AnalyticsDashboard() {
  const { user } = useAuthStore();
  const { t } = useLangStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>('30D');
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'views' | 'orders'>('revenue');

  useEffect(() => {
    getSellerStats().then(s => {
      setStats(s.find((x: any) => x.fieldValues['/attributes/@sseller'] === user?.username) ?? s[0]);
      setLoading(false);
    });
  }, [user]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-zinc-950">
      <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
    </div>
  );

  const sf = stats?.fieldValues ?? {};
  const revenue   = sf['/attributes/@srevenue']  || 284500;
  const orders    = sf['/attributes/@sorders']   || 127;
  const views     = sf['/attributes/@sviews']    || 1240000;
  const followers = sf['/attributes/@sfollowers'] || 22100;

  const days = RANGE_DAYS[range];
  const chartData = (activeMetric === 'revenue' ? REVENUE_DATA : activeMetric === 'views' ? VIEWS_DATA : ORDERS_DATA).slice(-days);
  const chartColor = activeMetric === 'revenue' ? '#22c55e' : activeMetric === 'views' ? '#a855f7' : '#3b82f6';
  const chartLabel = activeMetric === 'revenue' ? 'Revenue (NPR)' : activeMetric === 'views' ? 'Views' : 'Orders';

  const KPI_CARDS = [
    { label: t('revenue'),  value: formatNPR(revenue), icon: <DollarSign className="w-5 h-5" />, color: 'text-green-400', bg: 'bg-green-500/10', trend: '+18%', up: true  },
    { label: t('orders'),   value: String(orders),     icon: <Package className="w-5 h-5" />,    color: 'text-blue-400',  bg: 'bg-blue-500/10',  trend: '+12%', up: true  },
    { label: t('views'),    value: formatNumber(views), icon: <Eye className="w-5 h-5" />,       color: 'text-purple-400', bg: 'bg-purple-500/10', trend: '+34%', up: true },
    { label: 'Followers',   value: formatNumber(followers), icon: <Users className="w-5 h-5" />, color: 'text-red-400',  bg: 'bg-red-500/10',   trend: '+8%',  up: true  },
  ];

  return (
    <div className="flex-1 bg-zinc-950 overflow-y-auto scrollbar-none">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-950/95 backdrop-blur-md px-4 pt-4 pb-3 border-b border-zinc-900 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-xl flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-400" /> {t('analytics')}
            </h1>
            <p className="text-zinc-500 text-xs mt-0.5">@{user?.username} · Real-time data</p>
          </div>
          <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 border border-zinc-800">
            {RANGE_OPTIONS.map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-bold transition-all',
                  range === r ? 'bg-red-500 text-white' : 'text-zinc-500 hover:text-white'
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-5 pb-8">
        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-3">
          {KPI_CARDS.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={cn('rounded-2xl p-4 border border-zinc-800', kpi.bg)}
            >
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mb-3', kpi.bg.replace('bg-', 'bg-').replace('/10', '/20'))}>
                <span className={kpi.color}>{kpi.icon}</span>
              </div>
              <p className="text-white font-black text-lg leading-none">{kpi.value}</p>
              <p className="text-zinc-500 text-xs mt-1">{kpi.label}</p>
              <div className="flex items-center gap-1 mt-2">
                {kpi.up ? <TrendingUp className="w-3 h-3 text-green-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />}
                <span className={cn('text-xs font-bold', kpi.up ? 'text-green-400' : 'text-red-400')}>{kpi.trend}</span>
                <span className="text-zinc-600 text-xs">vs last period</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white font-bold text-sm">{chartLabel} Over Time</p>
            <div className="flex gap-1">
              {(['revenue', 'views', 'orders'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setActiveMetric(m)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all',
                    activeMetric === m ? 'bg-zinc-700 text-white' : 'text-zinc-600 hover:text-white'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} interval={Math.floor(days / 6)} />
              <YAxis tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: chartColor }}
              />
              <Area type="monotone" dataKey="value" stroke={chartColor} strokeWidth={2} fill="url(#chartGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Product performance */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-white font-bold text-sm mb-4">Top Products by Sales</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={PRODUCT_PERF} margin={{ top: 0, right: 5, left: -30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#71717a' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, fontSize: 12 }}
                itemStyle={{ color: '#ef4444' }}
              />
              <Bar dataKey="sales" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Traffic sources donut */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-white font-bold text-sm mb-4">Traffic Sources</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={TRAFFIC_SOURCES} cx="50%" cy="50%" innerRadius={42} outerRadius={64} dataKey="value" paddingAngle={3}>
                  {TRAFFIC_SOURCES.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {TRAFFIC_SOURCES.map(s => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                    <span className="text-zinc-400 text-xs">{s.name}</span>
                  </div>
                  <span className="text-white font-bold text-sm">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conversion funnel */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-white font-bold text-sm mb-4">Conversion Funnel</p>
          <div className="space-y-2">
            {[
              { label: 'Video Views',    value: views,              pct: 100 },
              { label: 'Profile Visits', value: Math.floor(views * 0.12), pct: 12  },
              { label: 'Product Views',  value: Math.floor(views * 0.06), pct: 6   },
              { label: 'Add to Cart',    value: Math.floor(views * 0.025), pct: 2.5 },
              { label: 'Orders',         value: orders,             pct: 0.8 },
            ].map((step, i) => (
              <div key={step.label} className="relative">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">{step.label}</span>
                  <span className="text-white font-semibold">{formatNumber(step.value)}</span>
                </div>
                <div className="h-6 bg-zinc-800 rounded-lg overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${step.pct}%` }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                    className="h-full flex items-center justify-end pr-2 rounded-lg"
                    style={{ background: `rgba(239,68,68,${0.3 + (1 - i * 0.15)})` }}
                  >
                    <span className="text-white text-xs font-bold">{step.pct}%</span>
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick insights */}
        <div className="bg-gradient-to-br from-red-900/30 to-zinc-900 border border-red-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-yellow-400" />
            <p className="text-white font-bold text-sm">AI Insights</p>
          </div>
          <div className="space-y-2">
            {[
              '📈 Your Momo Masala video has 3.2x higher conversion than average — create more food content!',
              '🕐 Your audience is most active between 7-9 PM Nepal time. Schedule posts then.',
              '🎯 Customers from Kathmandu convert 40% better. Consider targeted ads there.',
              '💡 Adding product prices in video captions increases click-through by 28%.',
            ].map((insight, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-zinc-300 text-xs leading-relaxed"
              >
                {insight}
              </motion.p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
