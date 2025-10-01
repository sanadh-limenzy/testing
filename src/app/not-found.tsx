import { Button } from "@/components/ui";
import { Home } from "lucide-react";
import Link from "next/link";

export default async function NotFound() {
  return (
    <div className="h-[70vh] flex flex-col items-center justify-center text-center font-sans bg-white text-black dark:bg-black dark:text-white">
      <div className="mb-8">
        <h1 className="inline-block m-0 mr-5 pr-6 text-2xl font-medium align-top leading-[49px] border-r border-black/30 dark:border-white/30">
          404
        </h1>
        <div className="inline-block">
          <h2 className="m-0 text-sm font-normal leading-[49px]">
            This page could not be found.
          </h2>
        </div>
      </div>

      <div className="flex gap-4">
        <Link href="/">
          <Button className="bg-blue-500 hover:bg-blue-600 text-white">
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
