import User from "../models/user.model.js";

/**
 * GET /api/users/me
 * Returns the caller's own safe anonymous profile.
 */
export async function getMe(req, res) {
  const { _id, anonymousUsername, status, isOnline } = req.user;
  res.status(200).json({ _id, anonymousUsername, status, isOnline });
}

/**
 * GET /api/users/available
 * Returns a sanitized list of users who are currently online and available.
 * Excludes the requesting user.
 * Never exposes email, clerkId, fullName, or _id directly — only anonymousUsername.
 * The userId field is needed by the frontend to send a request but contains no PII.
 */
export async function getAvailableUsers(req, res) {
  try {
    const myId = req.user._id;

    const users = await User.find({
      _id: { $ne: myId },
      isOnline: true,
      status: "available",
    })
      .select("_id anonymousUsername")
      .lean();

    // Return userId so frontend can target send-request, but no other private field
    const sanitized = users.map((u) => ({
      userId: u._id,
      anonymousUsername: u.anonymousUsername,
    }));

    res.status(200).json(sanitized);
  } catch (err) {
    console.error("[Users] getAvailableUsers error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
}
