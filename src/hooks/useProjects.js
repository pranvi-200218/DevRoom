import { useCallback, useEffect, useState } from "react";
import { databases, appwriteConfig, ID, Query } from "../lib/appwrite";
import { useUser } from "../context/UserContext";

const { databaseId, projectsCollectionId } = appwriteConfig;

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
            const doc = await databases.createDocument(databaseId, projectsCollectionId, ID.unique(), {
                name,
                description: description || "",
                icon: icon || "layers",
                status: "",
                pinned: false,
                ownerId: user.$id,
            });
            setProjects((prev) => [doc, ...prev]);
            return doc;
        }, [user.$id]
    );

    const updateProject = useCallback(async(id, data) => {
        const doc = await databases.updateDocument(databaseId, projectsCollectionId, id, data);
        setProjects((prev) => prev.map((p) => (p.$id === id ? doc : p)));
        return doc;
    }, []);

    const deleteProject = useCallback(async(id) => {
        await databases.deleteDocument(databaseId, projectsCollectionId, id);
        setProjects((prev) => prev.filter((p) => p.$id !== id));
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