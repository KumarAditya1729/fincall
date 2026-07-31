import type { ICommunicationProvider, CommunicationType, ProviderConfig } from "./types";
import { TwilioSmsProvider, Msg91SmsProvider } from "./SmsProvider";
import { WhatsAppProvider } from "./WhatsAppProvider";
import { SmtpEmailProvider } from "./EmailProvider";
import { supabaseAdmin } from "../../index";

const REGISTRY: Record<string, ICommunicationProvider> = {
  twilio: new TwilioSmsProvider(),
  msg91: new Msg91SmsProvider(),
  whatsapp_meta: new WhatsAppProvider(),
  smtp: new SmtpEmailProvider(),
};

export class ProviderFactory {
  /**
   * Retrieves the ordered list of active providers for a branch and communication type.
   * Enables automatic failover if the primary provider fails.
   */
  static async getActiveProviders(
    branchId: string,
    type: CommunicationType,
  ): Promise<{ provider: ICommunicationProvider; config: ProviderConfig }[]> {
    const { data, error } = await supabaseAdmin
      .from("comm_providers")
      .select("*")
      .eq("branch_id", branchId)
      .eq("type", type)
      .eq("is_active", true)
      .order("priority", { ascending: true });

    if (error || !data) {
      console.error("[ProviderFactory] Failed to fetch providers", error);
      return [];
    }

    const resolved = data
      .map((row) => ({
        provider: REGISTRY[row.provider_name],
        config: row as ProviderConfig,
      }))
      .filter((r) => r.provider !== undefined);

    return resolved;
  }
}
