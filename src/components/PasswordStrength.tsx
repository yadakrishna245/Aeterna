interface PasswordStrengthProps {
  password: string;
}

function getScore(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function getLevel(score: number): { label: string; color: string } {
  if (score <= 0) return { label: "", color: "transparent" };
  if (score <= 2) return { label: "Weak", color: "#ef4444" };
  if (score === 3) return { label: "Fair", color: "#f97316" };
  if (score === 4) return { label: "Good", color: "#eab308" };
  return { label: "Strong", color: "#22c55e" };
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const score = getScore(password);
  const { label, color } = getLevel(score);

  if (!password) return null;

  const percentage = (score / 6) * 100;

  return (
    <div className="mt-2 space-y-1">
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: "4px", backgroundColor: "rgba(255,255,255,0.1)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            transition: "width 0.3s ease, background-color 0.3s ease",
          }}
        />
      </div>
      <p className="text-xs" style={{ color }}>
        {label}
      </p>
    </div>
  );
}
