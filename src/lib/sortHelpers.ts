// Reusable helpers for sorting dropdown/option lists alphabetically.
export const sortByName = <T extends Record<string, any>>(
  items: T[],
  key: keyof T = "name" as keyof T
): T[] => {
  return [...(items || [])].sort((a, b) =>
    String(a?.[key] || "").localeCompare(String(b?.[key] || ""))
  );
};

export const sortByDisplayName = <T extends { display_name?: string | null }>(
  items: T[]
): T[] =>
  [...(items || [])].sort((a, b) =>
    String(a?.display_name || "").localeCompare(String(b?.display_name || ""))
  );

export const sortByTitle = <T extends { title?: string | null }>(items: T[]): T[] =>
  [...(items || [])].sort((a, b) =>
    String(a?.title || "").localeCompare(String(b?.title || ""))
  );
