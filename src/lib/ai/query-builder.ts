// ---------------------------------------------------------------------------
// Safe Query Builder – converts structured intents to parameterised SQL
// ---------------------------------------------------------------------------

// ── Public types -----------------------------------------------------------

export interface QueryIntent {
  /** The database entity / table to query. */
  entity: string;
  /** Field-level equality or comparison filters. */
  filters: Record<string, FilterValue>;
  /** Optional date range applied to the entity's date column. */
  dateRange?: { from: string; to: string };
  /** Optional aggregation function (sum, count, avg, min, max). */
  aggregation?: string;
  /** Optional column to group results by. */
  groupBy?: string;
  /** Optional column + direction for ordering. */
  orderBy?: { column: string; direction?: "ASC" | "DESC" };
  /** Maximum number of rows to return. */
  limit?: number;
}

export type FilterValue =
  | string
  | number
  | boolean
  | { operator: "gt" | "gte" | "lt" | "lte" | "ne" | "like"; value: string | number };

export interface BuiltQuery {
  sql: string;
  params: unknown[];
}

// ── Allow-lists ------------------------------------------------------------

/** Only these entities may be queried. */
const ALLOWED_ENTITIES = new Set([
  "transactions",
  "accounts",
  "invoices",
  "categories",
  "contacts",
  "receipts",
  "tax_entries",
]);

/** Per-entity allow-list of queryable columns. */
const ALLOWED_COLUMNS: Record<string, Set<string>> = {
  transactions: new Set([
    "id", "user_id", "date", "amount", "description", "category",
    "type", "account_id", "contact_id", "created_at",
  ]),
  accounts: new Set([
    "id", "user_id", "name", "type", "balance", "currency", "created_at",
  ]),
  invoices: new Set([
    "id", "user_id", "contact_id", "date", "due_date", "amount",
    "status", "currency", "created_at",
  ]),
  categories: new Set(["id", "user_id", "name", "type", "parent_id"]),
  contacts: new Set(["id", "user_id", "name", "email", "phone", "type"]),
  receipts: new Set([
    "id", "user_id", "transaction_id", "vendor", "amount", "date",
    "category", "currency", "created_at",
  ]),
  tax_entries: new Set([
    "id", "user_id", "transaction_id", "tax_type", "rate", "amount",
    "period_from", "period_to",
  ]),
};

const ALLOWED_AGGREGATIONS = new Set(["sum", "count", "avg", "min", "max"]);

const OPERATOR_MAP: Record<string, string> = {
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  ne: "!=",
  like: "LIKE",
};

// ── Validation helpers -----------------------------------------------------

class QueryBuilderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QueryBuilderError";
  }
}

/**
 * Strict identifier validation – only letters, digits, and underscores.
 * This prevents any SQL injection through column or table names.
 */
function isValidIdentifier(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

function assertEntity(entity: string): void {
  if (!ALLOWED_ENTITIES.has(entity)) {
    throw new QueryBuilderError(
      `Entity "${entity}" is not allowed. Allowed: ${[...ALLOWED_ENTITIES].join(", ")}`,
    );
  }
}

function assertColumn(entity: string, column: string): void {
  if (!isValidIdentifier(column)) {
    throw new QueryBuilderError(`Invalid column identifier: "${column}".`);
  }
  const allowed = ALLOWED_COLUMNS[entity];
  if (allowed && !allowed.has(column)) {
    throw new QueryBuilderError(
      `Column "${column}" is not allowed on entity "${entity}".`,
    );
  }
}

// ── Date column resolution -------------------------------------------------

/** Map entities to their canonical date column. */
const DATE_COLUMN: Record<string, string> = {
  transactions: "date",
  invoices: "date",
  receipts: "date",
  accounts: "created_at",
  categories: "id", // no real date column
  contacts: "id",
  tax_entries: "period_from",
};

// ── Builder ----------------------------------------------------------------

/**
 * Convert a structured `QueryIntent` into a safe, parameterised SQL query.
 *
 * **Security guarantees:**
 * - Table and column names are validated against strict allow-lists.
 * - All user-supplied values are bound as positional parameters (`$1`, `$2`, ...).
 * - No string interpolation of user input into the SQL string.
 */
export function buildQuery(intent: QueryIntent): BuiltQuery {
  const entity = intent.entity.toLowerCase();
  assertEntity(entity);

  const params: unknown[] = [];
  let paramIndex = 0;

  const nextParam = (value: unknown): string => {
    paramIndex++;
    params.push(value);
    return `$${paramIndex}`;
  };

  // -- SELECT clause --------------------------------------------------------
  let selectClause: string;

  if (intent.aggregation) {
    const agg = intent.aggregation.toLowerCase();
    if (!ALLOWED_AGGREGATIONS.has(agg)) {
      throw new QueryBuilderError(
        `Aggregation "${agg}" is not supported. Allowed: ${[...ALLOWED_AGGREGATIONS].join(", ")}`,
      );
    }

    if (intent.groupBy) {
      const groupCol = intent.groupBy.toLowerCase();
      assertColumn(entity, groupCol);
      // For count we don't need a specific column
      const aggTarget = agg === "count" ? "*" : "amount";
      selectClause = `SELECT "${groupCol}", ${agg.toUpperCase()}(${aggTarget}) AS "${agg}_value"`;
    } else {
      const aggTarget = agg === "count" ? "*" : "amount";
      selectClause = `SELECT ${agg.toUpperCase()}(${aggTarget}) AS "${agg}_value"`;
    }
  } else {
    selectClause = "SELECT *";
  }

  // -- FROM clause ----------------------------------------------------------
  const fromClause = `FROM "${entity}"`;

  // -- WHERE clause ---------------------------------------------------------
  const conditions: string[] = [];

  // Filters
  for (const [field, value] of Object.entries(intent.filters)) {
    const col = field.toLowerCase();
    assertColumn(entity, col);

    if (typeof value === "object" && value !== null && "operator" in value) {
      const op = OPERATOR_MAP[value.operator];
      if (!op) {
        throw new QueryBuilderError(`Unknown filter operator: "${value.operator}".`);
      }
      conditions.push(`"${col}" ${op} ${nextParam(value.value)}`);
    } else {
      conditions.push(`"${col}" = ${nextParam(value)}`);
    }
  }

  // Date range
  if (intent.dateRange) {
    const dateCol = DATE_COLUMN[entity] ?? "date";
    assertColumn(entity, dateCol);
    conditions.push(`"${dateCol}" >= ${nextParam(intent.dateRange.from)}`);
    conditions.push(`"${dateCol}" <= ${nextParam(intent.dateRange.to)}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // -- GROUP BY clause ------------------------------------------------------
  let groupByClause = "";
  if (intent.groupBy && intent.aggregation) {
    const groupCol = intent.groupBy.toLowerCase();
    assertColumn(entity, groupCol);
    groupByClause = `GROUP BY "${groupCol}"`;
  }

  // -- ORDER BY clause ------------------------------------------------------
  let orderByClause = "";
  if (intent.orderBy) {
    const orderCol = intent.orderBy.column.toLowerCase();
    assertColumn(entity, orderCol);
    const direction = intent.orderBy.direction === "ASC" ? "ASC" : "DESC";
    orderByClause = `ORDER BY "${orderCol}" ${direction}`;
  } else if (intent.aggregation && intent.groupBy) {
    // Default: order aggregated results by the aggregate value descending
    orderByClause = `ORDER BY "${intent.aggregation.toLowerCase()}_value" DESC`;
  }

  // -- LIMIT clause ---------------------------------------------------------
  let limitClause = "";
  if (intent.limit != null && intent.limit > 0) {
    const cap = Math.min(intent.limit, 1000); // hard cap
    limitClause = `LIMIT ${nextParam(cap)}`;
  }

  // -- Assemble -------------------------------------------------------------
  const sql = [
    selectClause,
    fromClause,
    whereClause,
    groupByClause,
    orderByClause,
    limitClause,
  ]
    .filter(Boolean)
    .join(" ");

  return { sql, params };
}
