"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  buildFormPayload,
  readFormReceipt,
  submitForm,
  validateSubmission,
  writeFormReceipt,
  type FormDefinition,
  type FormFieldDefinition,
} from "@/lib/forms";
import { describeWaitlistSource } from "@/lib/waitlist";

type FormState = "idle" | "submitting" | "success" | "exists" | "error";

export interface MinoFormProps {
  definition: FormDefinition;
  /** Keeps DOM ids stable when two forms share a page. */
  idPrefix?: string;
  className?: string;
}

/**
 * One renderer for every form definition. Nothing here navigates to the mail
 * provider: the submit is a fetch to the public form endpoint and every state
 * is rendered in place.
 */
export function MinoForm({ definition, idPrefix, className }: MinoFormProps) {
  const reactId = useId();
  const prefix = idPrefix ?? `form-${reactId.replace(/:/g, "")}`;

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of definition.fields) initial[field.key] = "";
    return initial;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [receiptEmail, setReceiptEmail] = useState("");
  const honeypotRef = useRef<HTMLInputElement | null>(null);
  const renderedAtMs = useRef<number>(Date.now());
  const renderedAtSeconds = useRef<number>(Math.floor(Date.now() / 1000));

  const isJoined = state === "success" || state === "exists";
  const isBusy = state === "submitting";

  useEffect(() => {
    if (!definition.remember) return;
    const receipt = readFormReceipt(definition);
    if (receipt?.email) {
      setReceiptEmail(receipt.email);
      setState("success");
    }
  }, [definition]);

  const setValue = useCallback(
    (key: string, value: string) => {
      setValues((current) => ({ ...current, [key]: value }));
      setErrors((current) => {
        if (!current[key] && !current._form) return current;
        const next = { ...current };
        delete next[key];
        delete next._form;
        return next;
      });
    },
    [],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isBusy) return;

      const localErrors = validateSubmission(definition, values);
      if (Object.keys(localErrors).length > 0) {
        setErrors(localErrors);
        setMessage(localErrors._form ?? localErrors[Object.keys(localErrors)[0] ?? ""] ?? null);
        setState("error");
        return;
      }

      setState("submitting");
      setMessage(null);

      const source = definition.attributeSource
        ? describeWaitlistSource({
            search: window.location.search,
            referrer: document.referrer,
            path: window.location.pathname,
          })
        : undefined;

      const result = await submitForm(definition, values, {
        source,
        company: honeypotRef.current?.value ?? "",
        renderedAt: renderedAtSeconds.current,
        renderedAtMs: renderedAtMs.current,
      });

      if (result.ok) {
        const email = values.email?.trim() ?? "";
        if (definition.remember && email) writeFormReceipt(definition, email);
        setReceiptEmail(email);
        setState(result.status === "exists" ? "exists" : "success");
        return;
      }

      if (result.status === "invalid") {
        setMessage(result.message ?? "Check the highlighted fields.");
      } else if (result.status === "too-fast") {
        setMessage(result.message ?? "Give it a second and submit again.");
      } else {
        setMessage(null);
      }
      setState("error");
    },
    [definition, isBusy, values],
  );

  const errorText =
    message ?? (state === "error" ? "The request did not reach the server. Try again in a moment." : null);

  const fieldId = (field: FormFieldDefinition) => `${prefix}-${field.key}`;

  const requiredFields = useMemo(
    () => definition.fields.filter((field) => field.required).map((field) => field.key),
    [definition],
  );

  if (isJoined) {
    return (
      <div className={`mino-form ${className ?? ""}`}>
        <div className="waitlist-done" role="status" aria-live="polite">
          <span className="waitlist-done-icon" aria-hidden>
            ✓
          </span>
          <div>
            <p className="waitlist-done-title">
              {state === "exists" ? "Already received." : definition.successTitle}
            </p>
            <p className="waitlist-done-body">{definition.successBody}</p>
            {receiptEmail ? (
              <button
                type="button"
                className="waitlist-link"
                onClick={() => {
                  setState("idle");
                  setMessage(null);
                  setValues((current) => ({ ...current, email: "" }));
                  setReceiptEmail("");
                }}
              >
                Send another
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      className={`mino-form ${className ?? ""}`}
      onSubmit={handleSubmit}
      noValidate
      aria-describedby={`${prefix}-status`}
    >
      {definition.fields.map((field) => {
        const id = fieldId(field);
        const describedBy = errors[field.key] ? `${id}-error` : undefined;
        const invalid = Boolean(errors[field.key]);

        return (
          <div className="mino-form-row" key={field.key}>
            <label className="mino-form-label" htmlFor={id}>
              {field.label}
              {field.required ? (
                <span className="mino-form-required" aria-hidden>
                  {" "}
                  *
                </span>
              ) : null}
            </label>

            {field.type === "longtext" ? (
              <textarea
                id={id}
                name={field.key}
                className="field mino-form-textarea"
                rows={field.rows ?? 5}
                maxLength={field.maxLength}
                placeholder={field.placeholder}
                value={values[field.key] ?? ""}
                onChange={(event) => setValue(field.key, event.target.value)}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                required={field.required}
              />
            ) : field.type === "select" ? (
              <select
                id={id}
                name={field.key}
                className="field"
                value={values[field.key] ?? ""}
                onChange={(event) => setValue(field.key, event.target.value)}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                required={field.required}
              >
                <option value="">{field.placeholder ?? "Choose one"}</option>
                {(field.options ?? []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : field.type === "boolean" ? (
              <label className="mino-form-check">
                <input
                  id={id}
                  name={field.key}
                  type="checkbox"
                  checked={values[field.key] === "on"}
                  onChange={(event) => setValue(field.key, event.target.checked ? "on" : "")}
                />
                <span>{field.placeholder ?? "Yes"}</span>
              </label>
            ) : (
              <input
                id={id}
                name={field.key}
                className="field"
                type={
                  field.type === "email"
                    ? "email"
                    : field.type === "number" || field.type === "integer"
                      ? "number"
                      : field.type === "date"
                        ? "date"
                        : "text"
                }
                inputMode={
                  field.type === "email"
                    ? "email"
                    : field.type === "number" || field.type === "integer"
                      ? "numeric"
                      : undefined
                }
                autoComplete={field.autoComplete}
                maxLength={field.maxLength}
                placeholder={field.placeholder}
                value={values[field.key] ?? ""}
                onChange={(event) => setValue(field.key, event.target.value)}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                required={field.required}
              />
            )}

            {field.hint ? <p className="mino-form-hint">{field.hint}</p> : null}

            {errors[field.key] ? (
              <p className="mino-form-error" id={`${id}-error`} role="alert">
                {errors[field.key]}
              </p>
            ) : null}
          </div>
        );
      })}

      <input
        ref={honeypotRef}
        className="waitlist-honeypot"
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div className="mino-form-actions">
        <button type="submit" className="button-primary" disabled={isBusy}>
          {isBusy ? (definition.submittingLabel ?? "Sending…") : definition.submitLabel}
        </button>
        {requiredFields.length > 0 ? (
          <span className="mino-form-hint">
            {requiredFields.length} required {requiredFields.length === 1 ? "field" : "fields"}
          </span>
        ) : null}
      </div>

      <p
        className={`waitlist-status ${state === "error" ? "is-error" : ""}`}
        id={`${prefix}-status`}
        role={state === "error" ? "alert" : "status"}
        aria-live="polite"
      >
        {errorText}
      </p>
    </form>
  );
}

/** Exported for tests: the payload the component would send, without a DOM. */
export { buildFormPayload };
