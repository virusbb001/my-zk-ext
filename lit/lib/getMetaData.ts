import { DOMParser, HTMLDocument } from "@b-fuze/deno-dom";
import { default as jsonld } from "jsonld";

export interface WebMetaData {
  author?: string;
  title?: string;
  description?: string;
}

const jsonLDSelector = `script[type="application/ld+json"]`;

/**
 * get names of authors from meta
 */
export function getAuthorFromMeta(doc: HTMLDocument): string[] {
  const authors: string[] = [];
  const meta = doc.querySelectorAll("meta[name=author]");
  if (meta.length > 0) {
    meta.forEach((node) => {
      const content = node.getAttribute("content");
      if (content) {
        authors.push(content);
      }
    });
    return authors;
  }
  return [];
}

export function getAuthor(doc: HTMLDocument, ld: Array<Record<string, any>>) {
  const fromMeta = getAuthorFromMeta(doc);
  if (fromMeta.length > 0) {
    return fromMeta;
  }
  return getAuthorFromLD(ld);
}

/**
 * get description from html
 *
 * 1. meta tag, that found first.
 * 2. json-ld
 */
export function getDescription(doc: HTMLDocument): string | undefined {
  const meta = doc.querySelector("meta[name=description]");
  if (meta) {
    const content = meta.getAttribute("content");
    if (content) {
      return content;
    }
  }
  return;
}

/**
 * 1. title tag
 */
export function getTitle(doc: HTMLDocument): string | undefined {
  const titleElement = doc.querySelector("title");
  if (titleElement) {
    return titleElement.textContent;
  }

  // title is missing
  return;
}

export function getAuthorFromLD(ld: Array<Record<string, unknown>>) {
  const schemaAuthor = "http://schema.org/author";
  const schemaName = "http://schema.org/name";
  const hasAuthor = ld.filter((subject) => schemaAuthor in subject);
  const authors = hasAuthor.flatMap((subject) => subject[schemaAuthor]);
  const authorNames = authors.flatMap((author) => {
    if (!author) {
      return undefined;
    }
    if (typeof author === "string") {
      return author;
    }
    if (typeof author !== "object") {
      console.error(`unknown type: ${typeof author}`);
      console.error(author);
    }
    const authorName = (author as Record<string, unknown>)[schemaName];
    if (!authorName) {
      return undefined;
    }
    const authorNameArr = Array.isArray(authorName) ? authorName : [authorName];
    const names = authorNameArr.map((authorName) => {
      if (typeof authorName === "string") {
        return authorName;
      }
      if ("@value" in authorName) {
        return authorName["@value"];
      }
    }).filter((v) => !!v);
    return names;
  }).filter((v) => !!v);
  return authorNames;
}

export function getDescriptionFromLD(ld: Array<Record<string, unknown>>) {
  const schemaDescription = "http://schema.org/description";
  const priorityClass = [
    "http://schema.org/Article",
    "http://schema.org/WebSite",
  ];
  const hasDescription = ld.filter((subject) => schemaDescription in subject)
    .sort((a, b) => {
      // @type should be string?
      const aClasses =
        (Array.isArray(a["@type"]) ? a["@type"] : [a["@type"]]) as string[];
      const bClasses =
        (Array.isArray(b["@type"]) ? b["@type"] : [b["@type"]]) as string[];

      // 最小のpriorityClassのindexを返却する
      const aClassesIndex = Math.min(
        ...aClasses.map((cls) => priorityClass.indexOf(cls)).filter((idx) =>
          idx >= 0
        ),
      );
      const bClassesIndex = Math.min(
        ...bClasses.map((cls) => priorityClass.indexOf(cls)).filter((idx) =>
          idx >= 0
        ),
      );
      return aClassesIndex - bClassesIndex;
    });
  const descriptions = hasDescription.flatMap((subject) =>
    subject[schemaDescription]
  );
  const description = descriptions.at(0);
  if (!description) {
    return undefined;
  }
  if (typeof description === "string") {
    return description;
  }
  if (typeof description !== "object") {
    return undefined;
  }
  if ("@value" in description) {
    return description["@value"];
  }
  console.warn("failed to parse description");
  console.warn(description);
  return undefined;
}

async function getHTML(url: string) {
  const response = await fetch(url, {
    redirect: "follow",
  });

  const contentType = response.headers.get("Content-Type");
  const mimeType = contentType?.split(";")[0];

  if (mimeType !== "text/html") {
    throw new Error(`response is not html: ${mimeType}`);
  }
  const html = await response.text();
  return html;
}

export async function getWebMetaData(html: string): Promise<WebMetaData> {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const jsonLDElements = doc.querySelectorAll(jsonLDSelector);
  let jsonLD: unknown[] = [];
  jsonLDElements.forEach((element) => {
    const content = element.textContent;
    try {
      const json = JSON.parse(content);
      if (Array.isArray(json)) {
        jsonLD = jsonLD.concat(json);
      } else {
        jsonLD.push(json);
      }
    } catch (e) {
      console.error(e);
      console.error(content);
    }
  });
  const expanded = await jsonld.expand(jsonLD) as Array<
    Record<string, unknown>
  >;
  const author = (getAuthor(doc, expanded)).join(
    ", ",
  );
  const description = getDescription(doc);
  const title = getTitle(doc);
  if (!author) {
    console.warn("failed to get author");
  }
  if (!description) {
    console.warn("failed to get description");
  }
  if (!title) {
    console.warn("failed to get title");
  }
  return {
    author,
    description,
    title,
  };
}

export async function getMetaDataFromURL(url: string) {
  const html = await getHTML(url);
  const metadata = await getWebMetaData(html);
  return metadata;
}
