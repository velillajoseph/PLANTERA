"use client";

import { useMemo, useState } from "react";

type Role = "admin" | "store" | "customer";

type DemoAccount = {
  email: string;
  password: string;
  notes?: string;
};

const sectionStyle: React.CSSProperties = {
  maxWidth: "1100px",
  margin: "0 auto",
  padding: "2.5rem 1.25rem",
};

const cardStyle: React.CSSProperties = {
  background: "#fff",
  padding: "1.5rem",
  borderRadius: "16px",
  boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
  border: "1px solid #e2e8f0",
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
    <div style={{ ...cardStyle, display: "grid", gap: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--muted)" }}>Demo login</p>
          <h3 style={{ margin: "0.1rem 0", textTransform: "capitalize" }}>{role}</h3>
        </div>
        <span
          style={{
            padding: "0.35rem 0.65rem",
            borderRadius: "999px",
            background: "#ecfdf3",
            color: "#15803d",
            fontWeight: 700,
            fontSize: "0.85rem",
            alignSelf: "start",
          }}
        >
          Ready
        </span>
      </div>
      <label style={{ display: "grid", gap: "0.25rem" }}>
        <span style={{ fontWeight: 600 }}>Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: "0.75rem",
            borderRadius: "12px",
            border: "1px solid #d4d4d8",
          }}
        />
      </label>
      <label style={{ display: "grid", gap: "0.25rem" }}>
        <span style={{ fontWeight: 600 }}>Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: "0.75rem",
            borderRadius: "12px",
            border: "1px solid #d4d4d8",
          }}
        />
      </label>
      {demo.notes && <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.5 }}>{demo.notes}</p>}
      {error && (
        <p style={{ margin: 0, color: "#b91c1c", fontWeight: 600 }}>
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => onLogin(email, password)}
        style={{
          padding: "0.9rem 1rem",
          borderRadius: "12px",
          background: "#0f172a",
          color: "#fff",
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
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
      <label style={{ fontWeight: 600 }}>Preview as</label>
      <select
        value={adminView}
        onChange={(e) => onChange(e.target.value as "store" | "customer")}
        style={{
          padding: "0.6rem 0.9rem",
          borderRadius: "12px",
          border: "1px solid #d4d4d8",
          background: "#fff",
          fontWeight: 600,
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
      <div style={{ ...cardStyle, display: "grid", gap: "0.5rem" }}>
        <h3 style={{ margin: 0 }}>Store dashboard</h3>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          Add new plants, update banners, and keep inventory fresh.
        </p>
        <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--muted)", lineHeight: 1.6 }}>
          <li>Quick actions to add inventory items with pricing and stock.</li>
          <li>Banner editor for seasonal promotions and shop personality.</li>
          <li>Featured plants list to highlight best-sellers instantly.</li>
        </ul>
      </div>
    );
  }

  return (
    <div style={{ ...cardStyle, display: "grid", gap: "0.5rem" }}>
      <h3 style={{ margin: 0 }}>Customer view</h3>
      <p style={{ margin: 0, color: "var(--muted)" }}>
        Browse the storefront, save favorites, and manage the cart just like your shoppers.
      </p>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {[1, 2, 3].map((item) => (
            <div key={item} style={{ ...cardStyle, boxShadow: "none", borderColor: "#e2e8f0" }}>
              <p style={{ margin: 0, fontWeight: 700 }}>Plant #{item}</p>
              <p style={{ margin: "0.35rem 0", color: "var(--muted)" }}>Modern tile with title and price emphasized.</p>
              <span style={{ fontWeight: 800 }}>$38.00</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <span style={{ padding: "0.5rem 0.9rem", background: "#ecfdf3", color: "#15803d", borderRadius: "999px", fontWeight: 700 }}>
            Favorites enabled
          </span>
          <span style={{ padding: "0.5rem 0.9rem", background: "#eff6ff", color: "#1d4ed8", borderRadius: "999px", fontWeight: 700 }}>
            Cart ready
          </span>
        </div>
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
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <section style={{ ...sectionStyle, paddingTop: "3rem", paddingBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, color: "var(--muted)", fontWeight: 700 }}>Plantera demo</p>
            <h1 style={{ margin: "0.25rem 0", fontSize: "2rem" }}>Log in and switch interfaces</h1>
            <p style={{ margin: 0, color: "var(--muted)", maxWidth: "720px" }}>
              Use the ready-made credentials below to log in as any profile. Admins can flip between
              Store and Customer experiences from a single dropdown without creating new users.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ fontWeight: 700 }}>Role</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role)}
              style={{
                padding: "0.65rem 0.9rem",
                borderRadius: "12px",
                border: "1px solid #d4d4d8",
                background: "#fff",
                fontWeight: 700,
              }}
            >
              <option value="admin">Admin</option>
              <option value="store">Store</option>
              <option value="customer">Customer</option>
            </select>
          </div>
        </div>
      </section>

      <section style={{ ...sectionStyle, paddingTop: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <LoginCard role={selectedRole} onLogin={handleLogin} error={error} />
          <div style={{ ...cardStyle, display: "grid", gap: "0.75rem" }}>
            <h3 style={{ margin: 0 }}>How to try the API quickly</h3>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              Start the backend and run these requests with curl or an API tool. Use the demo login above to mirror what the payloads represent in the UI.
            </p>
            <div style={{ display: "grid", gap: "0.65rem" }}>
              {apiExamples.map((api) => (
                <div key={api.title} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "0.75rem" }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>{api.title}</p>
                  <p style={{ margin: "0.25rem 0", color: "var(--muted)" }}>
                    <strong>{api.method}</strong> {api.url}
                  </p>
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
      </section>

      {loggedInRole === "admin" && (
        <section style={{ ...sectionStyle, paddingTop: 0 }}>
          <div style={{ ...cardStyle, display: "grid", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <p style={{ margin: 0, color: "var(--muted)", fontWeight: 700 }}>Admin sandbox</p>
                <h2 style={{ margin: "0.15rem 0" }}>Switch views instantly</h2>
                <p style={{ margin: 0, color: "var(--muted)" }}>
                  Preview the Store dashboard or Customer shopping experience using the dropdown.
                  Your preferred view maps to the <code>preferred_view</code> field in the admin API.
                </p>
              </div>
              <ViewSwitcher adminView={adminView} onChange={setAdminView} />
            </div>
            <AdminPreview view={adminView} />
          </div>
        </section>
      )}

      {loggedInRole && loggedInRole !== "admin" && (
        <section style={{ ...sectionStyle, paddingTop: 0 }}>
          <div style={{ ...cardStyle, display: "grid", gap: "0.75rem" }}>
            <h2 style={{ margin: 0 }}>You are logged in as {loggedInRole}</h2>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              Explore the API actions above that match this role, then hop back to Admin to compare storefront vs. customer-facing layouts.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
