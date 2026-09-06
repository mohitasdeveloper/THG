"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginHandler() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [message, setMessage] = useState("Logging in...");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = params.get("team");
    if (!token) {
      setStatus("error");
      setErrorMsg("No team token found in this link.");
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setErrorMsg(data.error ?? "Login failed");
          return;
        }
        setMessage(`Logging in ${data.team.name}...`);
        setTimeout(() => router.push("/game"), 600);
      } catch {
        setStatus("error");
        setErrorMsg("Network error — try again.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      {status === "loading" ? (
        <>
          <div className="text-4xl mb-4 animate-spin">🔄</div>
          <p className="text-text-secondary">{message}</p>
        </>
      ) : (
        <>
          <div className="text-4xl mb-4">❌</div>
          <p className="text-danger font-medium mb-2">Couldn't log in</p>
          <p className="text-text-secondary text-sm">{errorMsg}</p>
        </>
      )}
    </main>
  );
}

function LoginFallback() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="text-4xl mb-4 animate-spin">🔄</div>
      <p className="text-text-secondary">Logging in...</p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginHandler />
    </Suspense>
  );
}
