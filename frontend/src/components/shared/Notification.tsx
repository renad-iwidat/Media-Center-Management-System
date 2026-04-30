import { useEffect, useRef } from "react";
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
  // ✅ خزّن onClose في ref لتجنب إعادة تشغيل الـ effect عند تغيير الدالة
  const onCloseRef = useRef(onClose);
  
  // تحديث الـ ref عند تغيير onClose
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // ✅ الآن الـ timer مستقر ولا يتأثر بتغيير onClose
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => onCloseRef.current(), duration);
    return () => clearTimeout(timer);
  }, [notification, duration]); // ✅ حذفنا onClose من dependencies

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
          className={`${positionClass} px-8 py-4 rounded-2xl font-bold text-base flex items-center gap-3 shadow-lg z-50 cursor-pointer ${
            notification.type === "success"
              ? "bg-emerald-100 border border-emerald-300 text-emerald-700"
              : "bg-rose-100 border border-rose-300 text-rose-700"
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
