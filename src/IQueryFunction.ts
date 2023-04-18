import { IBOMItemDetails } from "./IBOMItemDetails";

/**
 * BOM item query function. A user defined function that returns properties 
 * associated with a provided part number.
 * @param partNumber Part Number (Unique ID)
 * @returns
 */
export type IQueryFunction = (partNumber: string) => Promise<IBOMItemDetails>;