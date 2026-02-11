"use client";

// UI: кнопка выхода из аккаунта (NextAuth signOut)
import { signOut } from "next-auth/react";

export default function LogoutButton({
  callbackUrl = "/",
  label = "Выйти",
  className,
}: {
  callbackUrl?: string;
  label?: string;
  className?: string;
}) {
  return (
    <button
      className={className}
      onClick={() => signOut({ callbackUrl })}
      style={
        className
          ? undefined
          : {
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "inherit",
              fontWeight: 800,
              cursor: "pointer",
            }
      }
    >
      {label}
    </button>
  );
}
