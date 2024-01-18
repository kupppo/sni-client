import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getFolderFromFile = (filePath: string): string => {
  const parts = filePath.split('/')
  return parts.slice(0, parts.length - 1).join('/')
}
