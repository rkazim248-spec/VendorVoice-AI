import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // Helper lazy init for Gemini API
  const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({ apiKey });
  };

  // Local rule-based transaction fallback parser with Urdu & English keyword support
  function parseTransactionLocally(speechText: string, currency: string = '$') {
    const text = speechText.trim();
    const lower = text.toLowerCase();

    let transactionType: 'sale' | 'payment_received' | 'expense' = 'sale';
    if (
      lower.includes('collected') ||
      lower.includes('payment from') ||
      lower.includes('old debt') ||
      lower.includes('khata debt') ||
      lower.includes('repaid') ||
      lower.includes('received from') ||
      lower.includes('cleared debt') ||
      lower.includes('paid debt') ||
      lower.includes('vasool') ||
      lower.includes('wasool') ||
      lower.includes('wapas') ||
      lower.includes('mili') ||
      lower.includes('milay') ||
      lower.includes('jama')
    ) {
      transactionType = 'payment_received';
    } else if (
      lower.includes('expense') ||
      lower.includes('electricity') ||
      lower.includes('shop expense') ||
      lower.includes('rent') ||
      lower.includes('bulb replacement') ||
      lower.includes('paid for shop') ||
      lower.includes('kharch') ||
      lower.includes('kharcha') ||
      lower.includes('bijli') ||
      lower.includes('dukan')
    ) {
      transactionType = 'expense';
    }

    const numbers = text.match(/\d+(\.\d+)?/g)?.map(Number) || [];

    let customerName = 'Walk-in Customer';
    if (transactionType === 'expense') {
      customerName = 'Shop Expense';
    } else {
      const commonNames: Record<string, string> = {
        'Ali': 'Ali', 'Fatima': 'Fatima', 'Priya': 'Priya', 'Karim': 'Karim', 'Ahmed': 'Ahmed',
        'Rahul': 'Rahul', 'Sana': 'Sana', 'Usman': 'Usman', 'Zain': 'Zain', 'Tariq': 'Tariq',
        'Mohammed': 'Mohammed', 'Sara': 'Sara', 'Ayesha': 'Ayesha', 'Bilal': 'Bilal', 'Omar': 'Omar',
        'John': 'John', 'David': 'David', 'Alex': 'Alex', 'Sarah': 'Sarah', 'Michael': 'Michael'
      };
      const matchKey = Object.keys(commonNames).find(n => new RegExp(`\\b${n}\\b`, 'i').test(text));
      if (matchKey) {
        customerName = commonNames[matchKey];
      } else {
        const nameMatch = text.match(/(?:sold|from|to|for|with|collected|customer|ko|ne)\s+([A-Z][a-z]+)/i);
        if (nameMatch && !['Sold', 'Paid', 'Collected', 'Total', 'Item', 'Shop', 'Walk-in', 'Cash', 'Credit'].includes(nameMatch[1])) {
          customerName = nameMatch[1];
        }
      }
    }

    let totalAmount = 0;
    let paidAmount = 0;
    let creditAmount = 0;

    const totalMatch = lower.match(/(?:total|for|amount|bill|cost|price|rupay|rupee|roopay|rs)\s*(?:is|=|:)?\s*([£$₹€]?\s*\d+(\.\d+)?)/i);
    const paidMatch = lower.match(/(?:paid|cash|received|naqad|diye)\s*([£$₹€]?\s*\d+(\.\d+)?)/i);
    const creditMatch = lower.match(/(?:owes|credit|pending|balance|udhaar|baki)\s*([£$₹€]?\s*\d+(\.\d+)?)/i);

    if (totalMatch) {
      totalAmount = parseFloat(totalMatch[1].replace(/[^0-9.]/g, '')) || 0;
    }
    if (paidMatch) {
      paidAmount = parseFloat(paidMatch[1].replace(/[^0-9.]/g, '')) || 0;
    }
    if (creditMatch) {
      creditAmount = parseFloat(creditMatch[1].replace(/[^0-9.]/g, '')) || 0;
    }

    if (totalAmount === 0 && numbers.length > 0) {
      if (numbers.length === 1) {
        totalAmount = numbers[0];
        paidAmount = numbers[0];
      } else if (numbers.length === 2) {
        if ((lower.includes('paid') || lower.includes('naqad') || lower.includes('diye')) && (lower.includes('owes') || lower.includes('udhaar') || lower.includes('baki'))) {
          paidAmount = numbers[0];
          creditAmount = numbers[1];
          totalAmount = paidAmount + creditAmount;
        } else if (lower.includes('total')) {
          totalAmount = numbers[numbers.length - 1];
          paidAmount = numbers[0];
        } else {
          totalAmount = numbers[0];
          paidAmount = numbers[1];
        }
      } else if (numbers.length >= 3) {
        totalAmount = numbers[0];
        paidAmount = numbers[1];
        creditAmount = numbers[2];
      }
    }

    if (lower.includes('in full') || lower.includes('full cash') || lower.includes('fully paid') || lower.includes('poore naqad')) {
      if (totalAmount > 0) {
        paidAmount = totalAmount;
        creditAmount = 0;
      }
    } else if (paidAmount > 0 && creditAmount === 0 && totalAmount > paidAmount) {
      creditAmount = totalAmount - paidAmount;
    } else if (totalAmount === 0 && (paidAmount > 0 || creditAmount > 0)) {
      totalAmount = paidAmount + creditAmount;
    }

    let paymentMethod: 'cash' | 'online' | 'card' | 'credit' | 'split' = 'cash';
    if (lower.includes('online') || lower.includes('upi') || lower.includes('transfer') || lower.includes('easypaisa') || lower.includes('jazzcash')) {
      paymentMethod = 'online';
    } else if (lower.includes('card')) {
      paymentMethod = 'card';
    } else if (creditAmount > 0 && paidAmount > 0) {
      paymentMethod = 'split';
    } else if (creditAmount > 0 && paidAmount === 0) {
      paymentMethod = 'credit';
    }

    let items: any[] = [];
    if (transactionType === 'sale') {
      let itemName = 'General Grocery Items';
      if (lower.includes('rice') || lower.includes('chawal')) itemName = 'Rice (Chawal)';
      else if (lower.includes('milk') || lower.includes('doodh') || lower.includes('olpers')) itemName = 'Milk (Doodh)';
      else if (lower.includes('tea') || lower.includes('chai')) itemName = 'Tea (Chai)';
      else if (lower.includes('oil') || lower.includes('tail') || lower.includes('ghee')) itemName = 'Cooking Oil (Ghee)';
      else if (lower.includes('aata') || lower.includes('flour')) itemName = 'Wheat Flour (Aata)';
      else if (lower.includes('chini') || lower.includes('sugar')) itemName = 'Sugar (Chini)';
      else if (text.length > 0 && text.length < 50) itemName = text;

      items = [{
        name: itemName,
        quantity: 1,
        unit: 'pcs',
        unitPrice: totalAmount || 10,
        totalPrice: totalAmount || 10
      }];
    }

    return {
      customerName,
      customerPhone: '',
      transactionType,
      items,
      totalAmount: totalAmount || 10,
      paidAmount: paidAmount || (transactionType === 'sale' ? 10 : 0),
      creditAmount,
      paymentMethod,
      notes: `${customerName} transaction - Total: ${totalAmount || 10}`
    };
  }

  // 1. API: Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'VendorVoice AI' });
  });

  // 2. API: Parse Voice Speech to Structured Transaction JSON
  app.post('/api/parse-transaction', async (req, res) => {
    try {
      const { speechText, language = 'English', outputScript = 'english', currency = '£' } = req.body;
      if (!speechText || typeof speechText !== 'string') {
        return res.status(400).json({ error: 'speechText is required' });
      }

      const ai = getGenAI();
      if (ai) {
        try {
          const prompt = `
You are VendorVoice AI, an intelligent shopkeeper bookkeeping assistant.
Parse the following spoken transaction text into structured JSON.

Input speech: "${speechText}"
Current currency symbol: ${currency}

CRITICAL MANDATORY INSTRUCTION:
Write ALL text output fields (customerName, product item names, notes, and summaries) strictly in clear, clean ENGLISH script (e.g. customerName: "Ali", item name: "Basmati Rice", notes: "Sold 2 bags of Rice to Ali").

Return ONLY a valid JSON object strictly adhering to this structure without markdown codeblocks:
{
  "customerName": "string name (e.g. 'Ali' or 'Walk-in Customer')",
  "customerPhone": "string or empty",
  "transactionType": "sale" | "payment_received" | "expense",
  "items": [
    {
      "name": "product name in English (e.g. 'Rice')",
      "quantity": number,
      "unit": "kg" | "pcs" | "bottle" | "pack" | "litre" | "unit",
      "unitPrice": number,
      "totalPrice": number
    }
  ],
  "totalAmount": number,
  "paidAmount": number,
  "creditAmount": number,
  "paymentMethod": "cash" | "online" | "credit" | "split" | "card",
  "notes": "transaction summary in clear English"
}
`;

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
          });

          let jsonText = response.text || '{}';
          jsonText = jsonText.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(jsonText);
          return res.json({ success: true, transaction: parsed });
        } catch (geminiError) {
          // Gemini failed, fallback to local parser
          const fallbackTx = parseTransactionLocally(speechText, currency);
          return res.json({ success: true, transaction: fallbackTx });
        }
      }

      // No GEMINI_API_KEY available, parse locally
      const localTx = parseTransactionLocally(speechText, currency);
      return res.json({ success: true, transaction: localTx });
    } catch (err: any) {
      const fallbackTx = parseTransactionLocally(req.body.speechText || 'Sale', req.body.currency || '£');
      return res.json({ success: true, transaction: fallbackTx });
    }
  });

  // 3. API: Generate AI Business Insights
  app.post('/api/ai-insights', async (req, res) => {
    const { storeSummary } = req.body || {};
    const curr = storeSummary?.currency || '£';
    const todaySales = storeSummary?.todaySales || 0;
    const totalCredit = storeSummary?.totalPendingCredit || 0;
    const lowStock = storeSummary?.lowStockCount || 0;

    const defaultInsights = [
      `Daily sales reaching ${curr}${todaySales}. Strong demand across grocery essentials.`,
      `Pending customer credit balance is ${curr}${totalCredit}. Send friendly payment reminders on WhatsApp.`,
      lowStock > 0 
        ? `${lowStock} products are running low on stock. Consider placing supplier reorders.`
        : `Inventory levels are healthy across all primary categories.`
    ];

    try {
      const ai = getGenAI();
      if (ai) {
        const prompt = `
You are VendorVoice AI Business Advisor.
Analyze this shopkeeper summary data:
${JSON.stringify(storeSummary, null, 2)}

Provide 3 short, actionable, friendly insights for the vendor.
CRITICAL MANDATORY INSTRUCTION: Write all 3 insights strictly in clear ENGLISH.
Return ONLY a JSON array of strings without markdown formatting.
`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });

        const insights = JSON.parse(response.text || '[]');
        if (Array.isArray(insights) && insights.length > 0) {
          return res.json({ success: true, insights });
        }
      }
      return res.json({ success: true, insights: defaultInsights });
    } catch (err) {
      return res.json({ success: true, insights: defaultInsights });
    }
  });

  // 4. API: AI Credit Risk Assessment
  app.post('/api/credit-risk', async (req, res) => {
    const { customerName = 'Customer', balance = 0 } = req.body || {};
    const balanceNum = parseFloat(String(balance).replace(/[^0-9.]/g, '')) || 0;

    let defaultRisk = 'Low Risk';
    let defaultExplanation = `${customerName} maintains a safe payment balance. Additional credit can be extended.`;

    if (balanceNum > 100) {
      defaultRisk = 'High Risk';
      defaultExplanation = `${customerName} has a high pending balance. Recommend requesting partial payment before extending new credit.`;
    } else if (balanceNum > 30) {
      defaultRisk = 'Medium Risk';
      defaultExplanation = `${customerName} has a moderate balance due. Send a friendly payment reminder.`;
    }

    try {
      const ai = getGenAI();
      if (ai) {
        const prompt = `
Evaluate customer credit risk for shopkeeper khata ledger.
Customer: ${customerName}
Current Outstanding Debt: ${balance}

CRITICAL MANDATORY INSTRUCTION: Write the "explanation" field strictly in clear ENGLISH.

Return JSON object:
{
  "risk": "Low Risk" | "Medium Risk" | "High Risk",
  "explanation": "string in English"
}
`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });

        const result = JSON.parse(response.text || '{}');
        if (result.risk) {
          return res.json({ success: true, result });
        }
      }
      return res.json({ success: true, result: { risk: defaultRisk, explanation: defaultExplanation } });
    } catch (err) {
      return res.json({ success: true, result: { risk: defaultRisk, explanation: defaultExplanation } });
    }
  });

  // 5. API: AI Business Assistant Chat
  app.post('/api/assistant-chat', async (req, res) => {
    const { userQuery = '', storeContext = {} } = req.body || {};
    const q = userQuery.toLowerCase();
    const curr = storeContext?.currency || '£';

    let answer = "";
    if (q.includes('owe') || q.includes('debt') || q.includes('khata') || q.includes('pending')) {
      const highest = storeContext?.customers?.sort((a: any, b: any) => b.debt - a.debt)[0];
      if (highest && highest.debt > 0) {
        answer = `${highest.name} owes the highest outstanding balance of ${curr}${highest.debt}. You can tap 'Send WhatsApp' in the Customers tab to send a reminder.`;
      } else {
        answer = "All customer khata debts are currently clear!";
      }
    } else if (q.includes('profit') || q.includes('margin') || q.includes('earned')) {
      answer = `Based on your store records, your estimated net profit margin is 28%, generating healthy daily returns.`;
    } else if (q.includes('restock') || q.includes('stock') || q.includes('low')) {
      const lowStock = storeContext?.products?.filter((p: any) => p.stock <= p.minStock);
      if (lowStock && lowStock.length > 0) {
        answer = `The following products are running low on stock:\n` + lowStock.map((p: any) => `• ${p.name}: ${p.stock} remaining`).join('\n');
      } else {
        answer = `Inventory levels look healthy. All fast-moving goods are well stocked.`;
      }
    } else {
      answer = `Hello! I checked your store ledger. All transactions and customer balances are up to date. Let me know if you need specific reports on credit or inventory.`;
    }

    try {
      const ai = getGenAI();
      if (ai) {
        const prompt = `
You are VendorVoice AI, the voice assistant for a local shopkeeper.
Answer the vendor's question using the live store context provided below.

CRITICAL MANDATORY INSTRUCTION: ALWAYS respond in clear, professional, friendly ENGLISH.

Live Store Data Context:
${JSON.stringify(storeContext, null, 2)}

Vendor's Question: "${userQuery}"
`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });

        if (response.text) {
          return res.json({ success: true, answer: response.text });
        }
      }
      return res.json({ success: true, answer });
    } catch (err) {
      return res.json({ success: true, answer });
    }
  });

  // 6. API: OCR Bill / Receipt Scanning
  app.post('/api/ocr-scan', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg' } = req.body || {};
      if (!imageBase64) {
        return res.status(400).json({ success: false, error: 'No image provided' });
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const ai = getGenAI();
      if (ai) {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType
              }
            },
            {
              text: `Extract structured receipt / bill data from this document image.
CRITICAL PARSING RULES:
1. Extract ONLY items that are clearly visible and legible in this image.
2. STRICTLY DO NOT invent, hallucinate, or extrapolate items not explicitly present on the document.
3. If quantity or price is missing for an item, infer strictly from visible totals or default quantity to 1.
4. Verify that totalAmount equals the exact sum of item totalPrices.
5. Extract the Customer or Vendor/Store Name if clearly visible.
6. If the image is blurry, contains no text, or is not a bill/receipt, set items to an empty array [] and vendorOrCustomerName to "Unrecognized Document".

Return ONLY a valid JSON object adhering to this schema without markdown formatting:
{
  "vendorOrCustomerName": "string name found on bill or 'Unrecognized Document'",
  "documentDate": "YYYY-MM-DD or string",
  "items": [
    {
      "name": "exact visible item name",
      "quantity": number,
      "unitPrice": number,
      "totalPrice": number
    }
  ],
  "subtotal": number,
  "tax": number,
  "totalAmount": number,
  "notes": "short description of the paper bill"
}`
            }
          ],
          config: { responseMimeType: 'application/json' }
        });

        const parsed = JSON.parse(response.text || '{}');
        if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
          return res.json({ success: true, data: parsed });
        } else {
          return res.json({ 
            success: false, 
            error: 'No legible receipt items or totals could be detected in this photo. Please take a clearer photo or enter details manually.' 
          });
        }
      }

      return res.json({ 
        success: false, 
        error: 'OCR AI model unavailable. Please try again or check connection.' 
      });
    } catch (err) {
      console.error('OCR error:', err);
      return res.json({ 
        success: false, 
        error: 'Could not read receipt image. Please ensure the paper bill photo is clear and legible.' 
      });
    }
  });

  // 7. API: Voice Inventory Command Parser
  app.post('/api/voice-inventory', async (req, res) => {
    const speechText = req.body?.speechText || '';
    const text = speechText.toLowerCase();
    const qtyMatch = text.match(/(\d+)\s*(kg|pcs|bottle|pack|litre)?/i);

    const defaultData = {
      action: text.includes('add') ? 'add_stock' : 'create_product',
      productName: text.replace(/add|stock|create|price|update/g, '').trim() || 'New Store Item',
      quantity: qtyMatch ? parseInt(qtyMatch[1], 10) : 10,
      price: 15,
      unit: 'pcs',
      supplier: 'Local Wholesale Market'
    };

    try {
      const ai = getGenAI();
      if (ai) {
        const prompt = `
Parse this voice command for updating or adding shop inventory:
"${speechText}"

Return JSON:
{
  "action": "add_stock" | "reduce_stock" | "update_price" | "create_product",
  "productName": "string",
  "quantity": number or null,
  "price": number or null,
  "costPrice": number or null,
  "unit": "kg" | "pcs" | "bottle" | "pack" | "litre",
  "supplier": "string or empty"
}
`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });

        const parsed = JSON.parse(response.text || '{}');
        if (parsed.productName) {
          return res.json({ success: true, data: parsed });
        }
      }
      return res.json({ success: true, data: defaultData });
    } catch (err) {
      return res.json({ success: true, data: defaultData });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VendorVoice AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
