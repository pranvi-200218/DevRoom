import { useEffect, useState } from "react";
import { getProfiles } from "../lib/profiles";

// Given a list of userIds (e.g. from activeMembers), fetches their profile
// docs (currently just avatarUrl) so member lists can show real uploaded
// photos instead of always falling back to initials.
export function useProfiles(userIds) {
    const [profiles, setProfiles] = useState({});
    const key = userIds.filter(Boolean).sort().join(",");

    useEffect(() => {
        if (!key) {
            setProfiles({});
            return;
        }
        let cancelled = false;
        getProfiles(key.split(",")).then((map) => {
            if (!cancelled) setProfiles(map);
        });
        return () => {
            cancelled = true;
        };
    }, [key]);

    return profiles;
}