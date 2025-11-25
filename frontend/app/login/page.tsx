"use client";

import { useEffect, useMemo, useState } from "react";

type Role = "admin" | "store" | "customer";

type DemoAccount = {
  email: string;
  password: string;
  notes?: string;
};

const sectionStyle: React.CSSProperties = {
  maxWidth: "1180px",
  margin: "0 auto",
  padding: "2.75rem 1.25rem",
};

const panelStyle: React.CSSProperties = {
  background: "#0b1224",
  backgroundImage: "radial-gradient(circle at 20% 20%, rgba(52,211,153,0.07), transparent 32%), radial-gradient(circle at 80% 0%, rgba(96,165,250,0.08), transparent 30%)",
  color: "#e2e8f0",
  borderRadius: "24px",
  padding: "2rem",
  boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
  border: "1px solid rgba(148,163,184,0.2)",
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.9)",
  padding: "1.75rem",
  borderRadius: "18px",
  boxShadow: "0 18px 45px rgba(15,23,42,0.12)",
  border: "1px solid #e2e8f0",
  backdropFilter: "blur(6px)",
};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.35rem",
  fontWeight: 600,
  color: "#0f172a",
};

const inputStyle: React.CSSProperties = {
  padding: "0.85rem 1rem",
  borderRadius: "12px",
  border: "1px solid #d4d4d8",
  background: "#fff",
  fontSize: "0.95rem",
  color: "#0f172a",
};

const demoAccounts: Record<Role, DemoAccount> = {
  admin: {
    email: "admin@plantera.demo",
    password: "demo-admin",
    notes: "Admin accounts can preview either storefront or customer-facing screens without switching users.",
  },
  store: {
    email: "fern-hub@plantera.demo",
    password: "demo-store",
    notes: "Store users can add plants to inventory and tweak storefront messaging.",
  },
  customer: {
    email: "plant-lover@plantera.demo",
    password: "demo-customer",
    notes: "Customers browse plants, save favorites, and manage a cart.",
  },
};

const apiExamples = [
  {
    title: "Create a store profile",
    method: "POST",
    url: "/api/stores",
    payload: {
      name: "Verdant Haven",
      email: "store@example.com",
      phone: "+1-555-123-4567",
      bio: "Tropicals, succulents, and rare finds",
      address: "123 Greenhouse Lane",
      banner_image: "https://images.plantera.test/store-banner.jpg",
      dashboard_message: "Welcome back! Add three new arrivals today.",
    },
  },
  {
    title: "Add an inventory item",
    method: "POST",
    url: "/api/stores/{storeId}/inventory",
    payload: {
      plant_name: "Monstera Deliciosa",
      description: "Large fenestrated leaves, 10in nursery pot",
      price: 42.0,
      stock: 12,
      image_url: "https://images.plantera.test/monstera.jpg",
      tags: "tropical,low-light",
      is_featured: true,
    },
  },
  {
    title: "Customer adds to cart",
    method: "POST",
    url: "/api/customers/{customerId}/cart",
    payload: {
      inventory_item_id: 1,
      quantity: 2,
    },
  },
  {
    title: "Admin toggles view",
    method: "PATCH",
    url: "/api/admins/{adminId}/view-mode",
    payload: {
      preferred_view: "customer",
    },
  },
];

function LoginCard({
  role,
  onLogin,
  error,
}: {
  role: Role;
  onLogin: (email: string, password: string) => void;
  error?: string;
}) {
  const demo = demoAccounts[role];
  const [email, setEmail] = useState(demo.email);
  const [password, setPassword] = useState(demo.password);

  return (
    <div style={{ ...cardStyle, display: "grid", gap: "1rem", borderColor: "#d9e3f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
        <div style={{ display: "grid", gap: "0.25rem" }}>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#475569", fontWeight: 700 }}>Role</p>
          <h3 style={{ margin: 0, textTransform: "capitalize", fontSize: "1.35rem" }}>{role}</h3>
        </div>
        <span
          style={{
            padding: "0.4rem 0.8rem",
            borderRadius: "999px",
            background: "#ecfdf3",
            color: "#15803d",
            fontWeight: 700,
            fontSize: "0.85rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <span style={{ width: 10, height: 10, background: "#22c55e", borderRadius: "50%" }} />
          Demo ready
        </span>
      </div>
      <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <button
          type="button"
          onClick={() => {
            setEmail(demo.email);
            setPassword(demo.password);
          }}
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "0.75rem 0.85rem",
            background: "#f8fafc",
            color: "#0f172a",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Fill demo credentials
        </button>
        <div style={{ border: "1px dashed #d1d5db", borderRadius: "12px", padding: "0.75rem 0.85rem", color: "#475569" }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Email</p>
          <p style={{ margin: 0, fontFamily: "monospace" }}>{demo.email}</p>
        </div>
        <div style={{ border: "1px dashed #d1d5db", borderRadius: "12px", padding: "0.75rem 0.85rem", color: "#475569" }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Password</p>
          <p style={{ margin: 0, fontFamily: "monospace" }}>{demo.password}</p>
        </div>
      </div>
      <label style={labelStyle}>
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          placeholder="name@plantera.demo"
        />
      </label>
      <label style={labelStyle}>
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          placeholder="••••••••"
        />
      </label>
      {demo.notes && <p style={{ margin: 0, color: "#475569", lineHeight: 1.5 }}>{demo.notes}</p>}
      {error && (
        <p style={{ margin: 0, color: "#b91c1c", fontWeight: 700, background: "#fef2f2", padding: "0.65rem 0.85rem", borderRadius: "12px" }}>
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => onLogin(email, password)}
        style={{
          padding: "0.95rem 1.05rem",
          borderRadius: "12px",
          background: "linear-gradient(90deg, #0f172a, #111827)",
          color: "#fff",
          fontWeight: 800,
          border: "none",
          cursor: "pointer",
          letterSpacing: "0.01em",
        }}
      >
        Log in as {role}
      </button>
    </div>
  );
}

function ViewSwitcher({
  adminView,
  onChange,
}: {
  adminView: "store" | "customer";
  onChange: (view: "store" | "customer") => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <label style={{ fontWeight: 700, color: "#0f172a" }}>Preview as</label>
      <select
        value={adminView}
        onChange={(e) => onChange(e.target.value as "store" | "customer")}
        style={{
          padding: "0.7rem 1rem",
          borderRadius: "12px",
          border: "1px solid #d1d5db",
          background: "#0f172a",
          color: "#e2e8f0",
          fontWeight: 700,
          boxShadow: "0 10px 25px rgba(15,23,42,0.18)",
        }}
      >
        <option value="store">Store</option>
        <option value="customer">Customer</option>
      </select>
    </div>
  );
}

function AdminPreview({ view }: { view: "store" | "customer" }) {
  if (view === "store") {
    return (
      <div style={{ ...cardStyle, display: "grid", gap: "0.75rem", background: "linear-gradient(180deg, #e8fff3, #fafffb)", borderColor: "#bbf7d0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, color: "#15803d", fontWeight: 800 }}>Store dashboard</p>
            <h3 style={{ margin: 0, color: "#0f172a" }}>Inventory + merchandising</h3>
          </div>
          <span style={{ padding: "0.4rem 0.7rem", background: "#ecfdf3", borderRadius: "999px", color: "#15803d", fontWeight: 700 }}>
            Live preview
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem", alignItems: "start" }}>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
              <div style={{ width: 10, height: 10, background: "#22c55e", borderRadius: "50%" }} />
              <p style={{ margin: 0, color: "#166534", fontWeight: 700 }}>Add plant to catalog</p>
            </div>
            <div style={{ display: "grid", gap: "0.35rem" }}>
              {["Monstera Deliciosa", "Philodendron Brasil", "Fiddle Leaf Fig"].map((item) => (
                <div key={item} style={{ display: "flex", justifyContent: "space-between", padding: "0.85rem", background: "#fff", borderRadius: "12px", border: "1px solid #d4d4d8" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700 }}>{item}</p>
                    <p style={{ margin: 0, color: "#475569" }}>Stock and price controls</p>
                  </div>
                  <button style={{ border: "none", background: "#15803d", color: "#fff", borderRadius: "10px", padding: "0.55rem 0.75rem", fontWeight: 700 }}>
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <p style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>Spotlight banner</p>
            <div style={{ border: "1px dashed #86efac", borderRadius: "12px", padding: "0.9rem", background: "#f0fdf4" }}>
              <p style={{ margin: 0, fontWeight: 800, color: "#166534" }}>Spring rare finds</p>
              <p style={{ margin: 0, color: "#166534" }}>Swap artwork and CTAs in seconds.</p>
            </div>
            <p style={{ margin: 0, color: "#166534" }}>Featured plants auto-sync to the storefront.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...cardStyle, display: "grid", gap: "0.75rem", background: "linear-gradient(180deg, #eff6ff, #f8fafc)", borderColor: "#bfdbfe" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ margin: 0, color: "#1d4ed8", fontWeight: 800 }}>Customer view</p>
          <h3 style={{ margin: 0, color: "#0f172a" }}>Browse, favorite, and cart</h3>
        </div>
        <span style={{ padding: "0.4rem 0.7rem", background: "#eff6ff", borderRadius: "999px", color: "#1d4ed8", fontWeight: 700 }}>
          Modern cards
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.85rem" }}>
        {["Variegated Monstera", "Calathea Orbifolia", "String of Pearls"].map((plant) => (
          <div key={plant} style={{ ...cardStyle, boxShadow: "none", background: "#fff", borderColor: "#e2e8f0", display: "grid", gap: "0.35rem" }}>
            <div style={{ height: 120, borderRadius: "12px", background: "linear-gradient(135deg, #dbeafe, #dcfce7)", border: "1px solid #e2e8f0" }} />
            <p style={{ margin: 0, fontWeight: 800, fontSize: "1.05rem" }}>{plant}</p>
            <p style={{ margin: 0, color: "#475569" }}>Clean tile with title, price, and CTA.</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 800, color: "#0f172a" }}>$38.00</span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button style={{ border: "1px solid #d1d5db", background: "#f8fafc", borderRadius: "10px", padding: "0.45rem 0.75rem", fontWeight: 700, color: "#1d4ed8" }}>
                  Favorite
                </button>
                <button style={{ border: "none", background: "#0f172a", color: "#fff", borderRadius: "10px", padding: "0.45rem 0.75rem", fontWeight: 800 }}>
                  Add to cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <span style={{ padding: "0.55rem 0.95rem", background: "#ecfdf3", color: "#15803d", borderRadius: "999px", fontWeight: 700 }}>
          Favorites enabled
        </span>
        <span style={{ padding: "0.55rem 0.95rem", background: "#eff6ff", color: "#1d4ed8", borderRadius: "999px", fontWeight: 700 }}>
          Cart ready
        </span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<Role>("admin");
  const [loggedInRole, setLoggedInRole] = useState<Role | null>(null);
  const [adminView, setAdminView] = useState<"store" | "customer">("store");
  const [error, setError] = useState<string | undefined>();

  const account = useMemo(() => demoAccounts[selectedRole], [selectedRole]);

  useEffect(() => {
    setLoggedInRole(null);
    setError(undefined);
  }, [selectedRole]);

  const handleLogin = (email: string, password: string) => {
    if (email === account.email && password === account.password) {
      setLoggedInRole(selectedRole);
      setError(undefined);
    } else {
      setLoggedInRole(null);
      setError("Invalid credentials for the selected role. Use the provided demo values.");
    }
  };

  return (
    <div style={{ background: "#020617", minHeight: "100vh", color: "#e2e8f0" }}>
      <section style={{ ...sectionStyle, paddingTop: "3.5rem", paddingBottom: "1rem" }}>
        <div style={{ ...panelStyle, display: "grid", gap: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "grid", gap: "0.55rem" }}>
              <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                <span style={{ padding: "0.4rem 0.75rem", borderRadius: "999px", background: "rgba(52,211,153,0.14)", color: "#34d399", fontWeight: 800 }}>Plantera demo</span>
                <span style={{ padding: "0.4rem 0.75rem", borderRadius: "999px", background: "rgba(96,165,250,0.15)", color: "#93c5fd", fontWeight: 800 }}>Admin dropdown ready</span>
              </div>
              <h1 style={{ margin: 0, fontSize: "2.5rem", lineHeight: 1.05 }}>Log in once and jump between Store and Customer modes.</h1>
              <p style={{ margin: 0, maxWidth: 820, color: "#cbd5e1", lineHeight: 1.6 }}>
                Use the demo credentials to sign in. Admins unlock a dropdown that instantly switches the interface preview between the Store dashboard and the Customer shopping flow.
              </p>
            </div>
            <div style={{ display: "grid", gap: "0.4rem", justifyItems: "end" }}>
              <span style={{ fontWeight: 700, color: "#cbd5e1" }}>Choose a profile</span>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                {["admin", "store", "customer"].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role as Role)}
                    style={{
                      padding: "0.65rem 0.95rem",
                      borderRadius: "12px",
                      border: selectedRole === role ? "1px solid #34d399" : "1px solid rgba(148,163,184,0.35)",
                      background: selectedRole === role ? "rgba(52,211,153,0.16)" : "rgba(255,255,255,0.06)",
                      color: "#e2e8f0",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.95rem" }}>Switching profiles resets the login panel for clarity.</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.5rem", alignItems: "stretch" }}>
            <LoginCard role={selectedRole} onLogin={handleLogin} error={error} />
            <div style={{ ...cardStyle, display: "grid", gap: "0.85rem", background: "rgba(255,255,255,0.92)", color: "#0f172a" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ padding: "0.35rem 0.7rem", borderRadius: "999px", background: "#eef2ff", color: "#4f46e5", fontWeight: 800 }}>API quickstart</span>
                <p style={{ margin: 0, color: "#475569" }}>Try these right after logging in.</p>
              </div>
              <div style={{ display: "grid", gap: "0.65rem" }}>
                {apiExamples.map((api) => (
                  <div key={api.title} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "0.85rem", background: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ margin: 0, fontWeight: 800 }}>{api.title}</p>
                      <span style={{ padding: "0.25rem 0.55rem", borderRadius: "10px", background: "#0f172a", color: "#fff", fontWeight: 800 }}>{api.method}</span>
                    </div>
                    <p style={{ margin: "0.25rem 0", color: "#475569" }}>{api.url}</p>
                    <pre
                      style={{
                        margin: 0,
                        background: "#0f172a",
                        color: "#e2e8f0",
                        padding: "0.75rem",
                        borderRadius: "10px",
                        overflowX: "auto",
                        fontSize: "0.9rem",
                      }}
                    >
                      {JSON.stringify(api.payload, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ ...sectionStyle, paddingTop: 0 }}>
        <div style={{ ...cardStyle, background: "rgba(255,255,255,0.95)", display: "grid", gap: "1rem", borderColor: "#d9e3f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: 0, color: "#475569", fontWeight: 800 }}>Interface preview</p>
              <h2 style={{ margin: "0.15rem 0", color: "#0f172a" }}>Watch the interface change as Admin</h2>
              <p style={{ margin: 0, color: "#475569" }}>
                Log in as Admin and use the dropdown to flip between Store management and Customer shopping views without refreshing.
              </p>
            </div>
            <ViewSwitcher adminView={adminView} onChange={setAdminView} />
          </div>
          <AdminPreview view={adminView} />
          {loggedInRole === "admin" ? (
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <span style={{ padding: "0.55rem 0.9rem", borderRadius: "12px", background: "#ecfdf3", color: "#15803d", fontWeight: 800 }}>
                You are logged in as Admin
              </span>
              <span style={{ padding: "0.55rem 0.9rem", borderRadius: "12px", background: "#eff6ff", color: "#1d4ed8", fontWeight: 800 }}>
                Dropdown available above
              </span>
            </div>
          ) : (
            <p style={{ margin: 0, color: "#475569", background: "#f8fafc", padding: "0.75rem 0.9rem", borderRadius: "12px" }}>
              Log in as Admin to activate the live preview toggle. Store and Customer logins stay focused on their own flows.
            </p>
          )}
        </div>
      </section>

      {loggedInRole && loggedInRole !== "admin" && (
        <section style={{ ...sectionStyle, paddingTop: "1rem" }}>
          <div style={{ ...cardStyle, display: "grid", gap: "0.75rem", background: "rgba(255,255,255,0.95)", borderColor: "#d9e3f0" }}>
            <h2 style={{ margin: 0, color: "#0f172a" }}>You are logged in as {loggedInRole}</h2>
            <p style={{ margin: 0, color: "#475569" }}>
              Explore the API actions above that match this role, then hop back to Admin to compare storefront vs. customer-facing layouts using the dropdown.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
