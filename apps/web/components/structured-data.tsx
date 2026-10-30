export interface JsonLdValue {
  [key: string]: unknown;
}

/**
 * Renders a JSON-LD block. Static export friendly: no runtime, no external
 * requests, and `<` is escaped so the payload can never close the script tag.
 */
export function JsonLd({ data }: { data: JsonLdValue | JsonLdValue[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      // The content is generated here from typed objects, never user input.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

export interface FaqEntry {
  question: string;
  answer: string;
  link?: { label: string; href: string };
}

export function faqPageSchema(items: FaqEntry[]): JsonLdValue {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

interface FaqListProps {
  items: FaqEntry[];
  /** Emit FAQPage structured data next to the list. */
  withSchema?: boolean;
  className?: string;
}

/**
 * Accessible, zero-JS accordion built on <details>. Crawlers get every answer
 * in the HTML, which is also what the FAQPage schema promises.
 */
export function FaqList({ items, withSchema = true, className }: FaqListProps) {
  return (
    <>
      <div className={className ? `faq-list ${className}` : "faq-list"}>
        {items.map((item) => (
          <details key={item.question} className="faq-item">
            <summary>{item.question}</summary>
            <div className="faq-answer">
              <p>{item.answer}</p>
              {item.link ? (
                <p>
                  <a href={item.link.href}>{item.link.label}</a>
                </p>
              ) : null}
            </div>
          </details>
        ))}
      </div>
      {withSchema ? <JsonLd data={faqPageSchema(items)} /> : null}
    </>
  );
}
