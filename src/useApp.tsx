import { useCallback, useState } from "react";
import './App.css'
import { saveAs } from 'file-saver';
import { pdfjs } from 'react-pdf';
import { BankUtilFactory } from "./util/BankUtilFactory";
import { BankName } from "./util/constant";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const useApp = () => {
    const [selectedBank, setSelectedBank] = useState<BankName>(BankName.OCBC);
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState('');
    const [errors, setErrors] = useState<string[]>([]);
    const [password, setPassword] = useState('');


    const onChangeSelectBank = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedBank = event.target.value as BankName;
        setSelectedBank(selectedBank);
    }

    async function extractText(pdfData, passwordAttempt = password) {
        try {
            const bufferCopy = pdfData.slice(0);
            const pdf = await pdfjsLib.getDocument({ data: bufferCopy, password: passwordAttempt }).promise;
            let text = '';
    
            for (let i = 1; i <= pdf.numPages; i++) {
                const textContent = await (await pdf.getPage(i)).getTextContent();
                text += textContent.items.map(item => item.str.trim()).filter(Boolean).join('\n') + '\n';
            }

            return text;
        } catch (err) {
            if (err.name === 'PasswordException' || err.message.includes('Incorrect Password')) {
                return retryWithPassword(pdfData);
            }
            alert(err.message);
        }
    }
    
    const retryWithPassword = async (pdfData) => {
        const passwordPrompt = prompt('This PDF is password protected. Please enter the password:');
        if (passwordPrompt) {
            setPassword(passwordPrompt)
            return extractText(pdfData, passwordPrompt);
        } else if (passwordPrompt != null) {
            alert('Password is required to open this PDF.')
            return retryWithPassword(pdfData);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (file) {
            const buffer = await file.arrayBuffer();
            const textData = await extractText(buffer);
            const bankUtil = BankUtilFactory.getBankUtil(selectedBank);
            const { csv, errors } = bankUtil.processPdfData(textData);
            const blob = new Blob([csv], { type: 'text/csv' });
            const fileName = file.name.replaceAll('.pdf', '') + '.csv';
            await saveAs(blob, fileName);
            setResult(`File successfully saved`);
            setErrors(errors);
        }
    };

    const clear = () => {
        setFile(null);
        setErrors([])
        setResult('')
        setPassword('')
    }
    const state = {
        selectedBank,
        file,
        errors,
        result
    }
    return {
        state,
        clear,
        handleSubmit,
        onChangeSelectBank,
        setFile
    }
}