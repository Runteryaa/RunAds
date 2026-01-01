'use client';

import { useEffect, useState } from 'react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { getWebsiteAnalytics, AnalyticsData } from '@/app/actions/analytics';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AnalyticsCharts({ websiteId }: { websiteId: string }) {
    const [data, setData] = useState<AnalyticsData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const analytics = await getWebsiteAnalytics(websiteId);
                setData(analytics);
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
            } finally {
                setLoading(false);
            }
        }
        if (websiteId) {
            fetchAnalytics();
        }
    }, [websiteId]);

    if (loading) return <div className="h-64 flex items-center justify-center text-gray-400">Loading analytics...</div>;
    if (data.length === 0) return <div className="h-64 flex items-center justify-center text-gray-400">No data available for the last 30 days.</div>;

    // Aggregate Data for Pie Charts
    const countryData: Record<string, number> = {};
    const deviceData: Record<string, number> = {};

    data.forEach(day => {
        if (day.countries) {
            Object.entries(day.countries).forEach(([country, count]) => {
                countryData[country] = (countryData[country] || 0) + count;
            });
        }
        if (day.devices) {
            Object.entries(day.devices).forEach(([device, count]) => {
                const label = device === 'undefined' ? 'Desktop' : device; // Map undefined to Desktop usually
                deviceData[label] = (deviceData[label] || 0) + count;
            });
        }
    });

    const countryChartData = Object.keys(countryData).map(key => ({ name: key, value: countryData[key] })).sort((a,b) => b.value - a.value).slice(0, 5);
    const deviceChartData = Object.keys(deviceData).map(key => ({ name: key, value: deviceData[key] }));

    return (
        <div className="space-y-8">
            {/* Clicks Over Time */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Clicks (Last 30 Days)</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="date" stroke="#9CA3AF" tickFormatter={(str) => str.slice(5)} />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#fff' }}
                            />
                            <Line type="monotone" dataKey="totalClicks" stroke="#3B82F6" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Countries */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Top Countries</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={countryChartData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                                <XAxis type="number" stroke="#9CA3AF" />
                                <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={100} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#fff' }}
                                />
                                <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Device Type */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Device Breakdown</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={deviceChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {deviceChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#fff' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
