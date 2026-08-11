"use client";

import { useState, useEffect, useCallback } from "react";

type Notification = {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type NotificationType = "INFO" | "WARNING" | "URGENT";

const typeIcons: Record<string, string> = {
  LOW_STOCK: "📦",
  OUT_OF_STOCK: "🚨",
  NEW_ORDER: "🍽️",
  ORDER_READY: "✅",
  ORDER_CANCELLED: "❌",
  TABLE_ASSIGNED: "🪑",
  PAYMENT_RECEIVED: "💰",
  SHIFT_OPENED: "🕐",
  SHIFT_CLOSED: "🔒",
};

const priorityStyles: Record<string, { bg: string; text: string }> & Record<NotificationType, { bg: string; text: string }> = {
  INFO: { bg: "#e4f5ee", text: "#0e7a57" },
  WARNING: { bg: "#fef2dc", text: "#d97706" },
  URGENT: { bg: "#fdeaec", text: "#ef4444" },
};

export default function NotifikasiPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter === "unread") params.set("unreadOnly", "true");
      params.set("limit", "50");

      const res = await fetch(`/api/trpc/notifikasi.list?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.result?.data ?? []);
      }
    } catch {
      // Fallback: tampilkan placeholder
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await fetch("/api/trpc/notifikasi.markRead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: { notificationId: id } }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch {
      // silent fail
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/trpc/notifikasi.markAllRead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: {} }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silent fail
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="market-stack">
      <div className="market-page-title">
        <div>
          <p>Notifikasi</p>
          <h1>Pusat Notifikasi</h1>
          <span>Pantau notifikasi pesanan, stok, dan aktivitas restoran.</span>
        </div>
        <div className="market-primary-actions">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "999px",
                backgroundColor: "var(--surface)",
                border: "1px solid var(--line)",
                fontWeight: "600",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              Tandai Semua Dibaca ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "999px",
              backgroundColor: filter === f ? "var(--accent)" : "var(--surface)",
              color: filter === f ? "#fff" : "var(--ink)",
              border: filter === f ? "none" : "1px solid var(--line)",
              fontWeight: "600",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            {f === "all" ? "Semua" : "Belum Dibaca"}
          </button>
        ))}
      </div>

      {/* Daftar Notifikasi */}
      <section className="market-panel">
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>
            Memuat notifikasi...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>
            <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔔</p>
            <p>Tidak ada notifikasi {filter === "unread" ? "yang belum dibaca" : ""}.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {notifications.map((notif) => {
              const pStyle = priorityStyles[notif.priority as NotificationType] ?? priorityStyles.INFO;
              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "1rem",
                    padding: "1rem 1.25rem",
                    borderRadius: "16px",
                    backgroundColor: notif.isRead ? "transparent" : "var(--surface-2)",
                    border: "1px solid var(--line-2)",
                    cursor: notif.isRead ? "default" : "pointer",
                    opacity: notif.isRead ? 0.65 : 1,
                    transition: "background-color 0.2s",
                  }}
                >
                  <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>
                    {typeIcons[notif.type] ?? "📢"}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <strong style={{ fontSize: "0.9rem" }}>{notif.title}</strong>
                      <span
                        style={{
                          padding: "0.15rem 0.5rem",
                          borderRadius: "6px",
                          backgroundColor: pStyle.bg,
                          color: pStyle.text,
                          fontSize: "0.7rem",
                          fontWeight: "700",
                        }}
                      >
                        {notif.priority}
                      </span>
                      {!notif.isRead && (
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "var(--accent)",
                            display: "inline-block",
                          }}
                        />
                      )}
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: 0 }}>{notif.message}</p>
                    <small style={{ fontSize: "0.75rem", color: "var(--muted)", opacity: 0.7 }}>
                      {new Date(notif.createdAt).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
