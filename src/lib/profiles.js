// Public-ish profile info (right now: just avatarUrl) that OTHER team
// members need to be able to see. Doc $id == the user's own $id, so
// "update my own profile" is always Role.user(self), which any session is
// allowed to grant.
import { Permission, Role } from "appwrite";
import { databases, storage, appwriteConfig, ID } from "./appwrite";

const { databaseId, profilesCollectionId, avatarsBucketId } = appwriteConfig;

export async function getProfile(userId) {
    try {
        return await databases.getDocument(databaseId, profilesCollectionId, userId);
    } catch {
        return null;
    }
}

export async function getProfiles(userIds) {
    const unique = [...new Set(userIds.filter(Boolean))];
    const results = await Promise.all(unique.map((id) => getProfile(id)));
    const map = {};
    unique.forEach((id, i) => {
        if (results[i]) map[id] = results[i];
    });
    return map;
}

export async function setMyAvatar(userId, file) {
    const uploaded = await storage.createFile(avatarsBucketId, ID.unique(), file);
    const avatarUrl = storage.getFileView(avatarsBucketId, uploaded.$id).toString();

    const existing = await getProfile(userId);
    if (existing) {
        return databases.updateDocument(databaseId, profilesCollectionId, userId, { avatarUrl });
    }
    return databases.createDocument(databaseId, profilesCollectionId, userId, { avatarUrl }, [
        Permission.read(Role.users()),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
    ]);
}

export async function clearMyAvatar(userId) {
    const existing = await getProfile(userId);
    if (existing) {
        return databases.updateDocument(databaseId, profilesCollectionId, userId, { avatarUrl: null });
    }
}