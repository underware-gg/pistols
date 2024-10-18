import {
  setComponent,
  Component,
  Type as RecsType,
  Schema,
} from "@dojoengine/recs";
import { getEntityIdFromKeys, hexToAscii } from "@dojoengine/utils";
import { ClientComponents } from '@/lib/dojo/setup/setup'


/**
 * Iterates over an array of events and updates components based on event data.
 *
 * @param {Components} components - The components to be updated.
 * @param {Event[]} events - An array of events containing component data.
 */
export function setComponentsFromEvents(components: ClientComponents, events: any[]) {
  events.forEach((event) => setComponentFromEvent(components, event.data));
}

/**
 * Updates a component based on the data from a single event.
 *
 * @param {Components} components - The components to be updated.
 * @param {string[]} eventData - The data from a single event.
 */
export function setComponentFromEvent(
  components: ClientComponents,
  eventData: string[]
) {
  console.log(eventData);

  let index = 0;

  // index 0: get component name
  // Dojo 0.7.5-alphs.5: eventData[0] is messed up!
  const componentName = hexToAscii(eventData[index++]);
  // console.log(`EVENTDATA`, eventData)

  // retrieve the component from name
  const component = components[componentName];
  // console.log(componentName, component)

  // index 1: keys count
  const keysNumber = parseInt(eventData[index++]);

  // index 2: keys
  const keys = eventData
    .slice(index, index + keysNumber)
    .map((key) => BigInt(key));
  const string_keys = keys.map((key) => key.toString());
  // console.log(keysNumber, keys)

  // get values
  index += keysNumber;
  const numberOfValues = parseInt(eventData[index++]);
  const values = eventData.slice(index, index + numberOfValues);
  // console.log(numberOfValues, values)

  // create component object from values with schema
  const componentValues = decodeComponent(component, [
    ...string_keys,
    ...values,
  ]);

  // get entityIndex from keys
  const entityIndex = getEntityIdFromKeys(keys);

  // set component
  setComponent(component, entityIndex, componentValues);
}

/**
 * Parse component value into typescript typed value
 *
 * @param {string} value - The value to parse
 * @param {RecsType} type - The target type
 */
export function parseComponentValue(value: string, type: RecsType) {
  switch (type) {
    case RecsType.Boolean:
      return value === "0x0" ? false : true;
    case RecsType.Number:
      return Number(value);
    case RecsType.BigInt:
      return BigInt(value);
    default:
      return value;
  }
}

/**
 * Decodes a component based on the provided schema.
 *
 * @param {Component} component - The component description created by defineComponent(), containing the schema and metadata types.
 * @param {string[]} values - An array of string values used to populate the decoded component.
 * @returns {Object} The decoded component object.
 */
export function decodeComponent(component: Component, values: string[]): any {
  const schema: any = component.schema;
  const types: string[] = (component.metadata?.types as string[]) ?? [];
  const indices = { types: 0, values: 0 };
  return decodeComponentValues(schema, types, values, indices);
}

function decodeComponentValues(
  schema: Schema,
  types: string[],
  values: string[],
  indices: any
): any {
  // Iterate through the keys of the schema and reduce them to build the decoded component.
  return Object.keys(schema).reduce((acc: any, key) => {
    const valueType = schema[key];
    if (typeof valueType === "object") {
      // valueType is a Schema
      // it means it's a nested component. Therefore, we recursively decode it.
      acc[key] = decodeComponentValues(
        valueType as Schema,
        types,
        values,
        indices
      );
    } else {
      // valueType is a RecsType
      // If the schema key points directly to a type or is not an object,
      // we parse its value using the provided parseComponentValue function
      // and move to the next index in the values array.
      acc[key] = parseComponentValue(
        values[indices.values],
        valueType as RecsType
      );
      indices.values++;
      // the u256 type in cairo is actually { low: u128, high: u128 }
      // we need to consume two u128 values, shifting the second to compose u256
      if (types[indices.types] == "u256") {
        const value = parseComponentValue(
          values[indices.values],
          valueType as RecsType
        ) as bigint;
        acc[key] |= value << 128n;
        indices.values++;
      }
      indices.types++;
    }
    return acc;
  }, {});
}
