import React, { useState, useRef, useEffect } from "react";

interface ReimbursementPlanSignatureData {
  business: { signature?: string };
}

interface Props {
  name: string;
  setSignatureData: (
    data: (prev: ReimbursementPlanSignatureData) => ReimbursementPlanSignatureData
  ) => void;
}

const ReimbursementPlanNamedSignature = ({ name, setSignatureData }: Props) => {
  const [selectedFont, setSelectedFont] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Define acceptable fonts for signatures
  const acceptableFonts = [
    { value: "Betmo", label: "Betmo" },
    { value: "Pattheda", label: "Pattheda" },
    { value: "Roger Heart", label: "Roger Heart" },
    { value: "Saint Hilton", label: "Saint Hilton" },
    { value: "Unicorn Confetti", label: "Unicorn Confetti" },
  ];

  useEffect(() => {
    setSelectedFont("");
  }, []);

  const handleSave = (selectedFont: string) => {
    setSelectedFont(selectedFont);
    const canvas = canvasRef.current;
    if (!canvas || !name) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear the canvas and draw the signature
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `32px ${selectedFont}`;
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, canvas.width / 2, canvas.height / 2);

    // Get the data URL of the signature image
    const signature = canvas.toDataURL("image/png");
    
    // Update signature data and trigger submission
    setSignatureData((prev) => ({
      ...prev,
      business: {
        signature: signature,
      },
    }));
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px" }}>
      {!name && (
        <div>
          <p className="text-center">Please enter your name</p>
        </div>
      )}
      {name && (
        <>
          <h3>Select Your Signature Style</h3>
          {acceptableFonts.map((font) => (
            <div
              key={font.value}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <input
                type="radio"
                name="signature"
                value={font.value}
                checked={selectedFont === font.value}
                onChange={() => handleSave(font.value)}
                style={{ marginRight: "10px" }}
              />
              <span style={{ fontFamily: font.value, fontSize: "24px" }}>
                {name}
              </span>
            </div>
          ))}
          <canvas ref={canvasRef} width="300" height="100"></canvas>
        </>
      )}
    </div>
  );
};

export default ReimbursementPlanNamedSignature;
