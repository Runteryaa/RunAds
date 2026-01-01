'use server'

import { getAdminDb } from "@/lib/firebase-admin";

interface AnalyticsData {
  views: number;
  clicks: number;
  ctr: number;
  dailyStats: { date: string; views: number; clicks: number }[];
  deviceStats: { name: string; value: number }[];
}

export async function getWebsiteStats(websiteId: string): Promise<AnalyticsData> {
    const db = getAdminDb();
    const today = new Date();
    const last7Days: string[] = [];
    
    // Generate dates for the last 7 days in YYYY-MM-DD format
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        last7Days.push(d.toISOString().split('T')[0]);
    }

    // Initialize stats container with 0s
    const statsMap: Record<string, { views: number, clicks: number }> = {};
    const deviceMap = { desktop: 0, mobile: 0, tablet: 0 };

    last7Days.forEach(date => {
        statsMap[date] = { views: 0, clicks: 0 };
    });

    try {
        const sevenDaysAgo = last7Days[0];
        
        // Query the daily_stats subcollection
        // This collection is populated by ad-serve (views) and click (clicks) endpoints
        const dailyStatsSnapshot = await db.collection("websites").doc(websiteId).collection("daily_stats")
            .where("date", ">=", sevenDaysAgo)
            .get();
            
        dailyStatsSnapshot.forEach(doc => {
            const data = doc.data(); 
            // data matches { date: "YYYY-MM-DD", views: number, clicks: number, viewsDesktop: number, viewsMobile: number, viewsTablet: number }
            if (statsMap[data.date]) {
                statsMap[data.date].views = data.views || 0;
                statsMap[data.date].clicks = data.clicks || 0;
            }
            
            // Aggregate device stats (accumulate over the period)
            deviceMap.desktop += (data.viewsDesktop || 0);
            deviceMap.mobile += (data.viewsMobile || 0);
            deviceMap.tablet += (data.viewsTablet || 0);
        });

        // Transform to Array for Recharts
        const dailyStats = last7Days.map(date => ({
            date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            views: statsMap[date].views,
            clicks: statsMap[date].clicks
        }));

        const totalViews = dailyStats.reduce((a, b) => a + b.views, 0);
        const totalClicks = dailyStats.reduce((a, b) => a + b.clicks, 0);
        const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

        // Calculate Device Percentages
        const totalDeviceViews = deviceMap.desktop + deviceMap.mobile + deviceMap.tablet;
        
        // Handle edge case where total is 0 to avoid NaN in charts
        const deviceStats = totalDeviceViews > 0 ? [
            { name: "Desktop", value: Math.round((deviceMap.desktop / totalDeviceViews) * 100) },
            { name: "Mobile", value: Math.round((deviceMap.mobile / totalDeviceViews) * 100) },
            { name: "Tablet", value: Math.round((deviceMap.tablet / totalDeviceViews) * 100) },
        ] : [
             { name: "Desktop", value: 100 }, // Default fallback if no data
             { name: "Mobile", value: 0 },
             { name: "Tablet", value: 0 },
        ];

        return {
            views: totalViews,
            clicks: totalClicks,
            ctr,
            dailyStats,
            deviceStats
        };

    } catch (error) {
        console.error("Error fetching stats:", error);
        // Return empty structure on error
        return {
             views: 0,
             clicks: 0,
             ctr: 0,
             dailyStats: last7Days.map(date => ({
                date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                views: 0,
                clicks: 0
             })),
             deviceStats: []
        };
    }
}
