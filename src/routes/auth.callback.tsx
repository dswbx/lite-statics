import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Alert } from "@/components/ui/alert";
import { Eyebrow } from "@/components/ui/eyebrow";
import { consumeAuthHashSession } from "../lib/auth-hash-session";

export default function AuthCallbackPage() {
   const [, navigate] = useLocation();
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      let cancelled = false;

      void consumeAuthHashSession()
         .then((result) => {
            if (cancelled) return;
            if (!result) {
               setError("This confirmation link is missing required parameters.");
               return;
            }
            if (result.type === "recovery") {
               navigate("/auth/reset-password", { replace: true });
               return;
            }
            navigate("/dashboard", { replace: true });
         })
         .catch((verifyError) => {
            if (cancelled) return;
            setError(
               verifyError instanceof Error
                  ? verifyError.message
                  : "Link could not be verified.",
            );
         });

      return () => {
         cancelled = true;
      };
   }, [navigate]);

   return (
      <div className="shell-bg min-h-screen flex items-center justify-center p-6">
         <div className="max-w-md w-full">
            <Eyebrow className="mb-3">account</Eyebrow>
            <h1 className="font-mono text-[32px] font-semibold tracking-[-0.035em] mb-4">
               {error ? "Link could not be verified" : "Confirming your email"}
            </h1>
            {error ? (
               <>
                  <Alert tone="danger">{error}</Alert>
                  <p className="text-muted mt-4 text-[15px]">
                     Request a new link from the sign-in page if this one expired.
                  </p>
               </>
            ) : (
               <p className="text-muted text-[15px]">Hang tight while we verify your link.</p>
            )}
         </div>
      </div>
   );
}
