## Classes

<dl>
<dt><a href="#BOM">BOM</a></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#QueryFunction">QueryFunction(pn)</a> ⇒ <code><a href="#BOMItemDetails">Promise.&lt;BOMItemDetails&gt;</a></code></dt>
<dd><p>A user defined function that returns properties associated with a provided part number.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#BOMItem">BOMItem</a> : <code>Object</code></dt>
<dd><p>BOM item.</p>
</dd>
<dt><a href="#BOMItemDetails">BOMItemDetails</a> : <code>Object</code></dt>
<dd><p>BOM item details (minimum).</p>
</dd>
<dt><a href="#BOMCustomProperty">BOMCustomProperty</a> : <code>Object</code></dt>
<dd><p>Custom metadata property.</p>
</dd>
<dt><a href="#BOMMetadata">BOMMetadata</a> : <code>Object</code></dt>
<dd><p>Optional metadata that can be associated with a bill of materials (BOM) instance.</p>
</dd>
</dl>

<a name="BOM"></a>

## BOM
**Kind**: global class  

* [BOM](#BOM)
    * [new BOM(queryFunction, metadata)](#new_BOM_new)
    * [.items](#BOM+items) : [<code>Array.&lt;BOMItem&gt;</code>](#BOMItem)
    * [.length](#BOM+length) : <code>Number</code>
    * [.add(pn, [qty])](#BOM+add)
    * [.set(pn, qty)](#BOM+set)
    * [.remove(pn, [qty])](#BOM+remove)
    * [.getDetails([pn])](#BOM+getDetails) ⇒ <code>Promise.&lt;(Array.&lt;BOMItemDetails&gt;\|BOMItemDetails)&gt;</code>
    * [.costRoll()](#BOM+costRoll) : <code>Promise.&lt;Number&gt;</code>
    * [.export(filePath)](#BOM+export) ⇒ <code>Promise</code>
    * [.buildFromTemplate(templatePath, data)](#BOM+buildFromTemplate) ⇒ <code>Promise</code>

<a name="new_BOM_new"></a>

### new BOM(queryFunction, metadata)
A new bill of materials (BOM) instance.


| Param | Type | Description |
| --- | --- | --- |
| queryFunction | <code>function</code> | A user defined function that returns properties associated with a provided part number (i.e., unique ID). See [QueryFunction](#QueryFunction) for my details. |
| metadata | [<code>BOMMetadata</code>](#BOMMetadata) | Optional metadata. |

<a name="BOM+items"></a>

### boM.items : [<code>Array.&lt;BOMItem&gt;</code>](#BOMItem)
List of items in the bill of materials and their quantities.Does not indicate order (i.e., order is 'random').List is an object array of part number and qty.

**Kind**: instance property of [<code>BOM</code>](#BOM)  
**Read only**: true  
<a name="BOM+length"></a>

### boM.length : <code>Number</code>
Number of unique items in the instance of bill of materials.

**Kind**: instance property of [<code>BOM</code>](#BOM)  
**Read only**: true  
<a name="BOM+add"></a>

### boM.add(pn, [qty])
Adds the desired quantity of parts to the bill of materials (BOM).

**Kind**: instance method of [<code>BOM</code>](#BOM)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| pn | <code>String</code> |  | Part Number (Unique ID) |
| [qty] | <code>Number</code> | <code>1</code> | Quantity |

<a name="BOM+set"></a>

### boM.set(pn, qty)
Sets the quantity of a part to a specific quantity.

**Kind**: instance method of [<code>BOM</code>](#BOM)  

| Param | Type | Description |
| --- | --- | --- |
| pn | <code>String</code> | Part Number (Unique) |
| qty | <code>Number</code> | Quantity |

<a name="BOM+remove"></a>

### boM.remove(pn, [qty])
Removes an item or certain quantity of an item from the bill of materials.Items with negative quantities are completely removed from the BOM.

**Kind**: instance method of [<code>BOM</code>](#BOM)  

| Param | Type | Description |
| --- | --- | --- |
| pn | <code>String</code> | Part Number (Unique ID) |
| [qty] | <code>Number</code> | Quantity |

<a name="BOM+getDetails"></a>

### boM.getDetails([pn]) ⇒ <code>Promise.&lt;(Array.&lt;BOMItemDetails&gt;\|BOMItemDetails)&gt;</code>
A promise resolving to an object containing all of the details for each iteminside the bill of materials. If a part number is passed then only the detailsfor that item will be returned.

**Kind**: instance method of [<code>BOM</code>](#BOM)  

| Param | Type | Description |
| --- | --- | --- |
| [pn] | <code>String</code> | Part number. |

<a name="BOM+costRoll"></a>

### boM.costRoll() : <code>Promise.&lt;Number&gt;</code>
Performs a cost roll on the items inside the BOM instance.Operation depends on the property `unit_cost` being returned froma provided query function.

**Kind**: instance method of [<code>BOM</code>](#BOM)  
**Read only**: true  
<a name="BOM+export"></a>

### boM.export(filePath) ⇒ <code>Promise</code>
Exports the current list of items to an Microsoft Excel spreadsheet.

**Kind**: instance method of [<code>BOM</code>](#BOM)  

| Param | Type | Description |
| --- | --- | --- |
| filePath | <code>String</code> | Desired filepath with .xlsx extension. |

<a name="BOM+buildFromTemplate"></a>

### boM.buildFromTemplate(templatePath, data) ⇒ <code>Promise</code>
Builds a bill of materials from a "JSON BOM template".

**Kind**: instance method of [<code>BOM</code>](#BOM)  
**Returns**: <code>Promise</code> - A promise that resolves to an Array of items added to the BOM.  

| Param | Type | Description |
| --- | --- | --- |
| templatePath | <code>String</code> | Filepath to a JSON BOM template. |
| data | <code>Object</code> | JavaScript data scoped to the JSON BOM template. |

<a name="QueryFunction"></a>

## QueryFunction(pn) ⇒ [<code>Promise.&lt;BOMItemDetails&gt;</code>](#BOMItemDetails)
A user defined function that returns properties associated with a provided part number.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| pn | <code>String</code> | Part Number (Unique ID) |

<a name="BOMItem"></a>

## BOMItem : <code>Object</code>
BOM item.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| pn | <code>String</code> | Part Number |
| qty | <code>Number</code> | Quantity |

<a name="BOMItemDetails"></a>

## BOMItemDetails : <code>Object</code>
BOM item details (minimum).

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| pn | <code>String</code> | Part Number (Unique ID) |
| qty | <code>String</code> | Quantity |
| title | <code>String</code> | Part title. |
| desc | <code>String</code> | Part description. |
| unit | <code>String</code> | Unit (ex: each, in, feet, lbs, etc.). |
| unit_cost | <code>Number</code> | Unit cost. |
| unit_weight | <code>Number</code> | Unit weight. |

<a name="BOMCustomProperty"></a>

## BOMCustomProperty : <code>Object</code>
Custom metadata property.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | Property name/title. |
| value | <code>String</code> | Property value. |

<a name="BOMMetadata"></a>

## BOMMetadata : <code>Object</code>
Optional metadata that can be associated with a bill of materials (BOM) instance.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [title] | <code>String</code> | (Optional) Default: "Bill of Materials" |
| [subtitle] | <code>String</code> | (Optional) Subtitle. |
| [footer] | <code>String</code> | (Optional) Footer. |
| [company] | <code>String</code> | (Optional) Company name. |
| [created_by] | <code>String</code> | (Optional) Author name / created by. |
| [custom] | [<code>Array.&lt;BOMCustomProperty&gt;</code>](#BOMCustomProperty) | (Optional) Custom user defined properties. |

