"use client";
import { useState, useEffect } from "react";

const SU = "https://assautgcinohojjgufjn.supabase.co";
const SK = "sb_publishable_zew7hL6PtkxDqrbN5ocUZg_cHBJ4fcw";

async function api(path, opt = {}) {
  const r = await fetch(`${SU}/rest/v1/${path}`, {
    headers: { apikey: SK, Authorization: `Bearer ${SK}`, "Content-Type": "application/json", ...(opt.method === "POST" ? { Prefer: "return=representation" } : {}), ...opt.headers },
    ...opt,
  });
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

const TC = { 물리치료: { bg:"#E8F4F8", c:"#2E7D9F" }, 작업치료: { bg:"#EAF6EE", c:"#2E7D52" }, 연하치료: { bg:"#FFF3E0", c:"#E07A00" }, 인지치료: { bg:"#F3E8FF", c:"#7B2EAF" }, 운동치료: { bg:"#E0F7FA", c:"#00838F" }, 기타: { bg:"#F5F5F5", c:"#555" } };
const ts = (t) => TC[t] || { bg:"#eee", c:"#444" };
const inp = { width:"100%", padding:"11px 13px", borderRadius:10, border:"1.5px solid #DDE6EE", fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:10 };
