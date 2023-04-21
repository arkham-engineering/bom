# BOM.js

An Node.js module that allows a user to programmatically create a [bill of materials (BOM)](https://en.wikipedia.org/wiki/Bill_of_materials) using only part numbers and the desired quantity. The final bill of materials is built against an outside dataset (database) to generate a detailed list of information.

## Overview

The BOM.js module provides a simple mechanism to represent and export a single-level bill of materials (BOM). In the engineering and manufacturing communities, a bill of materials will primarily contain a list of parts that are to be manufactured or purchased to produce a product. It can also be seen as a "formula, recipe, or ingredients list" needed for production. A part, in simple terms, represents a physical item that has a "part number" as means of identification/tracking. Parts also have properties associated with them. Some of these properties include:

- Title / Description
- Unit of Measure (UOM)
- Weight (or Unit Weight)
- Cost (or Unit Cost)
- etc.

The information associated with each part is often stored in a database such as those found in a [ERP](https://en.wikipedia.org/wiki/Enterprise_resource_planning) system. These databases will serve as the master source of information. BOM.js is designed to create dynamic bill of materials which can be tied to these master data sources.

## Installation

npm ([Link](https://www.npmjs.com/package/@arkham-engineering/bom)):

```powershell
npm install @arkham-engineering/bom
```

Yarn ([Link](https://yarnpkg.com/package/@arkham-engineering/bom)):

```powershell
yarn add @arkham-engineering/bom
```

## Importing

The module then can be referenced using the following syntax:

```javascript
// CommonJS Module
const BOM = require('@arkham-engineering/bom');

// ECMAScript Module
import BOM from '@arkham-engineering/bom';
```

## Usage

A new bill of materials is created by initializing a new instance of the BOM class. In the example below we will create a new bill of materials denoted by the variable `bom`.

```javascript
let bom = new BOM(queryFx, options)
```

The `BOM` constructor has two arguments, a "query function" while the second argument is an optional `options` object. Refer to the [API](doc/api.md) for information.

### Query Function

The query function is a user defined function, that when provided a part number, returns a Promise, that when resolved, is an object containing all the properties associated with the given part. The intent is that this function would query a database (or search some other dataset) that contains all of the relevant properties associated with a part number. The following is an example of a simple query function:

```javascript
// Part data stored on disc as JSON.
let data = require("./data.json")

// Query function.
function queryFx(pn) {
  return Promise.resolve(data.pn)
}
```

In this example, the detailed information about all of the parts is stored inside a JSON file. The query function provides the properties inside this dataset based on the given part number. It is recommended that the object returned contain commonly used properties (keys) used in a bill of materials (see [Data](Data)).

### Data

It is recommended that the object return from the query function return the following properties at a minimum:

| Name        | Type                | Description                           |
| ----------- | ------------------- | ------------------------------------- |
| partNumber  | <code>String</code> | Part Number (Unique ID)               |
| title       | <code>String</code> | Part title.                           |
| description | <code>String</code> | Part description.                     |
| unit        | <code>String</code> | Unit (ex: each, in, feet, lbs, etc.). |
| unitCost    | <code>Number</code> | Unit cost.                            |
| unitWeight  | <code>Number</code> | Unit weight.                          |

### Methods & Properties

Each BOM instance contains methods to add, remove, and modify items in the bill of materials. In general, most of these methods will require a part number and a quantity. The following sub-sections detail the usage of each method or property within the BOM class.

#### Add Item `.add()`

Adds an item to the parts list provided a part number `{String}` and a quantity `{Number}`.

```javascript
// Adds one instance of the part to the list.
bom.add(partNumber);

// Adds specified number of parts to the list.
bom.add(partNumber, quantity);
```

#### Remove Item `.remove()`

Removes an item or specific quantity of the item from the parts list depending on the parameters provided.

```javascript
// Remove an item completely from the list.
bom.remove(partNumber);

// Remove a specified quantity.
bom.remove(partNumber, quantity);
```

#### Modify Item `.set()`

Modifies (or in this case sets) the quantity of the part in the parts list. If the quantity is less than or equal to zero then part will be completely removed.

```javascript
// Set the quantity of an item to a specific value.
bom.set(partNumber, quantity);
```

#### Length `.length`

Returns the number (i.e., distinct count) of items in the bill of materials.

```javascript
bom.length // Returns {Number}
```

#### Items `.items`

The current list of items in the bill of materials can be accessed using the items property. This will return an array of objects with keys `pn` and `qty` representing part number and quantity, respectively.

```javascript
// Returns the collection of items with basic information.
console.log(bom.items);

// Example Result:
[
    {pn: "foo": qty: 10},
    {pn: "bar": qty: 20},
    {pn: "baz": qty: 5}
]
```

#### Details `.getDetails()`

Returns a promise resolving to a detailed bill of materials. This object array will include information provided by the [Query Function](QueryFunction).

```javascript
// Returns the collection of items with detailed information.
bom
  .getDetails()
  .then(details => /* Process BOM information. */)
  .catch(error => /* Handle error spawned from query function. */)

// Example Result:
/*
[
	{
		pn: "001",
		qty: 10,
		desc: "...",
		unit: "each",
		unit_cost: 20,
		total_cost: 200,
	},
	{
		pn: "002",
		qty: 1,
		desc: "...",
		unit: "each",
		unit_cost: 40,
		total_cost: 40,
	},
	{
		pn: "003",
		qty: 12,
		desc: "...",
		unit: "inch",
		unit_cost: 0.5,
		total_cost: 6,
	}
]
*/
```

#### Cost Roll `.costRoll()`

Returns a promise resolving to the total material cost of the bill of materials. This function depends requires that a `unitCost` property is available in each BOM item. This function will throw a type error if one or more items do not have a `unitCost` defined.

```javascript
bom.costRoll() // Returns {Promise<Number>}
```

#### Total Weight `.totalWeight()`



#### Export `.export()`

Exports the bill of materials to a Microsoft Excel file. The destination path should include the ".xlsx" extension. The metadata provided during construction will be used to format the Excel document.

```javascript
// Exports the
list.export(destinationFilePath) // Returns {Promise}
```

#### Build from Template `.buildFromTemplate()`

A `BOM` instance can also be populated from a JSON template. This template can be scoped against another data set, thus allowing a user to incorporate logic into the compellation of a bill of materials.

For example, lets assume a bill of materials needs to be constructed against a users input. In this example the user can specify the color of a product to be either red or yellow as well as specify a desired quantity. We can represent this using the following JSON template:

```json
[
	{
		"pn": "110-RED",
		"qty": "count",
		"include": "color === 'red'"
	},
	{
		"pn": "110-YEL",
		"qty": "count",
		"include": "color === 'yellow'"
	}
]
```

In this template the correct part is chosen based on the selected color. The users input is contained inside a object that at a minimum contains two keys: `color` and `count`. The `color` property will contain the color selection while the `count` property will indicate the desired quantity. This functionality is achieved using [angular-expressions](https://github.com/peerigon/angular-expressions).

The bill of materials would then be constructed doing the following:

```javascript
let data = { color: "red", count: 3 }
let templatePath = "path/to/json/template.json"
let queryFx = function(pn) {...} // Query function.

let bom = new BOM(queryFx)
bom.buildFromTemplate("templatePath", data)
```

In this case the bill of materials will have one item: three red "widgets".

> Note that for security reasons the object scoped to the BOM template can only evaluate its own properties; properties inside the objects prototype chain are not accessible. This can be overcome using [Lodash.toPlainObject()](https://lodash.com/docs/4.17.15#toPlainObject) or by doing some other method of data flattening and serialization.

## API

More information can be found by reading the [API documentation](doc/api.md).

## License

[MIT](LICENSE)
