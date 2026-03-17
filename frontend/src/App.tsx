import { useDocumentStore } from "./store/documentStore";
import { EmailGate } from "./components/EmailGate";
import { UploadButton } from "./components/UploadButton";
import { DocumentList } from "./components/DocumentList";
import { SearchBar } from "./components/SearchBar";
import { Header } from "./components/Header";

function App() {
  const { userEmail } = useDocumentStore();

  if (!userEmail) {
    return <EmailGate />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto py-10 px-4 flex flex-col gap-6">
        <Header />
        <UploadButton />
        <SearchBar />
        <DocumentList />
      </div>
    </div>
  );
}

export default App;
