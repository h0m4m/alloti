import { LoginForm } from "@/components/login-form";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Alloti</h1>
          <p className="text-muted-foreground">
            Budget smarter. Sign in to continue.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
