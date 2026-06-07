const DNI_REGEX = /^[0-9]{8}[A-Za-z]$/;
const NIE_REGEX = /^[XYZxyz][0-9]{7}[A-Za-z]$/;
const DNI_CONTROL = "TRWAGMYFPDXBNJZSQVHLCKE";

function dniControlDigit(num: string): string {
  const n = parseInt(num, 10) % 23;
  return DNI_CONTROL.charAt(n);
}

export function isValidDniNie(value: string): boolean {
  const v = value.trim().toUpperCase();
  if (DNI_REGEX.test(v)) {
    const num = v.substring(0, 8);
    const ctrl = v.charAt(8);
    return dniControlDigit(num) === ctrl;
  }
  if (NIE_REGEX.test(v)) {
    const first = v.charAt(0);
    const map: Record<string, string> = { X: "0", Y: "1", Z: "2" };
    const num = (map[first] || first) + v.substring(1, 8);
    const ctrl = v.charAt(8);
    return dniControlDigit(num) === ctrl;
  }
  return false;
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .trim();
}
