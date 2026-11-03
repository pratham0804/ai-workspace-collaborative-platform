import { useEffect, useState } from "react";
import { DOCS_CLIENT_ID, DOCS_REDIRECT_URI } from "./login";

export default function Callback() {
  const [message, setMessage] = useState("Completing login...");

  useEffect(() => {
    async function exchangeCode() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      const expectedState = sessionStorage.getItem("docs_oauth_state");
      const codeVerifier = sessionStorage.getItem("docs_pkce_code_verifier");

      if (!code) {
        setMessage("Authorization code is missing");
        return;
      }

      if (!state || !expectedState || state !== expectedState) {
        setMessage("Invalid OAuth state");
        return;
      }

      if (!codeVerifier) {
        setMessage("PKCE verifier is missing");
        return;
      }

      const response = await fetch("http://localhost:5000/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code,
          client_id: DOCS_CLIENT_ID,
          redirect_uri: DOCS_REDIRECT_URI,
          code_verifier: codeVerifier,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Token exchange failed");
        return;
      }

      sessionStorage.removeItem("docs_pkce_code_verifier");
      sessionStorage.removeItem("docs_oauth_state");
      sessionStorage.setItem("docs_access_token", data.access_token);
      sessionStorage.setItem("docs_id_token", data.id_token);
      window.location.href = "/";
    }

    void exchangeCode();
  }, []);

  return (
    <div className="login-screen">
      <h1>Docs App</h1>
      <p>{message}</p>
    </div>
  );
}
