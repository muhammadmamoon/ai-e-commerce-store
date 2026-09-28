export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  isActive: boolean;
  _count?: {
    products: number;
    children: number;
  };
  children: CategoryNode[];
}

/**
 * Converts a flat array of categories from Prisma into a nested hierarchical tree.
 */
export function buildCategoryTree(categories: any[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];

  // Initialize map with all nodes
  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] });
  }

  // Populate children arrays
  for (const cat of categories) {
    const node = map.get(cat.id)!;
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/**
 * Flattens a nested category tree into an ordered array with depth level and path prefix
 * (e.g., "Electronics —> Mobile Phones") for clean rendering in HTML <select> inputs and tables.
 */
export function flattenCategoryTree(
  nodes: CategoryNode[],
  depth = 0,
  parentPath = "",
): Array<CategoryNode & { depth: number; fullPath: string }> {
  let result: Array<CategoryNode & { depth: number; fullPath: string }> = [];

  for (const node of nodes) {
    const currentPath = parentPath ? `${parentPath} → ${node.name}` : node.name;
    result.push({ ...node, depth, fullPath: currentPath });

    if (node.children && node.children.length > 0) {
      result = result.concat(
        flattenCategoryTree(node.children, depth + 1, currentPath),
      );
    }
  }

  return result;
}

/**
 * Generates URL-friendly slugs.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}
