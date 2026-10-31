import { useState } from "react";
import Callback from "./auth/Callback";
import { loginWithSSO } from "./auth/login";

function Home() {
  const [message, setMessage] = useState("");

  const accessToken =
    sessionStorage.getItem("access_token");

  async function callProtectedApi() {
    if (!accessToken) {
      setMessage("Please login first");
      return;
    }

    const response = await fetch(
      "http://localhost:5000/api/protected",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    setMessage(JSON.stringify(data));
  }

  return (
    <div>
      <h1>Work App</h1>

      {!accessToken && (
        <button onClick={loginWithSSO}>
          Login with SSO
        </button>
      )}

      {accessToken && (
        <>
          <p>You are logged in.</p>

          <button onClick={callProtectedApi}>
            Call Protected API
          </button>
        </>
      )}

      <p>{message}</p>
    </div>
  );
}

export default function App() {
  if (
    window.location.pathname ===
    "/auth/callback"
  ) {
    return <Callback />;
  }

  return <Home />;
}