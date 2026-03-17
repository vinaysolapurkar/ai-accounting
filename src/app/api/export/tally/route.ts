import { NextResponse } from "next/server";

export async function POST() {
  // Generate Tally XML export
  const tallyXml = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>LedgerAI Export</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <LEDGER NAME="Cash" RESERVEDNAME="">
            <PARENT>Current Assets</PARENT>
            <OPENINGBALANCE>-245000</OPENINGBALANCE>
          </LEDGER>
          <LEDGER NAME="Bank Account" RESERVEDNAME="">
            <PARENT>Bank Accounts</PARENT>
            <OPENINGBALANCE>-580000</OPENINGBALANCE>
          </LEDGER>
          <LEDGER NAME="Accounts Receivable" RESERVEDNAME="">
            <PARENT>Current Assets</PARENT>
            <OPENINGBALANCE>-150000</OPENINGBALANCE>
          </LEDGER>
          <LEDGER NAME="Service Revenue" RESERVEDNAME="">
            <PARENT>Revenue</PARENT>
            <OPENINGBALANCE>485000</OPENINGBALANCE>
          </LEDGER>
          <LEDGER NAME="Office Expenses" RESERVEDNAME="">
            <PARENT>Indirect Expenses</PARENT>
            <OPENINGBALANCE>-8700</OPENINGBALANCE>
          </LEDGER>
        </TALLYMESSAGE>

        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Payment" ACTION="Create">
            <DATE>20260317</DATE>
            <NARRATION>Office Supplies - Amazon</NARRATION>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Office Expenses</LEDGERNAME>
              <AMOUNT>-2340</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Bank Account</LEDGERNAME>
              <AMOUNT>2340</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

  return new NextResponse(tallyXml, {
    headers: {
      "Content-Type": "application/xml",
      "Content-Disposition": "attachment; filename=ledgerai-tally-export.xml",
    },
  });
}
