import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { account, ID } from "../lib/appwrite";
import { linkPendingInvites } from "../lib/linkInvites";
import { getProfile, setMyAvatar, clearMyAvatar } from "../lib/profiles";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrlState] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  async function loadAvatar(userId) {
    const profile = await getProfile(userId);
    setAvatarUrlState(profile?.avatarUrl || null);
  }

  useEffect(() => {
    account
      .get()
      .then(async (u) => {
        setAuthUser(u);
        await loadAvatar(u.$id);
        linkPendingInvites(u.$id, u.email).catch(() => {});
      })
      .catch(() => setAuthUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signup = useCallback(async (email, password, name) => {
    await account.create(ID.unique(), email, password, name);
    await account.createEmailPasswordSession(email, password);
    const u = await account.get();
    setAuthUser(u);
    await loadAvatar(u.$id);
    await linkPendingInvites(u.$id, u.email).catch(() => {});
    return u;
  }, []);

  const login = useCallback(async (email, password) => {
    await account.createEmailPasswordSession(email, password);
    const u = await account.get();
    setAuthUser(u);
    await loadAvatar(u.$id);
    await linkPendingInvites(u.$id, u.email).catch(() => {});
    return u;
  }, []);

  const logout = useCallback(async () => {
    await account.deleteSession("current");
    setAuthUser(null);
    setAvatarUrlState(null);
  }, []);

  async function setAvatarFile(file) {
    if (!file || !authUser) return;
    setUploadingAvatar(true);
    try {
      const doc = await setMyAvatar(authUser.$id, file);
      setAvatarUrlState(doc.avatarUrl);
      return doc.avatarUrl;
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function clearAvatar() {
    if (!authUser) return;
    await clearMyAvatar(authUser.$id);
    setAvatarUrlState(null);
  }

  const user = authUser
    ? {
        $id: authUser.$id,
        name: authUser.name || "Team Member",
        email: authUser.email,
        avatarUrl,
        uploadingAvatar,
        setAvatarFile,
        clearAvatar,
        isAuthenticated: true,
      }
    : null;

  return (
    <UserContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  if (!ctx.user) throw new Error("useUser called with no authenticated user — wrap this route in <RequireAuth>");
  return ctx.user;
}

export function useAuth() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useAuth must be used within UserProvider");
  return ctx;
}