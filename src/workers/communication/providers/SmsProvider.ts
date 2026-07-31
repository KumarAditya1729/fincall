import { SecretsProvider } from "../../../features/communication/services/secretsProvider";
import type { DispatchResult, ICommunicationProvider } from "./types";

export class TwilioSmsProvider implements ICommunicationProvider {
  readonly name = "twilio";

  async dispatch(
    recipient: string,
    content: string,
    config: Record<string, unknown>,
    branchId: string,
  ): Promise<DispatchResult> {
    const apiKey = await SecretsProvider.getProviderSecret("twilio", branchId);
    const accountSid = await SecretsProvider.getSecret("TWILIO_ACCOUNT_SID");

    if (!apiKey || !accountSid) {
      return { success: false, errorReason: "Missing Twilio credentials" };
    }

    try {
      // In a real implementation, we would use the twilio npm package or fetch API here.
      // e.g., twilioClient.messages.create({ body: content, to: recipient, from: config.senderId })

      console.log(`[Twilio] Sending SMS to ${recipient} (Branch: ${branchId})`);
      console.log(`[Twilio] Content: ${content}`);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      return { success: true, messageId: `tw_${Date.now()}` };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      return { success: false, errorReason: errorMsg };
    }
  }
}

export class Msg91SmsProvider implements ICommunicationProvider {
  readonly name = "msg91";

  async dispatch(
    recipient: string,
    content: string,
    config: Record<string, unknown>,
    branchId: string,
  ): Promise<DispatchResult> {
    const apiKey = await SecretsProvider.getProviderSecret("msg91", branchId);

    if (!apiKey) {
      return { success: false, errorReason: "Missing MSG91 credentials" };
    }

    try {
      console.log(`[MSG91] Sending SMS to ${recipient}`);
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { success: true, messageId: `msg91_${Date.now()}` };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      return { success: false, errorReason: errorMsg };
    }
  }
}
