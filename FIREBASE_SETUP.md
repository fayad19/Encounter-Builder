# Firebase Setup Guide for Encounter Builder

This guide will help you set up Firebase to enable encounter sharing functionality in your Encounter Builder app.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "encounter-builder")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Firestore Database

1. In your Firebase project, click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" for development (you can secure it later)
4. Select a location for your database (choose the closest to your users)
5. Click "Done"

## Step 3: Get Your Firebase Configuration

1. In your Firebase project, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>)
5. Register your app with a nickname (e.g., "encounter-builder-web")
6. Copy the Firebase configuration object

## Step 4: Update Your Firebase Configuration

1. Open `src/services/firebase.js`
2. Replace the placeholder configuration with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## Step 5: Set Up Firestore Security Rules (Optional)

For production use, you should set up proper security rules. In the Firestore Database section:

1. Click on "Rules" tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to encounters collection
    match /encounters/{encounterId} {
      allow read, write: if true; // For development - change this for production
    }
  }
}
```

**Note:** The above rules allow anyone to read/write encounters. For production, you should implement proper authentication and authorization.

## Step 6: Test the Setup

1. Start your development server: `npm run dev`
2. Navigate to the "Share" tab in your app
3. Try saving an encounter - it should work without errors
4. Try loading the encounter using the generated ID

## Troubleshooting

### Common Issues:

1. **"Firebase: Error (auth/unauthorized-domain)"**
   - Go to Firebase Console → Authentication → Settings → Authorized domains
   - Add your domain (localhost for development)

2. **"Firebase: Error (firestore/permission-denied)"**
   - Check your Firestore security rules
   - Make sure you're in test mode or have proper rules set up

3. **"Firebase: Error (app/no-app)"**
   - Make sure you've properly initialized Firebase in `firebase.js`
   - Check that your configuration object is correct

### For Production Deployment:

1. **Set up proper security rules** - Don't use `allow read, write: if true` in production
2. **Enable authentication** if you want user-specific encounters
3. **Set up proper CORS** if deploying to a different domain
4. **Monitor usage** in Firebase Console to stay within free tier limits

## Firebase Free Tier Limits

- **Firestore**: 1GB storage, 50,000 reads/day, 20,000 writes/day
- **Authentication**: 10,000 users/month
- **Hosting**: 10GB storage, 360MB/day transfer

For most personal use cases, the free tier should be sufficient.

## Security Considerations

- **Data is public** - Anyone with an encounter ID can access the data
- **No user authentication** - Encounters are not tied to specific users
- **No data expiration** - Encounters are stored indefinitely (you can implement this later)

If you need more security, consider:
- Adding user authentication
- Implementing encounter expiration
- Adding user-specific access controls
- Using Firebase Functions for server-side validation 