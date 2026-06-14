"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const logout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.replace("/login");
    router.refresh();
  };
  return (
    <button
      onClick={logout}
      className="nav-link"
      style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer", fontSize: 14 }}
    >
      <span className="nav-icon">⎋</span> Salir
    </button>
  );
}
