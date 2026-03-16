import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFormik } from "formik";
import { Search, X } from "lucide-react";
import { useDocumentStore } from "../store/documentStore";
import { SearchResultCard } from "./SearchResultCard";

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
      <form onSubmit={formik.handleSubmit} className="flex gap-3 relative">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors text-slate-400 group-focus-within:text-slate-600" />
          <Input
            id="query"
            name="query"
            type="text"
            placeholder="Search documents..."
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.query}
            className="pl-12 pr-12 h-14 border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-950 rounded-xl text-lg w-full"
          />
          {formik.values.query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <Button
          type="submit"
          className="h-14 px-8 bg-slate-900 hover:bg-slate-600 text-white text-lg font-semibold rounded-xl transition-colors"
        >
          Search
        </Button>
      </form>

      {searchResults.length > 0 && (
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex items-center justify-left gap-2">
            <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {searchResults.length}{" "}
            </span>
            <h2 className="text-xl font-bold text-slate-900">Search Results</h2>
          </div>
          <div className="flex flex-col gap-3">
            {searchResults.map((result) => (
              <SearchResultCard key={result.id} result={result as any} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
