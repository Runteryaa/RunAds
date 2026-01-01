'use server'

import { getAdminDb, getAdminAuth } from "@/lib/firebase-admin";

export interface AnalyticsData {
    date: string;
    countries: Record<string, number>;
    devices: Record<string, number>;
    browsers: Record<string, number>;
    os: Record<string, number>;
    totalClicks: number;
}

export async function getWebsiteAnalytics(websiteId: string, days: number = 30): Promise<AnalyticsData[]> {
    const db = getAdminDb();
    
    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateString = startDate.toISOString().split('T')[0];

    const analyticsRef = db.collection("websites").doc(websiteId).collection("analytics");
    const snapshot = await analyticsRef.where("date", ">=", startDateString).orderBy("date", "asc").get();

    const data: AnalyticsData[] = [];
    snapshot.forEach(doc => {
        data.push(doc.data() as AnalyticsData);
    });

    return data;
}
