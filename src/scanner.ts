export function scanForAwsSecrets(text: string): string[] {
  const secrets: string[] = [];

  // Match AWS Access Key IDs: AKIA or ASIA + 16 uppercase letters/numbers
  const accessKeyRegex = /\b(AKIA|ASIA)[A-Z0-9]{16}\b/g;
  const accessKeyMatches = text.match(accessKeyRegex);
  if (accessKeyMatches) {
    secrets.push(...accessKeyMatches);
  }

  // Match AWS Secret Access Keys: exactly 40 characters of base64-like characters
  const secretKeyRegex = /\b(?<!\/)[A-Za-z0-9\/+=]{40}(?!\/)\b/g;
  const secretKeyMatches = text.match(secretKeyRegex);
  if (secretKeyMatches) {
    secrets.push(...secretKeyMatches);
  }

  const filteredSecrets = secrets.filter((secret) => {
    if (/^[a-f0-9]{40}$/.test(secret)) return false; // SHA1
    if (/[\/\\]/.test(secret)) return false; // file paths
    if (/[._]/.test(secret)) return false; // common in code symbols
    if (secret.length > 20 && /[a-z]/.test(secret) && /[A-Z]/.test(secret))
      return false; // camelCase
    return true;
  });

  return filteredSecrets;
}
