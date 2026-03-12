"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { SECTION_OPTIONS, getSectionBasePath } from "@/lib/sections";

type Poem = {
  section: (typeof SECTION_OPTIONS)[number]["key"];
  slug: string;
  title: string;
  text: string;
  downloadUrl?: string;
  purchaseUrl?: string;
  updatedAt: string;
};

export default function AdminPoemsManager() {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [section, setSection] = useState<
    (typeof SECTION_OPTIONS)[number]["key"]
  >("poems");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const loadPoems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/poems?section=${section}`, {
        method: "GET",
      });
      if (!response.ok) {
        throw new Error("Failed to load poems.");
      }
      const data = (await response.json()) as { poems: Poem[] };
      setPoems(data.poems || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load poems.");
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    void loadPoems();
  }, [loadPoems]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("section", section);

    try {
      const response = await fetch("/api/admin/poems", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error || "Failed to save poem.");
      }

      form.reset();
      await loadPoems();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save poem.");
    } finally {
      setSaving(false);
    }
  }

  async function onLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  async function onPasswordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordError("");
    setPasswordMessage("");

    try {
      const response = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error || "Failed to update password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password updated successfully.");
    } catch (e) {
      setPasswordError(
        e instanceof Error ? e.message : "Failed to update password."
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "30px auto", padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h1 style={{ fontSize: 32 }}>Admin Panel</h1>
        <button
          type="button"
          onClick={onLogout}
          style={{
            border: "1px solid #111",
            borderRadius: 8,
            padding: "8px 12px",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Section</span>
          <select
            value={section}
            onChange={(e) =>
              setSection(e.target.value as (typeof SECTION_OPTIONS)[number]["key"])
            }
            style={{ border: "1px solid #ccc", borderRadius: 8, padding: 10 }}
          >
            {SECTION_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <input
          name="title"
          placeholder="Title"
          required
          style={{ border: "1px solid #ccc", borderRadius: 8, padding: 10 }}
        />
        <input
          name="slug"
          placeholder="Slug (optional)"
          style={{ border: "1px solid #ccc", borderRadius: 8, padding: 10 }}
        />
        <textarea
          name="text"
          placeholder="Poem text"
          required
          rows={8}
          style={{ border: "1px solid #ccc", borderRadius: 8, padding: 10 }}
        />
        <input
          name="file"
          type="file"
          accept=".doc,.docx,.pdf"
          style={{ border: "1px solid #ccc", borderRadius: 8, padding: 8 }}
        />
        <input
          name="purchaseUrl"
          type="url"
          placeholder="Amazon purchase URL (optional)"
          style={{ border: "1px solid #ccc", borderRadius: 8, padding: 10 }}
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
          {saving ? "Saving..." : "Save poem"}
        </button>
      </form>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 10 }}>Change admin password</h2>
        <form onSubmit={onPasswordSubmit} style={{ display: "grid", gap: 10 }}>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            autoComplete="current-password"
            required
            style={{ border: "1px solid #ccc", borderRadius: 8, padding: 10 }}
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (12+ chars)"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
            style={{ border: "1px solid #ccc", borderRadius: 8, padding: 10 }}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
            style={{ border: "1px solid #ccc", borderRadius: 8, padding: 10 }}
          />
          <button
            type="submit"
            disabled={passwordSaving}
            style={{
              border: "1px solid #111",
              borderRadius: 8,
              padding: "10px 12px",
              background: "#111",
              color: "#fff",
              cursor: passwordSaving ? "default" : "pointer",
            }}
          >
            {passwordSaving ? "Updating..." : "Update password"}
          </button>
        </form>
        {passwordMessage ? (
          <p style={{ marginTop: 12, color: "#0a7a3a" }} role="status">
            {passwordMessage}
          </p>
        ) : null}
        {passwordError ? (
          <p style={{ marginTop: 12, color: "#b00020" }} role="alert">
            {passwordError}
          </p>
        ) : null}
      </section>

      {error ? (
        <p style={{ marginTop: 12, color: "#b00020" }} role="alert">
          {error}
        </p>
      ) : null}

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 10 }}>Existing entries</h2>
        {loading ? <p>Loading...</p> : null}
        {!loading && poems.length === 0 ? <p>No entries yet.</p> : null}
        <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
          {poems.map((poem) => (
            <li
              key={poem.slug}
              style={{
                padding: "12px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <div style={{ fontWeight: 600 }}>{poem.title}</div>
              <div style={{ color: "#555", fontSize: 13 }}>
                {getSectionBasePath(poem.section)}/{poem.slug}
              </div>
              <div style={{ color: "#666", fontSize: 12 }}>
                Updated: {new Date(poem.updatedAt).toLocaleString()}
              </div>
              {poem.downloadUrl ? (
                <a href={poem.downloadUrl} target="_blank" rel="noreferrer">
                  Download file
                </a>
              ) : null}
              {poem.purchaseUrl ? (
                <a
                  href={poem.purchaseUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ marginLeft: 12 }}
                >
                  Amazon
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
