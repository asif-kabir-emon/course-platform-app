import { cn } from "@/lib/utils";

type PasswordStrengthProps = {
  password: string;
};

const levels = [
  { label: "Enter a password", color: "bg-slate-200" },
  { label: "Weak", color: "bg-red-500" },
  { label: "Fair", color: "bg-amber-500" },
  { label: "Good", color: "bg-sky-500" },
  { label: "Strong", color: "bg-emerald-500" },
];

const getPasswordScore = (password: string) => {
  if (!password) return 0;

  return [
    password.length >= 8,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
};

const PasswordStrength = ({ password }: PasswordStrengthProps) => {
  const score = getPasswordScore(password);
  const level = levels[score];

  return (
    <div className="mt-2 space-y-1.5" aria-live="polite">
      <div className="grid grid-cols-4 gap-1">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn(
              "h-1.5 rounded-full bg-slate-200 transition-colors",
              step <= score && level.color,
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Password strength:{" "}
        <span className="font-medium text-foreground">{level.label}</span>
      </p>
    </div>
  );
};

export default PasswordStrength;
