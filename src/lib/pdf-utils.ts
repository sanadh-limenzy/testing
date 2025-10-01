/**
 * @fileoverview Efficient PDF generation service using @sparticuz/chromium
 * @author v0-theaugustarule-express
 * @version 1.0.2
 */

import puppeteer, { Browser as PuppeteerBrowser } from "puppeteer";
import puppeteerCore, { PaperFormat, Browser as PuppeteerCoreBrowser } from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { format } from "date-fns";
import fs from "fs";
import path from "path";
import { env } from "@/env";

// IMPORTANT: Configure chromium for serverless
// Disable graphics mode for better performance in serverless
if (process.env.NODE_ENV === 'production') {
  chromium.setGraphicsMode = false;
  chromium.setHeadlessMode = true;
}

type PDFOptions = {
  filename?: string;
  orientation?: "portrait" | "landscape";
  paperSize?:
    | "a4"
    | "a3"
    | "a2"
    | "a1"
    | "a0"
    | "letter"
    | "legal"
    | "tabloid"
    | "A4";
  margins?: { top?: string; right?: string; bottom?: string; left?: string };
  printBackground?: boolean;
  displayHeaderFooter?: boolean;
  timeout?: number;
};

/**
 * PDF generation service with browser instance pooling and optimization
 */
class PDFService {
  private browser: PuppeteerCoreBrowser | PuppeteerBrowser | null;
  private isInitializing: boolean;
  private isProduction: boolean;

  constructor() {
    this.browser = null;
    this.isInitializing = false;
    this.isProduction =
      env.NODE_ENV !== "development" &&
      !env.NEXT_PUBLIC_APP_URL.includes("localhost");
  }

  async initBrowser() {
    if (this.browser && !this.browser.connected) {
      console.log(
        "PDF Service: Browser disconnected, forcing reinitialization"
      );
      this.browser = null;
    }

    if (this.browser && this.browser.connected) {
      return this.browser;
    }

    if (this.isInitializing) {
      let attempts = 0;
      while (this.isInitializing && attempts < 100) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }
      if (this.browser && this.browser.connected) {
        return this.browser;
      }
    }

    this.isInitializing = true;

    try {
      if (this.browser) {
        try {
          await this.browser.close();
        } catch (error) {
          if (error instanceof Error) {
            console.warn(
              "PDF Service: Error closing old browser:",
              error.message
            );
          }
        }
        this.browser = null;
      }

      if (this.isProduction) {
        console.log("PDF Service: Launching browser in production mode...");
        
        // For Vercel deployment, chromium will automatically download and decompress
        // the binary to /tmp at runtime if needed
        let executablePath: string;
        
        try {
          // This will download/decompress chromium if needed
          executablePath = await chromium.executablePath();
          console.log("PDF Service: Chromium executable path:", executablePath);
        } catch (pathError) {
          console.error("PDF Service: Failed to get executable path:", pathError);
          
          // Fallback: Try to use the system-installed chromium if available
          // This is for environments that have chromium pre-installed
          const fallbackPaths = [
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium',
            '/usr/bin/google-chrome',
            '/opt/google/chrome/chrome',
          ];
          
          let foundPath = null;
          for (const tryPath of fallbackPaths) {
            try {
              await fs.promises.access(tryPath, fs.constants.X_OK);
              foundPath = tryPath;
              console.log(`PDF Service: Found chromium at ${tryPath}`);
              break;
            } catch {}
          }
          
          if (!foundPath) {
            throw new Error("Could not find chromium executable. Please ensure @sparticuz/chromium is properly installed.");
          }
          
          executablePath = foundPath;
        }
        
        // Launch options optimized for Vercel
        const launchOptions = {
          args: [
            ...chromium.args,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--single-process', // Important for serverless
            '--no-zygote',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-blink-features=AutomationControlled',
            '--disable-accelerated-2d-canvas',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--font-render-hinting=none', // Improves font rendering
          ],
          executablePath: executablePath,
          headless: chromium.headless ?? true,
          ignoreDefaultArgs: ['--disable-extensions'],
          defaultViewport: chromium.defaultViewport || {
            width: 1200,
            height: 1600,
          },
        };

        this.browser = await puppeteerCore.launch(launchOptions);
      } else {
        // Development mode
        this.browser = await puppeteer.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
            "--no-first-run",
            "--no-zygote",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "--disable-ipc-flooding-protection",
          ],
          timeout: 30000,
        });
      }

      // Handle browser disconnect
      this.browser.on("disconnected", () => {
        console.log(
          "PDF Service: Browser disconnected, will reinitialize on next request"
        );
        this.browser = null;
      });

      console.log("PDF Service: Browser initialized successfully");
      return this.browser;
    } catch (error) {
      console.error("PDF Service: Failed to initialize browser:", error);
      this.browser = null;
      throw new Error(
        `Browser initialization failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      this.isInitializing = false;
    }
  }

  async ensureDownloadsDir() {
    const downloadsDir = path.join(process.cwd(), "public", "downloads");
    try {
      await fs.promises.access(downloadsDir, fs.constants.W_OK);
    } catch {
      console.log("PDF Service: Creating downloads directory...");
      await fs.promises.mkdir(downloadsDir, { recursive: true });
    }
    return downloadsDir;
  }

  generateFilename(baseName: string) {
    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, "_");
    return `${sanitizedBaseName}_${timestamp}.pdf`;
  }

  /**
   * Generate PDF from HTML content (in memory)
   */
  async generatePDF(
    html: string,
    options: PDFOptions = {
      displayHeaderFooter: false,
      filename: "",
      orientation: "portrait",
      paperSize: "a4",
      margins: {
        top: "0.5in",
        right: "0.25in",
        bottom: "0.5in",
        left: "0.25in",
      },
      printBackground: true,
      timeout: 30000,
    }
  ) {
    // Validate input
    if (!html || typeof html !== "string") {
      throw new Error("HTML content is required and must be a string");
    }

    if (!options.filename) {
      throw new Error("Filename is required in options");
    }

    // Set default options
    const {
      filename,
      orientation = "portrait",
      paperSize = "a4",
      margins = {
        top: "0.5in",
        right: "0.25in",
        bottom: "0.5in",
        left: "0.25in",
      },
      printBackground = true,
      displayHeaderFooter = false,
      timeout = 30000,
    } = options;

    let page = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        // Initialize browser and create page
        const browser = await this.initBrowser();

        // Check if browser is still connected
        if (!browser.connected) {
          throw new Error("Browser is not connected");
        }

        page = await browser.newPage();

        // Optimize page settings for serverless
        await page.setDefaultNavigationTimeout(timeout);
        await page.setDefaultTimeout(timeout);

        // Set viewport for consistent rendering
        await page.setViewport({
          width: 1200,
          height: 1600,
          deviceScaleFactor: 1,
        });

        // Set content and wait for complete loading
        await page.setContent(html, {
          waitUntil: ["networkidle0", "domcontentloaded"],
          timeout: timeout,
        });

        // Wait a bit more for any dynamic content
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Break out of retry loop if successful
        break;
      } catch (error) {
        retryCount++;

        if (error instanceof Error) {
          console.warn(
            `PDF Service: Attempt ${retryCount} failed:`,
            error.message
          );

          // Clean up page if it exists
          if (page) {
            try {
              await page.close();
            } catch (closeError) {
              console.warn(
                "PDF Service: Error closing page during retry:",
                closeError instanceof Error
                  ? closeError.message
                  : "Unknown error"
              );
            }
            page = null;
          }

          // Force browser reinitialization on frame detachment errors
          if (
            error.message.includes("detached") ||
            error.message.includes("disconnected")
          ) {
            console.log(
              "PDF Service: Forcing browser reinitialization due to detachment"
            );
            this.browser = null;
          }

          // If this was the last retry, throw the error
          if (retryCount >= maxRetries) {
            throw new Error(
              `PDF generation failed after ${maxRetries} attempts: ${error.message}`
            );
          }

          // Wait before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * retryCount)
          );
        }
      }
    }

    // If we get here, page setup was successful
    try {
      const generatedFilename = this.generateFilename(filename);

      if (page) {
        // Normalize paper size to lowercase for consistency
        const normalizedPaperSize = paperSize.toLowerCase() as PaperFormat;
        
        const pdfData = await page.pdf({
          format: normalizedPaperSize,
          landscape: orientation === "landscape",
          printBackground: printBackground,
          margin: margins,
          displayHeaderFooter: displayHeaderFooter,
          preferCSSPageSize: true,
          omitBackground: false,
        });

        // Ensure we have a proper Node.js Buffer
        const pdfBuffer = Buffer.isBuffer(pdfData)
          ? pdfData
          : Buffer.from(pdfData);

        console.log(
          `PDF Service: Generated PDF in memory - ${generatedFilename} (${pdfBuffer.length} bytes)`
        );

        const result = {
          success: true,
          filename: generatedFilename,
          buffer: pdfBuffer,
          size: pdfBuffer.length,
          mimeType: "application/pdf",
        };

        return result;
      } else {
        throw new Error("Page is not initialized");
      }
    } catch (error) {
      console.error("PDF Service: Error generating PDF:", error);
      throw new Error(
        `PDF generation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      // Always close the page to free resources
      if (page) {
        try {
          await page.close();
        } catch (closeError) {
          console.warn(
            "PDF Service: Error closing page:",
            closeError instanceof Error ? closeError.message : "Unknown error"
          );
        }
      }
    }
  }

  async getFileSize(filePath: string) {
    try {
      const stats = await fs.promises.stat(filePath);
      return stats.size;
    } catch (error) {
      console.warn(
        "PDF Service: Could not get file size:",
        error instanceof Error ? error.message : "Unknown error"
      );
      return 0;
    }
  }

  async close() {
    if (this.browser) {
      try {
        await this.browser.close();
        console.log("PDF Service: Browser closed successfully");
      } catch (error) {
        console.error("PDF Service: Error closing browser:", error);
      } finally {
        this.browser = null;
      }
    }
  }
}

// Create singleton instance
const pdfService = new PDFService();

// Clean up on process exit (serverless function termination)
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    pdfService.close().catch(() => {});
  });
  
  process.on('SIGTERM', () => {
    pdfService.close().catch(() => {});
  });
}

export { pdfService, PDFService };