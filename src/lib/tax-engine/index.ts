/**
 * LedgerAI Tax Engine - Entry point.
 *
 * Use `getTaxEngine(countryCode)` to obtain the appropriate engine for a
 * jurisdiction. All engines implement the common `TaxEngine` interface
 * exported from `./base`.
 */

// Re-export core types so consumers only need to import from this barrel.
export type {
  TaxEngine,
  TaxRate,
  TaxRateComponent,
  TaxResult,
  TaxLineItem,
  TaxReport,
  TaxReportSection,
  COAEntry,
  TaxCategory,
  CountryCode,
  CurrencyCode,
} from "./base";
export { roundMoney, buildTaxResult } from "./base";

// Re-export concrete engines for direct use if needed.
export { IndiaTaxEngine } from "./india";
export { UnitedStatesTaxEngine } from "./united-states";
export { UnitedKingdomTaxEngine } from "./united-kingdom";
export { AustraliaTaxEngine } from "./australia";
export { NewZealandTaxEngine } from "./new-zealand";
export { GermanyTaxEngine } from "./eu/germany";
export { FranceTaxEngine } from "./eu/france";
export { EUVATBaseEngine } from "./eu/base";
export type { EUVATConfig, EUVATRateEntry } from "./eu/base";

// Engine imports (lazy-ish — these are still static imports; swap for
// dynamic import() if bundle size becomes a concern).
import type { TaxEngine } from "./base";
import { IndiaTaxEngine } from "./india";
import { UnitedStatesTaxEngine } from "./united-states";
import { UnitedKingdomTaxEngine } from "./united-kingdom";
import { AustraliaTaxEngine } from "./australia";
import { NewZealandTaxEngine } from "./new-zealand";
import { GermanyTaxEngine } from "./eu/germany";
import { FranceTaxEngine } from "./eu/france";

// ---------------------------------------------------------------------------
// Country code → engine mapping
// ---------------------------------------------------------------------------

type EngineFactory = () => TaxEngine;

const ENGINE_REGISTRY: Record<string, EngineFactory> = {
  IN: () => new IndiaTaxEngine(),
  US: () => new UnitedStatesTaxEngine(),
  GB: () => new UnitedKingdomTaxEngine(),
  UK: () => new UnitedKingdomTaxEngine(), // common alias
  AU: () => new AustraliaTaxEngine(),
  NZ: () => new NewZealandTaxEngine(),
  DE: () => new GermanyTaxEngine(),
  FR: () => new FranceTaxEngine(),
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Return a tax engine for the given ISO 3166-1 alpha-2 country code.
 *
 * @param countryCode  Two-letter country code (case-insensitive).
 * @returns            A fully initialised TaxEngine instance.
 * @throws             If no engine is registered for the given code.
 *
 * @example
 * ```ts
 * const engine = getTaxEngine("IN");
 * const result = engine.calculateTax(1000, "standard", "MH->MH");
 * ```
 */
export function getTaxEngine(countryCode: string): TaxEngine {
  const code = countryCode.toUpperCase().trim();
  const factory = ENGINE_REGISTRY[code];
  if (!factory) {
    const supported = getSupportedCountries().join(", ");
    throw new Error(
      `No tax engine registered for country code "${code}". Supported codes: ${supported}`,
    );
  }
  return factory();
}

/**
 * Return the list of currently supported country codes.
 */
export function getSupportedCountries(): string[] {
  return Object.keys(ENGINE_REGISTRY).sort();
}

/**
 * Check whether a tax engine exists for the given country code.
 */
export function isCountrySupported(countryCode: string): boolean {
  return countryCode.toUpperCase().trim() in ENGINE_REGISTRY;
}
