import { useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface NotificationData {
  type: "success" | "error";
  message: string;
}

interface NotificationProps {
  notification: NotificationData | null;
  onClose: () => void;
  duration?: number;
  position?: "top-right" | "center";
}

export function Notification({ notification, onClose, duration = 3000, position = "center" }: NotificationProps) {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [notification, onClose, duration]);

  const positionClass = position === "top-right"
    ? "fixed top-4 right-4"
    : "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={onClose}
          className={`${positionClass} px-8 py-4 rounded-2xl font-bold text-base flex items-center gap-3 shadow-2xl z-50 cursor-pointer ${
            notification.type === "success"
              ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400"
              : "bg-rose-500/20 border border-rose-500/50 text-rose-400"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 size={24} />
          ) : (
            <XCircle size={24} />
          )}
          {notification.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
