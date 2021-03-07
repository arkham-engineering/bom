"use strict"

// Dependencies
const Excel = require("exceljs")
const path = require("path")
const date = require("date-and-time")
const fs = require("fs/promises")
const expressions = require("angular-expressions")

/**
 * A user defined function that returns properties associated with a provided part number.
 * @function
 * @name QueryFunction
 * @param {String} pn - Part Number (Unique ID)
 * @returns {Promise<BOMItemDetails>}
 */

/**
 * BOM item.
 * @typedef {Object} BOMItem
 * @prop {String} pn - Part Number
 * @prop {Number} qty - Quantity
 */

/**
 * BOM item details (minimum).
 * @typedef {Object} BOMItemDetails
 * @prop {String} pn - Part Number (Unique ID)
 * @prop {String} qty - Quantity
 * @prop {String} title - Part title.
 * @prop {String} desc - Part description.
 * @prop {String} unit - Unit (ex: each, in, feet, lbs, etc.). 
 * @prop {Number} unit_cost - Unit cost.
 * @prop {Number} unit_weight - Unit weight.
 */

/**
 * Custom metadata property.
 * @typedef {Object} BOMCustomProperty
 * @prop {String} name - Property name/title.
 * @prop {String} value - Property value.
 */

/**
 * Optional metadata that can be associated with a bill of materials (BOM) instance.
 * @typedef {Object} BOMMetadata
 * @prop {String} [title] (Optional) Default: "Bill of Materials"
 * @prop {String}	[subtitle] (Optional) Subtitle.
 * @prop {String} [footer] (Optional) Footer.
 * @prop {String} [company] (Optional) Company name.
 * @prop {String} [created_by] (Optional) Author name / created by.
 * @prop {Array<BOMCustomProperty>} [custom] (Optional) Custom user defined properties.
 */

/**
 * A new bill of materials (BOM) instance.
 * @class BOM
 * @param {Function} queryFunction A user defined function that returns
 * properties associated with a provided part number (i.e., unique ID).
 * See {@link QueryFunction} for my details.
 * @param {BOMMetadata} metadata Optional metadata.
 * @export
 */
class BOM {
	constructor(queryFunction, metadata = {}) {
		if (typeof queryFunction !== "function") {
			throw new Error("Invalid constructor argument. Expecting user defined query function.")
		}
		this._metadata = {...{
			title: "Bill of Materials", 
			subtitle: "", 
			footer: "",
			company: "", 
			created_by: "",
			custom: []
		},...metadata}
		this._getItemInfo = queryFunction
		this._items = new Map()
		this._details = new Map()
	}

	/**
	 * Adds the desired quantity of parts to the bill of materials (BOM).
	 * @memberof BOM
	 * @param {String} pn - Part Number (Unique ID)
	 * @param {Number} [qty = 1] - Quantity
	 */
	add(pn, qty = 1) {
		// Make sure a valid part number was passed.
		if (typeof pn !== "string") {
			throw new Error("Part number must be a string.")
		}

		// Make sure that the qty passed is a number.
		if (typeof qty !== "number") {
			throw new Error("Part quantity must be a number.")
		}

		// The part numbers and their respective quantities are tracked in the
		// "private" _items Map. The part number is stored as a key while the value
		// is the quantity. Check if item (key) exists. If not, assign key with
		// a value of qty. Otherwise add qty to existing value.
		if (!this._items.has(pn)) {
			this._items.set(pn, qty)
			this._details.set(pn, this._getItemInfo(pn).then(details => {return {pn, qty, ...details}}))
		} else {
			this._items.set(pn, this._items.get(pn) + qty)
		}
	}

	/**
	 * Sets the quantity of a part to a specific quantity.
	 * @memberof BOM
	 * @param {String} pn - Part Number (Unique)
	 * @param {Number} qty - Quantity
	 */
	set(pn, qty) {
		// Make sure a part number was passed.
		if (typeof pn !== "string") {
			throw new Error("Part number must be a string.")
		}

		// Make sure that the qty passed is a number.
		if (typeof qty !== "number") {
			throw new Error("Part quantity must be a number.")
		}

		// Check if the part is in the list.
		if (!this._items.has(pn) && qty > 0) {
			this.add(pn, qty)
		}

		// Remove part if qty is 0 or less than 0, else continue.
		if (qty <= 0) {
			this._items.delete(pn)
			this._details.delete(pn)
		} else {
			this._items.set(pn, qty)
		}
	}

	/**
	 * Removes an item or certain quantity of an item from the bill of materials.
	 * Items with negative quantities are completely removed from the BOM.
	 * @memberof BOM
	 * @param {String} pn - Part Number (Unique ID)
	 * @param {Number} [qty] - Quantity
	 */
	remove(pn, qty = undefined) {
		// Make sure a valid part number was passed.
		if (pn !== "string") {
			throw new Error("Part number must be a string.")
		}

		// Check if the part is in the list.
		if (!this._items.has(pn)) {
			return
		}

		// If no qty provided, delete the entire entry.
		if (qty === undefined) {
			this._items.delete(pn)
			this._details.delete(pn)
			return
		}

		// Make sure that qty provided is a number.
		if (typeof qty !== "number") {
			throw new Error("Part quantity must be a number.")
		}

		let newQty = this._items.get(pn) - qty
		if (newQty <= 0) {
			this._items.delete(pn)
			this._details.delete(pn)
		} else {
			this._items.set(pn, newQty)
		}
	}

	/**
	 * A promise resolving to an object containing all of the details for each item
	 * inside the bill of materials. If a part number is passed then only the details
	 * for that item will be returned.
	 * @memberof BOM
	 * @returns {Promise<BOMItemDetails[] | BOMItemDetails>}
	 * @param {String} [pn] - Part number.
	 */
	getDetails(pn = undefined) {
		if (pn !== undefined) {
			return this._details.get(pn)
		} else {
			// Gather promises for BOM details.
			let promises = Array.from(this._details, ([pn, promiseDetails]) => (promiseDetails))

			// Return resolved promises.
			return (async () => {
				return await Promise.all(promises)
			})()
		}
	}

	/**
	 * Iterates through the current list of 'BOM.items' and refreshes the details using
	 * the user defined query function.
	 * @memberof BOM
	 * @returns {Promise<BOMItemDetails[]>}
	 * @private
	 */
	refresh() {
		let promises = new Array 
		this._items.forEach((qty, pn) => {
			promises.push(
				this._getItemInfo(pn).then((itemDetails) => {
					itemDetails.pn = pn
					return itemDetails
				})
			)
		})

		return Promise.all(promises)
			.then(
				(itemDetailsArray) => {
					itemDetailsArray.forEach((itemDetails) => {
						this._details.set(itemDetails.pn, {...itemDetails})
					})
					return itemDetailsArray
				},
				error => {throw error}
			)
	}
	
	/** 
	 * Performs a cost roll on the items inside the BOM instance.
	 * Operation depends on the property `unit_cost` being returned from
	 * a provided query function.
	 * @memberof BOM
	 * @type {Promise<Number>}
	 * @readonly
	 */
	async costRoll() {
		const details = await this.getDetails()
		let totalCost = 0
		for (let i = 0; i < details.length; i++) {
			if (typeof details[i]?.unit_cost !== "number") {
				throw new TypeError(`Property 'unit_cost' for part number "${details[i].pn}" is either undefined or not a number.`)
			}
			totalCost += details[i].unit_cost * details[i].qty
		}
		return totalCost
	}

	/**
	 * List of items in the bill of materials and their quantities.
	 * Does not indicate order (i.e., order is 'random').
	 * List is an object array of part number and qty.
	 * @memberof BOM
	 * @type {BOMItem[]}
	 * @readonly
	 */
	get items() {
		return Array.from(this._items, ([pn, qty]) => ({pn, qty}))
	}

	/**
	 * Number of unique items in the instance of bill of materials.
	 * @memberof BOM
	 * @type {Number}
	 * @readonly
	 */
	get length() {
		return this._items.size
	}

	/**
	 * Exports the current list of items to an Microsoft Excel spreadsheet.
	 * @param {String} filePath - Desired filepath with .xlsx extension.
	 * @returns {Promise}
	 */
	async export(filePath) {
		let data = await this.getDetails()
		let templatePath = path.resolve(__dirname, "template.xlsx")

		// Write Workbook
		const workbook = new Excel.Workbook()
		return workbook.xlsx

			// Read template file.
			.readFile(templatePath)

			// Populate template workbook.
			.then((workbook) => {
				// Define workbook properties.
				workbook.creator = this._metadata.company
				workbook.created = new Date()
				workbook.modified = new Date()
				workbook.lastModifiedBy = this._metadata.created_by
				workbook.calcProperties.fullCalcOnLoad = true

				// Get worksheet (BOM template).
				let ws = workbook.getWorksheet("BOM")

				// Define header and footer.
				let headerTitle = `&L&C&R&"-,Bold"&18${this._metadata.title.toUpperCase()}`
				let headerSubtitle = this._metadata.subtitle !== "" ? `\n&"-,Regular"&12${this._metadata.subtitle.toUpperCase()}` : ""
				ws.headerFooter.oddHeader = headerTitle + headerSubtitle
				let footerLeft = this._metadata.footer !== "" ? `&L&8${this._metadata.footer}&C` : "&L&C"
				let footerRight = "&R&8Page &P of &N"
				ws.headerFooter.oddFooter = footerLeft + footerRight

				// Metadata (display on document).
				function labelValue(label, value) {
					return {richText: [{text: `${label}: `, font: {bold: true, size: 10}}, {text: value, font: {size: 10}}]}
				}

				// Metadata - Custom Properties
				let rowIndex = 1
				this._metadata.custom.forEach(({name, value}) => {
					if (rowIndex > 2) {
						ws.insertRow(rowIndex, null, 'i')
					}
					ws.getCell(`A${rowIndex}`).value = labelValue(name, value)
					rowIndex++
				})

				// Metadata - Author & Creation
				// let leftAlignment = {vertical: "middle", horizontal: "left"}
				let rightAlignment = {vertical: "middle", horizontal: "right"}
				ws.getCell("M1").value = labelValue("Prepared by", this._metadata.created_by)
				ws.getCell("M2").value = labelValue("Date", date.format(new Date(), "M/D/YYYY"))
				ws.getCell("M1").alignment = rightAlignment
				ws.getCell("M2").alignment = rightAlignment

				// Define data (i.e. array of BOM items).
				let rows = []
				for (let i = 0; i < data.length; i++) {
					rows.push([i + 1, data[i].qty, data[i].pn, "", data[i].title, "", data[i].mfg, data[i].mfg_pn, data[i].unit, data[i].unit_weight, , data[i].unit_cost])
				}

				// Overwrite table in template - limitation of ExcelJS library.
				let tableStartingRow = rowIndex > 2 ? rowIndex + 1 : 4
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
						{ name: "Legacy Number", filterButton: true },
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

				// Write rows to table.
				// Note: duplication of rows done to maintain pre-defined logic in template file.
				let table = ws.getTable("BOM")
				let startingRow = tableStartingRow + 1
				for (let i = 0; i < this._items.size; i++) {
					ws.duplicateRow(startingRow + i, 1, true)
					table.addRow(rows[i], i + 1)
				}
				table.removeRows(0, 1)
				ws.getRow(startingRow + this._items.size + 1).values = undefined
				table.commit()

				// Style table header.
				for (let i = 1; i <= 13; i++) {
					ws.getRow(startingRow - 1).getCell(i).border = {
						top: { style: "thin" },
						bottom: { style: "medium" },
					}
				}

				return workbook
			})

			// Save workbook.
			.then((workbook) => {
					return workbook.xlsx.writeFile(filePath)
			})

			// Error handling.
			.catch((error) => {
				console.error(error)
				throw error
			})
	}

	/**
	 * Builds a bill of materials from a "JSON BOM template".
	 * @param {String} templatePath Filepath to a JSON BOM template.
	 * @param {Object} data JavaScript data scoped to the JSON BOM template.
	 * @returns {Promise} A promise that resolves to an Array of items added to the BOM.
	 */
	buildFromTemplate(templatePath, data) {
		return fs.readFile(templatePath, 'utf8')
		.then((JSONString) => {
			return JSON.parse(JSONString)
		})
		.then((templateContents) => {
			templateContents.forEach((entry) => {
				let addEntry = entry.included !== undefined ? expressions.compile(entry.included)(data) : true
				if (addEntry) {
					this.add(entry.pn, expressions.compile(entry.qty.toString())(data))
				}
			})
			return this.items
		})
	}
}

module.exports = BOM