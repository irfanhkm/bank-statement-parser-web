export interface IPdfBankUtil {
    processPdfData(textData: string): { csv: string; errors: string[] };
}
