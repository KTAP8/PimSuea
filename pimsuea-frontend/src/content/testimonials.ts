/**
 * Customer quotes shown on marketing pages.
 * ONLY add real quotes with the customer's permission (name/role as they agreed).
 * The section renders nothing while this list is empty — never invent entries.
 */
export type Testimonial = {
  quote: { en: string; th: string };
  name: string;
  role: { en: string; th: string };
  /** e.g. "35 shirts · Basketball club" */
  order?: { en: string; th: string };
};

export const TESTIMONIALS: Testimonial[] = [];
