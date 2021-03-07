"use strict"

const BOM = require("../index.js")
const path = require("path")
const data = require("./data.json")

// User defined query function.
// In this case we are finding the entry in our fake dataset that matches the 
// part number field provided.
let query = function (pn) {
	return Promise.resolve(
		data.find(entry => entry.pn === pn)
	)
}

// Metadata
let metadata = {
	title: "Shopping List",
	subtitle: "Acme Cooking, Co.",
	footer: "Acme Cooking, Co. | Fresh Food Delivery",
	created_by: "John Doe", 
	company: "Acme Cooking, Co.",
	custom: [
		{name: "Client Name", value: "Jessica Smith"},
		{name: "Shipping Address", value: "456321 Wavy Ave, Sumciti, ST 53426"},
		{name: "Billing Address", value: "123456 Along Rd, Sumciti, ST 53426"}
	]
}

// Initialize a new bill of materials (BOM).
let bom = new BOM(query, metadata)

// Scoped Data
let scopedData = {
	day: "Tuesday",
	specialItemsNeeded: true
}

// Build BOM from JSON template.
bom.buildFromTemplate(path.resolve(__dirname, "template.json"), scopedData)
	.then(() => {
		// Export to Microsoft Excel document.
		bom.export(path.resolve(__dirname, "example-buildFromTemplate.xlsx"))
	})
	.catch((error) => {
		console.error("Something went wrong.\n", error)
	})

