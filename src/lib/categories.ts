export const contentCategories = ["FOOD", "WORKOUT", "TECH", "PRODUCTS", "JOBS", "MISC"] as const;

export type ContentCategory = (typeof contentCategories)[number];

export const categoryLabels: Record<ContentCategory, string> = {
  FOOD: "Food",
  WORKOUT: "Workout",
  TECH: "Tech",
  PRODUCTS: "Products",
  JOBS: "Jobs",
  MISC: "Misc"
};

export const categoryDescriptions: Record<ContentCategory, string> = {
  FOOD: "Recipes, nutrition, supplements, grocery ideas, diet notes.",
  WORKOUT: "Exercises, training splits, mobility, recovery, equipment.",
  TECH: "Engineering, AI, product-building, frameworks, learning topics.",
  PRODUCTS: "Things to buy, compare, review, or track over time.",
  JOBS: "Roles, companies, skills, resumes, networking, applications.",
  MISC: "Anything useful that does not fit cleanly elsewhere."
};
