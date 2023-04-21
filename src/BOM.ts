"use strict"

// Dependencies
import fs from "node:fs/promises";
import path from "node:path";
import expressions from "angular-expressions";
import * as Excel from "exceljs";
import { Alignment } from "exceljs";
import { BOMItemDetails } from "./BOMItemDetails";
import { BOMMetadata } from "./BOMMetadata";
import { IBOMItem } from "./IBOMItem";
import { IBOMTemplateEntry } from "./IBOMTemplate";
import { IQueryFunction } from "./IQueryFunction";

/**
 * A new bill of materials (BOM) instance.
 * @class BOM
 * @param queryFunction A user defined function that returns properties 
 * associated with a provided part number (i.e., unique ID).
 * @param metadata Optional metadata.
 * @export
 */
export default class BOM {
	constructor(queryFunction: IQueryFunction, metadata: BOMMetadata = {}) {
		if (typeof queryFunction !== "function") {
			throw new Error("Invalid constructor argument. Expecting user defined query function.")
		}
		this._metadata = Object.assign(new BOMMetadata(), metadata);
		this._getItemInfo = queryFunction;
	}

	/**
	 * User defined query function.
	 */
	private _getItemInfo: IQueryFunction;

	/** 
	 * User defined metadata. 
	 */
	private _metadata: BOMMetadata;

	/**
	 * Map (Dictionary) of BOM items. Each key in the Map is a part number logged
	 * in the bill the materials while the value is total quantity.
	 */
	private _items: Map<string, number> = new Map();

	/**
	 * Map (Dictionary) of BOM item details. Each key in the Map is a part number
	 * logged in the bill of the materials while the value is the associated BOM
	 * details  provided by the user's query function.
	 */
	private _details: Map<string, BOMItemDetails> = new Map();

	/**
	 * Adds the desired quantity of parts to the bill of materials (BOM).
	 * @param partNumber - Part Number (Unique ID).
	 * @param quantity - Quantity.
	 */
	async add(partNumber: string, quantity: number = 1): Promise<void> {
		// The part numbers and their respective quantities are tracked in the
		// private _items Map. The part number is stored as a key while the value
		// is the quantity. Check if item (key) exists. If not, assign key with
		// a value of qty. Otherwise add qty to existing value.

		sanitizeInputs(partNumber, quantity);
		const partQuantity = this._items.get(partNumber);
		if (partQuantity !== undefined) {
			this._items.set(partNumber, partQuantity + quantity);
		} else {
			this._items.set(partNumber, quantity);
			await this._getItemInfo(partNumber).then(details => this._details.set(partNumber, {...details, partNumber, quantity}));
		}
	}

	/**
	 * Sets the quantity of a part to a specific quantity.
	 * @param partNumber - Part Number (Unique).
	 * @param quantity - Quantity.
	 */
	async set(partNumber: string, quantity: number): Promise<void> {
		// Check if the part is in the list, if not add it.
		// Remove part if quantity is 0 or less than 0, else continue.
		
		sanitizeInputs(partNumber, quantity);
		if (this._items.has(partNumber)) {
			if (quantity <= 0) {
				this._items.delete(partNumber);
				this._details.delete(partNumber);
			} else {
				this._items.set(partNumber, quantity);
			}
		} else if (quantity > 0) {
			this._items.set(partNumber, quantity);
			await this._getItemInfo(partNumber).then(details => this._details.set(partNumber, {...details, partNumber, quantity}));
		}
	}

	/**
	 * Removes an item or certain quantity of an item from the bill of materials.
	 * Items with negative quantities are completely removed from the BOM.
	 * @param partNumber - Part Number (Unique ID).
	 * @param quantity - Quantity.
	 */
	remove(partNumber: string, quantity: number | undefined = undefined): void {
		// Make sure a valid part number was passed.
		if (typeof partNumber !== "string") {
			throw new TypeError("Invalid part number provided. The part number must be a string.");
		}

		// Make sure that the qty passed is a number or undefined.
		if (typeof quantity !== "number" && quantity !== undefined) {
			throw new TypeError("Invalid part quantity provided. Part quantity must be a number or undefined.");
		}

		// If no quantity is provided then delete the entry; else update the quantity.
		let newQty = (this._items.get(partNumber) ?? 0) - (quantity ?? 0);
		if (quantity === undefined || newQty <= 0) {
			this._items.delete(partNumber);
			this._details.delete(partNumber);
		} else {
			this._items.set(partNumber, newQty);
		}
	}

	/**
	 * A promise resolving to an object containing all of the details for each item
	 * inside the bill of materials. If a part number is passed then only the details
	 * for that item will be returned. If the provided part number is unknown then
	 * the Promise will resolve to undefined.
	 * @param pn - Optional. Part number.
	 */
	getDetails(): Promise<BOMItemDetails[]>
	getDetails(partNumber: string): Promise<BOMItemDetails | undefined>
	getDetails(partNumber: string | undefined = undefined): Promise<BOMItemDetails | BOMItemDetails[] | undefined> {
		if (partNumber !== undefined) {
			return Promise.resolve(this._details.get(partNumber));
		} else {
			return Promise.resolve(Array.from(this._details, ([partNumber, details]) => details));
		}
	}

	/**
	 * Updates the definition of each item in the bill of materials by querying it's
	 * value.
	 */
	private refresh(): Promise<void> {
		let promises: Promise<BOMItemDetails>[] = [];
		this._items.forEach((quantity, partNumber) => promises.push(this._getItemInfo(partNumber).then(details => ({...details, partNumber, quantity}))));

		return Promise
			.all(promises)
			.then(itemDetailsArray => {
				itemDetailsArray.forEach(details => this._details.set(details.partNumber, {...details}))
			});
	}
	
	
	/** 
	 * Performs a cost roll on the items inside the BOM instance.
	 * This operation depends on the property `unitCost` being returned from
	 * a provided query function.
	 */
	getTotalCost(): number {
		let totalCost = 0;
		this._items.forEach((quantity: number, partNumber: string) => {
			const unitCost = this._details.get(partNumber)?.unitCost;
			totalCost += (unitCost ?? 0) * quantity;
			// if (unitCost === undefined || typeof unitCost !== "number") {
			// 	console.warn(`Property "unitCost" for part number "${partNumber}" is either undefined or not a number.`);
			// }
		});
		return totalCost;
	}

	/** 
	 * Gets the total weight on the items inside the BOM instance.
	 * This operation depends on the property `unitWeight` being returned from
	 * a provided query function.
	 */
	getTotalWeight(): number {
		let totalWeight = 0;
		this._items.forEach((quantity: number, partNumber: string) => {
			const unitWeight = this._details.get(partNumber)?.unitWeight;
			totalWeight += (unitWeight ?? 0) * quantity;
		});
		return totalWeight;
	}

	/**
	 * An array of each part in the bill of materials and its corresponding quantity.
	 * Note that the order of the array is random.
	 * @readonly
	 */
	get items(): IBOMItem[] {
		return Array.from(this._items, ([partNumber, quantity]) => ({partNumber, quantity}));
	}

	/**
	 * The number of unique items in the of bill of materials.
	 * @readonly
	 */
	get length(): number {
		return this._items.size;
	}

	/**
	 * Exports the current list of items to an Microsoft Excel spreadsheet.
	 * @param filePath - Desired filepath with .xlsx extension.
	 */
	async export(filePath: string): Promise<void> {
		const data = await this.getDetails();
		const templatePath = path.resolve(__dirname, "template.xlsx");

		// Write Workbook
		const workbook = new Excel.Workbook()
		return workbook.xlsx
			.readFile(templatePath)
			.catch(error => { throw new Error("Unable to read template Microsoft Excel file.", {cause: error}); })
			.then((workbook) => {
				// Sanitize inputs.
				const title = this._metadata.title ?? "";
				const subtitle = this._metadata.subtitle ?? "";
				const footer = this._metadata.footer ?? "";
				const company = this._metadata.company ?? "";
				const createdBy = this._metadata.created_by ?? "";
				const createdOn = new Date();

				// Workbook Properties
				workbook.creator = company;
				workbook.created = createdOn;
				workbook.modified = createdOn;
				workbook.lastModifiedBy = createdBy;
				workbook.calcProperties.fullCalcOnLoad = true;

				// Get worksheet inside BOM template.
				let ws = workbook.getWorksheet("BOM");

				// Header & Footer
				let headerTitle = `&L&C&R&"-,Bold"&18${title.toUpperCase()}`;
				let headerSubtitle = `\n&"-,Regular"&12${subtitle.toUpperCase()}`;
				ws.headerFooter.oddHeader = headerTitle + headerSubtitle;

				// TODO: Determine whether this formatting check is necessary.
				let footerLeft = footer !== "" ? `&L&8${footer}&C` : "&L&C";
				let footerRight = "&R&8Page &P of &N";
				ws.headerFooter.oddFooter = footerLeft + footerRight;

				// Metadata (Write/Display on Document)
				function labelValue(label: string, value: string) {
					return {richText: [{text: `${label}: `, font: {bold: true, size: 10}}, {text: value, font: {size: 10}}]};
				}

				// Metadata - Custom Properties (If Defined)
				let rowIndex = 1;
				this._metadata.custom?.forEach(({name, value}) => {
					if (rowIndex > 2) ws.insertRow(rowIndex, null, 'i');
					ws.getCell(`A${rowIndex}`).value = labelValue(name, value);
					rowIndex++;
				});

				// Right cell alignment.
				const rightAlignment: Alignment = {
					horizontal: "right",
					indent: 0,
					readingOrder: "ltr",
					shrinkToFit: false,
					textRotation: 0,
					vertical: "middle", 
					wrapText: false
				};

				// Metadata - Author & Creation
				ws.getCell("M1").value = labelValue("Prepared by", createdBy);
				ws.getCell("M2").value = labelValue("Date", new Intl.DateTimeFormat("en-US", {dateStyle: "short"}).format(createdOn));
				ws.getCell("M1").alignment = rightAlignment;
				ws.getCell("M2").alignment = rightAlignment;

				// Define data (i.e. list of array items).
				let rows = [];
				for (let i = 0; i < data.length; i++) {
					rows.push([
						i + 1, 
						data[i].quantity, 
						data[i].partNumber,
						data[i].title, 
						data[i].description, 
						"",
						data[i].manufacturer ?? "", 
						data[i]?.manufacturerPartNumber ?? "", 
						data[i].unit, 
						data[i].unitWeight,
						, 
						data[i].unitCost
					])
				}

				// Overwrite table in template - limitation of ExcelJS library.
				let tableStartingRow = rowIndex > 2 ? rowIndex + 1 : 4;

				ws.addTable({
					name: "BOM",
					ref: `A${tableStartingRow}`,
					headerRow: true,
					totalsRow: true,
					style: {
						theme: "TableStyleLight1",
						showRowStripes: false,
					},
					columns: [
						{ name: "Item", filterButton: true, totalsRowLabel: "" },
						{ name: "Qty", filterButton: true },
						{ name: "Part Number", filterButton: true },
						{ name: "Title", filterButton: true },
						{ name: "Description", filterButton: true },
						{ name: "Mat./Finish", filterButton: true },
						{ name: "Mfg.", filterButton: true },
						{ name: "Mfg. Part Number", filterButton: true },
						{ name: "Unit", filterButton: true },
						{ name: "Unit Weight", filterButton: true },
						{ name: "Total Weight", filterButton: true },
						{ name: "Unit Cost", filterButton: true, totalsRowFunction: "custom", totalsRowFormula: '"Total"'},
						{ name: "Total Cost", filterButton: true, totalsRowFunction: "sum" },
					],
					rows: [[]],
				})

				let table = ws.getTable("BOM");
				let startingRow = tableStartingRow + 1;
				for (let i = 0; i < this._items.size; i++) {
					ws.duplicateRow(startingRow + i, 1, true);
					table.addRow(rows[i], i + 1);
				}

				table.removeRows(0, 1);
				// @ts-ignore
				ws.getRow(startingRow + this._items.size + 1).values = undefined;
				table.commit();

				// Style Table Header Row
				for (let i = 1; i <= 13; i++) {
					ws.getRow(startingRow - 1).getCell(i).border = {
						top: { style: "thin" },
						bottom: { style: "medium" },
					}
				}
				
				return workbook;
			})
			.catch(error => { throw new Error("Unable to create Microsoft Excel file. An internal error occurred.", {cause: error})})
			.then(workbook => workbook.xlsx.writeFile(filePath))
			.catch(error => { throw new Error("Unable to write Microsoft Excel file to disk.", {cause: error}); });
	}

	/**
	 * Builds a bill of materials from a "JSON BOM template".
	 * @param {String} templatePath Filepath to a JSON BOM template.
	 * @param {Object} data JavaScript data scoped to the JSON BOM template.
	 * @returns {Promise} A promise that resolves to an Array of items added to the BOM.
	 */
	buildFromTemplate(templatePath: string, data: any) {
		this._items.clear();
		this._details.clear();
		
		return fs.readFile(templatePath, 'utf8')
		.then(JSONString => JSON.parse(JSONString))
		.then((templateContents: IBOMTemplateEntry[]) => {
			templateContents.forEach(entry => {
				let addEntry = entry.included !== undefined ? expressions.compile(entry.included)(data) : true;
				if (addEntry) this.add(entry.partNumber, expressions.compile(entry.quantity?.toString() ?? 0)(data));
			});
			return this.items;
		});
	}
}

function sanitizeInputs(partNumber: string, quantity: number): void {
	// Make sure a valid part number was passed.
	if (typeof partNumber !== "string") {
		throw new TypeError("Invalid part number provided. The part number must be a string.");
	}

	// Make sure that the qty passed is a number.
	if (typeof quantity !== "number") {
		throw new TypeError("Invalid part quantity provided. Part quantity must be a number.");
	}
}