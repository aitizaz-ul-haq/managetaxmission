export function calculateInvoiceItems(items = []) {
  return items.map((item, index) => {
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unitPrice || 0);
    const taxRate = Number(item.taxRate || 0);
    const saleValue = quantity * unitPrice;
    const taxAmount = saleValue * (taxRate / 100);

    return {
      ...item,
      itemSNo: index + 1,
      quantity,
      unitPrice,
      taxRate,
      saleValue,
      taxAmount,
    };
  });
}

export function calculateInvoiceTotals(items = []) {
  const itemList = calculateInvoiceItems(items);
  const totalSaleValue = itemList.reduce((sum, item) => sum + item.saleValue, 0);
  const totalTaxAmount = itemList.reduce((sum, item) => sum + item.taxAmount, 0);
  const totalBillAmount = totalSaleValue + totalTaxAmount;

  return { itemList, totalSaleValue, totalTaxAmount, totalBillAmount };
}
