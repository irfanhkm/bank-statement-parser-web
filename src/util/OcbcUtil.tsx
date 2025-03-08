import moment from "moment";
import { IPdfBankUtil } from "./IPdfBankUtil";

export class OcbcUtil implements IPdfBankUtil {
    private bannedWords = [
        "Total Mutasi Debet",
        "BILAMANA",
        "TERHITUNG SEJAK TANGGAL STEMPEL POS",
        "DITERIMANYA PER EKSPEDISI",
        "TANGGAL TERKIRIMNYA LAYANAN",
        "STATEMENT REKENING KORAN",
        "SEGALA RISIKO",
        "TUNTUTAN",
        "NASABAH",
        "TIDAK MEMBUAT NOTA UNTUK SETIAP PERKREDITAN BUNGA",
        "KOMPUTER INI TIDAK MEMERLUKAN TANDA TANGAN PEJABAT BANK.",
        "Waspada! File APK. (Android Package Kit)",
        "web.ocbc.id/apkpalsu",
        "INI TIDAK ADA SANGGAHAN DARI"
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
                    comment = lineArray[startData + 6]?.trim();
                    startData += 1; // Skip extra comment line

                    while (lineArray[startData + 6] && !this.isValidDateFormat(lineArray[startData + 6])) {
                        comment += " " + lineArray[startData + 6].trim(); // Append multiline comment
                        startData += 1;
                    }
                } else {
                    let commentLine = startData + 6;

                    if (this.bannedWords.some(word => lineArray[commentLine].includes(word))) {
                        while (!lineArray[commentLine].includes("TGL")) {                        
                            commentLine++;
                        }
                        commentLine += 8;
                        comment = lineArray[commentLine]?.trim();
                        startData = commentLine;
                        startData += 1;
                        if (lineArray[startData] && !this.isValidDateFormat(lineArray[startData])) {
                            comment += " " + lineArray[startData].trim();
                        }
                    } else {
                        comment = lineArray[commentLine]?.trim();
                        startData += 1;
                        if (lineArray[startData + 6] && !this.isValidDateFormat(lineArray[startData + 6])) {
                            comment += " " + lineArray[startData + 6].trim();
                            startData += 1;
                        }
                    }
                }
                comment = this.removeTextAfterBannedWords(comment);
                finalArr.push([date, title, amount, comment].join(csvIdentifier));
            }
    
            startData++;
        }

        return { csv: finalArr.join('\n'), errors };
    }


    // Helper method to clean comments
    private removeTextAfterBannedWords(text: string): string {
        if (!text) return "";
        
        let cleanedText = text;
        for (const word of this.bannedWords) {
        const index = cleanedText.indexOf(word);
        if (index !== -1) {
            cleanedText = cleanedText.substring(0, index).trim();
        }
        }
        
        return cleanedText;
    }
  
    private isValidDateFormat(dateString: string) {
        const dateFormat = "DD/MM/YYYY";
        const parsedDate = moment(dateString, dateFormat, true);
        return parsedDate.isValid() && parsedDate.format(dateFormat) === dateString;
    }
    
}