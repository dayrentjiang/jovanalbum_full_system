import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface DownloadNotification {
  id: string;
  folderName: string;
  progress: number;
  totalSize?: number; // Total size in bytes
}

const formatSizeMB = (bytes: number) => {
  // Handle invalid or missing input
  if (isNaN(bytes) || bytes <= 0) return "0,00 MB";

  // Convert bytes to MB and format to two decimal places
  const sizeInMB = (bytes / 1_000_000).toLocaleString("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  // Replace the decimal point with a comma
  return `${sizeInMB.replace(".", ",")} MB`;
};

const DownloadNotifications = () => {
  const [notifications, setNotifications] = useState<DownloadNotification[]>(
    []
  );

  useEffect(() => {
    const handleDownloadStart = (event: CustomEvent) => {
      const { folderName, id, totalSize } = event.detail;
      setNotifications((prev) => [
        ...prev,
        { id, folderName, progress: 0, totalSize }
      ]);
    };

    const handleDownloadProgress = (event: CustomEvent) => {
      const { id, progress } = event.detail;
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, progress } : notif))
      );
    };

    const handleDownloadComplete = (event: CustomEvent) => {
      const { id } = event.detail;
      setTimeout(() => {
        setNotifications((prev) => prev.filter((notif) => notif.id !== id));
      }, 2000);
    };

    const handleDownloadError = (event: CustomEvent) => {
      const { id, error } = event.detail;
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id
            ? { ...notif, error: error || "Download failed" }
            : notif
        )
      );
    };

    window.addEventListener(
      "downloadStart",
      handleDownloadStart as EventListener
    );
    window.addEventListener(
      "downloadProgress",
      handleDownloadProgress as EventListener
    );
    window.addEventListener(
      "downloadComplete",
      handleDownloadComplete as EventListener
    );
    window.addEventListener(
      "downloadError",
      handleDownloadError as EventListener
    );

    return () => {
      window.removeEventListener(
        "downloadStart",
        handleDownloadStart as EventListener
      );
      window.removeEventListener(
        "downloadProgress",
        handleDownloadProgress as EventListener
      );
      window.removeEventListener(
        "downloadComplete",
        handleDownloadComplete as EventListener
      );
      window.removeEventListener(
        "downloadError",
        handleDownloadError as EventListener
      );
    };
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-white rounded-lg shadow-lg p-4 max-w-md animate-slide-up border border-gray-200"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Downloading</h4>
            <button
              onClick={() =>
                setNotifications((prev) =>
                  prev.filter((n) => n.id !== notification.id)
                )
              }
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-2 truncate">
            {notification.folderName}
          </p>

          {notification.totalSize !== undefined && (
            <p className="text-xs text-gray-500">
              Size: {formatSizeMB(notification.totalSize)} MB
            </p>
          )}

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${notification.progress}%` }}
            />
          </div>

          <p className="text-xs text-gray-500 mt-1">
            {notification.progress === 100 || notification.progress === 0
              ? "Processing..."
              : `${notification.progress}% complete`}
          </p>
        </div>
      ))}
    </div>
  );
};

export default DownloadNotifications;
