export function scanForAwsSecrets(diff: string): string[] {
  const accessKeyRegex = /AKIA[0-9A-Z]{16}/g;
  const secretKeyRegex = /(?<![A-Z0-9])[A-Za-z0-9/+=]{40}(?![A-Z0-9])/g;
  const accessKeyMatches = diff.match(accessKeyRegex) || [];
  const secretKeyMatches = diff.match(secretKeyRegex) || [];
  return [...accessKeyMatches, ...secretKeyMatches];
}
