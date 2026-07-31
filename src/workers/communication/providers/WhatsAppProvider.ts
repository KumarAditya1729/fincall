import { SecretsProvider } from "../../../features/communication/services/secretsProvider";
import type { DispatchResult, ICommunicationProvider } from "./types";

export class WhatsAppProvider implements ICommunicationProvider {
  readonly name = "whatsapp_meta";

  async dispatch(
    recipient: string,
    content: string,
    config: Record<string, unknown>,
    branchId: string,
  ): Promise<DispatchResult> {
    const apiKey = await SecretsProvider.getProviderSecret("whatsapp_meta", branchId);

    if (!apiKey) {
      return { success: false, errorReason: "Missing WhatsApp Cloud API credentials" };
    }

    try {
      console.log(`[WhatsApp] Sending message to ${recipient}`);
      await new Promise((resolve) => setTimeout(resolve, 400));
      return { success: true, messageId: `wa_${Date.now()}` };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      return { success: false, errorReason: errorMsg };
    }
  }
}
