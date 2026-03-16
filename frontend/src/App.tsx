import { Toaster } from "react-hot-toast";
import { EmailGate } from "./components/EmailGate";
import { SearchBar } from "./components/SearchBar";
import { UploadButton } from "./components/UploadButton";
import { useDocumentStore } from "./store/documentStore";

function App() {
  const userEmail = useDocumentStore((s) => s.userEmail);

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
      <UploadButton />
      <SearchBar />
    </>
  );
}

export default App;
