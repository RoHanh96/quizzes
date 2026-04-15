import { isCrosswordType } from "./types";

export function quizTypeSupportsCrosswordPlayer(type: string): boolean {
  return isCrosswordType(type);
}

export function defaultPlayPath(shareLink: string): string {
  return `/play/${shareLink}`;
}
