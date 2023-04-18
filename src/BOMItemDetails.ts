import { IBOMItemDetails } from "./IBOMItemDetails";

export class BOMItemDetails implements IBOMItemDetails {
  partNumber: string = "";
  quantity: number = 0;
  title: string = "";
  description: string = "";
  manufacturer?: string | undefined = undefined;
  manufacturerPartNumber?: string | undefined = undefined;
  unit: string = "";
  unitCost: number = 0;
  unitWeight: number = 0;
}