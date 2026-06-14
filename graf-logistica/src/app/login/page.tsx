"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "No autorizado");
      }
      router.replace(next);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100vh",
        width: "100%",
        background:
          "linear-gradient(120deg, #0A1622 0%, #0B8A8F 58%, #2DCBD1 100%)",
      }}
    >
      <form onSubmit={submit} className="card" style={{ width: 340, padding: 28 }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <Image
            src="/brand/cauce-symbol.svg"
            alt="Olympo"
            width={48}
            height={48}
            priority
            style={{ borderRadius: 12 }}
          />
          <h2 style={{ margin: "8px 0 2px" }}>Graf Logística</h2>
          <div className="muted" style={{ fontSize: 13 }}>Despacho &amp; Cargue</div>
        </div>
        {err && <div className="banner banner-err">{err}</div>}
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Contraseña de la oficina</label>
          <input type="password" value={password} autoFocus
            onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit" disabled={busy}>
          {busy ? "Entrando…" : "Entrar"}
        </button>
        <div
          className="muted"
          style={{ textAlign: "center", fontSize: 11, marginTop: 16 }}
        >
          Un producto <b>Olympo</b>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
