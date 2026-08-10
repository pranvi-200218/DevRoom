import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { functions, appwriteConfig } from "../lib/appwrite";
import { mi } from "../lib/icons";

const { sendInviteFunctionId } = appwriteConfig;

export default function JoinProject() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const user = useUser();
    const [status, setStatus] = useState("joining");
    const [message, setMessage] = useState("");

    useEffect(() => {
        let cancelled = false;
        async function join() {
            try {
                const execution = await functions.createExecution(
                    sendInviteFunctionId,
                    JSON.stringify({ action: "joinViaLink", projectId, userId: user.$id, email: user.email, name: user.name }),
                    false
                );
                const result = JSON.parse(execution.responseBody || "{}");
                if (cancelled) return;
                if (result.error) { setStatus("error"); setMessage(result.error); return; }
                setStatus("done");
                setTimeout(() => { if (!cancelled) navigate(`/project/${projectId}`); }, 900);
            } catch (err) {
                if (!cancelled) { setStatus("error"); setMessage(err.message || "Couldn't join this project."); }
            }
        }
        join();
        return () => { cancelled = true; };
    }, [projectId, user.$id, user.email, user.name, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="glass rounded-2xl p-10 max-w-sm w-full text-center space-y-4">
                {status === "joining" && (<>
                    <i className={`${mi("progress_activity")} text-primary text-[36px]`} />
                    <p className="text-on-surface font-medium">Joining project…</p>
                </>)}
                {status === "done" && (<>
                    <i className={`${mi("check_circle")} text-primary text-[36px]`} />
                    <p className="text-on-surface font-medium">You're in! Taking you there…</p>
                </>)}
                {status === "error" && (<>
                    <i className={`${mi("error")} text-error text-[36px]`} />
                    <p className="text-on-surface font-medium mb-1">Couldn't join this project</p>
                    <p className="text-xs text-on-surface-variant mb-4">{message}</p>
                    <button onClick={() => navigate("/")} className="text-primary text-sm font-bold hover:underline">Back to DevRoom OS</button>
                </>)}
            </div>
        </div>
    );
}