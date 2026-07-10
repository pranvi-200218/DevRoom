import { useCallback, useEffect, useState } from "react";
import { databases, storage, appwriteConfig, ID, Query } from "../lib/appwrite";
import { useUser } from "../context/UserContext";

const { databaseId, foldersCollectionId, filesCollectionId, resourcesBucketId } = appwriteConfig;

export function useResources(projectId, folderId = null) {
  const user = useUser();
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAll = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const folderQuery = [
        Query.equal("projectId", projectId),
        folderId ? Query.equal("parentId", folderId) : Query.isNull("parentId"),
      ];
      const fileQuery = [
        Query.equal("projectId", projectId),
        folderId ? Query.equal("folderId", folderId) : Query.isNull("folderId"),
        Query.orderDesc("$createdAt"),
      ];
      const [folderRes, fileRes] = await Promise.all([
        databases.listDocuments(databaseId, foldersCollectionId, folderQuery),
        databases.listDocuments(databaseId, filesCollectionId, fileQuery),
      ]);
      setFolders(folderRes.documents);
      setFiles(fileRes.documents);
    } catch (err) {
      setError(err.message || "Failed to load resources.");
    } finally {
      setLoading(false);
    }
  }, [projectId, folderId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createFolder = useCallback(
    async (name) => {
      const doc = await databases.createDocument(databaseId, foldersCollectionId, ID.unique(), {
        projectId,
        name,
        parentId: folderId || null,
      });
      setFolders((prev) => [...prev, doc]);
      return doc;
    },
    [projectId, folderId]
  );

  const uploadFile = useCallback(
    async (file) => {
      const uploaded = await storage.createFile(resourcesBucketId, ID.unique(), file);
      const doc = await databases.createDocument(databaseId, filesCollectionId, ID.unique(), {
        projectId,
        folderId: folderId || null,
        name: file.name,
        storageFileId: uploaded.$id,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        uploadedBy: user.$id,
      });
      setFiles((prev) => [doc, ...prev]);
      return doc;
    },
    [projectId, folderId, user.$id]
  );

  const renameFile = useCallback(async (id, name) => {
    const doc = await databases.updateDocument(databaseId, filesCollectionId, id, { name });
    setFiles((prev) => prev.map((f) => (f.$id === id ? doc : f)));
    return doc;
  }, []);

  const deleteFile = useCallback(async (file) => {
    await storage.deleteFile(resourcesBucketId, file.storageFileId);
    await databases.deleteDocument(databaseId, filesCollectionId, file.$id);
    setFiles((prev) => prev.filter((f) => f.$id !== file.$id));
  }, []);

  const deleteFolder = useCallback(async (id) => {
    await databases.deleteDocument(databaseId, foldersCollectionId, id);
    setFolders((prev) => prev.filter((f) => f.$id !== id));
  }, []);

  const getFileUrl = useCallback((storageFileId) => {
    return storage.getFileView(resourcesBucketId, storageFileId);
  }, []);

  const getFilePreview = useCallback((storageFileId) => {
    try {
      return storage.getFilePreview(resourcesBucketId, storageFileId, 400, 300);
    } catch {
      return null;
    }
  }, []);

  const term = searchTerm.trim().toLowerCase();
  const filteredFiles = term ? files.filter((f) => f.name.toLowerCase().includes(term)) : files;
  const filteredFolders = term ? folders.filter((f) => f.name.toLowerCase().includes(term)) : folders;

  const totalBytes = files.reduce((sum, f) => sum + (f.size || 0), 0);

  return {
    folders: filteredFolders,
    files: filteredFiles,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    totalBytes,
    createFolder,
    uploadFile,
    renameFile,
    deleteFile,
    deleteFolder,
    getFileUrl,
    getFilePreview,
    refetch: fetchAll,
  };
}
