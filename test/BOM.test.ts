import { faker } from "@faker-js/faker";
import path from 'node:path';
import { describe, beforeEach, expect, it, test } from "vitest";
import BOM from "../src/BOM";
import { BOMItemDetails } from "../src/BOMItemDetails";
import { IBOMItemDetails } from "../src/IBOMItemDetails";

const INVALID_PART_NUMBERS = [null, undefined, [], {}, true, false, 0];
const INVALID_PART_QUANTITIES = [null, [], {}, true, false, "0"];
const INVALID_PART_NUMBER_ERROR = "Invalid part number provided. The part number must be a string.";
const INVALID_PART_QUANTITY_ERROR = "Invalid part quantity provided. Part quantity must be a number.";

describe("Bill of Materials (BOM)", () => {
  let bom: BOM;

  // Mock BOM data / details.
  let bomData: Map<string, IBOMItemDetails> = new Map();
  bomData.set("foo", { title: faker.commerce.product(), description: faker.commerce.productDescription(), unit: "each",  unitCost: 10, unitWeight: 20 });
  bomData.set("bar", { title: faker.commerce.product(), description: faker.commerce.productDescription(), unit: "each",  unitCost: 10, unitWeight: 20 });
  bomData.set("baz", { title: faker.commerce.product(), description: faker.commerce.productDescription(), unit: "each",  unitCost: 10, unitWeight: 20 });

  // Basic BOM query function.
  const queryFunction = (partNumber: string): Promise<IBOMItemDetails> => {
    return Promise.resolve(bomData.get(partNumber) ?? new BOMItemDetails());
  };

  beforeEach(() => {
    bom = new BOM(queryFunction);
    bom.add("foo", 100);
    bom.add("bar", 100);
    bom.add("baz", 100);
  })

  test("that an error is thrown if no query function is provided during initialization", () => {
    // @ts-ignore
    const createInvalidBOM = () => new BOM();
    expect(createInvalidBOM).toThrow(Error);
  });

  test("the `add()` method correctly adds parts", async () => {
    await bom.add("foo", Math.round(Math.random() * 100));
    await bom.add("bar", Math.round(Math.random() * 100));
    await bom.add("baz", Math.round(Math.random() * 100));
    expect(bom.length).toBe(3);
  });

  describe("the `add()` method throws an error if the part number isn't a string:", () => {
    it.each(INVALID_PART_NUMBERS)("throws error if %j", async (partNumber: any) => {
      await expect(bom.add(partNumber)).rejects.toThrow(INVALID_PART_NUMBER_ERROR);
    });  
  });

  describe("the `add()` method throws an error if the part quantity isn't a number:", () => {
    it.each(INVALID_PART_QUANTITIES)("throws error if %j", async (quantity: any) => {
      await expect(bom.add("foo", quantity)).rejects.toThrow(INVALID_PART_QUANTITY_ERROR);
    });
  });

  test("the `set()` method correctly sets the part quantity", async () => {
    // Set bom item quantities.
    await bom.set("foo", 1);
    await bom.set("bar", 2);
    await bom.set("baz", -3);
    await bom.set("bat", 4);
    expect(bom.length).toBe(3);

    // Verify bom item quantities.
    const bomItems = bom.items;
    expect(bomItems.find(obj => obj.partNumber === "foo")?.quantity).toBe(1);
    expect(bomItems.find(obj => obj.partNumber === "bar")?.quantity).toBe(2);
    expect(bomItems.find(obj => obj.partNumber === "baz")?.quantity).toBe(undefined);
    expect(bomItems.find(obj => obj.partNumber === "bat")?.quantity).toBe(4);
  });

  describe("the `set()` method throws an error if the part number isn't a string:", () => {
    it.each(INVALID_PART_NUMBERS)("throws error if %j", async (partNumber: any) => {
      // @ts-expect-error
      await expect(bom.set(partNumber)).rejects.toThrow(INVALID_PART_NUMBER_ERROR);
    });  
  });

  describe("the `set()` method throws an error if the part quantity isn't a number:", () => {
    it.each(INVALID_PART_QUANTITIES)("throws error if %j", async (quantity: any) => {
      await expect(bom.set("foo", quantity)).rejects.toThrow(INVALID_PART_QUANTITY_ERROR);
    });
  });

  test("the `remove()` method correctly removes parts", () => {
    // Remove a positive number.    
    bom.remove("foo", 10);

    // Remove a negative number.
    bom.remove("bar", 10);

    // Remove item completely.
    bom.remove("baz");
    expect(bom.length).toBe(2);

    // Ignore item that doesn't exist.
    bom.remove("bat");
    expect(bom.length).toBe(2);

  });

  test("the `remove()` method throws an error if the part number isn't a string:", () => {
    it.each(INVALID_PART_NUMBERS)("throws error if %j", (partNumber: any) => {
      expect(bom.remove(partNumber)).toThrow(INVALID_PART_NUMBER_ERROR);
    });
  });

  describe("the `remove()` method throws an error if the part quantity isn't a number or undefined:", () => {
    it.each(INVALID_PART_QUANTITIES.filter(type => type !== undefined))("throws error if %j", (quantity: any) => {
      expect(() => {bom.remove("foo", quantity)}).toThrow();
    });
  });

  test("total cost is calculated correctly", () => {
    bom.set("foo", 1);
    bom.set("bar", 1);
    bom.set("baz", 1);
    bom.add("bat", 1);
    expect(bom.getTotalCost()).toBe(30);
  });

  test("total weight is calculated correctly", () => {
    bom.set("foo", 1);
    bom.set("bar", 1);
    bom.set("baz", 1);
    bom.add("bat", 1);
    expect(bom.getTotalWeight()).toBe(60);
  });

  test("the BOM is exported to a Microsoft Excel file", async () => {
    // Fake dataset.
    const obj = await import('./BOM.test.data.json');
    const data: IBOMItemDetails[] = obj.default;
    
    // User defined query function.
    // In this case we are finding the entry in our fake dataset that matches the 
    // part number field provided.
    const query = function (partNumber: string): Promise<IBOMItemDetails> {
      return Promise.resolve(data.find(entry => entry.partNumber === partNumber) ?? new BOMItemDetails());
    }

    // Metadata
    const metadata = {
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
    };

    // Initialize a new bill of materials (BOM).
    const bom = new BOM(query, metadata);

    // Add "parts" to bill.
    // I.e., adding "parts" that we know exists in our fake dataset.
    const promises: Promise<void>[] = [];
    for (let i = 0; i < 10; i++) {
      promises.push(bom.add(
        data[Math.floor(data.length * Math.random())].partNumber as string, 
        Math.ceil(10 * Math.random()))
      );
    }

    // Export to Microsoft Excel document.
    await Promise.allSettled(promises);
    const exportResult = await bom.export(path.resolve(__dirname, "..", "test", "results", "example-manual.xlsx"));
    expect(exportResult).toBeUndefined();
    }, 30000);

  test("build from Template", async () => {
    // Fake dataset.
    const data: IBOMItemDetails[] = (await import('./BOM.test.data.json')).default;

    // User defined query function.
    // In this case we are finding the entry in our fake dataset that matches the 
    // part number field provided.
    const query = function (partNumber: string): Promise<IBOMItemDetails> {
      return Promise.resolve(data.find(entry => entry.partNumber === partNumber) ?? new BOMItemDetails());
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
    };

    // Initialize a new bill of materials (BOM).
    const bom = new BOM(query, metadata);

    // Scoped Data
    let scopedData = { day: "Tuesday", specialItemsNeeded: true }

    // Build BOM from JSON template.
    await bom.buildFromTemplate(path.resolve(__dirname, "BOM.test.template.json"), scopedData);
    const result = bom.export(path.resolve(__dirname, "example-buildFromTemplate.xlsx"));
    expect(result).resolves;
    
  }, 30000);
});