export interface IBOMTemplateEntry {
  partNumber: string;

  quantity: string | number;

  included: string | boolean | undefined;
}