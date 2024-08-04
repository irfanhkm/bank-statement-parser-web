import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import './App.css'
import { saveAs } from 'file-saver';
import { pdfjs } from 'react-pdf';
import moment from 'moment';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState('');
  const [errors, setErrors] = useState([]);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ onDrop, accept: '.pdf', noClick: true });

  let alltext = [];
  async function extractText(url) {
      try {
          let pdf = await pdfjsLib.getDocument(url).promise; 
          let pages = pdf.numPages; // Get the total number of pages in the PDF
          let lastY, text = '';
          for (let i = 1; i <= pages; i++) {
              let page = await pdf.getPage(i); // Get the page object for each page
              let textContent = await page.getTextContent(); // Get the text content of the page
              for (let i = 0; i < textContent.items.length; i++) {
                  let item = textContent.items[i];
                  
                  // skipping empty
                  if (item === undefined || item.str == '') {
                      continue;
                  }
                  text += '\n' + item.str;
              }
              // let text = txt.items.map((s) => s.str).join("\n"); // Concatenate the text items into a single string
              // alltext.push(text); // Add the extracted text to the array
          }
          return text;
      } catch (err) {
          alert(err.message);
      }
  }

  const bannedWords = ['Previous Balance', 'Total Incoming', 'Total Outgoing', 'Closing Balance', 'Source/Destination', 'Transaction Details'];
  function processPdfData(textData) {
    const lineArray = textData.split("\n");
    const csvIdentifier = "~";
    const finalArr = [`date${csvIdentifier}title${csvIdentifier}amount${csvIdentifier}comment`];
    const startPage = lineArray.indexOf("Source/Destination");
    const errors = [];

    for (let i = startPage + 1; i < lineArray.length; i++) {
        const currentDate = lineArray[i];
        if (isValidDateFormat(currentDate)) {
            const rawData = lineArray.slice(i, i + 20);
            if (bannedWords.some(word => rawData.includes(word))) {
                continue;
            }
            const transformedLines = transformLines(rawData);
            if (transformedLines) {
                finalArr.push(transformedLines.join(csvIdentifier));
            } else {
              errors.push(`Failed parsed this data: ${rawData.join(' ')}`);
            }
        } 
    }
    return { csv: finalArr.join('\n'), errors };
  }

  function transformLines(lines) {
    const regexAmount = /^[+-]\d+$/;
    const indexAmount = lines.findIndex(data => data.replace(/\./g, '').match(regexAmount));
    console.log(lines);
    const dateTime = moment(lines[0] + " " + lines[1], 'DD MMM YYYY HH:mm').format('YYYY-MM-DDTHH:mm:ssZ');
    if (indexAmount !== -1) {
      return [
        dateTime,
        lines[2] + " " + lines[3],
        lines[indexAmount].replace(/[+.]/g, ''),
        lines.slice(4, indexAmount).join(" "),
      ];
    }
    return null;
  }

  function isValidDateFormat(dateString) {
    const dateFormat = 'DD MMM YYYY';
    const parsedDate = moment(dateString, dateFormat, true);
    return parsedDate.isValid() && parsedDate.format(dateFormat) === dateString;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (file) {
      const buffer = await file.arrayBuffer();
      const pdf = await extractText(buffer);
      const { csv, errors } = processPdfData(pdf);
      console.log(errors);

      const blob = new Blob([csv], { type: 'text/csv' });
      const fileName = file.name + '.csv';
      await saveAs(blob, fileName);
      setResult(`File successfully saved`);
      setErrors(errors);
    }
  };

  return (
    <div className="App">
      <form onSubmit={handleSubmit}>
        <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
          <input {...getInputProps()} />
          {
              <p>Drop the PDF file here ...</p>
          }
        </div>
        {file && <p>Selected file: {file.name}</p>}
        <button type="submit" disabled={!file} style={{marginRight: "20px"}}>
          Parse Statement
        </button>
        {
         file && 
         <button disabled={!file} 
          onClick={() => {
            setFile(null);
            setErrors([])
            setResult('')
          }}>
          Clear
        </button>
        }
      </form>
      {result && (
        <div>
          <h2>Result:</h2>
          <p>{result}</p>
        </div>
      )}
      {errors.length > 0 && (
        <div>
          <h2>Parsing Errors:</h2>
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;