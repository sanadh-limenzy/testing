import React, { useRef, useState } from "react";
import Signature, { SignatureRef } from "@uiw/react-signature";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SignatureData {
  business: { signature?: string };
}

interface SignatureCanvasProps {
  setSignatureData: (data: SignatureData) => void;
}

export default function SignatureCanvas({
  setSignatureData,
}: SignatureCanvasProps) {
  const signatureRef = useRef<null | SignatureRef>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const handleClear = () => {
    signatureRef.current?.clear();
    setHasDrawn(false);
  };

  const convertSvgToPng = (svgElement: SVGSVGElement): Promise<string> => {
    return new Promise((resolve, reject) => {
      const clientWidth = svgElement.clientWidth || 400;
      const clientHeight = svgElement.clientHeight || 200;

      // Clean up SVG for conversion
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
      clonedSvg.removeAttribute("style");
      clonedSvg.setAttribute("width", `${clientWidth}px`);
      clonedSvg.setAttribute("height", `${clientHeight}px`);
      clonedSvg.setAttribute("viewBox", `0 0 ${clientWidth} ${clientHeight}`);

      // Convert SVG to data URL using the working method
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgDataUrl = `data:image/svg+xml;base64,${window.btoa(
        unescape(encodeURIComponent(svgData))
      )}`;

      // Create image and convert to PNG
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = clientWidth;
          canvas.height = clientHeight;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          // Draw the signature (no background needed as PNG will be transparent where not drawn)
          ctx.drawImage(img, 0, 0);

          // Convert to PNG data URL
          const pngDataUrl = canvas.toDataURL("image/png");
          resolve(pngDataUrl);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error("Failed to load SVG image"));
      img.src = svgDataUrl;
    });
  };

  const handleSave = async () => {
    const svgelm = signatureRef.current?.svg?.cloneNode(true) as SVGSVGElement;
    if (!svgelm) {
      console.error("No signature data found");
      return;
    }

    setIsProcessing(true);

    try {
      const pngDataUrl = await convertSvgToPng(svgelm);

      setSignatureData({
        business: { signature: pngDataUrl },
      });
    } catch (error) {
      console.error("Error saving signature:", error);
      toast.error("Failed to save signature. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h4 className="text-lg font-medium text-gray-700 mb-2">
          Draw Your Signature
        </h4>
        <p className="text-sm text-gray-600">
          Use your mouse or touch to draw your signature in the box below
        </p>
      </div>

      <div
        className="border-2 border-gray-300 rounded-lg p-2 bg-white"
        onMouseDown={() => {setHasDrawn(true); handleSave()}}
        onTouchStart={() => {setHasDrawn(true); handleSave()}}
      >
        <Signature
          ref={signatureRef}
          options={{
            size: 2,
            smoothing: 0.5,
            thinning: 0.5,
          }}
          className="w-full h-40"
        />
      </div>

      <div className="flex gap-3 justify-center">
        <Button
          variant="outline"
          onClick={handleClear}
          disabled={isProcessing}
          className="flex-1 max-w-32"
        >
          Clear
        </Button>
      </div>

      {!hasDrawn && (
        <p className="text-xs text-gray-500 text-center">
          Draw your signature above to enable the save button
        </p>
      )}
    </div>
  );
}
