/**
 * Returns the authenticated user's own anonymous profile.
 * Never returns email, fullName, clerkId, or other PII.
 */
export async function checkAuth(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { _id, anonymousUsername, status, isOnline } = req.user;
  res.status(200).json({ _id, anonymousUsername, status, isOnline });
}