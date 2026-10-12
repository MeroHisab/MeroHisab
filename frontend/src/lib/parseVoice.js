import { TRANSACTION_TYPES as T } from './constants.js';

const DEV_DIGITS = '०१२३४५६७८९';
const toAscii = (s) => s.replace(/[०-९]/g, (d) => String(DEV_DIGITS.indexOf(d)));

const UNITS = {
  // Nepali
  'एक': 1, 'दुई': 2, 'तीन': 3, 'चार': 4, 'पाँच': 5, 'पांच': 5, 'छ': 6, 'छ्': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दश': 10, 'दस': 10,
  'बीस': 20, 'तीस': 30, 'चालीस': 40, 'पचास': 50, 'साठी': 60, 'सत्तरी': 70, 'असी': 80, 'नब्बे': 90,
  // English
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const MULTIPLIERS = {
  'सय': 100, 'हजार': 1000, 'लाख': 100000,
  hundred: 100, thousand: 1000, lakh: 100000, k: 1000,
};

function parseAmount(text) {
  const t = toAscii(text.toLowerCase()).replace(/(\d),(?=\d{3})/g, '$1');
  const tokens = t.split(/[\s,।]+/).map((x) => x.replace(/\.+$/, '')).filter(Boolean);

  // 1) digits, optionally followed by a multiplier word ("5 hundred", "2k")
  for (let i = 0; i < tokens.length; i++) {
    const m = tokens[i].match(/^(?:rs\.?|npr|रु\.?)?(\d+(?:\.\d+)?)(k)?$/i);
    if (m) {
      let n = parseFloat(m[1]);
      if (m[2]) n *= 1000;
      else if (MULTIPLIERS[tokens[i + 1]]) n *= MULTIPLIERS[tokens[i + 1]];
      if (n > 0) return n;
    }
  }

  // 2) number words ("पाँच सय", "दुई हजार", "five hundred")
  let total = 0, current = 0, found = false;
  for (const raw of tokens) {
    const word = [raw, raw.replace(/(ले|को|मा|लाई)$/u, '')].find((w) => UNITS[w] != null || MULTIPLIERS[w] != null);
    if (word == null) continue;
    if (UNITS[word] != null) {
      current += UNITS[word];
      found = true;
    } else {
      current = (current || 1) * MULTIPLIERS[word];
      if (MULTIPLIERS[word] >= 1000) { total += current; current = 0; }
      found = true;
    }
  }
  total += current;
  return found && total > 0 ? total : null;
}

const has = (text, words) => words.some((w) => text.includes(w));

function detectType(text, hasCustomer) {
  const t = text.toLowerCase();
  if (has(t, ['तिर्यो', 'तिरे', 'तिरेको', 'तिरिन्', 'भुक्तानी', 'फिर्ता', 'repaid', 'paid back', 'repayment', 'returned money', 'settled'])) return T.REPAYMENT;
  if (hasCustomer && has(t, ['paid'])) return T.REPAYMENT;
  if (has(t, ['उधारो', 'उधार', 'udharo', 'udhar', 'credit', 'on loan', 'लग्यो', 'लगे'])) return T.CREDIT_SALE;
  if (has(t, ['खरिद', 'किने', 'किनें', 'किन्यो', 'bought', 'purchase', 'purchased', 'restock', 'stock'])) return T.PURCHASE;
  if (has(t, ['खर्च', 'भाडा', 'बिल', 'तलब', 'expense', 'rent', 'bill', 'salary', 'electricity', 'spent', 'transport'])) return T.EXPENSE;
  return T.SALE;
}

const CATEGORY_HINTS = [
  ['Dairy', ['दूध', 'दही', 'milk', 'curd', 'ghee', 'घ्यू', 'पनिर', 'paneer', 'dairy']],
  ['Drinks', ['चिया', 'कफी', 'जुस', 'पानी', 'tea', 'coffee', 'juice', 'water', 'cola', 'drink']],
  ['Snacks', ['बिस्कुट', 'चाउचाउ', 'चिप्स', 'noodle', 'biscuit', 'chips', 'snack']],
  ['Groceries', ['चामल', 'दाल', 'तेल', 'चिनी', 'नुन', 'rice', 'dal', 'oil', 'sugar', 'salt', 'flour', 'grocer']],
];

function detectCategory(text, categories) {
  const t = text.toLowerCase();
  const direct = categories.find((c) => t.includes(c.toLowerCase()));
  if (direct) return direct;
  for (const [name, words] of CATEGORY_HINTS) {
    if (has(t, words) && categories.includes(name)) return name;
  }
  return categories.includes('Others') ? 'Others' : categories[0] || 'Others';
}

/**
 * Turn a spoken / typed sentence into a draft transaction.
 * Returns fields that could not be detected as null so the UI can ask for them.
 */
export function parseTransactionText(text, customers = [], categories = []) {
  const clean = text.trim();
  const lower = clean.toLowerCase();
  const customer = [...customers]
    .sort((a, b) => b.name.length - a.name.length)
    .find((c) => lower.includes(c.name.toLowerCase())) || null;
  const type = detectType(clean, !!customer);
  const amount = parseAmount(clean);
  return {
    type,
    amount: amount ?? '',
    customer_id: customer ? customer.id : '',
    category: detectCategory(clean, categories),
    description: clean,
    status: type === T.CREDIT_SALE ? 'UNPAID' : 'PAID',
  };
}
