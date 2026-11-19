// Firebase web config for the games' play stats (Firebase console > Project settings > Your apps > Web app).
// These values are public by design; access is controlled by the Firestore rules in firebase/firestore.rules.
// Leave apiKey empty to turn stats off.
window.GAMES_FIREBASE = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  appId: '',
};
// Your Firebase user id (shown on the admin page after you sign in). Only this account can read the stats.
window.GAMES_ADMIN_UID = '';
