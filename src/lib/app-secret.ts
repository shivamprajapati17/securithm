/**
 * Central SECRET_KEY resolver for the app's HS256 session tokens and
 * signed attestations. Reads SECRET_KEY from the environment and fails
 * closed when it is absent — no hardcoded fallback can ship here, since
 * a public fallback would let anyone mint valid session tokens.
 */
export function getAppSecret(): string {
  const secret = process.env.SECRET_KEY;
  if (!secret) {
    throw new Error(
      "SECRET_KEY is not configured — set it in the deployment environment"
    );
  }
  return secret;
}
