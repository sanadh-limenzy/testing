interface RandomStringOptions {
  length: number;
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
}
export function generateRandomString({
  length,
  uppercase = false,
  lowercase = false,
  numbers = false,
  symbols = false,
}: RandomStringOptions): string {
  const sets: { [key: string]: string } = {
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    symbols: "!@#$%^&*()-_=+[]{}|;:,.<>?/",
  };

  let chars = "";
  if (uppercase) chars += sets.uppercase;
  if (lowercase) chars += sets.lowercase;
  if (numbers) chars += sets.numbers;
  if (symbols) chars += sets.symbols;

  if (!chars) throw new Error("At least one character set must be enabled");

  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }

  return result;
}

export const getInitials = (firstName?: string, lastName?: string) => {
  const first = firstName?.charAt(0)?.toUpperCase() || "";
  const last = lastName?.charAt(0)?.toUpperCase() || "";
  return first + last || "U";
};
