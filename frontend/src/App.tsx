import { Toaster } from "react-hot-toast";
import { useDocumentStore } from "./store/documentStore";
import { EmailGate } from "./components/EmailGate";
import { UploadButton } from "./components/UploadButton";
import { DocumentList } from "./components/DocumentList";
import { SearchBar } from "./components/SearchBar";
import { LogOut } from "lucide-react";

function App() {
  const { userEmail, clearUserEmail } = useDocumentStore();

  if (!userEmail) {
    return (
      <>
        <Toaster position="top-right" />
        <EmailGate />
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto py-10 px-4 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Document Search</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-500 bg-slate-200/50 px-3 py-1 rounded-full">{userEmail}</span>
              <button 
                onClick={clearUserEmail}
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          <UploadButton />
          <SearchBar />
          <DocumentList />
        </div>
      </div>
    </>
  );
}

export default App;
