import moment from "moment";
import { IPdfBankUtil } from "./IPdfBankUtil";

export class JagoSyariahUtil implements IPdfBankUtil {
    private bannedWords = [
        "Previous Balance", "Total Incoming", "Total Outgoing", "Closing Balance", "Source/Destination", "Transaction Details"
    ];

    processPdfData(textData: string): { csv: string; errors: string[]; } {
        const lineArray = textData.split("\n");
        const csvIdentifier = "~";
        const finalArr = [`date${csvIdentifier}title${csvIdentifier}amount${csvIdentifier}comment`];
        const startPage = lineArray.indexOf("Source/Destination");
        const errors :string[] = [];

        for (let i = startPage + 1; i < lineArray.length; i++) {
            const currentDate = lineArray[i];
            if (this.isValidDateFormat(currentDate)) {
                const rawData = lineArray.slice(i, i + 20);
                if (this.bannedWords.some(word => rawData.includes(word))) {
                    continue;
                }
                const transformedLines = this.transformLines(rawData);
                if (transformedLines) {
                    finalArr.push(transformedLines.join(csvIdentifier));
                } else {
                    errors.push(`Failed parsed this data: ${rawData.join(' ')}`);
                }
            }
        }
        return { csv: finalArr.join('\n'), errors };
    }

    private transformLines(lines: string[]) {
        const regexAmount = /^[+-]\d+$/;
        const indexAmount = lines.findIndex(data => data.replace(/\./g, "").match(regexAmount));
        const dateTime = moment(lines[0] + " " + lines[1], "DD MMM YYYY HH:mm").format("YYYY-MM-DDTHH:mm:ssZ");
        if (indexAmount !== -1) {
            return [
                dateTime,
                lines[2] + " " + lines[3],
                lines[indexAmount].replace(/[+.]/g, ""),
                lines.slice(4, indexAmount).join(" "),
            ];
        }
        return null;
    }

    private isValidDateFormat(dateString: string) {
        const dateFormat = "DD MMM YYYY";
        const parsedDate = moment(dateString, dateFormat, true);
        return parsedDate.isValid() && parsedDate.format(dateFormat) === dateString;
    }
    
}