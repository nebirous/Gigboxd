export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 24;
export const BIO_MAX_LENGTH = 160;

const USERNAME_PATTERN = /^[a-z0-9_]+$/;

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function validateUsername(value: string): string | null {
  const username = normalizeUsername(value);

  if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
    return `Nickname must be between ${USERNAME_MIN_LENGTH} and ${USERNAME_MAX_LENGTH} characters.`;
  }

  if (!USERNAME_PATTERN.test(username)) {
    return "Nickname can only contain lowercase letters, numbers, and underscores.";
  }

  return null;
}

export function validateBio(value: string): string | null {
  return value.length > BIO_MAX_LENGTH
    ? `Bio must be ${BIO_MAX_LENGTH} characters or fewer.`
    : null;
}
