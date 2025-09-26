# Firebase Database Security Rules

## Simple Database Rules for User Data Isolation

### 🔒 **Recommended Simple Rules**

Use this simple rule set for your Firebase Firestore database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### 📋 **How to Apply These Rules**

1. **Go to Firebase Console**
   - Visit [Firebase Console](https://console.firebase.google.com/)
   - Select your project

2. **Navigate to Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - Click on the "Rules" tab

3. **Replace the Rules**
   - Delete the existing rules
   - Copy and paste the simple rules above
   - Click "Publish"

### 🔍 **What These Rules Do**

#### ✅ **Allows:**
- **Authenticated users** can read their own data
- **Authenticated users** can write/update their own data
- **Authenticated users** can create new documents with their user ID

#### ❌ **Prevents:**
- **Unauthenticated users** from accessing any data
- **Users** from accessing other users' data
- **Users** from creating documents with other users' IDs

### 🛡️ **Security Features**

1. **User Authentication Required**: All operations require a valid user token
2. **Data Isolation**: Users can only access documents where `userId` matches their `auth.uid`
3. **Create Protection**: Users can only create documents with their own user ID
4. **Update Protection**: Users can only modify documents they own

### 📊 **Data Structure Requirements**

Your documents must include a `userId` field that matches the authenticated user's ID:

```javascript
// Example document structure
{
  "userId": "user123", // Must match request.auth.uid
  "title": "Assignment 1",
  "subject": "Mathematics",
  "deadline": "2024-01-15",
  "status": "In Progress",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### 🔧 **Testing the Rules**

#### Test Cases:

1. **✅ Should Work:**
   - User creates a document with their own `userId`
   - User reads documents where `userId` matches their `auth.uid`
   - User updates documents they own

2. **❌ Should Fail:**
   - Unauthenticated user tries to read/write
   - User tries to access another user's data
   - User tries to create document with different `userId`

### 🚨 **Important Notes**

1. **Backup Your Data**: Always backup your data before changing rules
2. **Test Thoroughly**: Test the rules in Firebase Console simulator
3. **Monitor Usage**: Check Firebase Console for rule violations
4. **Update Regularly**: Review and update rules as your app grows

### 🔄 **Alternative: More Specific Rules**

If you want more granular control, use the detailed rules in `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Specific rules for each collection
    match /assignments/{assignmentId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    match /grades/{gradeId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // ... more collections
  }
}
```

### 🎯 **Quick Setup Steps**

1. Copy the simple rules from above
2. Go to Firebase Console → Firestore → Rules
3. Paste the rules
4. Click "Publish"
5. Test with your application

### ✅ **Verification**

After applying the rules, verify that:
- Users can only see their own data
- Users cannot access other users' data
- Unauthenticated users cannot access any data
- All CRUD operations work correctly for authenticated users

---

**Need Help?** Check the Firebase documentation or test your rules using the Firebase Console simulator.
