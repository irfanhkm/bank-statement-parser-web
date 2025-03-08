import { BankName } from "./constant";
import { IPdfBankUtil } from "./IPdfBankUtil";
import { JagoSyariahUtil } from "./jagoSyariahUtil";

export class BankUtilFactory {
    static getBankUtil(bankName: BankName): IPdfBankUtil {
        switch (bankName) {
            case BankName.JAGO_SYARIAH:
                return new JagoSyariahUtil();
            default:
                throw new Error(`No implementation for bank: ${bankName}`);
        }
    }
}
