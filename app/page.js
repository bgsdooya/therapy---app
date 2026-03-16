/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true
  }
}
module.exports = nextConfig

2026.03.16 16:10 정용진
"use client";
import { useState, useEffect } from "react";

const URL = "https://assautgcinohojjgufjn.supabase.co";
const KEY = "sb_publishable_zew7hL6PtkxDqrbN5ocUZg_cHBJ4fcw";

async function api(path, opt = {}) {
  const r = await fetch(`${URL}/rest/v1/${path}`, {
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      ...(opt.method === "POST" ? { Prefer: "return=representation" } : {}),
      ...opt.headers,
    },
    ...opt,
  });
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}
