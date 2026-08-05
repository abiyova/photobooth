import React, { useEffect, useState, useCallback, createContext, useContext, useRef } from "react";
import "../styles/toast.css";

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

function ToastItem({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 400);
    }, toast.duration || 3500);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const iconMap = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  return (
    <div className={`toast-item toast-${toast.type} ${exiting ? "toast-exit" : "toast-enter"}`}>
      <span className="toast-icon">{iconMap[toast.type] || iconMap.info}</span>
      <span className="toast-message">{toast.message}</span>
      <button
        className="toast-close"
        onClick={() => {
          setExiting(true);
          setTimeout(() => onRemove(toast.id), 400);
        }}
      >
        ×
      </button>
    </div>
  );
}

function ConfirmModal({ config, onClose }) {
  const [exiting, setExiting] = useState(false);

  const handleConfirm = () => {
    setExiting(true);
    setTimeout(() => {
      config.onConfirm();
      onClose();
    }, 250);
  };

  const handleCancel = () => {
    setExiting(true);
    setTimeout(() => {
      config.onCancel?.();
      onClose();
    }, 250);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") handleCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`confirm-overlay ${exiting ? "confirm-overlay-exit" : ""}`} onClick={handleCancel}>
      <div className={`confirm-modal ${exiting ? "confirm-modal-exit" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon-wrap">
          <span className={`confirm-icon confirm-icon-${config.type || "warning"}`}>
            {config.type === "danger" ? "🗑️" : "⚠️"}
          </span>
        </div>
        <h3 className="confirm-title">{config.title || "Konfirmasi"}</h3>
        <p className="confirm-message">{config.message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn confirm-btn-cancel" onClick={handleCancel}>
            Batal
          </button>
          <button
            className={`confirm-btn confirm-btn-confirm ${config.type === "danger" ? "confirm-btn-danger" : ""}`}
            onClick={handleConfirm}
          >
            {config.confirmText || "Ya, Lanjutkan"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const idRef = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = "info", duration = 3500) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const showConfirm = useCallback(({ title, message, type, confirmText, onConfirm, onCancel }) => {
    setConfirmConfig({ title, message, type, confirmText, onConfirm, onCancel });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmConfig(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}
      {/* Toast container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
      {/* Confirm modal */}
      {confirmConfig && <ConfirmModal config={confirmConfig} onClose={closeConfirm} />}
    </ToastContext.Provider>
  );
}
