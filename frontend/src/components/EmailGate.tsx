import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, Mail } from "lucide-react";
import { useFormik } from "formik";
import { useDocumentStore } from "../store/documentStore";
import { emailValidationSchema } from "../validations/emailValidation";

export const EmailGate = () => {
  const setUserEmail = useDocumentStore((s) => s.setUserEmail);

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: emailValidationSchema,
    onSubmit: (values) => {
      setUserEmail(values.email);
    },
  });

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
        <CardContent className="px-4 pb-6">
          <form onSubmit={formik.handleSubmit} className="flex flex-col gap-6">
            <div className="space-y-2">
              <div className="relative group">
                <Mail
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                    formik.touched.email && formik.errors.email
                      ? "text-red-500"
                      : "text-slate-400 group-focus-within:text-slate-600"
                  }`}
                />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.email}
                  className={`pl-12 h-14 border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-950 rounded-xl text-lg ${
                    formik.touched.email && formik.errors.email
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }`}
                />
              </div>
              {formik.touched.email && formik.errors.email ? (
                <div className="text-red-500 text-sm font-medium px-2">
                  {formik.errors.email}
                </div>
              ) : null}
            </div>
            <Button
              type="submit"
              className="w-full h-14 bg-slate-900 hover:bg-slate-600 text-white text-lg font-semibold rounded-xl transition-colors"
            >
              Continue
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
