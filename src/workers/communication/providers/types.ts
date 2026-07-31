export type CommunicationType = "sms" | "whatsapp" | "email" | "push" | "call";

export interface ProviderConfig {
  id: string;
  provider_name: string;
  config: Record<string, unknown>;
  priority: number;
}

export interface DispatchResult {
  success: boolean;
  messageId?: string;
  errorReason?: string;
}

export interface ICommunicationProvider {
  /**
   * The unique name of the provider (e.g., 'twilio', 'msg91')
   */
  readonly name: string;

  /**
   * Dispatches a message to the recipient using the provider.
   *
   * @param recipient The destination (phone number, email)
   * @param content The parsed message content
   * @param config The non-secret config from the DB
   * @param branchId The branch ID for fetching secrets if needed
   */
  dispatch(
    recipient: string,
    content: string,
    config: Record<string, unknown>,
    branchId: string,
  ): Promise<DispatchResult>;
}
