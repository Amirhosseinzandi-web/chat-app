"use client";

import { useCallback, useEffect, useState } from "react";
import { Database, Trash2, Users } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";

type AdminUser = {
  _id: string;
  fullName: string;
  email: string;
  role?: "user" | "admin";
  profilePic?: string;
  createdAt?: string;
};

type Stats = { users: number; messages: number; online: number };

const AdminPanel = () => {
  // guard: admins only (non-admins get bounced by useRequireAuth to /login; extra check below)
  const { authUser, isCheckingAuth } = useRequireAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [confirmTarget, setConfirmTarget] = useState<AdminUser | null>(null);
  const [resetScope, setResetScope] = useState<"messages" | "all" | null>(null);
  const [resetText, setResetText] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, u] = await Promise.all([
        axiosInstance.get("/api/admin/stats"),
        axiosInstance.get("/api/admin/users"),
      ]);
      setStats(s.data);
      setUsers(u.data);
    } catch (err) {
      console.error("admin load failed:", err);
      toast.error("Failed to load admin data");
    }
  }, []);
 
  useEffect(() => {
    if (authUser?.role === "admin") load();
  }, [authUser, load]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-base-200">
        <span className="loading loading-ring loading-lg"></span>
      </div>
    );
  }

  if (!authUser || authUser.role !== "admin") {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-base-200 p-6">
        <div className="bg-base-100 rounded-xl shadow-lg p-8 text-center max-w-sm">
          <h1 className="text-xl font-bold mb-2">Access denied</h1>
          <p className="text-base-content/60 text-sm">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const deleteUser = async (u: AdminUser) => {
    setBusy(true);
    try {
      await axiosInstance.delete(`/api/admin/user/${u._id}`);
      toast.success(`Deleted ${u.email}`);
      setConfirmTarget(null);
      await load();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const resetDb = async () => {
    if (!resetScope) return;
    setBusy(true);
    try {
      const res = await axiosInstance.post("/api/admin/reset", { scope: resetScope, confirm: resetText });
      toast.success(res.data.message);
      setResetScope(null);
      setResetText("");
      await load();
    } catch (err) {
      console.error(err);
      toast.error("Reset failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[100dvh] container mx-auto px-4 pt-24 pb-10 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Database className="size-6 text-primary" />
        <h1 className="text-2xl font-bold">Admin Panel</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-base-100 rounded-xl p-4 text-center shadow">
          <div className="text-2xl font-bold">{stats?.users ?? "-"}</div>
          <div className="text-xs text-base-content/60">Users</div>
        </div>
        <div className="bg-base-100 rounded-xl p-4 text-center shadow">
          <div className="text-2xl font-bold">{stats?.messages ?? "-"}</div>
          <div className="text-xs text-base-content/60">Messages</div>
        </div>
        <div className="bg-base-100 rounded-xl p-4 text-center shadow">
          <div className="text-2xl font-bold">{stats?.online ?? "-"}</div>
          <div className="text-xs text-base-content/60">Online now</div>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-base-100 rounded-xl shadow overflow-x-auto mb-10">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>
                  <div className="flex items-center gap-2">
                    <img src={u.profilePic || "/avatar.png"} alt={u.fullName} className="size-8 rounded-full object-cover" />
                    <span className="font-medium">{u.fullName}</span>
                  </div>
                </td>
                <td className="text-sm">{u.email}</td>
                <td>
                  <span className={`badge badge-sm ${u.role === "admin" ? "badge-primary" : "badge-ghost"}`}>
                    {u.role ?? "user"}
                  </span>
                </td>
                <td className="text-sm text-base-content/60">{u.createdAt?.split("T")[0]}</td>
                <td>
                  {u._id !== authUser._id && (
                    <button
                      className="btn btn-ghost btn-sm text-error"
                      onClick={() => setConfirmTarget(u)}
                      aria-label={`Delete user ${u.email}`}
                      disabled={busy}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Danger zone */}
      <div className="bg-base-100 rounded-xl shadow p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-error" />
          <h2 className="font-bold">Danger zone</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="btn btn-outline btn-error btn-sm" onClick={() => setResetScope("messages")} disabled={busy}>
            Delete ALL messages
          </button>
          <button className="btn btn-error btn-sm" onClick={() => setResetScope("all")} disabled={busy}>
            Reset EVERYTHING
          </button>
        </div>
        <p className="text-xs text-base-content/50">
          Reset EVERYTHING deletes all messages and all users except admin accounts. You must type DELETE to confirm.
        </p>
      </div>

      {/* Delete user modal */}
      {confirmTarget && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Delete user?</h3>
            <p className="py-4 text-sm">
              This permanently deletes <b>{confirmTarget.fullName}</b> ({confirmTarget.email}) and{" "}
              <b>all their messages</b>. This cannot be undone.
            </p>
            <div className="modal-action">
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmTarget(null)} disabled={busy}>
                Cancel
              </button>
              <button className="btn btn-error btn-sm" onClick={() => deleteUser(confirmTarget)} disabled={busy}>
                {busy ? "Deleting..." : "Delete user"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset modal */}
      {resetScope && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-error">
              {resetScope === "all" ? "Reset EVERYTHING?" : "Delete all messages?"}
            </h3>
            <p className="py-2 text-sm">
              {resetScope === "all"
                ? "All messages and all non-admin users will be permanently deleted."
                : "Every message in the database will be permanently deleted."}
            </p>
            <input
              className="input input-bordered input-error w-full mb-1"
              placeholder='type DELETE'
              value={resetText}
              onChange={(e) => setResetText(e.target.value)}
            />
            <div className="modal-action">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setResetScope(null);
                  setResetText("");
                }}
                disabled={busy}
              >
                Cancel
              </button>
              <button className="btn btn-error btn-sm" onClick={resetDb} disabled={busy || resetText !== "DELETE"}>
                {busy ? "Working..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
