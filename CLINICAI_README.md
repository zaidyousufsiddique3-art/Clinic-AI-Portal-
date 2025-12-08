# ClinicAI - Complete WhatsApp AI Intelligence System

## 🚀 Overview

ClinicAI is a complete AI-powered patient engagement platform that handles lead capture, appointment booking, multilingual conversations, and staff handoffs through WhatsApp.

## 📦 Features Implemented

### ✅ A. AI Reply System (Multilingual + Knowledge Base)
- **Language Detection**: Automatic detection of Arabic, English, Urdu, and other languages
- **Knowledge Base Integration**: Fetches answers from Firestore `knowledge_base` collection
- **OpenAI Fallback**: Uses GPT-4o-mini for general questions not in knowledge base
- **Message Persistence**: All messages saved to `messages` collection with language tags
- **Real-time UI Updates**: Live feed shows all bot, patient, and staff messages

### ✅ B. Appointment Booking Flow
- **Intent Detection**: AI analyzes user messages to detect booking requests
- **Date/Time Extraction**: Smart parsing of natural language dates ("tomorrow at 3pm")
- **Availability Checking**: Queries Firestore for available doctors and time slots
- **Appointment Creation**: Creates confirmed appointments in Firestore
- **Lead Stage Update**: Automatically updates lead.stage to "Booked"
- **WhatsApp Confirmation**: Sends formatted appointment confirmation messages

### ✅ C. Reminder Automations (Vercel Cron)

#### `/api/cron-appointment-reminders` (Runs every 5 minutes)
- Finds appointments within next 2 hours
- Sends WhatsApp reminder: "You have an appointment today at {time}. Please arrive 10 minutes early."
- Sets `reminderSent = true` to prevent duplicates

#### `/api/cron-post-appointment-followup` (Runs every 6 hours)
- Finds completed appointments where feedback wasn't requested
- Sends: "We hope your visit went well! Could you rate your experience from 1–5?"
- Sets `feedbackRequested = true`

### ✅ D. Human Handoff System

#### Automatic Handoff Triggers
- Low AI confidence (< 70%)
- Keywords: "speak to human", "urgent pain", "emergency", etc.
- Intent classified as "urgent" or "human_handoff"

#### Staff Handoff Endpoint: `/api/handoff-to-staff`
- Updates conversation.mode to "human"
- Assigns staff member
- Creates agent_notifications for dashboard alerts
- Sends WhatsApp: "A staff member will now assist you"

#### Staff Messaging: `/api/staff-message`
- Allows staff to send messages to patients
- Marks messages with `from: "staff"`
- Updates conversation timestamp

### ✅ E. Live Feed System

#### Real-time Conversation View (`/pages/LiveFeed.tsx`)
- **Conversation Sidebar**: Shows all active conversations
- **Patient Info Panel**: Email, phone, lead stage, service interest
- **Message Bubbles**: Color-coded by sender (purple = bot, blue = patient, green = staff)
- **Language Tags**: Shows detected language for each message
- **Take Over Button**: Quick handoff to human mode
- **Staff Messaging Input**: Send direct messages to patients

### ✅ F. Lead Capture + Tracking

#### On First Message:
1. Creates `patient` document
2. Creates `lead` document (stage: "New")
3. Creates `conversation` document (state: "collecting_contact", mode: "bot")

#### Contact Collection Flow:
- Bot asks for email + phone
- Extracts using regex from user message
- Updates patient document
- Transitions to state: "ready"
- Changes lead.stage to "Contacted"

#### Continuous Tracking:
- Updates `leads.lastMessage` on every message
- Detects and saves `leads.service` (Whitening, Invisalign, etc.)
- Updates `leads.updatedAt` timestamp

## 📁 Project Structure

```
api/
├── whatsapp-webhook.js           # Main webhook with full AI logic
├── ai-service.js                 # OpenAI helpers (language detection, intent analysis)
├── whatsapp-utils.js             # WhatsApp message sending utility
├── firebase-admin.js             # Firebase Admin SDK initialization
├── handoff-to-staff.js           # Manual handoff endpoint
├── staff-message.js              # Staff-to-patient messaging
├── cron-appointment-reminders.js # Reminder automation
└── cron-post-appointment-followup.js # Followup automation

pages/
└── LiveFeed.tsx                  # Real-time conversation UI

src/
└── firebase.ts                   # Frontend Firebase config

firestore.rules                   # Firestore security rules
vercel.json                       # Cron job configuration
```

## 🔧 Environment Variables

Add these to `.env.local` and Vercel:

```bash
# WhatsApp
WHATSAPP_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=clinicai_verify_2025

# OpenAI
OPENAI_API_KEY=sk-proj-your-openai-key

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Frontend Firebase Config (VITE_* prefix)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## 📊 Firestore Collections

### `patients`
```javascript
{
  phone: string,
  email: string,
  name: string,
  createdAt: timestamp,
  lastSeenAt: timestamp
}
```

### `leads`
```javascript
{
  patientId: string,
  source: "whatsapp",
  stage: "New" | "Contacted" | "Booked" | "Completed" | "Lost",
  service: "Whitening" | "Invisalign" | "Braces" | "Implants" | "Cleaning" | "Checkup",
  lastMessage: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### `conversations`
```javascript
{
  patientId: string,
  state: "collecting_contact" | "ready" | "awaiting_datetime" | "checking_availability" | "appointment_confirmed",
  mode: "bot" | "human",
  staffAssigned: string (optional),
  handoverReason: string (optional),
  createdAt: timestamp,
  lastMessageAt: timestamp
}
```

### `messages`
```javascript
{
  conversationId: string,
  patientId: string,
  from: "bot" | "patient" | "staff",
  staffId: string (optional),
  text: string,
  language: "en" | "ar" | "ur",
  createdAt: timestamp
}
```

### `appointments`
```javascript
{
  patientId: string,
  doctorId: string,
  dateTime: ISO string,
  status: "confirmed" | "completed" | "cancelled",
  reminderSent: boolean,
  feedbackRequested: boolean,
  createdAt: timestamp
}
```

### `knowledge_base`
```javascript
{
  question: string,
  answer: string,
  category: string (optional),
  language: string (optional)
}
```

### `agent_notifications`
```javascript
{
  conversationId: string,
  patientId: string,
  type: "handover" | "new_message" | "booking",
  message: string,
  staffId: string (optional),
  createdAt: timestamp,
  seen: boolean
}
```

### `doctors`
```javascript
{
  name: string,
  specialization: string,
  workingHours: {
    monday: { start: "09:00", end: "17:00" },
    // ... other days
  }
}
```

## 🚀 Deployment

### 1. Install Dependencies
```bash
npm install
```

### 2. Deploy to Vercel
```bash
vercel --prod
```

### 3. Set Environment Variables in Vercel
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add all variables from `.env.example`

### 4. Configure WhatsApp Webhook
- Go to Meta Business Suite → WhatsApp → Configuration
- Set Webhook URL: `https://your-vercel-domain.vercel.app/api/whatsapp-webhook`
- Set Verify Token: `clinicai_verify_2025`
- Subscribe to `messages` events

### 5. Enable Vercel Cron Jobs
Cron jobs are automatically configured in `vercel.json`:
- Reminders: Every 5 minutes
- Followups: Every 6 hours

## 🧪 Testing

### Test Webhook Locally
```bash
npm run dev
```

Then use a tool like `ngrok` to expose your local server:
```bash
ngrok http 5173
```

### Test WhatsApp Flow
1. Send message to your WhatsApp Business number
2. Bot asks for email + phone
3. Provide: "john@example.com +1234567890"
4. Bot replies with menu
5. Say: "I want teeth whitening"
6. Service is detected and saved
7. Say: "I want to book an appointment"
8. Bot asks for date/time
9. Provide: "Tomorrow at 3pm"
10. Bot confirms appointment

## 📱 Live Feed Dashboard

Access the live feed at: `/live-feed`

Features:
- See all active conversations in real-time
- View patient details and lead information
- Take over conversations from bot
- Send direct messages to patients
- Color-coded message bubbles
- Language indicators

## 🔐 Security

- Firestore rules allow Admin SDK access (server-side)
- Frontend rules can be tightened based on `clinicId` or user auth
- WhatsApp verify token prevents unauthorized webhook calls
- All sensitive credentials stored as environment variables

## 🎯 Key Workflows

### New Patient Flow
```
1. Patient messages → Create patient/lead/conversation
2. State: collecting_contact → Ask for email/phone
3. Extract details → Update patient
4. State: ready → Send menu
5. Detect service → Update lead.service
6. Update lead.lastMessage continuously
```

### Booking Flow
```
1. Detect "booking" intent
2. State: awaiting_datetime
3. Extract date from message
4. State: checking_availability
5. Find available doctor
6. Create appointment
7. Update lead.stage = "Booked"
8. State: appointment_confirmed
9. Send confirmation message
```

### Handoff Flow
```
1. Detect low confidence or urgent keywords
2. Update mode: "human"
3. Create agent_notification
4. Stop bot replies
5. Staff sees alert in dashboard
6. Staff takes over conversation
7. Staff can send messages via /api/staff-message
```

## 📈 Future Enhancements

- ✨ Multi-doctor scheduling with real availability checking
- 📊 Analytics dashboard for lead conversion rates
- 🌐 Support for more languages (French, Spanish, etc.)
- 🎤 Voice message transcription
- 📎 Document/image handling (X-rays, insurance cards)
- 💳 Payment integration for deposits
- 📧 Email notifications alongside WhatsApp
- 🔔 Push notifications for mobile app
- 🤖 More sophisticated AI routing based on specialty
- 📅 Calendar integration (Google Calendar, Outlook)

---

Built with ❤️ for ClinicAI Platform
