"use client";

import { Button } from "@/components/ui";
import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useIsNotFoundPage } from "@/components/providers/not-found-provider";

export default function NotFound() {
  const router = useRouter();
  const { setIsNotFoundPage } = useIsNotFoundPage();
  useEffect(() => {
    document.title = "404 - Page Not Found | TheAugustaRule";

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "The page you are looking for does not exist. Please check the URL or return to the home page."
      );
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content =
        "The page you are looking for does not exist. Please check the URL or return to the home page.";
      document.head.appendChild(meta);
    }
    setIsNotFoundPage(true);
  }, [setIsNotFoundPage]);

  return (
    <div className="h-screen flex flex-col items-center justify-center text-center font-sans bg-white text-black dark:bg-black dark:text-white">
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
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>

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
