import { headers } from "next/headers";
import { prisma } from "../../lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const headerStore = await headers();
  const orgId  = headerStore.get("x-org-id");
  const userId = headerStore.get("x-user-id");
  const role   = headerStore.get("x-member-role");

  if (!orgId || !userId) redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: { members: { include: { user: { select: { name: true, email: true } } } } },
  });

  if (!org) redirect("/login");

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px", color: "#111827" }}>{org.name}</h1>
        <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
          Plan: <strong style={{ color: "#2563eb" }}>{org.plan}</strong> &nbsp;|&nbsp; Your role: <strong>{role}</strong>
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Team Members", value: org.members.length },
          { label: "Slug",         value: org.slug },
          { label: "Member Since", value: new Date(org.createdAt).toLocaleDateString() },
        ].map((m) => (
          <div key={m.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "20px 24px" }}>
            <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #f3f4f6" }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: "#111827" }}>Team Members</h2>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ color: "#9ca3af", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {["Name", "Email", "Role", "Joined"].map((h) => (
                <th key={h} style={{ padding: "10px 24px", textAlign: "left", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {org.members.map((m, i) => (
              <tr key={m.id} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 === 0 ? "transparent" : "#fafafa" }}>
                <td style={{ padding: "14px 24px", fontWeight: 500, color: "#111827" }}>{m.user.name}</td>
                <td style={{ padding: "14px 24px", color: "#6b7280" }}>{m.user.email}</td>
                <td style={{ padding: "14px 24px" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: m.role === "OWNER" ? "#7c3aed" : m.role === "ADMIN" ? "#2563eb" : "#374151", background: m.role === "OWNER" ? "#ede9fe" : m.role === "ADMIN" ? "#dbeafe" : "#f3f4f6", borderRadius: 4, padding: "2px 8px" }}>
                    {m.role}
                  </span>
                </td>
                <td style={{ padding: "14px 24px", color: "#9ca3af" }}>{new Date(m.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
