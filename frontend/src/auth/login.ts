import { createPkce } from "./pkce";

export async function loginWithSSO() {
  const {
    codeVerifier,
    codeChallenge,
  } = await createPkce();

  sessionStorage.setItem(
    "pkce_code_verifier",
    codeVerifier
  );

  const params = new URLSearchParams({
    client_id: "work-app-client",
    redirect_uri:
      "http://localhost:5173/auth/callback",
    response_type: "code",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  window.location.href =
    `http://localhost:5000/oauth/authorize?${params.toString()}`;
}