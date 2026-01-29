"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Check, X, Loader2 } from "lucide-react";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 border-gray-300",
  SENT: "bg-blue-100 text-blue-800 border-blue-300",
  ACCEPTED: "bg-green-100 text-green-800 border-green-300",
  REJECTED: "bg-red-100 text-red-800 border-red-300",
  EXPIRED: "bg-orange-100 text-orange-800 border-orange-300",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Concept",
  SENT: "Verzonden",
  ACCEPTED: "Geaccepteerd",
  REJECTED: "Afgewezen",
  EXPIRED: "Verlopen",
};

interface EstimateHeaderProps {
  estimateId: string;
  projectId: string;
  name: string;
  status: string;
}

export function EstimateHeader({
  estimateId,
  projectId,
  name,
  status,
}: EstimateHeaderProps) {
  const router = useRouter();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [savingName, setSavingName] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  async function handleSaveName() {
    if (!editedName.trim() || editedName === name) {
      setEditedName(name);
      setIsEditingName(false);
      return;
    }

    setSavingName(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/estimates/${estimateId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: editedName.trim() }),
        }
      );

      if (response.ok) {
        setIsEditingName(false);
        router.refresh();
      } else {
        setEditedName(name);
      }
    } catch {
      setEditedName(name);
    } finally {
      setSavingName(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (newStatus === currentStatus) return;

    setSavingStatus(true);
    const previousStatus = currentStatus;
    setCurrentStatus(newStatus);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/estimates/${estimateId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        router.refresh();
      } else {
        setCurrentStatus(previousStatus);
      }
    } catch {
      setCurrentStatus(previousStatus);
    } finally {
      setSavingStatus(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      setEditedName(name);
      setIsEditingName(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {isEditingName ? (
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSaveName}
            className="text-2xl font-bold h-auto py-1 px-2 w-[300px]"
            disabled={savingName}
          />
          {savingName && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsEditingName(true)}
          className="group flex items-center gap-2 hover:bg-muted/50 rounded-md px-2 py-1 -ml-2 transition-colors"
        >
          <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
          <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      )}

      <Select
        value={currentStatus}
        onValueChange={handleStatusChange}
        disabled={savingStatus}
      >
        <SelectTrigger
          className={`w-auto h-7 text-xs font-medium border ${statusColors[currentStatus]} focus:ring-0 focus:ring-offset-0`}
        >
          {savingStatus ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : null}
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="DRAFT">Concept</SelectItem>
          <SelectItem value="SENT">Verzonden</SelectItem>
          <SelectItem value="ACCEPTED">Geaccepteerd</SelectItem>
          <SelectItem value="REJECTED">Afgewezen</SelectItem>
          <SelectItem value="EXPIRED">Verlopen</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
