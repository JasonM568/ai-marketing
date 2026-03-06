/**
 * 綠界科技 ECPay — 訂閱制定期定額信用卡扣款工具
 */
import crypto from "crypto";

const MERCHANT_ID = process.env.ECPAY_MERCHANT_ID || "";
const HASH_KEY = process.env.ECPAY_HASH_KEY || "";
const HASH_IV = process.env.ECPAY_HASH_IV || "";
const ECPAY_API_URL = process.env.ECPAY_API_URL || "https://payment-stage.ecpay.com.tw";

// ===== 產生唯一交易編號 =====
export function generateMerchantTradeNo(): string {
  const now = new Date();
  const dateStr = now
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14);
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  // ECPay 限制 20 字元
  return `SUB${dateStr}${random}`.slice(0, 20);
}

// ===== CheckMacValue 產生 =====
export function generateCheckMacValue(params: Record<string, string>): string {
  // 1. 依參數名稱排序
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  // 2. 前後加上 HashKey / HashIV
  const raw = `HashKey=${HASH_KEY}&${sorted}&HashIV=${HASH_IV}`;

  // 3. URL encode (小寫)
  const encoded = encodeURIComponent(raw)
    .toLowerCase()
    // ECPay 特殊字元還原
    .replace(/%20/g, "+")
    .replace(/%2d/g, "-")
    .replace(/%5f/g, "_")
    .replace(/%2e/g, ".")
    .replace(/%21/g, "!")
    .replace(/%2a/g, "*")
    .replace(/%28/g, "(")
    .replace(/%29/g, ")")
    .replace(/%7e/g, "~");

  // 4. SHA256 + 轉大寫
  return crypto.createHash("sha256").update(encoded).digest("hex").toUpperCase();
}

// ===== 驗證 ECPay 回傳的 CheckMacValue =====
export function validateCheckMacValue(params: Record<string, string>): boolean {
  const receivedMac = params.CheckMacValue;
  if (!receivedMac) return false;

  // 移除 CheckMacValue 後重新計算
  const filtered = { ...params };
  delete filtered.CheckMacValue;

  const calculated = generateCheckMacValue(filtered);
  return calculated === receivedMac;
}

// ===== 建立定期定額扣款參數 =====
interface PeriodicPaymentParams {
  merchantTradeNo: string;
  planName: string;
  amount: number;
  returnUrl: string;
  periodReturnUrl: string;
  clientBackUrl: string;
  orderResultUrl: string;
}

export function buildPeriodicPaymentParams(opts: PeriodicPaymentParams): Record<string, string> {
  const now = new Date();
  const tradeDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

  const params: Record<string, string> = {
    MerchantID: MERCHANT_ID,
    MerchantTradeNo: opts.merchantTradeNo,
    MerchantTradeDate: tradeDate,
    PaymentType: "aio",
    TotalAmount: String(opts.amount),
    TradeDesc: encodeURIComponent("AI Marketing Agent 訂閱"),
    ItemName: opts.planName,
    ReturnURL: opts.returnUrl,
    OrderResultURL: opts.orderResultUrl,
    ClientBackURL: opts.clientBackUrl,
    ChoosePayment: "Credit",
    EncryptType: "1",
    // 定期定額參數
    PeriodAmount: String(opts.amount),
    PeriodType: "M", // 月
    Frequency: "1", // 每 1 個月
    ExecTimes: "99", // 最多執行 99 次
    PeriodReturnURL: opts.periodReturnUrl,
  };

  // 計算 CheckMacValue
  params.CheckMacValue = generateCheckMacValue(params);

  return params;
}

// ===== 產生自動提交的 HTML 表單 =====
export function getEcpayFormHtml(params: Record<string, string>): string {
  const actionUrl = `${ECPAY_API_URL}/Cashier/AioCheckOut/V5`;
  const inputs = Object.entries(params)
    .map(([key, val]) => `<input type="hidden" name="${key}" value="${val}" />`)
    .join("\n");

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>前往付款...</title></head>
    <body>
      <form id="ecpay-form" method="POST" action="${actionUrl}">
        ${inputs}
      </form>
      <script>document.getElementById('ecpay-form').submit();</script>
    </body>
    </html>
  `;
}

// ===== 解析 ECPay 回傳資料 =====
export function parseEcpayCallback(body: string): Record<string, string> {
  const params: Record<string, string> = {};
  body.split("&").forEach((pair) => {
    const [key, ...valueParts] = pair.split("=");
    if (key) {
      params[key] = decodeURIComponent(valueParts.join("=") || "");
    }
  });
  return params;
}
