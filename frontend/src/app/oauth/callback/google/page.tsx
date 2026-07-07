"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { oauthLogin } = useAuth();
  const [statusMsg, setStatusMsg] = useState("Verifying Google authorization...");

  useEffect(() => {
    let active = true;
    const hash = window.location.hash || window.location.search;
    const params = new URLSearchParams(hash.startsWith("#") || hash.startsWith("?") ? hash.substring(1) : hash);
    const accessToken = params.get("access_token") || params.get("code");

    if (!accessToken) {
      setStatusMsg("No Google OAuth access token was returned.");
      setTimeout(() => {
        router.push("/login");
      }, 2500);
      return;
    }

    const verifyToken = async () => {
      try {
        // Fetch user metadata profile from Google UserInfo endpoint
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!userInfoRes.ok) {
          throw new Error("Failed to authenticate details with Google User Info server.");
        }

        const profile = await userInfoRes.json();
        if (!active) return;

        setStatusMsg("Logging into InterviewX Workspace...");
        await oauthLogin("google", accessToken, profile.email, profile.name);
        router.push("/dashboard");
      } catch (err: unknown) {
        if (!active) return;
        const msg = err instanceof Error ? err.message : String(err);
        setStatusMsg(`OAuth Authentication error: ${msg}`);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    };

    verifyToken();
    return () => {
      active = false;
    };
  }, [oauthLogin, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white select-none">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-violet-650" />
        <p className="text-sm font-semibold tracking-wide text-neutral-300">{statusMsg}</p>
      </div>
    </div>
  );
}
