"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  children?: React.ReactNode;
}

interface ErrorState {
  hasError: boolean;
  error?: Error;
}

export default class AdminErrorBoundary extends React.Component<
  ErrorProps,
  ErrorState
> {
  constructor(props: ErrorProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log admin-specific errors
    console.error("Admin Error caught by ErrorBoundary:", error, errorInfo);

    // You can add admin-specific error logging here
    // Example: logAdminError(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.reset();
  };

  render() {
    if (this.state.hasError) {
      // Check if the error is Forbidden (403) - show 404 page
      const isForbidden =
        this.state.error?.message?.includes("Forbidden") ||
        this.state.error?.message?.includes("403") ||
        this.state.error?.message?.includes("Unauthorized");

      if (isForbidden) {
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center">
              {/* 404 Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-gray-600" />
                </div>
              </div>

              {/* 404 Title */}
              <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                Admin Access Denied
              </h2>

              {/* 404 Message */}
              <p className="text-gray-600 mb-6">
                You don&apos;t have permission to access this admin page. This page
                may not exist or you may need different access privileges.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  asChild
                  className="flex items-center gap-2"
                >
                  <Link href="/admin/home">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-lg shadow-lg border border-gray-200 p-8">
            {/* Admin Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Admin Panel Error
            </h1>

            {/* Error Message */}
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-2">
                An error occurred in the admin panel. This has been logged for
                review.
              </p>
              <p className="text-sm text-gray-500">
                Please try refreshing the page or contact the development team
                if the issue persists.
              </p>
            </div>

            {/* Error Details (only in development) */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 rounded-md text-left">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Error Details:
                </h3>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                  {this.state.error.message}
                </pre>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                      Stack Trace
                    </summary>
                    <pre className="text-xs text-gray-500 mt-2 whitespace-pre-wrap break-words">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>

              <Button
                variant="outline"
                asChild
                className="flex items-center gap-2"
              >
                <Link href="/admin/home">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>

            {/* Admin Help */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Admin Panel Error</p>
                <p className="text-xs text-gray-400">
                  Error ID: {(this.state.error as unknown as { digest?: string })?.digest || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
