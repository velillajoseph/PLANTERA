"use client";

import Link from "next/link";
import { useState } from "react";

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.35rem",
  fontWeight: 700,
  color: "#0f172a",
};

const inputStyle: React.CSSProperties = {
  padding: "0.9rem 1rem",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  fontSize: "1rem",
};

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("customer");

  return (
    <div
      style={{
        maxWidth: "1024px",
        margin: "0 auto",
        padding: "3rem 1.5rem",
        display: "grid",
        gap: "1.5rem",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #ecfdf3, #eff6ff)",
          padding: "2rem",
          borderRadius: "18px",
          border: "1px solid #d9e3f0",
          display: "grid",
          gap: "0.75rem",
        }}
      >
        <p style={{ margin: 0, color: "#15803d", fontWeight: 800 }}>Sign up</p>
        <h1 style={{ margin: 0 }}>Create your Plantera account</h1>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
          Pick a role to test the platform quickly. You can always log in with
          the demo credentials on the login page to explore the Admin, Store,
          or Customer experiences.
        </p>
      </div>

      <div
        style={{
          background: "#fff",
          padding: "1.75rem",
          borderRadius: "18px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
          display: "grid",
          gap: "1rem",
        }}
      >
        <label style={labelStyle}>
          <span>Full name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            style={inputStyle}
            placeholder="Avery Botanist"
          />
        </label>
        <label style={labelStyle}>
          <span>Email</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={inputStyle}
            type="email"
            placeholder="you@plantera.demo"
          />
        </label>
        <label style={labelStyle}>
          <span>Role</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            style={{
              ...inputStyle,
              cursor: "pointer",
              background: "#f8fafc",
              fontWeight: 700,
            }}
          >
            <option value="customer">Customer</option>
            <option value="store">Store</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button
          type="button"
          style={{
            background: "#0f172a",
            color: "#fff",
            fontWeight: 800,
            padding: "0.95rem 1rem",
            borderRadius: "12px",
            border: "none",
            letterSpacing: "0.01em",
          }}
        >
          Continue
        </button>
        <p style={{ margin: 0, color: "#475569" }}>
          Already have an account? <Link href="/login">Log in</Link>
        </p>
        <div
          style={{
            border: "1px dashed #e2e8f0",
            padding: "1rem",
            borderRadius: "12px",
            background: "#f8fafc",
          }}
        >
          <p style={{ margin: 0, fontWeight: 700 }}>Demo shortcuts</p>
          <p style={{ margin: "0.35rem 0", color: "#475569", lineHeight: 1.5 }}>
            Use the login page to explore fully wired Admin, Store, and Customer
            flows with prefilled demo credentials and the live interface switcher.
          </p>
          <ul style={{ margin: 0, color: "#0f172a", paddingLeft: "1.2rem" }}>
            <li>Admin: admin@plantera.demo / demo-admin</li>
            <li>Store: fern-hub@plantera.demo / demo-store</li>
            <li>Customer: plant-lover@plantera.demo / demo-customer</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
