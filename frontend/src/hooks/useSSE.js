import { useEffect, useRef } from "react";
// ייבוא ל-Sentry (אם כבר התקנת)
// import * as Sentry from "@sentry/react";

export default function useSSEOrWS(taskId, onSuccess, onFailure, onProgress) {
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const baseDelay = 3000;
  const sourceRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const heartbeatTimeoutRef = useRef(null);
  const HEARTBEAT_INTERVAL = 10000;

  useEffect(() => {
    if (!taskId) return;

    const connectSSE = () => {
      console.log(`🔗 [SSE] Connecting (try ${retryCountRef.current + 1}/${maxRetries})`);
      const source = new EventSource(`${import.meta.env.VITE_API_BASE_URL}/api/events/${taskId}`);
      sourceRef.current = source;
      startHeartbeat();

      source.onmessage = (event) => {
        resetHeartbeat();
        try {
          const data = JSON.parse(event.data);
          handleData(data);
        } catch (err) {
          reportError("SSE parse error", err);
          failAndCleanup({ error: "SSE parse error" });
        }
      };

      source.onerror = (err) => {
        reportError("SSE connection error", err);
        source.close();
        tryReconnect();
      };
    };

    const handleData = (data) => {
      if (data.status === "SUCCESS" || data.status === "completed") {
        onSuccess?.(data);
        cleanup();
      } else if (data.status === "failed" || data.status === "FAILURE") {
        onFailure?.(data);
        cleanup();
      } else if (typeof data.progress === "number") {
        onProgress?.(data.progress);
      }
    };

    const startHeartbeat = () => {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = setTimeout(() => {
        reportError("Heartbeat timeout");
        failAndCleanup({ error: "Heartbeat timeout" });
      }, HEARTBEAT_INTERVAL + 2000);
    };

    const resetHeartbeat = () => {
      clearTimeout(heartbeatTimeoutRef.current);
      startHeartbeat();
    };

    const tryReconnect = () => {
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        const delay = baseDelay * retryCountRef.current;
        console.log(`🔄 Reconnecting in ${delay / 1000}s...`);
        retryTimeoutRef.current = setTimeout(connectSSE, delay);
      } else {
        failAndCleanup({ error: "Connection failed after max retries" });
      }
    };

    const failAndCleanup = (error) => {
      onFailure?.(error);
      cleanup();
    };

    const reportError = (message, err = null) => {
      console.error(`❌ ${message}`, err || "");
      // Sentry.captureException(err || new Error(message));
    };

    const cleanup = () => {
      if (sourceRef.current) {
        sourceRef.current.close?.();
        sourceRef.current = null;
      }
      clearTimeout(retryTimeoutRef.current);
      clearTimeout(heartbeatTimeoutRef.current);
      retryCountRef.current = 0;
    };

    connectSSE();

    return () => {
      console.log("🛑 Cleaning up connection");
      cleanup();
    };
  }, [taskId, onSuccess, onFailure, onProgress]);
}
