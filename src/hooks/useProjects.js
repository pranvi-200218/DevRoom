import { useCallback, useEffect, useState } from "react";
import { databases, storage, teams, appwriteConfig, ID, Query } from "../lib/appwrite";
import { useUser } from "../context/UserContext";
import { buildProjectPermissions } from "../lib/permissions";
import { logActivity } from "../lib/activity";

const {
    databaseId,
    projectsCollectionId,
    membersCollectionId,
    messagesCollectionId,
    aiMessagesCollectionId,
    foldersCollectionId,
    filesCollectionId,
    typingCollectionId,
    presenceCollectionId,
    activityCollectionId,
    resourcesBucketId,
} = appwriteConfig;

export function useProjects() {
    const user = useUser();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchProjects = useCallback(async() => {
        setLoading(true);
        setError(null);
        try {
            const res = await databases.listDocuments(databaseId, projectsCollectionId, [
                Query.orderDesc("$updatedAt"),
                Query.limit(100),
            ]);
            setProjects(res.documents);
        } catch (err) {
            setError(err.message || "Failed to load projects. Check your Appwrite config in .env.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const createProject = useCallback(
        async({ name, description, icon }) => {
            const team = await teams.create(ID.unique(), name);

            const doc = await databases.createDocument(
                databaseId,
                projectsCollectionId,
                ID.unique(), {
                    name,
                    description: description || "",
                    icon: icon || "layers",
                    status: "",
                    pinned: false,
                    ownerId: user.$id,
                    teamId: team.$id,
                },
                buildProjectPermissions(team.$id)
            );
            setProjects((prev) => [doc, ...prev]);
            logActivity(doc.$id, "project_created", { actorName: user.name });
            return doc;
        }, [user.$id, user.name]
    );

    const updateProject = useCallback(async(id, data) => {
        const doc = await databases.updateDocument(databaseId, projectsCollectionId, id, data);
        setProjects((prev) => prev.map((p) => (p.$id === id ? doc : p)));
        logActivity(id, "project_updated", { actorName: user.name });
        return doc;
    }, [user.name]);

    const deleteProject = useCallback(async(id) => {
        // Appwrite doesn't cascade-delete anything on its own — deleting just
        // the project doc would leave every message, file, member record,
        // and the Team itself silently orphaned in the database/storage.
        // Clean those up first, then the project doc, then the Team last
        // (deleting the team first would strip everyone's permission to
        // delete the child documents that still reference it).
        const project = await databases.getDocument(databaseId, projectsCollectionId, id);

        const childCollections = [
            messagesCollectionId,
            aiMessagesCollectionId,
            foldersCollectionId,
            filesCollectionId,
            typingCollectionId,
            presenceCollectionId,
            activityCollectionId,
            membersCollectionId,
        ];

        for (const collectionId of childCollections) {
            try {
                const res = await databases.listDocuments(databaseId, collectionId, [
                    Query.equal("projectId", id),
                    Query.limit(500),
                ]);
                await Promise.all(
                    res.documents.map((doc) => {
                        if (collectionId === filesCollectionId && doc.storageFileId) {
                            storage.deleteFile(resourcesBucketId, doc.storageFileId).catch(() => {});
                        }
                        return databases.deleteDocument(databaseId, collectionId, doc.$id).catch(() => {});
                    })
                );
            } catch (err) {
                console.warn(`Cleanup failed for ${collectionId}:`, err.message);
            }
        }

        await databases.deleteDocument(databaseId, projectsCollectionId, id);
        setProjects((prev) => prev.filter((p) => p.$id !== id));

        if (project.teamId) {
            teams.delete(project.teamId).catch((err) => {
                console.warn("Project deleted, but its Team could not be removed:", err.message);
            });
        }
    }, []);

    const togglePin = useCallback(
        (id) => {
            const target = projects.find((p) => p.$id === id);
            if (!target) return Promise.resolve();
            return updateProject(id, { pinned: !target.pinned });
        }, [projects, updateProject]
    );

    const filtered = searchTerm.trim() ?
        projects.filter((p) => p.name.toLowerCase().includes(searchTerm.trim().toLowerCase())) :
        projects;

    const pinnedProjects = filtered.filter((p) => p.pinned);
    const recentProjects = filtered.filter((p) => !p.pinned);

    return {
        projects: filtered,
        allProjects: projects,
        pinnedProjects,
        recentProjects,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        createProject,
        updateProject,
        deleteProject,
        togglePin,
        refetch: fetchProjects,
    };
}

export function useProject(projectId) {
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!projectId) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        databases
            .getDocument(databaseId, projectsCollectionId, projectId)
            .then((doc) => {
                if (!cancelled) setProject(doc);
            })
            .catch((err) => {
                if (!cancelled) setError(err.message || "Project not found.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [projectId]);

    return { project, loading, error };
}