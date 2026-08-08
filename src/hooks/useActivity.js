import { useCallback, useEffect, useState } from "react";
import { databases, appwriteConfig, client, Query } from "../lib/appwrite";

const { databaseId, activityCollectionId } = appwriteConfig;

export function useActivity(projectId, limit = 20) {
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchActivity = useCallback(async() => {
        if (!projectId) return;
        setLoading(true);
        try {
            const res = await databases.listDocuments(databaseId, activityCollectionId, [
                Query.equal("projectId", projectId),
                Query.orderDesc("$createdAt"),
                Query.limit(limit),
            ]);
            setActivity(res.documents);
        } catch (err) {
            console.warn("Failed to load activity:", err.message);
        } finally {
            setLoading(false);
        }
    }, [projectId, limit]);

    useEffect(() => {
        fetchActivity();
    }, [fetchActivity]);

    useEffect(() => {
        if (!projectId) return;
        const unsubscribe = client.subscribe(
            `databases.${databaseId}.collections.${activityCollectionId}.documents`,
            (event) => {
                const doc = event.payload;
                if (doc.projectId !== projectId) return;
                if (event.events.some((e) => e.endsWith(".create"))) {
                    setActivity((prev) => [doc, ...prev].slice(0, limit));
                }
            }
        );
        return () => unsubscribe();
    }, [projectId, limit]);

    return { activity, loading, refetch: fetchActivity };
}