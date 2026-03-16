import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

export type DocumentStatus = "pending" | "success" | "error";

interface DocumentData {
  id: string;
  userFilename: string;
  uploadedAt: string;
  status: DocumentStatus;
}

interface DocumentCardProps {
  doc: DocumentData;
  onDelete: (id: string) => void;
}

const statusColor = {
  pending: "secondary",
  success: "default",
  error: "destructive",
} as const;

const statusLabel = {
  pending: "Indexing...",
  success: "Ready",
  error: "Error",
};

export const DocumentCard = ({ doc, onDelete }: DocumentCardProps) => {
  return (
    <Card className="overflow-hidden border-slate-200 rounded-xl group transition-colors hover:border-slate-300">
      <CardContent className="pt-5 pb-5 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-slate-900 text-lg line-clamp-1">
            {doc.userFilename}
          </p>
          <p className="text-sm font-medium text-slate-500">
            {new Date(doc.uploadedAt).toLocaleString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge
            variant={statusColor[doc.status]}
            className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-lg"
          >
            {statusLabel[doc.status]}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(doc.id)}
            className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors h-10 w-10 shrink-0"
            title="Delete document"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
