// packages/sdk/src/convertQuerytoClause.ts

import * as torii from "@dojoengine/torii-client";
import { QueryType, SchemaType, SubscriptionQueryType } from "@dojoengine/sdk";

/**
 * Converts a query object into a Torii clause.
 *
 * @template T - The schema type.
 * @param {QueryType<T>} query - The query object to convert.
 * @param {T} schema - The schema providing field order information.
 * @returns {torii.Clause | undefined} - The resulting Torii clause or undefined.
 */
export function convertQueryToClause<T extends SchemaType>(
  query: QueryType<T>,
  schema: T
): torii.Clause | undefined {
  const clauses: torii.Clause[] = [];

  for (const [namespace, models] of Object.entries(query)) {
    if (namespace === "entityIds") continue; // Skip entityIds

    if (models && typeof models === "object") {
      const modelClauses = processModels(namespace, models, schema);
      if (modelClauses.length > 0) {
        clauses.push(...modelClauses);
      }
    }
  }

  // If there are clauses, combine them under a single Composite clause
  if (clauses.length > 1) {
    return {
      Composite: {
        operator: "Or",
        clauses: clauses,
      },
    };
  } else if (clauses.length === 1) {
    return clauses[0];
  }

  // If there are no clauses, return undefined
  return undefined;
}

/**
 * Processes all models within a namespace and generates corresponding clauses.
 *
 * @template T - The schema type.
 * @param {string} namespace - The namespace of the models.
 * @param {any} models - The models object to process.
 * @param {T} schema - The schema providing field order information.
 * @returns {torii.Clause[]} - An array of generated clauses.
 */
function processModels<T extends SchemaType>(
  namespace: string,
  models: any,
  schema: T
): torii.Clause[] {
  const clauses: torii.Clause[] = [];

  for (const [model, modelData] of Object.entries(models)) {
    const namespaceModel = `${namespace}-${model}`;

    if (modelData && typeof modelData === "object" && "$" in modelData) {
      const conditions = modelData.$ as Record<string, unknown>;
      if (
        conditions &&
        typeof conditions === "object" &&
        "where" in conditions
      ) {
        const whereClause = conditions.where;
        if (whereClause && typeof whereClause === "object") {
          // Iterate over each member in the whereClause to handle $is
          for (const [member, memberConditions] of Object.entries(
            whereClause
          )) {
            if (
              typeof memberConditions === "object" &&
              memberConditions !== null &&
              "$is" in memberConditions
            ) {
              // Convert $is to EntityKeysClause
              const isClauses = convertQueryToEntityKeyClauses(
                {
                  [namespace]: {
                    [model]: {
                      $: {
                        where: {
                          [member]: {
                            $is: memberConditions[
                              "$is"
                            ],
                          },
                        },
                      },
                    },
                  },
                } as SubscriptionQueryType<T>,
                schema
              );
              clauses.push(...(isClauses as any));

              // Remove $is from memberConditions to prevent further processing
              const { $is, ...remainingConditions } =
                memberConditions;
              (whereClause as Record<string, unknown>)[member] =
                remainingConditions;
            }
          }

          // After handling all $is, build the remaining whereClause
          const clause = buildWhereClause(
            namespaceModel,
            whereClause
          );
          if (clause) {
            if (
              "Composite" in clause &&
              clause.Composite.operator === "Or"
            ) {
              // If the composite operator is "Or", flatten the clauses
              clauses.push(...clause.Composite.clauses);
            } else {
              // Otherwise, keep the composite as is to preserve logical structure
              clauses.push(clause);
            }
          }
        }
      }
    } else {
      // Handle the case where there are no conditions
      clauses.push({
        Keys: {
          keys: [undefined],
          pattern_matching: "FixedLen",
          models: [namespaceModel],
        },
      });
    }
  }

  return clauses;
}

/**
 * Builds a Torii clause from a where clause object.
 *
 * @param {string} namespaceModel - The namespaced model identifier.
 * @param {Record<string, any>} where - The where clause conditions.
 * @returns {torii.Clause | undefined} - The constructed Torii clause or undefined.
 */
function buildWhereClause(
  namespaceModel: string,
  where: Record<string, any>
): torii.Clause | undefined {
  // Define logical operator mapping
  const logicalOperators: Record<string, torii.LogicalOperator> = {
    And: "And",
    Or: "Or",
  };

  // Check for logical operators first
  const keys = Object.keys(where);
  const logicalKey = keys.find((key) => key in logicalOperators);

  if (logicalKey) {
    const operator = logicalOperators[logicalKey];
    const conditions = where[logicalKey] as Array<Record<string, any>>;

    const subClauses: torii.Clause[] = [];

    for (const condition of conditions) {
      const clause = buildWhereClause(namespaceModel, condition);
      if (clause) {
        subClauses.push(clause);
      }
    }

    if (subClauses.length === 1) {
      return subClauses[0];
    }

    return {
      Composite: {
        operator: operator,
        clauses: subClauses,
      },
    };
  }

  // If no logical operator, build Member clauses
  const memberClauses: torii.Clause[] = [];

  for (const [member, memberValue] of Object.entries(where)) {
    if (typeof memberValue === "object" && memberValue !== null) {
      const memberKeys = Object.keys(memberValue);
      // Check if memberValue contains logical operators
      const memberLogicalKey = memberKeys.find(
        (key) => key in logicalOperators
      );
      if (memberLogicalKey) {
        const operator = logicalOperators[memberLogicalKey];
        const conditions = memberValue[memberLogicalKey] as Array<
          Record<string, any>
        >;

        const nestedClauses: torii.Clause[] = [];
        for (const condition of conditions) {
          const clause = buildWhereClause(namespaceModel, condition);
          if (clause) {
            nestedClauses.push(clause);
          }
        }

        if (nestedClauses.length === 1) {
          memberClauses.push(nestedClauses[0]);
        } else {
          memberClauses.push({
            Composite: {
              operator: operator,
              clauses: nestedClauses,
            },
          });
        }
      } else {
        // Process operators like $eq, $gt, etc
        for (const [op, val] of Object.entries(memberValue)) {
          memberClauses.push({
            Member: {
              model: namespaceModel,
              member,
              operator: convertOperator(op),
              value: convertToPrimitive(val),
            },
          });
        }
      }
    } else {
      // Assume equality condition
      memberClauses.push({
        Member: {
          model: namespaceModel,
          member,
          operator: "Eq",
          value: convertToPrimitive(memberValue),
        },
      });
    }
  }

  if (memberClauses.length === 1) {
    return memberClauses[0];
  } else if (memberClauses.length > 1) {
    return {
      // conditions in member clause should be treated as "And" Conditions by default
      Composite: {
        operator: "And",
        clauses: memberClauses,
      },
    };
  }

  return undefined;
}

/**
 * Converts a value to a Torii primitive type.
 *
 * @param {any} value - The value to convert.
 * @returns {torii.MemberValue} - The converted primitive value.
 * @throws {Error} - If the value type is unsupported.
 */
function convertToPrimitive(value: any): torii.MemberValue {
  if (typeof value === "number") {
    return { Primitive: { U32: value } };
  } else if (typeof value === "boolean") {
    return { Primitive: { Bool: value } };
  } else if (typeof value === "bigint") {
    return {
      Primitive: {
        Felt252: torii.cairoShortStringToFelt(value.toString()),
      },
    };
  } else if (typeof value === "string") {
    return { String: value };
  }

  // Add more type conversions as needed
  throw new Error(`Unsupported primitive type: ${typeof value}`);
}

/**
 * Converts a query operator to a Torii comparison operator.
 *
 * @param {string} operator - The query operator to convert.
 * @returns {torii.ComparisonOperator} - The corresponding Torii comparison operator.
 * @throws {Error} - If the operator is unsupported.
 */
function convertOperator(operator: string): torii.ComparisonOperator {
  switch (operator) {
    case "$eq":
      return "Eq";
    case "$neq":
      return "Neq";
    case "$gt":
      return "Gt";
    case "$gte":
      return "Gte";
    case "$lt":
      return "Lt";
    case "$lte":
      return "Lte";
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
}

export function convertQueryToEntityKeyClauses<T extends SchemaType>(
  query: SubscriptionQueryType<T>,
  schema: T
): torii.EntityKeysClause[] {
  if (!query) {
    return [];
  }

  const clauses: torii.EntityKeysClause[] = [];

  const { entityIds, ...namespaces } = query;

  if (entityIds && entityIds.length > 0) {
    clauses.push({ HashedKeys: entityIds });
  }

  clauses.push(...convertQueryToKeysClause(namespaces, schema));

  return clauses;
}

/**
 * Converts namespaces to an array of EntityKeysClause.
 *
 * @template T - The schema type.
 * @param {Omit<SubscriptionQueryType<T>, "entityIds">} namespaces - The namespaces to convert.
 * @param {T} schema - The schema providing field order information.
 * @returns {torii.EntityKeysClause[]} An array of EntityKeysClause.
 */
export function convertQueryToKeysClause<T extends SchemaType>(
  namespaces: Omit<SubscriptionQueryType<T>, "entityIds">,
  schema: T
): torii.EntityKeysClause[] {
  const clauses: torii.EntityKeysClause[] = [];

  Object.entries(namespaces).forEach(([namespace, models]) => {
    if (models && typeof models === "object") {
      Object.entries(models).forEach(([model, value]) => {
        const namespaceModel = `${namespace}-${model}`;
        if (Array.isArray(value)) {
          const clause = createClause(namespaceModel, value);
          if (clause) {
            clauses.push(clause);
          }
        } else if (
          typeof value === "object" &&
          value !== null &&
          "$" in value
        ) {
          const whereOptions = (value as { $: { where: any } }).$
            .where;
          const modelSchema = schema[namespace]?.[model];
          if (modelSchema) {
            const clause = createClauseFromWhere(
              namespaceModel,
              whereOptions,
              modelSchema.fieldOrder
            );
            if (clause) {
              clauses.push(clause);
            }
          }
        }
      });
    }
  });

  return clauses;
}

/**
 * Creates an EntityKeysClause based on the provided model and value.
 *
 * @param {string} namespaceModel - The combined namespace and model string.
 * @param {string[]} value - The value associated with the model.
 * @returns {torii.EntityKeysClause | undefined} An EntityKeysClause or undefined.
 */
function createClause(
  namespaceModel: string,
  value: string[]
): torii.EntityKeysClause | undefined {
  if (Array.isArray(value) && value.length === 0) {
    return {
      Keys: {
        keys: [undefined],
        pattern_matching: "VariableLen",
        models: [namespaceModel],
      },
    };
  } else if (Array.isArray(value)) {
    return {
      Keys: {
        keys: value,
        pattern_matching: "FixedLen",
        models: [namespaceModel],
      },
    };
  }
  return undefined;
}

/**
 * Creates an EntityKeysClause based on the provided where conditions.
 * Orders the keys array based on the fieldOrder from the schema,
 * inserting undefined placeholders where necessary.
 *
 * @param {string} namespaceModel - The combined namespace and model string.
 * @param {Record<string, { $is?: any; $eq?: any; $neq?: any; $gt?: any; $gte?: any; $lt?: any; $lte?: any }>} [whereOptions] - The where conditions from the query.
 * @param {string[]} [fieldOrder=[]] - The defined order of fields for the model.
 * @returns {torii.EntityKeysClause | undefined} An EntityKeysClause or undefined.
 */
function createClauseFromWhere(
  namespaceModel: string,
  whereOptions?: Record<
    string,
    {
      $is?: any;
      $eq?: any;
      $neq?: any;
      $gt?: any;
      $gte?: any;
      $lt?: any;
      $lte?: any;
    }
  >,
  fieldOrder: string[] = []
): torii.EntityKeysClause | undefined {
  if (!whereOptions || Object.keys(whereOptions).length === 0) {
    return {
      Keys: {
        keys: Array(fieldOrder.length).fill(undefined),
        pattern_matching: "VariableLen",
        models: [namespaceModel],
      },
    };
  }

  // Initialize keys array with undefined placeholders
  const keys: (string | undefined)[] = Array(fieldOrder.length).fill(
    undefined
  );

  Object.entries(whereOptions).forEach(([field, condition]) => {
    // Find the index of the field in the fieldOrder
    const index = fieldOrder.indexOf(field);
    if (index !== -1) {
      // Assign value without operator prefixes
      if (condition.$is !== undefined) {
        keys[index] = condition.$is.toString();
      }
      if (condition.$eq !== undefined) {
        keys[index] = condition.$eq.toString();
      }
      if (condition.$neq !== undefined) {
        keys[index] = condition.$neq.toString();
      }
      if (condition.$gt !== undefined) {
        keys[index] = condition.$gt.toString();
      }
      if (condition.$gte !== undefined) {
        keys[index] = condition.$gte.toString();
      }
      if (condition.$lt !== undefined) {
        keys[index] = condition.$lt.toString();
      }
      if (condition.$lte !== undefined) {
        keys[index] = condition.$lte.toString();
      }
      // Add more operators as needed
    }
  });

  return {
    Keys: {
      keys: keys,
      pattern_matching: "VariableLen",
      models: [namespaceModel],
    },
  };
}
