import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { account, storage, appwriteConfig, ID } from "../lib/appwrite";
import { linkPendingInvites } from "../lib/linkInvites";

const AVATAR_KEY_PREFIX = "devroom_avatar_url_"; // keyed per real user $id

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [authUser, setAuthUser] = useState(null); // Appwrite Account object, or null
  const [loading, setLoading] = useState(true); // still checking session on first load
  const [avatarUrl, setAvatarUrlState] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // On mount, check if there's already a valid session (so refresh doesn't log you out)
  useEffect(() => {
    account
      .get()
      .then((u) => {
        setAuthUser(u);
        setAvatarUrlState(localStorage.getItem(AVATAR_KEY_PREFIX + u.$id) || null);
        // Best-effort: don't block app load if this fails.
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
    setAvatarUrlState(localStorage.getItem(AVATAR_KEY_PREFIX + u.$id) || null);
    await linkPendingInvites(u.$id, u.email).catch(() => {});
    return u;
  }, []);

  const login = useCallback(async (email, password) => {
    await account.createEmailPasswordSession(email, password);
    const u = await account.get();
    setAuthUser(u);
    setAvatarUrlState(localStorage.getItem(AVATAR_KEY_PREFIX + u.$id) || null);
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
      const uploaded = await storage.createFile(appwriteConfig.avatarsBucketId, ID.unique(), file);
      const url = storage.getFileView(appwriteConfig.avatarsBucketId, uploaded.$id).toString();
      localStorage.setItem(AVATAR_KEY_PREFIX + authUser.$id, url);
      setAvatarUrlState(url);
      return url;
    } finally {
      setUploadingAvatar(false);
    }
  }

  function clearAvatar() {
    if (!authUser) return;
    localStorage.removeItem(AVATAR_KEY_PREFIX + authUser.$id);
    setAvatarUrlState(null);
  }

  const user = authUser
    ? {
        $id: authUser.$id,
        name: authUser.name || "Team Member",
        email: authUser.email,
        tier: "Pro Tier",
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

// Returns the current user object directly. Only call this inside routes
// that are wrapped in <RequireAuth> where a logged-in user is guaranteed.
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  if (!ctx.user) throw new Error("useUser called with no authenticated user — wrap this route in <RequireAuth>");
  return ctx.user;
}

// Use this in login/signup screens and route guards — gives access to
// loading state and the signup/login/logout actions, without throwing.
export function useAuth() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useAuth must be used within UserProvider");
  return ctx;
}