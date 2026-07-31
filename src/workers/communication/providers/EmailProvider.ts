import { SecretsProvider } from "../../../features/communication/services/secretsProvider";
import type { DispatchResult, ICommunicationProvider } from "./types";

export class SmtpEmailProvider implements ICommunicationProvider {
  readonly name = "smtp";

  async dispatch(
    recipient: string,
    content: string,
    config: Record<string, unknown>,
    branchId: string,
  ): Promise<DispatchResult> {
    const password = await SecretsProvider.getProviderSecret("smtp", branchId);

    if (!password) {
      return { success: false, errorReason: "Missing SMTP credentials" };
    }

    try {
      console.log(`[SMTP] Sending Email to ${recipient}`);
      await new Promise((resolve) => setTimeout(resolve, 600));
      return { success: true, messageId: `smtp_${Date.now()}` };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      return { success: false, errorReason: errorMsg };
    }
  }
}
