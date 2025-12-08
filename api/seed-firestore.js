// /api/seed-firestore.js
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  try {
    const alreadySeeded = await db.collection("doctors").limit(1).get();
    if (!alreadySeeded.empty) {
      return res.status(200).json({
        message: "Database already seeded. Delete doctors/ or knowledge_base/ to reseed.",
      });
    }

    // -----------------------------
    // 1️⃣ SEED DOCTORS
    // -----------------------------
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
    }

    // -----------------------------
    // 2️⃣ SEED KNOWLEDGE BASE
    // -----------------------------

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
    }

    // -----------------------------
    // 3️⃣ OPTIONAL SAMPLE LEAD
    // -----------------------------
    const patientRef = await db.collection("patients").add({
      name: "Sample Patient",
      phone: "+966500000000",
      email: "sample@example.com",
      createdAt: admin.firestore.Timestamp.now(),
      lastSeenAt: admin.firestore.Timestamp.now(),
    });

    const leadRef = await db.collection("leads").add({
      patientId: patientRef.id,
      stage: "New",
      service: "Whitening",
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      lastMessage: "Hi, I would like information about whitening.",
      source: "whatsapp",
    });

    const convoRef = await db.collection("conversations").add({
      patientId: patientRef.id,
      state: "ready",
      mode: "bot",
      lastMessageAt: admin.firestore.Timestamp.now(),
    });

    await db.collection("messages").add({
      conversationId: convoRef.id,
      from: "patient",
      text: "Hi, I would like information about whitening.",
      createdAt: admin.firestore.Timestamp.now(),
      language: "en",
    });

    // -----------------------------
    // 4️⃣ SAMPLE APPOINTMENT
    // -----------------------------
    await db.collection("appointments").add({
      patientId: patientRef.id,
      doctorId: "placeholder",
      dateTime: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 86400000)), // tomorrow
      status: "pending",
      createdAt: admin.firestore.Timestamp.now(),
    });

    return res.status(200).json({
      message: "🔥 Firestore successfully seeded!",
      doctors: doctors.length,
      knowledge_base: kbItems.length,
      sample_lead: true,
    });

  } catch (error) {
    console.error("Seed Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
