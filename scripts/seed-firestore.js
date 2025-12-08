// Standalone Firestore Seed Script (Run Locally)
import admin from "firebase-admin";
import { config } from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
const result = config({ path: join(__dirname, '..', '.env.local') });

console.log('🔍 Loading .env.local from:', join(__dirname, '..', '.env.local'));
if (result.error) {
    console.warn('⚠️  .env.local not found or error loading:', result.error.message);
    console.log('Trying process.env directly (Vercel environment)...');
}

console.log('🔍 Checking environment variables...');
console.log('  FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅ SET' : '❌ MISSING');
console.log('  FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅ SET' : '❌ MISSING');
console.log('  FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? `✅ SET (${process.env.FIREBASE_PRIVATE_KEY.length} chars)` : '❌ MISSING');

if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.error('❌ Missing Firebase credentials in .env.local');
    console.error('Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    process.exit(1);
}

console.log('✅ Environment variables loaded');

// Initialize Firebase Admin
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
            }),
        });
        console.log('🔥 Firestore initialized');
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error.message);
        process.exit(1);
    }
}

const db = admin.firestore();

async function seedDatabase() {
    try {
        // Check if already seeded
        const alreadySeeded = await db.collection("doctors").limit(1).get();
        if (!alreadySeeded.empty) {
            console.log('⚠️  Database already seeded. Delete collections to reseed.');
            return;
        }

        console.log('🌱 Starting database seeding...\n');

        // -----------------------------
        // 1️⃣ SEED DOCTORS
        // -----------------------------
        console.log('👨‍⚕️ Seeding doctors...');
        const doctors = [
            {
                name: "Dr. Aisha Rahman",
                specialty: "Cosmetic Dentistry",
                isActive: true,
                workingHours: {
                    sun: [{ start: "09:00", end: "17:00" }],
                    mon: [{ start: "09:00", end: "17:00" }],
                    tue: [{ start: "09:00", end: "17:00" }],
                    wed: [{ start: "09:00", end: "17:00" }],
                    thu: [{ start: "09:00", end: "17:00" }],
                },
            },
            {
                name: "Dr. Omar Siddiq",
                specialty: "Orthodontist",
                isActive: true,
                workingHours: {
                    sat: [{ start: "10:00", end: "16:00" }],
                    sun: [{ start: "10:00", end: "16:00" }],
                    tue: [{ start: "10:00", end: "16:00" }],
                },
            },
            {
                name: "Dr. Fatimah Nasser",
                specialty: "Implant Specialist",
                isActive: true,
                workingHours: {
                    sun: [{ start: "08:00", end: "14:00" }],
                    mon: [{ start: "08:00", end: "14:00" }],
                    wed: [{ start: "08:00", end: "14:00" }],
                },
            },
        ];

        for (const doc of doctors) {
            await db.collection("doctors").add(doc);
            console.log(`  ✅ Added: ${doc.name}`);
        }

        // -----------------------------
        // 2️⃣ SEED KNOWLEDGE BASE
        // -----------------------------
        console.log('\n📚 Seeding knowledge base...');
        const kbItems = [
            {
                topic: "Teeth Whitening",
                content: "Professional teeth whitening brightens your smile safely. Results typically last 6–12 months depending on lifestyle habits.",
                tags: ["whitening", "bleaching", "brightening"],
            },
            {
                topic: "Invisalign",
                content: "Invisalign uses clear aligners to straighten teeth gradually. Suitable for mild to moderate alignment corrections.",
                tags: ["invisalign", "aligners", "braces"],
            },
            {
                topic: "Dental Cleaning",
                content: "A dental cleaning removes plaque, tartar, and stains while reducing the risk of gum disease.",
                tags: ["cleaning", "scaling", "polishing"],
            },
            {
                topic: "Dental Implants",
                content: "Implants replace missing teeth permanently with natural-looking titanium posts.",
                tags: ["implants", "missing teeth"],
            },
            {
                topic: "Root Canal Treatment",
                content: "A root canal removes infected pulp to save your natural tooth and eliminate pain.",
                tags: ["root canal", "RCT", "infection"],
            },
            {
                topic: "Tooth Pain",
                content: "Tooth pain may be caused by decay, infection, grinding, or sensitivity. An examination is required for diagnosis.",
                tags: ["toothache", "pain", "sensitivity"],
            },
            {
                topic: "Braces",
                content: "Braces straighten teeth using brackets and wires. Treatment typically lasts between 12–24 months.",
                tags: ["braces", "orthodontics"],
            },
            {
                topic: "Dental Emergency",
                content: "If you have severe pain, swelling, or bleeding, please seek urgent care. We accept emergency walk-ins.",
                tags: ["emergency", "urgent"],
            },
        ];

        for (const item of kbItems) {
            await db.collection("knowledge_base").add(item);
            console.log(`  ✅ Added: ${item.topic}`);
        }

        // -----------------------------
        // 3️⃣ SAMPLE PATIENT & LEAD
        // -----------------------------
        console.log('\n👤 Creating sample patient...');
        const patientRef = await db.collection("patients").add({
            name: "Sample Patient",
            phone: "+966500000000",
            email: "sample@example.com",
            createdAt: admin.firestore.Timestamp.now(),
            lastSeenAt: admin.firestore.Timestamp.now(),
        });
        console.log(`  ✅ Patient ID: ${patientRef.id}`);

        const leadRef = await db.collection("leads").add({
            patientId: patientRef.id,
            stage: "New",
            service: "Whitening",
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
            lastMessage: "Hi, I would like information about whitening.",
            source: "whatsapp",
        });
        console.log(`  ✅ Lead ID: ${leadRef.id}`);

        const convoRef = await db.collection("conversations").add({
            patientId: patientRef.id,
            state: "ready",
            mode: "bot",
            lastMessageAt: admin.firestore.Timestamp.now(),
            createdAt: admin.firestore.Timestamp.now(),
        });
        console.log(`  ✅ Conversation ID: ${convoRef.id}`);

        await db.collection("messages").add({
            conversationId: convoRef.id,
            patientId: patientRef.id,
            from: "patient",
            text: "Hi, I would like information about whitening.",
            createdAt: admin.firestore.Timestamp.now(),
            language: "en",
        });
        console.log(`  ✅ Sample message created`);

        // -----------------------------
        // 4️⃣ SAMPLE APPOINTMENT
        // -----------------------------
        console.log('\n📅 Creating sample appointment...');
        const doctorsSnapshot = await db.collection("doctors").limit(1).get();
        const doctorId = doctorsSnapshot.docs[0].id;

        await db.collection("appointments").add({
            patientId: patientRef.id,
            doctorId: doctorId,
            dateTime: new Date(Date.now() + 86400000).toISOString(), // tomorrow
            status: "confirmed",
            reminderSent: false,
            feedbackRequested: false,
            createdAt: admin.firestore.Timestamp.now(),
        });
        console.log(`  ✅ Appointment scheduled for tomorrow`);

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ 🌱 Seeding completed successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`\n📊 Summary:`);
        console.log(`  - Doctors: ${doctors.length}`);
        console.log(`  - Knowledge Base Items: ${kbItems.length}`);
        console.log(`  - Sample Patient: 1`);
        console.log(`  - Sample Lead: 1`);
        console.log(`  - Sample Conversation: 1`);
        console.log(`  - Sample Appointment: 1\n`);

    } catch (error) {
        console.error('❌ Seed Error:', error);
        process.exit(1);
    }
}

// Run the seeding
seedDatabase().then(() => {
    console.log('🎉 Database ready for ClinicAI!\n');
    process.exit(0);
});
