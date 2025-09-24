"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PDFTestPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const generateRentalPDF = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        "/api/subscriber/pdf/rental-agreement-form",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event_id: "fc867312-a5ac-4d12-ad68-b2a579b5bcce",
          }),
        }
      );

      if (response.ok) {
        // Create download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "rental-agreement.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        setSuccess("PDF generated and downloaded successfully!");
      } else {
        const errorData = await response.json();
        setError(`PDF generation failed: ${errorData.error}`);
        console.error("PDF generation failed:", errorData);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(`Error: ${errorMessage}`);
      console.error("Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            PDF Generation Test
          </h1>
          <p className="text-gray-600">
            Test the rental agreement PDF generation functionality
          </p>
        </div>

        {/* Main Card */}
        <Card className="p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Sample Rental Agreement
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">
                    Property Info:
                  </h3>
                  <p className="text-gray-600">123 Main Street</p>
                  <p className="text-gray-600">San Francisco, CA 94102</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">
                    Event Info:
                  </h3>
                  <p className="text-gray-600">Birthday Party</p>
                  <p className="text-gray-600">
                    Dec 25, 2024 • 2:00 PM - 8:00 PM
                  </p>
                  <p className="text-gray-600">25 attendees</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Renter:</h3>
                  <p className="text-gray-600">John Smith</p>
                  <p className="text-gray-600">john@example.com</p>
                  <p className="text-gray-600">(555) 123-4567</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Pricing:</h3>
                  <p className="text-gray-600">Rental Rate: $500</p>
                  <p className="text-gray-600">Security Deposit: $200</p>
                  <p className="text-gray-600 font-semibold">Total: $700</p>
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-red-500 text-lg mr-3">❌</div>
                  <div>
                    <h3 className="text-red-800 font-medium">Error</h3>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-green-500 text-lg mr-3">✅</div>
                  <div>
                    <h3 className="text-green-800 font-medium">Success</h3>
                    <p className="text-green-700 text-sm">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <div className="flex justify-center">
              <Button
                onClick={generateRentalPDF}
                disabled={isGenerating}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                {isGenerating ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generating PDF...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>📄</span>
                    <span>Generate Rental Agreement PDF</span>
                  </div>
                )}
              </Button>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <h3 className="text-blue-800 font-medium mb-2">Instructions:</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>
                  • Click the button above to generate a sample rental agreement
                  PDF
                </li>
                <li>
                  • The PDF will be automatically downloaded to your device
                </li>
                <li>
                  • Check your browser&apos;s download folder for the generated
                  file
                </li>
                <li>
                  • The PDF includes all property, event, and party information
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
