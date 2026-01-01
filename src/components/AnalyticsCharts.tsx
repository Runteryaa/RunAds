"use client";

import { useEffect, useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from "recharts";
import { Loader2 } from "lucide-react";
import { getWebsiteStats } from "@/app/actions/analytics";

interface AnalyticsData {
  views: number;
  clicks: number;
  ctr: number;
  dailyStats: { date: string; views: number; clicks: number }[];
  deviceStats: { name: string; value: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-white/10 p-3 rounded-lg shadow-xl">
        <p className="text-slate-300 font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-400 capitalize">{entry.name}:</span>
            <span className="text-white font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function AnalyticsCharts({ websiteId }: { websiteId: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
        try {
            const stats = await getWebsiteStats(websiteId);
            setData(stats);
        } catch (error) {
            console.error("Failed to load analytics:", error);
        } finally {
            setLoading(false);
        }
    }
    
    if (websiteId) {
        fetchData();
    }
  }, [websiteId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-900/50 rounded-xl border border-white/5">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!data) return null;

  const COLORS = ["#6366f1", "#06b6d4", "#8b5cf6"];

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Main Performance Chart */}
        <div className="bg-slate-900/50 border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Traffic Overview (Last 7 Days)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                />
                <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff20' }} />
                <Area 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorViews)" 
                />
                <Area 
                    type="monotone" 
                    dataKey="clicks" 
                    stroke="#06b6d4" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorClicks)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Distribution */}
        <div className="bg-slate-900/50 border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Device Distribution</h3>
          <div className="flex flex-col md:flex-row items-center justify-center h-[300px]">
            <div className="h-full w-full md:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={data.deviceStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    >
                    {data.deviceStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                    ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
                </ResponsiveContainer>
            </div>
            
            <div className="w-full md:w-1/2 flex flex-col justify-center gap-4 px-4">
                {data.deviceStats.map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="text-slate-300">{entry.name}</span>
                        </div>
                        <span className="text-white font-bold">{entry.value}%</span>
                    </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
