export const TRANSACTION_TYPES = {
  SALE: 'SALE',
  PURCHASE: 'PURCHASE',
  EXPENSE: 'EXPENSE',
  CREDIT_SALE: 'CREDIT_SALE',
  REPAYMENT: 'REPAYMENT',
};

export const PAYMENT_STATUS = { PAID: 'PAID', UNPAID: 'UNPAID' };

export const TYPE_META = {
  [TRANSACTION_TYPES.SALE]:        { label: 'Sale',        labelNp: 'बिक्री',       color: 'sale'      },
  [TRANSACTION_TYPES.PURCHASE]:    { label: 'Purchase',    labelNp: 'खरिद',         color: 'purchase'  },
  [TRANSACTION_TYPES.EXPENSE]:     { label: 'Expense',     labelNp: 'खर्च',         color: 'expense'   },
  [TRANSACTION_TYPES.CREDIT_SALE]: { label: 'Credit Sale', labelNp: 'उधारो बिक्री', color: 'credit'    },
  [TRANSACTION_TYPES.REPAYMENT]:   { label: 'Repayment',   labelNp: 'भुक्तानी',    color: 'repayment' },
};
