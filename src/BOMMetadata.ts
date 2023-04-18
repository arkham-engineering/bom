import { BOMCustomProperty } from './BOMCustomProperty';

/**
 * Optional metadata that can be associated with a bill of materials (BOM) instance.
 */
export class BOMMetadata {
	/**
	 * Title.
	 * @default "Bill of Materials"
	 */
	title?: string = "Bill of Materials";
  
	/**
	 * Subtitle.
	 */
	subtitle?: string;
  
	/**
	 * Footer.
	 */
	footer?: string;

	/**
	 * Company name.
	 */
  company?: string;

	/**
	 * Author name / created by.
	 */
  created_by?: string;

	/**
	 * Custom user defined properties.
	 */
	custom?: BOMCustomProperty[];
}
