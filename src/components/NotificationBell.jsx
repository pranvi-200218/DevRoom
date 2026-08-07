import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import { notificationIcon } from "../lib/notifications";
import { relativeTime } from "../lib/format";

export default function NotificationBell() {
    const navigate = useNavigate();
    const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        function onClickOutside(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    function handleClickNotification(n) {
        markRead(n.$id);
        setOpen(false);
        if (n.projectId) navigate(`/project/${n.projectId}`);
    }

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((v) => !v)}
                className="relative w-9 h-9 flex items-center justify-center rounded-full text-outline-variant/60 hover:text-primary hover:bg-primary/10 transition-colors"
                title="Notifications"
            >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error"></span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto custom-scrollbar bg-surface-container-low border border-outline-variant/20 rounded-xl shadow-2xl z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10">
                        <span className="font-bold text-sm">Notifications</span>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} className="text-[11px] text-primary hover:underline">
                                Mark all read
                            </button>
                        )}
                    </div>

                    {notifications.length === 0 && (
                        <div className="p-6 text-center text-on-surface-variant text-sm">
                            No notifications yet.
                        </div>
                    )}

                    {notifications.map((n) => (
                        <div
                            key={n.$id}
                            onClick={() => handleClickNotification(n)}
                            className={`flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-outline-variant/5 hover:bg-surface-variant/20 transition-colors ${
                                n.read ? "opacity-60" : ""
                            }`}
                        >
                            <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">
                                {notificationIcon(n.type)}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-on-surface leading-snug">{n.message}</p>
                                <p className="text-[10px] text-outline mt-1">{relativeTime(n.$createdAt)}</p>
                            </div>
                            {!n.read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}