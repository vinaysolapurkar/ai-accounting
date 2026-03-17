/**
 * LedgerAI Tax Engine - France (TVA / VAT).
 *
 * Rates:
 *   Standard       – 20 %   (most goods and services)
 *   Intermediate   – 10 %   (restaurants, transport, renovation works)
 *   Reduced        –  5.5 % (food, books, energy, cultural events)
 *   Super-reduced  –  2.1 % (certain medicines, press publications)
 *   Zero           –  0 %   (intra-community / export)
 *   Exempt         –  0 %   (health, education, insurance)
 */

import { EUVATBaseEngine, EUVATConfig } from "./base";

const CONFIG: EUVATConfig = {
  countryCode: "FR",
  currency: "EUR",
  displayName: "France",
  vatNumberPattern: /^[A-Z0-9]{2}\d{9}$/, // FR + 2 chars + 9 digits
  rates: [
    { label: "Taux normal (Standard)", category: "standard", rate: 20 },
    { label: "Taux intermédiaire (Intermediate)", category: "intermediate", rate: 10 },
    { label: "Taux réduit (Reduced)", category: "reduced", rate: 5.5 },
    { label: "Taux super-réduit (Super-Reduced)", category: "super-reduced", rate: 2.1 },
    { label: "Taux zéro (Zero-Rated)", category: "zero", rate: 0 },
    { label: "Exonéré (Exempt)", category: "exempt", rate: 0 },
  ],
};

export class FranceTaxEngine extends EUVATBaseEngine {
  constructor() {
    super(CONFIG);
  }
}
