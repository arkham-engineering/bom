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
	title: "Bill of Materials",
	subtitle: "Preliminary",
	footer: "Preliminary Project Bill of Materials",
	created_by: "John Doe", 
	company: "Acme, Inc.",
	custom: [
		{name: "Project Name", value: "Sumciti Plant"},
		{name: "Project Number", value: "123456"},
		{name: "Project Location", value: "Sumciti, ST"},
		{name: "Description", value: "Example project bill of materials."},
		{name: "Notes", value: "A small number of notes can be included using a custom metadata property."}
	]
}

// Initialize a new bill of materials (BOM).
let bom = new BOM(query, metadata)

// Add "parts" to bill.
for (let i = 0; i < 10; i++) {
	// Adding "parts" that we know exists in our fake dataset.
	bom.add(data[Math.round(1000 * Math.random())].pn, Math.ceil(10 * Math.random()))
}

// Export to Microsoft Excel document.
bom.export(path.resolve(__dirname, "example-manual.xlsx"))