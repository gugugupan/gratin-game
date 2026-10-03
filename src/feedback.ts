import { t, type Locale } from "./i18n";
import { FEEDBACK_EMAIL } from "./privacy";

const ENDPOINT = "https://api.web3forms.com/submit";
const SUBJECT = "Gratin Game feedback";
const LAST_KEY = "gratin.feedback.last";
const COOLDOWN_MS = 60_000;

const key = import.meta.env.VITE_WEB3FORMS_KEY;

const $ = <T extends Element>(sel: string) => document.querySelector(sel) as T;

function details(locale: Locale): string {
  return [
    `Language: ${locale}`,
    `Build: ${import.meta.env.VITE_BUILD_SHA?.slice(0, 7) ?? "dev"}`,
    `Screen: ${innerWidth}x${innerHeight} @${devicePixelRatio}`,
    `Agent: ${navigator.userAgent}`,
  ].join("\n");
}

export function mailto(locale: Locale, message = ""): string {
  const body = message ? `${message}\n\n---\n${details(locale)}` : "";
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(t(locale, "feedbackSubject"))}${body ? `&body=${encodeURIComponent(body)}` : ""}`;
}

function lastSent(): number {
  try {
    return Number(localStorage.getItem(LAST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function setStatus(text: string, tone: "" | "ok" | "bad" = ""): void {
  const el = $(".fb-status");
  el.textContent = text;
  el.className = `fb-status${tone ? ` ${tone}` : ""}`;
}

export function initFeedback(getLocale: () => Locale): void {
  $<HTMLFormElement>(".fb-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    $<HTMLAnchorElement>(".fb-fallback").hidden = true;
    const locale = getLocale();
    const field = $<HTMLTextAreaElement>("#fb-message");
    const message = field.value.trim();
    const email = $<HTMLInputElement>("#fb-email").value.trim();
    if (!message) {
      setStatus(t(locale, "feedbackEmpty"), "bad");
      field.focus();
      return;
    }
    if (!key) {
      location.href = mailto(locale, message);
      return;
    }
    if (Date.now() - lastSent() < COOLDOWN_MS) {
      setStatus(t(locale, "feedbackWait"), "bad");
      return;
    }
    if ($<HTMLInputElement>("#fb-bot").checked) {
      field.value = "";
      setStatus(t(locale, "feedbackThanks"), "ok");
      return;
    }
    const send = $<HTMLButtonElement>(".fb-send");
    send.disabled = true;
    setStatus(t(locale, "feedbackSending"));
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: key,
          subject: `${SUBJECT} (${locale})`,
          from_name: "グラタンゲーム",
          ...(email ? { email, replyto: email } : {}),
          message: `${message}\n\n---\n${details(locale)}`,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean };
      if (!res.ok || !data.success) throw new Error(String(res.status));
      try {
        localStorage.setItem(LAST_KEY, String(Date.now()));
      } catch {}
      field.value = "";
      setStatus(t(locale, "feedbackThanks"), "ok");
    } catch {
      setStatus(t(locale, "feedbackFailed"), "bad");
      const link = $<HTMLAnchorElement>(".fb-fallback");
      link.href = mailto(locale, message);
      link.hidden = false;
    } finally {
      send.disabled = false;
    }
  });
}
