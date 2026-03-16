import { Card, CardContent } from "@/components/ui/card";
import type { SearchResult } from "../types/document.types";

interface SearchResultCardProps {
  result: SearchResult;
}

export const SearchResultCard = ({ result }: SearchResultCardProps) => {
  return (
    <Card className="overflow-hidden border-slate-200 bg-slate-50/80 rounded-xl">
      <CardContent className="pt-5 pb-5">
        <p className="font-semibold text-slate-900 text-lg">
          {result.userFilename}
        </p>
        {result.highlight && (
          <p
            className="text-base text-slate-600 mt-3 leading-relaxed border-l-2 border-slate-300 pl-3 italic bg-white p-3 rounded-lg"
            dangerouslySetInnerHTML={{ __html: result.highlight }}
          />
        )}
      </CardContent>
    </Card>
  );
};
