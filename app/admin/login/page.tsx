"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error || "Login failed.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "80px auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Acceso de administración</h1>
      <p style={{ marginBottom: 20, color: "#555" }}>
        Ingresá la contraseña para administrar el archivo.
      </p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label htmlFor="admin-password" style={{ fontSize: 14, fontWeight: 600 }}>
          Contraseña
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Ingresá tu contraseña"
          autoComplete="current-password"
          required
          style={{
            border: "1px solid #ccc",
            borderRadius: 8,
            padding: "10px 12px",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            border: "1px solid #111",
            borderRadius: 8,
            padding: "10px 12px",
            background: "#111",
            color: "#fff",
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "Ingresando..." : "Entrar"}
        </button>
      </form>

      {error ? (
        <p style={{ marginTop: 12, color: "#b00020" }} role="alert">
          {error}
        </p>
      ) : null}
    </main>
  );
}
