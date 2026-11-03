export interface DocsUser {
  id: number;
  name: string;
  email: string;
  color: string;
}

const COLORS = [
  "#0052CC",
  "#DE350B",
  "#00875A",
  "#FF8B00",
  "#5243AA",
  "#00A3BF",
  "#FF5630",
  "#6554C0",
];

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) {
      return null;
    }

    const padded = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getDocsAccessToken() {
  return sessionStorage.getItem("docs_access_token");
}

export function getDocsUser(): DocsUser | null {
  const accessToken = getDocsAccessToken();
  if (!accessToken) {
    return null;
  }

  const access = decodeJwt(accessToken);
  const identity = decodeJwt(sessionStorage.getItem("docs_id_token") ?? "");
  const userId = Number(access?.sub);

  if (!Number.isInteger(userId) || userId <= 0) {
    return null;
  }

  const nameValue = identity?.name;
  const emailValue = identity?.email;

  return {
    id: userId,
    name: typeof nameValue === "string" && nameValue.length > 0
      ? nameValue
      : `User ${userId}`,
    email: typeof emailValue === "string" ? emailValue : "",
    color: COLORS[userId % COLORS.length] ?? "#0052CC",
  };
}
