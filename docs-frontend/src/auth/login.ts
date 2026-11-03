import { createPkce } from "./pkce";

export const DOCS_CLIENT_ID = "docs-app-client";
export const DOCS_REDIRECT_URI = "http://localhost:5174/auth/callback";
export const IDP_AUTHORIZE_URL = "http://localhost:5000/oauth/authorize";

export async function loginWithSSO() {
  const { codeVerifier, codeChallenge } = await createPkce();
  const state = crypto.randomUUID();

  sessionStorage.setItem("docs_pkce_code_verifier", codeVerifier);
  sessionStorage.setItem("docs_oauth_state", state);

  const params = new URLSearchParams({
    client_id: DOCS_CLIENT_ID,
    redirect_uri: DOCS_REDIRECT_URI,
    response_type: "code",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });

  window.location.href = `${IDP_AUTHORIZE_URL}?${params.toString()}`;
}

export function logoutDocs() {
  sessionStorage.removeItem("docs_access_token");
  sessionStorage.removeItem("docs_id_token");
  sessionStorage.removeItem("docs_pkce_code_verifier");
  sessionStorage.removeItem("docs_oauth_state");
  window.location.href = "/";
}
