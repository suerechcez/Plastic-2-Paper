const SESSION = "rpvm_session";

export function setSession(id: string) {
  if (typeof window !== "undefined") localStorage.setItem(SESSION, id);
}
export function getSession(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION);
}
export function clearSession() {
  if (typeof window !== "undefined") localStorage.removeItem(SESSION);
}