'use server'

import { getAdminDb, getAdminAuth, initAdmin } from "@/lib/firebase-admin";

interface WebsiteData {
    domain: string;
    category: string;
    refreshInterval: number;
    adTitle: string;
    adDescription: string;
    widgetColor: string;
    widgetBgColor: string;
}

export async function submitWebsite(idToken: string, data: WebsiteData) {
    const auth = getAdminAuth();
    const db = getAdminDb();
    const admin = initAdmin();

    // 1. Verify User
    let decodedToken;
    try {
        decodedToken = await auth.verifyIdToken(idToken);
    } catch (e) {
        throw new Error("Unauthorized: Invalid token");
    }

    const userId = decodedToken.uid;
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
        throw new Error("User profile not found");
    }
    
    const userData = userSnap.data();

    // Check if already banned
    if (userData?.permanentBan) {
        throw new Error("Your account is permanently suspended.");
    }
    
    if (userData?.bannedUntil) {
        const bannedUntil = userData.bannedUntil.toDate();
        if (bannedUntil > new Date()) {
             throw new Error(`Your account is suspended until ${bannedUntil.toLocaleString()}`);
        }
    }

    // 2. Clean Domain
    let cleanDomain = data.domain.toLowerCase().trim();
    if (!cleanDomain.startsWith('http')) {
        cleanDomain = 'https://' + cleanDomain;
    }
    
    try {
        const url = new URL(cleanDomain);
        cleanDomain = url.hostname.replace(/^www\./, '');
    } catch(e) {
        throw new Error("Invalid domain format");
    }

    // 3. Check for duplicates
    const websitesRef = db.collection("websites");
    const querySnapshot = await websitesRef.where("domain", "==", cleanDomain).get();

    if (!querySnapshot.empty) {
        // Check if the domain belongs to the SAME user
        // If so, just return error, don't ban.
        const existingDoc = querySnapshot.docs[0];
        const existingData = existingDoc.data();

        if (existingData.userId === userId) {
            throw new Error("You have already registered this domain.");
        }

        // Domain exists and belongs to ANOTHER user.
        // This implies "adding the same domain with multiple accounts".
        // Ban Logic.
        
        const offenses = (userData?.duplicateDomainOffenses || 0) + 1;
        const isPermaBan = offenses >= 2;
        
        let banUpdate: any = {
            duplicateDomainOffenses: offenses
        };

        if (isPermaBan) {
            banUpdate.permanentBan = true;
            banUpdate.banReason = "Duplicate domain submission (Repeat Offense)";
            // Disable Auth
            try {
                await auth.updateUser(userId, { disabled: true });
            } catch (err) {
                console.error("Failed to disable user in auth:", err);
            }
        } else {
            // 1 Day Ban
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            banUpdate.bannedUntil = admin.firestore.Timestamp.fromDate(tomorrow);
            banUpdate.banReason = "Duplicate domain submission (1st Offense)";
        }

        await userRef.update(banUpdate);

        if (isPermaBan) {
             throw new Error("Access Denied: Your account has been permanently banned for repeated attempts to register existing domains.");
        } else {
             throw new Error("Access Denied: Your account has been suspended for 24 hours for attempting to register a domain that belongs to another account.");
        }
    }

    // 4. Create Website
    await websitesRef.add({
        userId,
        domain: cleanDomain,
        category: data.category,
        refreshInterval: data.refreshInterval,
        adTitle: data.adTitle,
        adDescription: data.adDescription,
        widgetColor: data.widgetColor,
        widgetBgColor: data.widgetBgColor,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        active: false,
        status: "pending",
        hasCredits: true,
        views: 0,
        clicks: 0
    });

    return { success: true };
}
