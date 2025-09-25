/**
 * @fileoverview Efficient PDF generation service using @sparticuz/chromium
 * @author v0-theaugustarule-express
 * @version 1.0.0
 */

import puppeteer, { Browser as PuppeteerBrowser } from "puppeteer";
import puppeteerCore, { Browser as PuppeteerCoreBrowser } from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { format } from "date-fns";
import fs from "fs";
import path from "path";
import { env } from "@/env";

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
    console.log("PDF Service: isProduction", this.isProduction);
    console.log("PDF Service: env.NODE_ENV", env.NODE_ENV);
    console.log(
      "PDF Service: env.NEXT_PUBLIC_APP_URL",
      env.NEXT_PUBLIC_APP_URL
    );
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
        this.browser = await puppeteerCore.launch({
          args: [
            ...chromium.args,
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
          executablePath: await chromium.executablePath(),
          headless: true,
          browser: "chrome",
        });
      } else {
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
      await fs.access(downloadsDir, (err) => {
        if (err) {
          fs.mkdir(downloadsDir, { recursive: true }, (err) => {
            if (err) {
              console.error(
                "PDF Service: Error creating downloads directory:",
                err
              );
            }
          });
        }
      });
    } catch (error) {
      console.error("PDF Service: Error creating downloads directory:", error);
      await fs.mkdir(downloadsDir, { recursive: true }, (err) => {
        if (err) {
          console.error(
            "PDF Service: Error creating downloads directory:",
            err
          );
        }
      });
      console.log("PDF Service: Created downloads directory");
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
   * @example
   * // Generate PDF in memory only
   * const result = await pdfService.generatePDF(htmlContent, {
   *   filename: 'rental-agreement',
   *   orientation: 'portrait',
   *   paperSize: 'A4'
   * });
   * console.log(`PDF buffer size: ${result.buffer.length} bytes`);
   *
   * @example
   * // Generate PDF and save to file (for direct downloads)
   * const result = await pdfService.generatePDF(htmlContent, {
   *   filename: 'rental-agreement',
   *   saveToFile: true
   * });
   * console.log(`PDF saved to: ${result.filePath}`);
   */
  async generatePDF(
    html: string,
    options: PDFOptions = {
      displayHeaderFooter: false,
      filename: "",
      orientation: "portrait",
      paperSize: this.isProduction ? "a4" : "A4",
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
      paperSize = this.isProduction ? "a4" : "A4",
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

        // Optimize page settings
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

        // Wait a bit more for any dynamic content using Promise-based delay
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
        const pdfData = await page.pdf({
          format: paperSize,
          landscape: orientation === "landscape",
          printBackground: printBackground,
          margin: margins,
          displayHeaderFooter: displayHeaderFooter,
          preferCSSPageSize: true, // Respect CSS page size
          omitBackground: false, // Include background
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

export { pdfService, PDFService };
