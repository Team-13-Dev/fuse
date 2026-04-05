import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const AVATAR_COLORS = [
  { bg: "#EEEDFE", text: "#3C3489" },
  { bg: "#B5D4F4", text: "#042C53" },
  { bg: "#9FE1CB", text: "#04342C" },
  { bg: "#F5C4B3", text: "#4A1B0C" },
  { bg: "#FAC775", text: "#412402" },
  { bg: "#C0DD97", text: "#173404" },
  { bg: "#F4C0D1", text: "#4B1528" },
  { bg: "#D3D1C7", text: "#2C2C2A" },
]

export function getAvatarColor(name: string) {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[hash]
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

const SEGMENT_STYLES: Record<string, { bg: string; text: string }> = {
  VIP:      { bg: "#EEEDFE", text: "#3C3489" },
  Regular:  { bg: "#E1F5EE", text: "#085041" },
  New:      { bg: "#E6F1FB", text: "#0C447C" },
  "At-risk":{ bg: "#FCEBEB", text: "#791F1F" },
  Inactive: { bg: "#F1EFE8", text: "#444441" },
}

export function getSegmentStyle(segment: string | null) {
  return SEGMENT_STYLES[segment ?? ""] ?? { bg: "#F1EFE8", text: "#444441" }
}