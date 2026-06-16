import { useEffect } from "react";

// Injects a JSON-LD <script> into <head> for the lifetime of the component,
// then removes it on unmount. Mirrors the upsert/cleanup pattern in
// useDocumentMeta. Accepts a single schema object or an array of them.
export function useJsonLd(schema: object | object[] | null | undefined) {
  useEffect(() => {
    if (!schema) return;

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-blog-jsonld", "");
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [JSON.stringify(schema)]);
}
