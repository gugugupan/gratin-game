import { t, type Locale, type StringKey } from "./i18n";
import { FEEDBACK_EMAIL } from "./privacy";

export function mailto(locale: Locale, subject: StringKey = "feedbackSubject"): string {
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(t(locale, subject))}`;
}
