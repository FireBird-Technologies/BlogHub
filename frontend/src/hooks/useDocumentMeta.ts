import { useEffect } from "react";

interface DocumentMeta {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  image?: string | null;
  type?: "website" | "article";
}

function upsertMetaName(name: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertMetaProperty(property: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(url: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", url);
}

function getMetaName(name: string): string {
  return document.head.querySelector(`meta[name="${name}"]`)?.getAttribute("content") ?? "";
}

function getMetaProperty(property: string): string {
  return document.head.querySelector(`meta[property="${property}"]`)?.getAttribute("content") ?? "";
}

export function useDocumentMeta(meta: DocumentMeta) {
  const { title, description, canonicalUrl, image, type } = meta;

  useEffect(() => {
    const prev = {
      title: document.title,
      description: getMetaName("description"),
      canonical:
        document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.getAttribute("href") ?? "",
      ogTitle: getMetaProperty("og:title"),
      ogDescription: getMetaProperty("og:description"),
      ogUrl: getMetaProperty("og:url"),
      ogImage: getMetaProperty("og:image"),
      ogType: getMetaProperty("og:type"),
      twTitle: getMetaName("twitter:title"),
      twDescription: getMetaName("twitter:description"),
      twImage: getMetaName("twitter:image"),
    };

    if (title) {
      document.title = title;
      upsertMetaProperty("og:title", title);
      upsertMetaName("twitter:title", title);
    }
    if (description) {
      upsertMetaName("description", description);
      upsertMetaProperty("og:description", description);
      upsertMetaName("twitter:description", description);
    }
    if (canonicalUrl) {
      upsertCanonical(canonicalUrl);
      upsertMetaProperty("og:url", canonicalUrl);
    }
    if (image) {
      upsertMetaProperty("og:image", image);
      upsertMetaName("twitter:image", image);
    }
    if (type) {
      upsertMetaProperty("og:type", type);
    }

    return () => {
      document.title = prev.title;
      upsertMetaName("description", prev.description);
      if (prev.canonical) upsertCanonical(prev.canonical);
      upsertMetaProperty("og:title", prev.ogTitle);
      upsertMetaProperty("og:description", prev.ogDescription);
      upsertMetaProperty("og:url", prev.ogUrl);
      upsertMetaProperty("og:image", prev.ogImage);
      upsertMetaProperty("og:type", prev.ogType);
      upsertMetaName("twitter:title", prev.twTitle);
      upsertMetaName("twitter:description", prev.twDescription);
      upsertMetaName("twitter:image", prev.twImage);
    };
  }, [title, description, canonicalUrl, image, type]);
}
