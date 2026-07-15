'use client';

export function submissionFormReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };

    case 'SET_SELLER_FIELD':
      return { ...state, [action.field]: action.value };

    case 'SET_BUYER_FIELD':
      return { ...state, [action.field]: action.value };

    case 'ADD_ITEM': {
      const newList = [
        ...state.itemList,
        {
          itemSNo: state.itemList.length + 1,
          buyerNTN: '', buyerCNIC: '', buyerBusinessName: '', buyerType: '', buyerProvince: '',
          sellerProvince: '',
          invoiceType: 'Sale invoice', invoiceNumber: '', invoiceDate: new Date().toISOString().split('T')[0],
          itemDescription: '', hsCode: '9815.9000', quantity: 1, unitPrice: 0,
          saleValue: 0, taxRate: 0, taxAmount: 0, uom: '', saleType: 'Services',
          fixedNotifiedValue: 0, extraTax: 0, furtherTax: 0,
          totalValueOfSales: 0, stWithheldAtSource: 0,
          invoiceReferenceNo: '', reasons: '', reasonRemarks: '',
          petroleumLevyOn: '',
          buyerAddress: '',
          sroScheduleNo: 'ICTO TABLE II', sroItemSerialNo: '1(i)',
        },
      ];
      return { ...state, itemList: newList };
    }

    case 'UPDATE_ITEM': {
      const updatedList = state.itemList.map((item, i) => {
        if (i !== action.index) return item;
        const updated = { ...item, [action.field]: action.value };
        const quantity = Number(updated.quantity || 0);
        const unitPrice = Number(updated.unitPrice || 0);
        const taxRate = Number(updated.taxRate || 0);
        updated.saleValue = quantity * unitPrice;
        updated.taxAmount = updated.saleValue * (taxRate / 100);
        return updated;
      });
      const totalSaleValue = updatedList.reduce((sum, i) => sum + Number(i.saleValue || 0), 0);
      const totalTaxAmount = updatedList.reduce((sum, i) => sum + Number(i.taxAmount || 0), 0);
      const totalBillAmount = totalSaleValue + totalTaxAmount;
      return { ...state, itemList: updatedList, totalSaleValue, totalTaxAmount, totalBillAmount };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        itemList: state.itemList.filter((_, i) => i !== action.index),
      };

    case 'RECALCULATE_TOTALS': {
      const totalSaleValue = state.itemList.reduce((sum, i) => sum + Number(i.saleValue || 0), 0);
      const totalTaxAmount = state.itemList.reduce((sum, i) => sum + Number(i.taxAmount || 0), 0);
      const totalBillAmount = totalSaleValue + totalTaxAmount;
      return { ...state, totalSaleValue, totalTaxAmount, totalBillAmount };
    }

    case 'SET_VALIDATION_ERRORS':
      return { ...state, validationErrors: action.errors };

    case 'RESET_FORM':
      return action.initialState;

    case 'LOAD_DRAFT':
      return { ...action.data };

    default:
      return state;
  }
}

export const initialFormState = {
  submissionType: 'sales_tax_fed',
  taxPeriodMonth: new Date().getMonth() + 1,
  taxPeriodYear: new Date().getFullYear(),
  invoiceType: '',
  invoiceDate: new Date().toISOString().split('T')[0],
  invoiceNumber: '',
  sellerBusinessName: '',
  sellerNTN: '',
  sellerProvince: '',
  sellerAddress: '',
  buyerBusinessName: '',
  buyerNTN: '',
  buyerCNIC: '',
  buyerProvince: '',
  buyerAddress: '',
  buyerType: '',
  totalSaleValue: 0,
  totalTaxAmount: 0,
  totalBillAmount: 0,
  itemList: [],
  validationErrors: [],
};
