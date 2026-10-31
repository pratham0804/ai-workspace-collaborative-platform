import { useEffect, useState } from "react";

export default function Callback() {
  const [message, setMessage] = useState(
    "Completing login..."
  );

  useEffect(() => {
    async function exchangeCode() {
      const params = new URLSearchParams(
        window.location.search
      );

      const code = params.get("code");

      if (!code) {
        setMessage("Authorization code is missing");
        return;
      }

      const codeVerifier = sessionStorage.getItem(
        "pkce_code_verifier"
      );

      if (!codeVerifier) {
        setMessage("PKCE verifier is missing");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/oauth/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            grant_type: "authorization_code",
            code,
            client_id: "work-app-client",
            redirect_uri:
              "http://localhost:5173/auth/callback",
            code_verifier: codeVerifier,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Token exchange failed"
        );
        return;
      }

      sessionStorage.removeItem(
        "pkce_code_verifier"
      );

      sessionStorage.setItem(
        "id_token",
        data.id_token
      );

      sessionStorage.setItem(
        "access_token",
        data.access_token
      );

      setMessage("Login successful!");

      window.location.href = "/";
    }

    exchangeCode();
  }, []);

  return <h2>{message}</h2>;
}