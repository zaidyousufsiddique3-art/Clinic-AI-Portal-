# 🔐 ClinicAI Environment Configuration Guide

## ⚠️ Action Required: Configure .env.local

The seed script requires Firebase Admin credentials in your `.env.local` file.

---

## 📋 Step-by-Step Instructions

### 1. Get Your Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click **⚙️ Settings** → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the downloaded JSON file

### 2. Extract Values from JSON

The downloaded JSON file contains:
```json
{
  "project_id": "your-project-id",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIB..."
}
```

### 3. Add to .env.local

Create or edit `.env.local` in your project root:

```bash
# Firebase Admin SDK (Required for seeding)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"

# Optional: Other credentials for full system
WHATSAPP_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=clinicai_verify_2025
OPENAI_API_KEY=sk-proj-your-openai-key

# Frontend Firebase Config
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 4. Important: Private Key Formatting

⚠️ **Critical:** The private key must keep the `\n` characters as literal backslash-n:

✅ **Correct:**
```bash
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"
```

❌ **Wrong:** (Don't replace `\n` with actual newlines)

### 5. Run the Seed Script

Once `.env.local` is configured:

```bash
node scripts/seed-firestore.js
```

Expected output:
```
🔍 Checking environment variables...
✅ Environment variables loaded
🔥 Firestore initialized
🌱 Starting database seeding...

👨‍⚕️ Seeding doctors...
  ✅ Added: Dr. Aisha Rahman
  ✅ Added: Dr. Omar Siddiq
  ✅ Added: Dr. Fatimah Nasser

📚 Seeding knowledge base...
  ✅ Added: Teeth Whitening
  ✅ Added: Invisalign
  ...

✅ 🌱 Seeding completed successfully!
```

---

## 📊 What Gets Seeded

### Collections Created:

1. **doctors** (3 doctors)
   - Dr. Aisha Rahman (Cosmetic Dentistry)
   - Dr. Omar Siddiq (Orthodontist)
   - Dr. Fatimah Nasser (Implant Specialist)

2. **knowledge_base** (8 items)
   - Teeth Whitening
   - Invisalign
   - Dental Cleaning
   - Dental Implants
   - Root Canal Treatment
   - Tooth Pain
   - Braces
   - Dental Emergency

3. **patients** (1 sample)
   - Sample Patient (+966500000000)

4. **leads** (1 sample)
   - Stage: New
   - Service: Whitening

5. **conversations** (1 sample)
   - State: ready
   - Mode: bot

6. **messages** (1 sample)
   - Patient message about whitening

7. **appointments** (1 sample)
   - Scheduled for tomorrow
   - Status: confirmed

---

## 🔧 Troubleshooting

### Error: "Missing Firebase credentials"
- ✅ Make sure `.env.local` exists in project root
- ✅ Check variable names match exactly: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- ✅ Private key must be in quotes

### Error: "Firebase initialization failed"
- ✅ Verify private key has `\n` characters (not actual newlines)
- ✅ Check Firebase project has Firestore enabled
- ✅ Ensure service account has Firestore permissions

### Error: "Database already seeded"
- ✅ Delete the `doctors` collection in Firebase Console
- ✅ Run script again

---

## ✅ Quick Reference

**Minimum required for seeding:**
```bash
FIREBASE_PROJECT_ID=xxx
FIREBASE_CLIENT_EMAIL=xxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Run seed:**
```bash
node scripts/seed-firestore.js
```

**Verify in Firebase Console:**
- Go to Firestore Database
- Check collections: doctors, knowledge_base, patients, leads, etc.

---

## 🎯 Next Steps After Seeding

1. ✅ Verify data in Firebase Console
2. ✅ Add remaining environment variables (WhatsApp, OpenAI)
3. ✅ Test local development: `npm run dev`
4. ✅ Deploy to Vercel
5. ✅ Configure WhatsApp webhook

---

**Need help?** Check `CLINICAI_README.md` for full system documentation.
