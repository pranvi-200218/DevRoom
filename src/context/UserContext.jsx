import { createContext, useContext, useEffect, useState } from "react";
const ID_KEY = "devroom_user_id";
const NAME_KEY = "devroom_user_name";

const DEFAULT_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBTHLdCi81Y3kmL94me3c3twAskb4fS9P7F34JJlwbdkLOXfP7z31MqDu-lStyqpeLKCEORhiLdwx_lYECbUM90ARhqFdIyBttDXyYYAa-JQ96eMrSCS-XefShdCd9PDtCls-sElF7emeKP0aFBmv7T1F2RJBeMd4Sgf5AGx2TXCW6x5TiE7UoorC31uwmzP79kjyxxb9HWSFdmN5k7hPQ5jFx2II5R_ExxGbT_Jj_QkzW5hyVkmKI3W_lVJjmcPhtcM_6BtTQOKNs";

function getOrCreateUserId() {
  let id = localStorage.getItem(ID_KEY);
  if (!id) {
    id =
      "user-" +
      (crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2));
    localStorage.setItem(ID_KEY, id);
  }
  return id;
}

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [id] = useState(getOrCreateUserId);
  const [name, setNameState] = useState(
    () => localStorage.getItem(NAME_KEY) || "",
  );

  function setName(newName) {
    const trimmed = newName.trim();
    if (!trimmed) return;
    localStorage.setItem(NAME_KEY, trimmed);
    setNameState(trimmed);
  }

  const user = {
    $id: id,
    name: name || "Team Member",
    email: `${id}@devroom.local`,
    tier: "Pro Tier",
    avatarUrl: DEFAULT_AVATAR,
    setName,
    hasName: Boolean(name),
  };

  return <UserContext.Provider value={user}>
    {children}
  </UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
