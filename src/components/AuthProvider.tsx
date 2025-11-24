"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const supabase = getSupabaseBrowserClient();

        // Suppress auth errors in console by handling them gracefully
        const originalConsoleError = console.error;
        console.error = (...args: any[]) => {
            // Filter out Supabase auth errors from console
            const message = args[0]?.toString() || "";
            if (
                message.includes("AuthApiError") ||
                message.includes("Invalid Refresh Token") ||
                message.includes("Refresh Token Not Found")
            ) {
                // Silently handle the error by clearing the session
                supabase.auth.signOut({ scope: "local" });
                return;
            }
            originalConsoleError(...args);
        };

        return () => {
            console.error = originalConsoleError;
        };
    }, []);

    return <>{children}</>;
}
