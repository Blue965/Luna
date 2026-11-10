"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}

/** Avatar utilisateur : image Roblox si disponible, initiales sinon. */
export function UserAvatar({ username, avatarUrl, size = 36, className }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initials = username.slice(0, 2).toUpperCase();

  if (avatarUrl && !failed) {
    return (
      <span
        className={cn("relative inline-flex shrink-0 overflow-hidden rounded-full border border-zinc-700/70 bg-zinc-900", className)}
        style={{ width: size, height: size }}
      >
        <Image
          src={avatarUrl}
          alt={`Avatar de ${username}`}
          fill
          sizes={`${size * 2}px`}
          className="object-cover"
          unoptimized
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-gradient-to-br from-violet-600/30 to-sky-600/20 font-semibold text-violet-200",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.34) }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
