export type ListItem = { label?: string; text: string };

export type ArticleBlock =
  | { kind: "heading"; level?: 2 | 3; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: ListItem[] }
  | { kind: "source"; text: string; label: string; href: string };

export type ArticleBody = {
  blocks: ArticleBlock[];
  cta: { title: string; description: string; button: string };
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
