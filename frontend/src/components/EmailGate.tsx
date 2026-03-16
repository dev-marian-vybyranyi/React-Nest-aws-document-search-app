import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, Mail } from "lucide-react";
import { useState } from "react";
import { useDocumentStore } from "../store/documentStore";

export const EmailGate = () => {
  const [email, setEmail] = useState("");
  const setUserEmail = useDocumentStore((s) => s.setUserEmail);

  const handleSubmit = () => {
    if (!email.includes("@")) return;
    setUserEmail(email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white overflow-hidden">
      <Card className="w-full max-w-md overflow-hidden p-2">
        <CardHeader className="space-y-4 pb-4 text-center mt-4">
          <div className="space-y-2">
            <CardTitle className="text-3xl font-extrabold text-slate-900">
              Document Search
            </CardTitle>
            <p className="text-slate-500 text-base font-medium">
              Enter your email to access the service
            </p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 px-4 pb-6">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600" />
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="pl-12 h-14 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-600 transition-all rounded-xl text-lg"
            />
          </div>
          <Button
            onClick={handleSubmit}
            className="w-full h-14 bg-slate-900 hover:bg-indigo-600 text-white text-lg font-semibold rounded-xl"
          >
            Continue
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
