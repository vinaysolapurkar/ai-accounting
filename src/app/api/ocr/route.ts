import { NextRequest, NextResponse } from "next/server";
import { initSchema, createReceipt } from "@/lib/db";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

const EXTRACTION_PROMPT = `You are an expert receipt/invoice data extraction system.
The user will provide raw text extracted from a receipt or invoice image via OCR.
Analyze the text carefully and extract structured data.

Return ONLY valid JSON in this exact format (no markdown, no explanation):

{
  "vendor": "string - the business/vendor name",
  "amount": number,
  "date": "YYYY-MM-DD",
  "category": "one of: Food & Dining, Transport, Office Supplies, Software, Utilities, Rent, Cloud Services, Travel, Marketing, Professional Services, Other",
  "lineItems": [{"description": "string", "amount": number}],
  "taxInfo": {"type": "GST or VAT or Sales Tax or None", "rate": number, "amount": number},
  "currency": "INR or USD or GBP or EUR or AUD or NZD"
}

If you cannot determine a field, use reasonable defaults. For amount, always use the total/grand total. For date, use today if not found.`;

export async function POST(request: NextRequest) {
  try {
    await initSchema();

    const userId = request.headers.get("x-user-id");
    const body = await request.json();
    const { image, ocrText } = body;

    if (!image && !ocrText) {
      return NextResponse.json({ error: "No image or text provided" }, { status: 400 });
    }

    let extracted;

    if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === "placeholder") {
      extracted = getDemoData();
    } else if (ocrText) {
      // Text was already extracted client-side, send to DeepSeek for structured extraction
      extracted = await extractWithDeepSeek(ocrText);
    } else if (image) {
      // Try sending image directly to DeepSeek (vision)
      try {
        extracted = await extractImageWithDeepSeek(image);
      } catch (err) {
        console.error("Vision API failed, returning demo:", err);
        extracted = getDemoData();
      }
    } else {
      extracted = getDemoData();
    }

    // Persist the extracted receipt to the database
    if (userId) {
      try {
        const receipt = await createReceipt(userId, {
          raw_ocr_data: extracted,
          extracted_vendor: extracted.vendor,
          extracted_amount: extracted.amount,
          extracted_date: extracted.date,
          extracted_category: extracted.category,
          extracted_line_items: extracted.lineItems,
          extracted_tax_info: extracted.taxInfo,
        });
        return NextResponse.json({ ...extracted, receiptId: receipt?.id });
      } catch (dbErr) {
        console.error("DB error saving receipt:", dbErr);
        return NextResponse.json(extracted);
      }
    }

    return NextResponse.json(extracted);
  } catch (error) {
    console.error("OCR error:", error);
    return NextResponse.json(getDemoData());
  }
}

async function extractWithDeepSeek(text: string) {
  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: EXTRACTION_PROMPT },
        { role: "user", content: `Extract structured data from this receipt text:\n\n${text}` },
      ],
      max_tokens: 1000,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("DeepSeek extraction error:", err);
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse JSON from response");
  return JSON.parse(jsonMatch[0]);
}

async function extractImageWithDeepSeek(image: string) {
  const base64Data = image.includes(",") ? image.split(",")[1] : image;

  // Try with deepseek-chat vision mode
  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: EXTRACTION_PROMPT },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Data}` } },
            { type: "text", text: "Extract all data from this receipt/invoice image. Return JSON only." },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek vision API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse JSON from vision response");
  return JSON.parse(jsonMatch[0]);
}

function getDemoData() {
  return {
    vendor: "Sample Vendor",
    amount: 1240,
    date: new Date().toISOString().split("T")[0],
    category: "Food & Dining",
    lineItems: [
      { description: "Lunch Special", amount: 850 },
      { description: "Beverages", amount: 390 },
    ],
    taxInfo: { type: "GST", rate: 5, amount: 59 },
    currency: "INR",
  };
}
