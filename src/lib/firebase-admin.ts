import * as admin from 'firebase-admin';

function formatPrivateKey(key: string) {
  return key.replace(/\\n/g, '\n');
}

export function initAdmin() {
  if (!admin.apps.length) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: formatPrivateKey(privateKey),
        }),
      });
    } else {
        console.error("Firebase Admin credentials missing");
    }
  }
  return admin;
}

export function getAdminDb() {
    const app = initAdmin();
    if (!app.apps.length) throw new Error("Firebase Admin not initialized");
    return app.firestore();
}

export function getAdminAuth() {
    const app = initAdmin();
    if (!app.apps.length) throw new Error("Firebase Admin not initialized");
    return app.auth();
}
