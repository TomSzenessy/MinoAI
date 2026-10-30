"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "@/components/i18n-provider";
import { getMailspoolConfig } from "@/lib/config";
import {
  describeWaitlistSource,
  isValidEmail,
  normalizeEmail,
  readWaitlistRecord,
  rememberWaitlistSignup,
  submitWaitlistSignup,
} from "@/lib/waitlist";

type WaitlistStatus = "idle" | "submitting" | "success" | "exists" | "error";

export interface WaitlistFormProps {
  /** "hero" is the large above-the-fold variant, "card" the section default. */
  variant?: "hero" | "card" | "page";
  className?: string;
  /** Keeps the DOM id stable when two forms share a page. */
  idPrefix?: string;
}

const USE_CASE_KEYS = [
  "personal",
  "engineering",
  "research",
  "agents",
  "curious",
] as const;

export function WaitlistForm({
  variant = "card",
  className,
  idPrefix,
}: WaitlistFormProps) {
  const { t } = useTranslation();
  const reactId = useId();
  const prefix = idPrefix ?? `waitlist-${reactId.replace(/:/g, "")}`;
  const emailId = `${prefix}-email`;
  const nameId = `${prefix}-name`;
  const useCaseId = `${prefix}-use-case`;
  const statusId = `${prefix}-status`;

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [useCase, setUseCase] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [status, setStatus] = useState<WaitlistStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [joinedEmail, setJoinedEmail] = useState("");
  const honeypotRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const existing = readWaitlistRecord();
    if (existing?.email) {
      setJoinedEmail(existing.email);
      setEmail(existing.email);
      setStatus("success");
    }
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (status === "submitting") return;

      const cleanEmail = normalizeEmail(email);
      if (!isValidEmail(cleanEmail)) {
        setMessage(t("waitlist.invalidEmail"));
        setStatus("error");
        return;
      }

      // Bots fill every input, including the hidden one. Absorb them silently.
      if (honeypotRef.current?.value) {
        setJoinedEmail(cleanEmail);
        setStatus("success");
        return;
      }

      setStatus("submitting");
      setMessage(null);

      const source =
        typeof window === "undefined"
          ? undefined
          : describeWaitlistSource({
              search: window.location.search,
              referrer: document.referrer,
              path: window.location.pathname,
            });

      const result = await submitWaitlistSignup({
        email: cleanEmail,
        firstName: firstName.trim() || undefined,
        useCase: useCase || undefined,
        source,
      });

      if (result.ok) {
        rememberWaitlistSignup(cleanEmail);
        setJoinedEmail(cleanEmail);
        setStatus(result.status === "exists" ? "exists" : "success");
        return;
      }

      setMessage(
        result.status === "invalid"
          ? (result.message ?? t("waitlist.invalidEmail"))
          : null,
      );
      setStatus("error");
    },
    [email, firstName, status, t, useCase],
  );

  const isBusy = status === "submitting";
  const isJoined = status === "success" || status === "exists";
  const errorText =
    message ?? (status === "error" ? t("waitlist.errorBody") : null);

  const mailspool = getMailspoolConfig();
  const hostedFormUrl = `${mailspool.baseUrl}/f/${mailspool.formSlug}?key=${mailspool.publicKey}`;

  return (
    <div
      className={`waitlist ${variant === "hero" ? "waitlist-hero" : ""} ${className ?? ""}`}
    >
      {isJoined ? (
        <div className="waitlist-done" role="status" aria-live="polite">
          <span className="waitlist-done-icon" aria-hidden>
            ✓
          </span>
          <div>
            <p className="waitlist-done-title">
              {status === "exists"
                ? t("waitlist.existsTitle")
                : t("waitlist.successTitle")}
            </p>
            <p className="waitlist-done-body">
              {status === "exists"
                ? t("waitlist.existsBody", { email: joinedEmail })
                : t("waitlist.successBody")}
            </p>
            <button
              type="button"
              className="waitlist-link"
              onClick={() => {
                setStatus("idle");
                setMessage(null);
                setEmail("");
              }}
            >
              {t("waitlist.changeEmail")}
            </button>
          </div>
        </div>
      ) : (
        <>
          <noscript>
            <p className="waitlist-note">
              JavaScript is off.{" "}
              <a href={hostedFormUrl} rel="noreferrer">
                Use the plain HTML form
              </a>
              .
            </p>
          </noscript>
          <form className="waitlist-form" onSubmit={handleSubmit} noValidate>
            <div className="waitlist-row">
              <label className="sr-only" htmlFor={emailId}>
                {t("waitlist.emailLabel")}
              </label>
              <input
                id={emailId}
                className="field waitlist-email"
                type="email"
                name="email"
                inputMode="email"
                autoComplete="email"
                placeholder={t("waitlist.emailPlaceholder")}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-describedby={statusId}
                aria-invalid={status === "error"}
                required
              />
              <button
                type="submit"
                className="button-primary waitlist-submit"
                disabled={isBusy}
              >
                {isBusy ? t("waitlist.submitting") : t("waitlist.submit")}
              </button>
            </div>

            <button
              type="button"
              className="waitlist-details-toggle"
              aria-expanded={detailsOpen}
              aria-controls={`${prefix}-details`}
              onClick={() => setDetailsOpen((open) => !open)}
            >
              {detailsOpen
                ? t("waitlist.detailsHide")
                : t("waitlist.detailsToggle")}
            </button>

            {detailsOpen ? (
              <div className="waitlist-details" id={`${prefix}-details`}>
                <div>
                  <label className="waitlist-label" htmlFor={nameId}>
                    {t("waitlist.nameLabel")}
                  </label>
                  <input
                    id={nameId}
                    className="field"
                    type="text"
                    name="first_name"
                    autoComplete="given-name"
                    placeholder={t("waitlist.namePlaceholder")}
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    maxLength={80}
                  />
                </div>
                <div>
                  <label className="waitlist-label" htmlFor={useCaseId}>
                    {t("waitlist.useCaseLabel")}
                  </label>
                  <select
                    id={useCaseId}
                    className="field"
                    name="use_case"
                    value={useCase}
                    onChange={(event) => setUseCase(event.target.value)}
                  >
                    <option value="">{t("waitlist.useCasePlaceholder")}</option>
                    {USE_CASE_KEYS.map((key) => (
                      <option key={key} value={t(`waitlist.useCases.${key}`)}>
                        {t(`waitlist.useCases.${key}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            <input
              ref={honeypotRef}
              className="waitlist-honeypot"
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            <p
              className={`waitlist-status ${status === "error" ? "is-error" : ""}`}
              id={statusId}
              role={status === "error" ? "alert" : "status"}
              aria-live="polite"
            >
              {errorText}
            </p>

            <p className="waitlist-note">{t("waitlist.privacy")}</p>
          </form>
        </>
      )}
    </div>
  );
}
