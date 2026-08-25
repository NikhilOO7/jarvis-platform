export const MIN_SERVICE_TOKEN_LENGTH = 32;

export function hasSecureServiceToken(value: string | null | undefined): value is string {
  return typeof value === "string" && value.length >= MIN_SERVICE_TOKEN_LENGTH;
}
