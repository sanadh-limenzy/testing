import { env } from "@/env";
import * as fs from "fs";
import * as path from "path";

// Dynamic import for DocuSign to avoid module resolution issues

export interface DocuSignTokenResponse {
  accessToken: string;
  error?: boolean;
  message?: string;
}

export interface EmbeddedSigningRequest {
  documentBase64: string;
  documentName: string;
  recipientEmail: string;
  recipientName: string;
  returnUrl: string;
  emailSubject?: string;
  emailBlurb?: string;
  signerClientUserId?: string;
}

export interface EmbeddedSigningResponse {
  envelopeId: string;
  url: string;
}

export class DocuSignEmbeddedSigning {
  private apiClient: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  private accountId: string;
  private docusign: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  constructor() {
    this.accountId = env.DOCUSIGN_API_ACCOUNT_ID;
  }

  private async initializeDocuSign() {
    if (!this.docusign) {
      this.docusign = await import("docusign-esign");
      this.apiClient = new this.docusign.ApiClient();
      this.apiClient.setBasePath(env.DOCUSIGN_BASE_PATH);
    }
  }

  private async configureAuthentication() {
    try {
      await this.initializeDocuSign();
      
      // Use JWT authentication for server-to-server integration
      const jwt = await this.getJWT();
      const authResponse = await this.apiClient.requestJWTUserToken(
        env.DOCUSIGN_INTEGRATION_KEY_AUTH_CODE,
        env.DOCUSIGN_USER_ID,
        ["signature", "impersonation"],
        Buffer.from(jwt),
        3600
      );

      const authHeader = `Bearer ${authResponse.body.access_token}`;
      this.apiClient.addDefaultHeader("Authorization", authHeader);
    } catch (error) {
      console.error("DocuSign authentication failed:", error);
      throw new Error("Failed to authenticate with DocuSign");
    }
  }

  private async getJWT(): Promise<string> {
    try {
      // Read the private key file based on environment
      const isProduction = env.NODE_ENV === "production";
      const privateKeyFileName = isProduction ? "private-live.key" : "private.key";
      const privateKeyPath = path.join(process.cwd(), privateKeyFileName);
      
      if (!fs.existsSync(privateKeyPath)) {
        throw new Error(`Private key file not found: ${privateKeyPath}`);
      }
      
      const privateKey = fs.readFileSync(privateKeyPath, "utf8");
      return privateKey;
    } catch (error) {
      console.error("Error reading private key:", error);
      throw new Error("Failed to read DocuSign private key");
    }
  }

  async sendEnvelopeForEmbeddedSigning(request: EmbeddedSigningRequest): Promise<EmbeddedSigningResponse> {
    try {
      await this.initializeDocuSign();
      await this.configureAuthentication();

      // Create the envelope definition
      const envelopeDefinition: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
        emailSubject: request.emailSubject || "Please sign this document",
        emailBlurb: request.emailBlurb || "Please review and sign the attached document.",
      };

      // Create the document
      const document: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
        documentBase64: request.documentBase64,
        name: request.documentName,
        fileExtension: "pdf",
        documentId: "1",
      };

      // Create the signer
      const signer: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
        email: request.recipientEmail,
        name: request.recipientName,
        recipientId: "1",
        clientUserId: request.signerClientUserId || "1", // Required for embedded signing
      };

      // Create signature tabs
      const signHere: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
        documentId: "1",
        pageNumber: "1",
        recipientId: "1",
        xPosition: "100",
        yPosition: "100",
        anchorString: "/s1/",
        anchorXOffset: "0",
        anchorYOffset: "0",
        anchorUnits: "pixels",
      };

      // Create tabs
      const tabs: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
        signHereTabs: [signHere],
      };
      signer.tabs = tabs;

      // Create recipients
      const recipients: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
        signers: [signer],
      };

      // Set up the envelope
      envelopeDefinition.documents = [document];
      envelopeDefinition.recipients = recipients;
      envelopeDefinition.status = "sent";

      // Create the envelope
      const envelopesApi = new this.docusign.EnvelopesApi(this.apiClient);
      const results = await envelopesApi.createEnvelope(this.accountId, {
        envelopeDefinition,
      });

      const envelopeId = results.envelopeId;
      if (!envelopeId) {
        throw new Error("Failed to create envelope - no envelope ID returned");
      }

      // Create the recipient view for embedded signing
      const recipientViewRequest: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
        authenticationMethod: "none",
        email: request.recipientEmail,
        userName: request.recipientName,
        clientUserId: request.signerClientUserId || "1",
        returnUrl: request.returnUrl,
      };

      // Get the embedded signing URL
      const recipientView = await envelopesApi.createRecipientView(
        this.accountId,
        envelopeId,
        { recipientViewRequest }
      );

      const url = recipientView.url;
      if (!url) {
        throw new Error("Failed to create recipient view - no URL returned");
      }

      return {
        envelopeId,
        url,
      };
    } catch (error) {
      console.error("Error creating embedded signing envelope:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create embedded signing envelope: ${errorMessage}`);
    }
  }

  async getEnvelopeStatus(envelopeId: string): Promise<string> {
    try {
      await this.initializeDocuSign();
      await this.configureAuthentication();
      
      const envelopesApi = new this.docusign.EnvelopesApi(this.apiClient);
      const envelope = await envelopesApi.getEnvelope(this.accountId, envelopeId);
      return envelope.status || "unknown";
    } catch (error) {
      console.error("Error getting envelope status:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get envelope status: ${errorMessage}`);
    }
  }

  async downloadEnvelope(envelopeId: string): Promise<Buffer> {
    try {
      await this.initializeDocuSign();
      await this.configureAuthentication();
      
      const envelopesApi = new this.docusign.EnvelopesApi(this.apiClient);
      const document = await envelopesApi.getDocument(this.accountId, envelopeId, "combined", {});
      return Buffer.from(document, 'base64');
    } catch (error) {
      console.error("Error downloading envelope:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to download envelope: ${errorMessage}`);
    }
  }
}

/**
 * Standalone function to get DocuSign access token
 * This can be used by other parts of the application that need DocuSign access
 */
export async function getDocuSignToken(): Promise<DocuSignTokenResponse> {
  try {
    // Dynamic import for DocuSign
    const docusign = await import("docusign-esign");
    
    // Initialize DocuSign API client
    const apiClient = new docusign.ApiClient();
    apiClient.setBasePath(env.DOCUSIGN_BASE_PATH);

    // Read the private key file based on environment
    const isProduction = env.NODE_ENV === "production";
    const privateKeyFileName = isProduction ? "private-live.key" : "private.key";
    const privateKeyPath = path.join(process.cwd(), privateKeyFileName);
    
    if (!fs.existsSync(privateKeyPath)) {
      return {
        accessToken: "",
        error: true,
        message: `Private key file not found: ${privateKeyPath}`
      };
    }
    
    const privateKey = fs.readFileSync(privateKeyPath, "utf8");

    // Request JWT user token
    const authResponse = await apiClient.requestJWTUserToken(
      env.DOCUSIGN_INTEGRATION_KEY_AUTH_CODE,
      env.DOCUSIGN_USER_ID,
      ["signature", "impersonation"],
      Buffer.from(privateKey),
      3600
    );

    return {
      accessToken: authResponse.body.access_token,
      error: false
    };
  } catch (error) {
    console.error("Error getting DocuSign token:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      accessToken: "",
      error: true,
      message: `Failed to get DocuSign token: ${errorMessage}`
    };
  }
}