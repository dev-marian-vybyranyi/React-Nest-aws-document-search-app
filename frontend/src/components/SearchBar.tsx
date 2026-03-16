import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFormik } from "formik";
import { Search, X } from "lucide-react";
import { useDocumentStore } from "../store/documentStore";

export const SearchBar = () => {
  const { search, searchResults, clearSearch } = useDocumentStore();

  const formik = useFormik({
    initialValues: {
      query: "",
    },
    onSubmit: async (values) => {
      if (!values.query.trim()) return;
      await search(values.query);
    },
  });

  const handleClear = () => {
    formik.resetForm();
    clearSearch();
  };

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={formik.handleSubmit}
        className="flex gap-3 group relative"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors text-slate-400 group-focus-within:text-slate-600" />
          <Input
            id="query"
            name="query"
            type="text"
            placeholder="Search documents..."
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.query}
            className="pl-12 h-14 border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-950 rounded-xl text-lg w-full"
          />
        </div>
        <Button
          type="submit"
          className="h-14 px-8 bg-slate-900 hover:bg-slate-600 text-white text-lg font-semibold rounded-xl transition-colors"
        >
          Search
        </Button>
        {searchResults.length > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            className="h-14 px-4 border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </Button>
        )}
      </form>

      {searchResults.length > 0 && (
        <div className="flex flex-col gap-3">
          {searchResults.map((result) => (
            <Card
              key={result.id}
              className="overflow-hidden border-slate-200 rounded-xl"
            >
              <CardContent className="pt-5 pb-5">
                <p className="font-semibold text-slate-900 text-lg">
                  {result.userFilename}
                </p>
                {result.highlight && (
                  <p
                    className="text-base text-slate-600 mt-2 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: result.highlight }}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
