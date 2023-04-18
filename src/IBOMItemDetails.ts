/**
 * BOM item details (minimum).
 */
export interface IBOMItemDetails {
	/**
	 * Optional. Part Number (Unique ID).
	 */
	partNumber?: string;

	/**
	 * Part title.
	 */
	title: string;

	/**
	 * Part description.
	 */
	description: string;

	/**
	 * Optional. Manufacturer.
	 */
	manufacturer?: string;

	/**
	 * Optional. Manufacturer part number.
	 */
	manufacturerPartNumber?: string;

	/**
	 * Unit (ex: each, in, feet, lbs, etc.).
	 */
	unit: string;

	/**
	 * Unit cost.
	 */
	unitCost: number;

	/** 
	 * Unit weight. 
	 */
	unitWeight: number;
}