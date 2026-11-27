"use client";
import type { useJournalSync } from "@/lib/use-journal-sync";
import { Button } from "./ui";
export default function JournalSyncStatus({
  sync,
}: {
  sync: ReturnType<typeof useJournalSync>;
}) {
  return (
    <div
      className={`journal-sync-status${sync.error ? " sync-error" : ""}`}
      role="status"
    >
      <span>{sync.status}</span>
      {sync.conflict && (
        <>
          <p>
            Download your unsaved version before choosing which version to keep.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              const url = URL.createObjectURL(
                new Blob([JSON.stringify(sync.data, null, 2)], {
                  type: "application/json",
                }),
              );
              const a = document.createElement("a");
              a.href = url;
              a.download = "journal-unsaved.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download my changes
          </Button>
          <Button variant="secondary" onClick={() => sync.resolve(false)}>
            Load saved version
          </Button>
          <Button onClick={() => sync.resolve(true)}>
            Replace with my version
          </Button>
        </>
      )}
    </div>
  );
}
