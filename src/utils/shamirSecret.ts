/**
 * Shamir's Secret Sharing — Threshold 2-of-3 Scheme
 *
 * Mathematical Foundation:
 * ========================
 * Shamir's Secret Sharing is based on polynomial interpolation over a finite field.
 * For a threshold-t scheme, we construct a random polynomial of degree (t-1).
 *
 * For our 2-of-3 scheme:
 *   - Polynomial degree: 1 (linear: f(x) = a₀ + a₁·x)
 *   - a₀ = the secret byte
 *   - a₁ = random coefficient
 *   - Shares are evaluations: f(1), f(2), f(3)
 *   - Any 2 shares can reconstruct a₀ via Lagrange interpolation
 *
 * We operate over GF(256) — the Galois Field with 256 elements.
 * This is the finite field of integers mod an irreducible polynomial of degree 8.
 * Using GF(256) means each byte of the secret is independently shared,
 * and arithmetic never overflows a single byte.
 *
 * GF(256) Arithmetic:
 *   - Addition = XOR
 *   - Multiplication uses log/exp tables (based on generator 0x03
 *     with irreducible polynomial x⁸ + x⁴ + x³ + x + 1 = 0x11B)
 *
 * Security:
 *   - With fewer than threshold shares, NO information about the secret is revealed
 *     (information-theoretic security, not just computational)
 *   - Each share alone is indistinguishable from random data
 */

// ============================================================================
// GF(256) Arithmetic Tables
// ============================================================================

/**
 * Generate log and exp tables for GF(256) multiplication.
 * Generator: 0x03, Irreducible polynomial: 0x11B (x⁸ + x⁴ + x³ + x + 1)
 */
function generateGF256Tables(): { log: Uint8Array; exp: Uint8Array } {
  const exp = new Uint8Array(512); // Double-size for easy modular lookup
  const log = new Uint8Array(256);

  let x = 1;
  for (let i = 0; i < 255; i++) {
    exp[i] = x;
    exp[i + 255] = x; // Duplicate for mod-free lookup
    log[x] = i;
    // Multiply by generator (0x03): x = x * 3 in GF(256)
    x = x ^ (x << 1); // x * 2 (shift) XOR x * 1
    if (x & 0x100) x ^= 0x11b; // Reduce modulo irreducible polynomial
  }
  log[0] = 0; // log(0) is undefined, but we handle 0 specially

  return { log, exp };
}

const { log: GF_LOG, exp: GF_EXP } = generateGF256Tables();

/**
 * Multiply two elements in GF(256) using log/exp tables.
 * Returns 0 if either operand is 0.
 */
function gf256Mul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

/**
 * Divide a by b in GF(256): a / b = a * inv(b)
 */
function gf256Div(a: number, b: number): number {
  if (b === 0) throw new Error("Division by zero in GF(256)");
  if (a === 0) return 0;
  return GF_EXP[(GF_LOG[a] + 255 - GF_LOG[b]) % 255];
}

// ============================================================================
// Core Shamir Operations
// ============================================================================

/**
 * Evaluate a polynomial at point x in GF(256).
 * coefficients[0] is the constant term (the secret).
 *
 * f(x) = coefficients[0] + coefficients[1]*x + coefficients[2]*x² + ...
 */
function evaluatePolynomial(coefficients: number[], x: number): number {
  let result = 0;
  let xPow = 1; // x^0 = 1

  for (const coeff of coefficients) {
    // result += coeff * x^i (in GF(256), addition is XOR)
    result ^= gf256Mul(coeff, xPow);
    xPow = gf256Mul(xPow, x); // x^(i+1)
  }

  return result;
}

/**
 * Lagrange interpolation at x=0 to recover the secret.
 *
 * Given points (x₁, y₁), (x₂, y₂), ..., (xₖ, yₖ), compute f(0):
 *
 *   f(0) = Σᵢ yᵢ · Πⱼ≠ᵢ (xⱼ / (xⱼ - xᵢ))
 *
 * All arithmetic in GF(256):
 *   - Addition/subtraction = XOR
 *   - Multiplication/division use log/exp tables
 */
function lagrangeInterpolateAtZero(
  points: Array<{ x: number; y: number }>
): number {
  let secret = 0;

  for (let i = 0; i < points.length; i++) {
    let numerator = 1;
    let denominator = 1;

    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;

      // In GF(256): subtraction = XOR (same as addition)
      numerator = gf256Mul(numerator, points[j].x); // Πⱼ≠ᵢ xⱼ
      denominator = gf256Mul(denominator, points[j].x ^ points[i].x); // Πⱼ≠ᵢ (xⱼ - xᵢ)
    }

    // Lagrange basis polynomial value at x=0: Lᵢ(0) = numerator / denominator
    const lagrangeBasis = gf256Div(numerator, denominator);

    // f(0) += yᵢ * Lᵢ(0) — XOR for addition in GF(256)
    secret ^= gf256Mul(points[i].y, lagrangeBasis);
  }

  return secret;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Split a secret string into shares using Shamir's Secret Sharing.
 *
 * @param secret - The secret to split (e.g., master password)
 * @param totalShares - Number of shares to generate (default: 3)
 * @param threshold - Minimum shares needed to reconstruct (default: 2)
 * @returns Array of base64-encoded share strings
 *
 * Each share encodes:
 *   - Byte 0: the share index (1, 2, or 3) — identifies which evaluation point
 *   - Bytes 1..n: the share values for each byte of the secret
 *
 * The entire share is then Base64-encoded for safe storage/transmission.
 */
export function splitSecret(
  secret: string,
  totalShares: number = 3,
  threshold: number = 2
): string[] {
  if (threshold > totalShares) {
    throw new Error("Threshold cannot exceed total shares");
  }
  if (threshold < 2) {
    throw new Error("Threshold must be at least 2");
  }
  if (totalShares > 255) {
    throw new Error("Maximum 255 shares supported");
  }

  // Convert secret string to bytes
  const encoder = new TextEncoder();
  const secretBytes = encoder.encode(secret);

  // For each byte of the secret, generate a random polynomial of degree (threshold - 1)
  // and evaluate it at points x = 1, 2, ..., totalShares
  const shares: Uint8Array[] = Array.from({ length: totalShares }, (_, i) => {
    // First byte of each share is the x-coordinate (share index, 1-based)
    const share = new Uint8Array(secretBytes.length + 1);
    share[0] = i + 1; // x = 1, 2, 3, ...
    return share;
  });

  for (let byteIdx = 0; byteIdx < secretBytes.length; byteIdx++) {
    // Build random polynomial: coefficients[0] = secret byte, rest are random
    const coefficients = new Uint8Array(threshold);
    coefficients[0] = secretBytes[byteIdx]; // The secret is the constant term

    // Generate random coefficients for higher-order terms
    const randomCoeffs = new Uint8Array(threshold - 1);
    crypto.getRandomValues(randomCoeffs);
    for (let k = 1; k < threshold; k++) {
      coefficients[k] = randomCoeffs[k - 1];
      // Ensure at least one random coeff is non-zero for security
      // (if all random coeffs are 0, every share would equal the secret)
    }
    // If all random coefficients turned out to be 0, force one to be non-zero
    if (threshold > 1 && randomCoeffs.every((c) => c === 0)) {
      coefficients[1] = 1;
    }

    // Evaluate polynomial at each share's x-coordinate
    for (let shareIdx = 0; shareIdx < totalShares; shareIdx++) {
      const x = shareIdx + 1; // x = 1, 2, 3
      shares[shareIdx][byteIdx + 1] = evaluatePolynomial(
        Array.from(coefficients),
        x
      );
    }
  }

  // Encode each share as Base64
  return shares.map((share) => {
    let binary = "";
    for (let i = 0; i < share.length; i++) {
      binary += String.fromCharCode(share[i]);
    }
    return btoa(binary);
  });
}

/**
 * Reconstruct the original secret from a subset of shares.
 *
 * @param shares - Array of base64-encoded share strings (need at least `threshold` shares)
 * @returns The reconstructed secret string
 *
 * Uses Lagrange interpolation at x=0 for each byte position independently.
 * If fewer than `threshold` shares are provided, the result will be garbage
 * (not an error — this is by design for information-theoretic security).
 */
export function reconstructSecret(shares: string[]): string {
  if (shares.length < 2) {
    throw new Error("Need at least 2 shares to reconstruct");
  }

  // Decode Base64 shares back to bytes
  const decodedShares = shares.map((shareB64) => {
    const binary = atob(shareB64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  });

  // All shares must have the same length
  const shareLength = decodedShares[0].length;
  if (!decodedShares.every((s) => s.length === shareLength)) {
    throw new Error("All shares must have the same length");
  }

  // Number of secret bytes = share length - 1 (first byte is x-coordinate)
  const secretLength = shareLength - 1;
  const reconstructedBytes = new Uint8Array(secretLength);

  // For each byte position, use Lagrange interpolation to recover f(0)
  for (let byteIdx = 0; byteIdx < secretLength; byteIdx++) {
    const points = decodedShares.map((share) => ({
      x: share[0], // The share's x-coordinate (1, 2, or 3)
      y: share[byteIdx + 1], // The share's y-value for this byte
    }));

    reconstructedBytes[byteIdx] = lagrangeInterpolateAtZero(points);
  }

  // Decode bytes back to string
  const decoder = new TextDecoder();
  return decoder.decode(reconstructedBytes);
}

/**
 * Verify that shares can reconstruct to a known secret.
 * Useful for testing before distributing shares.
 *
 * @param shares - Array of base64-encoded share strings
 * @param expectedSecret - The original secret to verify against
 * @returns true if reconstruction matches
 */
export function verifyShares(
  shares: string[],
  expectedSecret: string
): boolean {
  try {
    const reconstructed = reconstructSecret(shares);
    return reconstructed === expectedSecret;
  } catch {
    return false;
  }
}
