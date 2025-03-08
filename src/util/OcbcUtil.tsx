import moment from "moment";
import { IPdfBankUtil } from "./IPdfBankUtil";

export class OcbcUtil implements IPdfBankUtil {
    private bannedWords = [
        "Total Mutasi Debet"
    ];

    processPdfData(textData: string): { csv: string; errors: string[]; } {
        const lineArray = textData.split("\n");
        const csvIdentifier = "~";
        const finalArr = [`date${csvIdentifier}title${csvIdentifier}amount${csvIdentifier}comment`];
        const errors :string[] = [];

        let startData = lineArray.indexOf("TGL");
        startData++;

        while (startData < lineArray.length) {
            const line = lineArray[startData].trim();
    
            // Check if the line contains a valid transaction date
            if (this.isValidDateFormat(line)) {
                const date = line;
                const title = lineArray[startData + 2]?.trim();
                const debit = lineArray[startData + 3]?.trim()?.replace(/,/g, "") || 0;
                const credit = lineArray[startData + 4]?.trim()?.replace(/,/g, "") || 0;
                const amount = debit !== '0.00' ? -debit : credit;
                let comment = "";
                // Extract "Berita" comment if available
                if (lineArray[startData + 6]?.startsWith("Berita")) {
                    comment = lineArray[startData + 6]?.replace("Berita :", "").trim();
                    startData += 1; // Skip extra comment line
                    if (lineArray[startData + 6] && !this.isValidDateFormat(lineArray[startData + 6])) {
                        comment += " " + lineArray[startData + 6].trim(); // Append multiline comment
                        startData += 1;
                    }
                    this.bannedWords.forEach(word => {
                        comment = comment.replace(word, "").trim();
                    });
                }
                finalArr.push([date, title, amount, comment].join(csvIdentifier));
            }
    
            startData++;
        }

        return { csv: finalArr.join('\n'), errors };
    }

    private isValidDateFormat(dateString: string) {
        const dateFormat = "DD/MM/YYYY";
        const parsedDate = moment(dateString, dateFormat, true);
        return parsedDate.isValid() && parsedDate.format(dateFormat) === dateString;
    }
    
}