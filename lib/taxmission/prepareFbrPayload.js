export function prepareFbrPayload(submission) {
  return {
    invoiceType: submission.invoiceType,
    invoiceDate: submission.invoiceDate,
    invoiceNumber: submission.invoiceNumber,
    sellerBusinessName: submission.sellerBusinessName,
    sellerNTN: submission.sellerNTN,
    sellerProvince: submission.sellerProvince,
    sellerAddress: submission.sellerAddress,
    buyerBusinessName: submission.buyerBusinessName,
    buyerNTN: submission.buyerNTN,
    buyerCNIC: submission.buyerCNIC,
    buyerProvince: submission.buyerProvince,
    buyerAddress: submission.buyerAddress,
    totalSaleValue: submission.totalSaleValue,
    totalTaxAmount: submission.totalTaxAmount,
    totalBillAmount: submission.totalBillAmount,
    itemList: submission.itemList.map((item, index) => ({
      itemSNo: index + 1,
      itemDescription: item.itemDescription,
      hsCode: item.hsCode,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      saleValue: Number(item.saleValue),
      taxRate: Number(item.taxRate),
      taxAmount: Number(item.taxAmount),
    })),
  };
}
