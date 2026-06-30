/** True nếu user có role root hoặc username là root. */
export function isRootUser(user) {
  if (!user) return false;
  if (Array.isArray(user.roles) && user.roles.includes("root")) return true;
  return user.username === "root";
}
