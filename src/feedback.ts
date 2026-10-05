import { t, type Locale } from "./i18n";
import { FEEDBACK_EMAIL } from "./privacy";

export function mailto(locale: Locale): string {
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(t(locale, "feedbackSubject"))}`;
}
