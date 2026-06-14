import * as dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

export const initializeFirebase = () => {
  if (
    !admin.apps.length &&
    process.env.NODE_ENV !== 'test' &&
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY
          ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
          : undefined,
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
};

initializeFirebase();

export default admin;
