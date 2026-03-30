import { useEffect } from "react";
import { toast } from "sonner";

export function useRealtimeToast(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const ws = new WebSocket("ws://127.0.0.1:8000/ws/notifications");
    let pingInterval = null;

    ws.onopen = () => {
      console.log("Realtime WebSocket connected");
      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send("ping");
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const title = data.title || "Thông báo";
        const message = data.message || "";

        switch (data.type) {
          case "task_created":
            toast.success(title, { description: message });
            break;
          case "task_updated":
            toast.info(title, { description: message });
            break;
          case "task_completed":
            toast.success(title, { description: message });
            break;
          case "task_deleted":
            toast.warning(title, { description: message });
            break;
          case "error":
            toast.error(title, { description: message });
            break;
          default:
            toast(title, { description: message });
        }

        window.dispatchEvent(
          new CustomEvent("task-realtime-event", { detail: data })
        );
      } catch (error) {
        console.error("Invalid WS message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("Realtime WebSocket disconnected");
      if (pingInterval) clearInterval(pingInterval);
    };

    return () => {
      if (pingInterval) clearInterval(pingInterval);
      ws.close();
    };
  }, [enabled]);
}
