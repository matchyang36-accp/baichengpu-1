export type ListItem = { label?: string; text: string };

export type ArticleTableRow = {
  cells: string[];
};

export type ArticleFaqItem = {
  question: string;
  answer: string;
};

export type ArticleBlock =
  | { kind: "heading"; level?: 2 | 3; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: ListItem[] }
  | { kind: "source"; text: string; label: string; href: string }
  | { kind: "internalLink"; text: string; label: string; href: string }
  | { kind: "table"; caption: string; headers: string[]; rows: ArticleTableRow[] }
  | {
      kind: "imagePair";
      images: Array<{ src: string; alt: string; caption: string }>;
      caption: string;
    }
  | { kind: "faq"; title: string; items: ArticleFaqItem[] };

export type ArticleBody = {
  blocks: ArticleBlock[];
  cta: { title: string; description: string; button: string };
  summary?: string;
  updatedAt?: string;
};

export type ScheduledArticle = ArticleBody & {
  id: string;
  tag: string;
  title: string;
  description: string;
  targetKeyword: string;
  publishedAt: string;
  date: string;
  reviewedBy: string;
};
