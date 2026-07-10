import { Client, Databases, Storage, Functions, ID, Query } from "appwrite";
export const appwriteConfig = {
    endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1",
    projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || "YOUR_PROJECT_ID",
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || "devroom-db",
    projectsCollectionId: import.meta.env.VITE_APPWRITE_PROJECTS_COLLECTION_ID || "projects",
    membersCollectionId: import.meta.env.VITE_APPWRITE_MEMBERS_COLLECTION_ID || "members",
    foldersCollectionId: import.meta.env.VITE_APPWRITE_FOLDERS_COLLECTION_ID || "folders",
    filesCollectionId: import.meta.env.VITE_APPWRITE_FILES_COLLECTION_ID || "files",
    messagesCollectionId: import.meta.env.VITE_APPWRITE_MESSAGES_COLLECTION_ID || "messages",
    typingCollectionId: import.meta.env.VITE_APPWRITE_TYPING_COLLECTION_ID || "typing",
    presenceCollectionId: import.meta.env.VITE_APPWRITE_PRESENCE_COLLECTION_ID || "presence",
    aiMessagesCollectionId: import.meta.env.VITE_APPWRITE_AI_MESSAGES_COLLECTION_ID || "ai_messages",
    resourcesBucketId: import.meta.env.VITE_APPWRITE_RESOURCES_BUCKET_ID || "resources",
    chatAttachmentsBucketId: import.meta.env.VITE_APPWRITE_CHAT_ATTACHMENTS_BUCKET_ID || "chat-attachments",
    aiChatFunctionId: import.meta.env.VITE_APPWRITE_AI_CHAT_FUNCTION_ID || "ai-chat",
    sendInviteFunctionId: import.meta.env.VITE_APPWRITE_SEND_INVITE_FUNCTION_ID || "send-invite-email",
};

const client = new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId);

export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);
export { ID, Query };
export default client;