import React, { useState, useCallback } from "react";
import { Download, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FileDownloaderProps {
  fileId: string;
  folderName: string;
  descFolderId?: string; // Optional description folder ID
}

const apiUrl = "https://jovanalbum-system-backend.onrender.com";
// const apiUrl = "http://localhost:8001";

const FileDownloader: React.FC<FileDownloaderProps> = ({
  fileId,
  folderName,
  descFolderId
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    setError(null);

    const downloadId = `download-${Date.now()}`;
    let totalSize = 0;

    try {
      // Step 1: Get size
      const sizeResponse = await fetch(`${apiUrl}/download/size`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fileId,
          descFolderId // Include in size calculation if provided
        })
      });

      if (!sizeResponse.ok) {
        throw new Error(
          `Failed to get size: ${sizeResponse.status} ${sizeResponse.statusText}`
        );
      }

      const sizeText = await sizeResponse.text();
      try {
        const sizeData = JSON.parse(sizeText);
        totalSize = sizeData.size;
      } catch (e) {
        console.warn("Failed to parse size response:", sizeText);
        console.log("Error:", e);
      }

      // Dispatch download start
      window.dispatchEvent(
        new CustomEvent("downloadStart", {
          detail: { id: downloadId, folderName, totalSize }
        })
      );

      // Step 2: Start download
      const downloadResponse = await fetch(`${apiUrl}/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fileId,
          descFolderId // Include description folder ID if provided
        })
      });

      if (!downloadResponse.ok) {
        throw new Error(
          `Download failed: ${downloadResponse.status} ${downloadResponse.statusText}`
        );
      }

      const contentType = downloadResponse.headers.get("Content-Type");

      if (contentType?.includes("text/html")) {
        throw new Error(
          "Server returned an HTML error page instead of the file"
        );
      }

      if (downloadResponse.body) {
        const reader = downloadResponse.body.getReader();
        const chunks: Uint8Array[] = [];
        let receivedLength = 0;

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          chunks.push(value);
          receivedLength += value.length;

          // Update progress
          if (totalSize > 0) {
            const progress = Math.min(
              Math.round((receivedLength / totalSize) * 100),
              100
            );
            window.dispatchEvent(
              new CustomEvent("downloadProgress", {
                detail: {
                  id: downloadId,
                  progress,
                  receivedSize: receivedLength
                }
              })
            );
          } else {
            window.dispatchEvent(
              new CustomEvent("downloadProgress", {
                detail: {
                  id: downloadId,
                  progress: -1,
                  receivedSize: receivedLength
                }
              })
            );
          }
        }

        const blob = new Blob(chunks, {
          type: contentType || "application/octet-stream"
        });
        const url = window.URL.createObjectURL(blob);

        const contentDisposition = downloadResponse.headers.get(
          "Content-Disposition"
        );
        let filename = folderName;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(
            /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
          );
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, "");
          }
        }

        if (
          contentType?.includes("zip") &&
          !filename.toLowerCase().endsWith(".zip")
        ) {
          filename += ".zip";
        }

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        window.dispatchEvent(
          new CustomEvent("downloadComplete", {
            detail: { id: downloadId }
          })
        );
      } else {
        throw new Error("No response body received");
      }
    } catch (err) {
      console.error("Download error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Download failed";
      setError(errorMessage);

      window.dispatchEvent(
        new CustomEvent("downloadError", {
          detail: {
            id: downloadId,
            error: errorMessage
          }
        })
      );
    } finally {
      setIsDownloading(false);
    }
  }, [fileId, folderName, descFolderId, apiUrl]);

  return (
    <div className="space-y-4">
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
      >
        {isDownloading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Downloading...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Download
          </>
        )}
      </button>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default FileDownloader;
