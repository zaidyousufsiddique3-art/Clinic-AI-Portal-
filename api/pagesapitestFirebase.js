// adjust path to match where you initialize Firebase Admin SDK
import firebaseAdmin from "@/lib/firebaseAdmin";  

export default function handler(req, res) {
  try {
    const projectId = firebaseAdmin.app().options.projectId;
    res.status(200).json({
      success: true,
      message: "Firebase Admin initialized successfully",
      projectId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Firebase Admin failed to initialize",
      error: String(error)
    });
  }
}
