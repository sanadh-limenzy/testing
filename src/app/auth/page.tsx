import { LoginForm } from "../../components/auth/AuthPageClient";
import { getCurrentUserServer } from "@/lib/auth-server";
import { redirectUserToHome } from "@/lib/server-utils";
import Image from "next/image";

export const dynamic = 'force-dynamic';

export default async function AuthPage() {
  const user = await getCurrentUserServer();

  if (user) {
    await redirectUserToHome(user.user_metadata.user_type);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="relative w-full h-16 mx-auto">
          <Image
            src="/assets/tar-logo.png"
            alt="The Augusta Rule"
            fill
            className="object-contain"
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
