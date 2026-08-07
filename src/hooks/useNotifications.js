import { useCallback, useEffect, useState } from "react";
import { databases, appwriteConfig, client, Query } from "../lib/appwrite";
import { useUser } from "../context/UserContext";
import { markNotificationRead, markAllNotificationsRead } from "../lib/notifications";

const { databaseId, notificationsCollectionId } = appwriteConfig;

export function useNotifications() {
    const user = useUser();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async() => {
        setLoading(true);
        try {
            const res = await databases.listDocuments(databaseId, notificationsCollectionId, [
                Query.equal("userId", user.$id),
                Query.orderDesc("$createdAt"),
                Query.limit(30),
            ]);
            setNotifications(res.documents);
        } catch (err) {
            console.warn("Failed to load notifications:", err.message);
        } finally {
            setLoading(false);
        }
    }, [user.$id]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        const unsubscribe = client.subscribe(
            `databases.${databaseId}.collections.${notificationsCollectionId}.documents`,
            (event) => {
                const doc = event.payload;
                if (doc.userId !== user.$id) return;
                if (event.events.some((e) => e.endsWith(".create"))) {
                    setNotifications((prev) => [doc, ...prev]);
                } else if (event.events.some((e) => e.endsWith(".update"))) {
                    setNotifications((prev) => prev.map((n) => (n.$id === doc.$id ? doc : n)));
                } else if (event.events.some((e) => e.endsWith(".delete"))) {
                    setNotifications((prev) => prev.filter((n) => n.$id !== doc.$id));
                }
            }
        );
        return () => unsubscribe();
    }, [user.$id]);

    const markRead = useCallback(async(id) => {
        setNotifications((prev) => prev.map((n) => (n.$id === id ? {...n, read: true } : n)));
        await markNotificationRead(id).catch(() => {});
    }, []);

    const markAllRead = useCallback(async() => {
        const unreadIds = notifications.filter((n) => !n.read).map((n) => n.$id);
        setNotifications((prev) => prev.map((n) => ({...n, read: true })));
        await markAllNotificationsRead(unreadIds);
    }, [notifications]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    return { notifications, unreadCount, loading, markRead, markAllRead, refetch: fetchNotifications };
}