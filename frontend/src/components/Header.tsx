import { LogOut } from "lucide-react";
import { useDocumentStore } from "../store/documentStore";

export const Header = () => {
  const { userEmail, clearUserEmail } = useDocumentStore();

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
        Document Search
      </h1>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-500 bg-slate-200/50 px-3 py-1 rounded-full">
          {userEmail}
        </span>
        <button
          onClick={clearUserEmail}
          className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
