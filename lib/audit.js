import { getDatabase } from "./mongodb";

export async function recordAudit({
  user,
  action,
  itemId = null,
  details = null,
}) {
  const database = await getDatabase();
  const auditLogs = database.collection("audit_logs");

  await auditLogs.insertOne({
    userId: user.userId,
    username: user.username,
    role: user.role,
    action,
    itemId,
    details,
    createdAt: new Date(),
  });
}