/**
 * Secrets Management for the Communication Platform
 *
 * As per architectural guidelines, we DO NOT store provider secrets in plain text in the database.
 * The database only stores provider configurations (e.g., rate limits, active status, branch).
 * API secrets must be abstracted behind this Secrets Provider so the implementation
 * can later migrate to AWS KMS, Azure Key Vault, or HashiCorp Vault without changing business logic.
 *
 * For the current deployment, environment variables are acceptable.
 */

export class SecretsProvider {
  /**
   * Retrieves the secret API key/token for a given provider and branch.
   * In a future KMS integration, this would use KMS SDKs to fetch the decrypted secret.
   *
   * @param providerName The name of the provider (e.g., "twilio", "msg91")
   * @param branchId The branch ID (useful if different branches have different accounts)
   * @returns The secret string, or null if not configured
   */
  static async getProviderSecret(providerName: string, branchId?: string): Promise<string | null> {
    const key = `${providerName.toUpperCase()}_API_KEY`;
    // If branch-specific keys are needed later, we could look for `${key}_${branchId}`
    return process.env[key] || null;
  }

  /**
   * Retrieves additional secrets (like Twilio Account SID, SMTP Password)
   */
  static async getSecret(key: string): Promise<string | null> {
    return process.env[key] || null;
  }
}
