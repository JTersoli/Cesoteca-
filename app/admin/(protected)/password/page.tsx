"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const inputStyle = {
  border: "1px solid #ccc",
  borderRadius: 8,
  padding: "10px 12px",
};

export default function AdminPasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const response = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        setError(data?.error || "No se pudo cambiar la contraseña.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Contraseña actualizada.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "80px auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Cambiar contraseña</h1>
      <p style={{ marginBottom: 20, color: "#555" }}>
        La nueva contraseña debe tener entre 12 y 128 caracteres.
      </p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label htmlFor="current-password" style={{ fontSize: 14, fontWeight: 600 }}>
          Contraseña actual
        </label>
        <input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          required
          style={inputStyle}
        />
        <label htmlFor="new-password" style={{ fontSize: 14, fontWeight: 600 }}>
          Contraseña nueva
        </label>
        <input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
          style={inputStyle}
        />
        <label htmlFor="confirm-password" style={{ fontSize: 14, fontWeight: 600 }}>
          Repetir contraseña nueva
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
          style={inputStyle}
        />
        <button
          type="submit"
          disabled={saving}
          style={{
            border: "1px solid #111",
            borderRadius: 8,
            padding: "10px 12px",
            background: "#111",
            color: "#fff",
            cursor: saving ? "default" : "pointer",
          }}
        >
          {saving ? "Guardando..." : "Cambiar contraseña"}
        </button>
      </form>

      {error ? (
        <p style={{ marginTop: 12, color: "#b00020" }} role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p style={{ marginTop: 12, color: "#1b5e20" }} role="status">
          {message}
        </p>
      ) : null}

      <p style={{ marginTop: 24 }}>
        <Link href="/admin" style={{ color: "#555" }}>
          Volver al panel
        </Link>
      </p>
    </main>
  );
}
