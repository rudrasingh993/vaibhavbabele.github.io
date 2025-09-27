# Firebase Setup Guide for Nitra Mitra

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `nitra-mitra` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Authentication
1. In your Firebase project, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider
5. Enable "Google" provider (optional but recommended)
6. Save changes

### Step 3: Create Firestore Database
1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location (choose closest to your users)
5. Click "Done"

### Step 4: Get Firebase Config
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon (`</>`)
4. Enter app nickname: `nitra-mitra-web`
5. Click "Register app"
6. Copy the Firebase config object

### Step 5: Update Configuration
1. Open `js/firebase-config.js`
2. Replace the placeholder config with your actual config:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

### Step 6: Set Up Security Rules (Important!)

#### Firestore Security Rules
Go to Firestore Database → Rules and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // User-specific collections
    match /assignments/{document} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    match /grades/{document} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    match /attendance/{document} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    match /goals/{document} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    match /userProfiles/{document} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

## 🎯 Features You Get

### ✅ Authentication
- Email/Password login
- Google Sign-in
- Password reset
- User session management
- Automatic login persistence

### ✅ Database
- Real-time data sync
- User-specific data isolation
- Automatic data backup
- Offline support

### ✅ Security
- Row-level security
- User authentication required
- Data validation
- Secure API endpoints

## 📊 Database Structure

```
users/
  {userId}/
    email: string
    displayName: string
    createdAt: timestamp
    lastLogin: timestamp

assignments/
  {assignmentId}/
    userId: string
    title: string
    subject: string
    deadline: timestamp
    status: string
    createdAt: timestamp

grades/
  {gradeId}/
    userId: string
    subject: string
    grade: string
    date: timestamp
    createdAt: timestamp

attendance/
  {attendanceId}/
    userId: string
    subject: string
    date: timestamp
    status: string
    createdAt: timestamp

goals/
  {goalId}/
    userId: string
    title: string
    target: string
    progress: number
    deadline: timestamp
    createdAt: timestamp

userProfiles/
  {profileId}/
    userId: string
    studentId: string
    department: string
    displayName: string
    createdAt: timestamp
```

## 🔧 Customization Options

### Add More Authentication Providers
1. Go to Authentication → Sign-in method
2. Enable additional providers:
   - Facebook
   - Twitter
   - GitHub
   - Microsoft

### Customize User Data
Edit `js/firebase-config.js` to add more user fields:

```javascript
// In signUp function
await addDoc(collection(db, 'users'), {
    uid: user.uid,
    email: user.email,
    displayName: displayName,
    studentId: studentId,        // Add this
    department: department,      // Add this
    year: year,                  // Add this
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
});
```

### Add Admin Features
Create admin collection and rules:

```javascript
// In Firestore rules
match /admin/{document} {
  allow read, write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

## 🚨 Important Notes

### Development vs Production
- **Development**: Use test mode for quick setup
- **Production**: Set up proper security rules before going live

### Cost Management
- **Free Tier**: 1GB storage, 50K reads/day
- **Monitor Usage**: Check Firebase Console regularly
- **Optimize Queries**: Use indexes for better performance

### Backup Strategy
- **Automatic**: Firebase handles backups
- **Export**: Use Firebase CLI for manual exports
- **Import**: Use Firebase CLI for data migration

## 🆘 Troubleshooting

### Common Issues

1. **"Firebase not initialized"**
   - Check if config is correct
   - Ensure Firebase script is loaded

2. **"Permission denied"**
   - Check Firestore security rules
   - Verify user is authenticated

3. **"Network error"**
   - Check internet connection
   - Verify Firebase project is active

4. **"Invalid API key"**
   - Regenerate API key in Firebase Console
   - Update config file

### Getting Help
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Support](https://firebase.google.com/support)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)

## 🎉 You're Ready!

Once you've completed these steps:
1. Your authentication system will work
2. User data will be stored securely
3. Real-time updates will work
4. All features will be user-specific

**Next Steps:**
- Test the login/signup flow
- Add some sample data
- Customize the user experience
- Deploy to production when ready!

---

**Need Help?** Check the console for error messages and refer to the troubleshooting section above.
