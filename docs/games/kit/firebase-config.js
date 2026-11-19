// Firebase web config for the games' play stats (Firebase console > Project settings > Your apps > Web app).
// These values are public by design; access is controlled by the Firestore rules in firebase/firestore.rules.
// Leave apiKey empty to turn stats off.
window.GAMES_FIREBASE = {
  apiKey: 'AIzaSyDO-W6g_bnj1gW75_ekE5t4mvsnyvbKEHU',
  authDomain: 'omargames-7f627.firebaseapp.com',
  projectId: 'omargames-7f627',
  appId: '1:677955300916:web:da4008c1462839a1686461',
};
// Your Firebase user id (shown on the admin page after you sign in). Only this account can read the stats.
window.GAMES_ADMIN_UID = '';
