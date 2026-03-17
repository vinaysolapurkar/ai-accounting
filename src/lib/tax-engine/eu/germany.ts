/**
 * LedgerAI Tax Engine - Germany (Umsatzsteuer / VAT).
 *
 * Rates:
 *   Standard  – 19 %
 *   Reduced   –  7 %  (food, books, newspapers, public transport, etc.)
 *   Zero      –  0 %  (intra-community / export)
 *   Exempt    –  0 %  (insurance, financial services, medical, education)
 */

import { EUVATBaseEngine, EUVATConfig } from "./base";

const CONFIG: EUVATConfig = {
  countryCode: "DE",
  currency: "EUR",
  displayName: "Germany",
  vatNumberPattern: /^\d{9}$/, // DE + 9 digits
  rates: [
    { label: "Regelsteuersatz (Standard)", category: "standard", rate: 19 },
    { label: "Ermäßigter Satz (Reduced)", category: "reduced", rate: 7 },
    { label: "Nullsatz (Zero-Rated)", category: "zero", rate: 0 },
    { label: "Steuerbefreit (Exempt)", category: "exempt", rate: 0 },
  ],
};

export class GermanyTaxEngine extends EUVATBaseEngine {
  constructor() {
    super(CONFIG);
  }
}
