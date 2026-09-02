import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Line,
  ComposedChart
} from 'recharts';
import { MonthlyEarningStat } from '../types';
import { formatCurrency, formatIndianShort } from '../utils/dateUtils';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';

interface EarningsVisualizationProps {
  stats: MonthlyEarningStat[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1 z-50">
        <p className="font-bold text-white mb-1.5 border-b border-slate-800 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-semibold text-white">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const EarningsVisualization: React.FC<EarningsVisualizationProps> = ({ stats }) => {
  const [chartType, setChartType] = useState<'composed' | 'bars'>('composed');

  const totalInterestAllTime = stats.reduce((sum, s) => sum + s.interestCollected, 0);
  const totalPrincipalReturned = stats.reduce((sum, s) => sum + s.principalCollected, 0);

  return (
    <div id="monthly-earnings-chart-container" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/15 text-emerald-400 rounded-lg">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">Monthly Earnings & Cash Flow</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Historical interest collected vs. projected upcoming interest collection
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setChartType('composed')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                chartType === 'composed'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setChartType('bars')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                chartType === 'bars'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Collections
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 sm:h-72 md:h-80 lg:h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'composed' ? (
            <ComposedChart data={stats} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
              <XAxis 
                dataKey="monthLabel" 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#334155' }}
                tickFormatter={(val) => formatIndianShort(val)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={30} 
                wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                formatter={(val) => <span className="text-slate-300 mr-2">{val}</span>}
              />
              <Bar 
                dataKey="interestCollected" 
                name="Interest Collected" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={32}
              />
              <Bar 
                dataKey="principalCollected" 
                name="Principal Returned" 
                fill="#06b6d4" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={32}
              />
              <Line 
                type="monotone" 
                dataKey="projectedInterest" 
                name="Projected Interest" 
                stroke="#818cf8" 
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: 4, fill: '#818cf8', strokeWidth: 1 }}
              />
            </ComposedChart>
          ) : (
            <BarChart data={stats} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
              <XAxis 
                dataKey="monthLabel" 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#334155' }}
                tickFormatter={(val) => formatIndianShort(val)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={30} 
                wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                formatter={(val) => <span className="text-slate-300 mr-2">{val}</span>}
              />
              <Bar 
                dataKey="interestCollected" 
                name="Interest Collected" 
                fill="#10b981" 
                stackId="a" 
                radius={[0, 0, 0, 0]} 
                maxBarSize={36}
              />
              <Bar 
                dataKey="principalCollected" 
                name="Principal Returned" 
                fill="#06b6d4" 
                stackId="a" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={36}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Footer Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
        <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <div>
            <span className="text-slate-400 block text-[10px]">Total Interest Earned</span>
            <span className="font-bold text-emerald-400">{formatCurrency(totalInterestAllTime)}</span>
          </div>
        </div>
        <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
          <div>
            <span className="text-slate-400 block text-[10px]">Principal Recovered</span>
            <span className="font-bold text-cyan-400">{formatCurrency(totalPrincipalReturned)}</span>
          </div>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-slate-800/50 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
          <div>
            <span className="text-slate-400 block text-[10px]">Active Recurrence</span>
            <span className="font-bold text-indigo-300">Continuous Projections</span>
          </div>
        </div>
      </div>
    </div>
  );
};
