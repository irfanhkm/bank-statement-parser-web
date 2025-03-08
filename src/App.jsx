import React, { useCallback } from 'react';
import './App.css'
import { useApp } from './useApp';
import { useDropzone } from 'react-dropzone';
import { BankName } from './util/constant';

function App() {
  const { state, onChangeSelectBank, clear, handleSubmit, setFile } = useApp();
  const { selectedBank, errors, result, file } = state;

  const onDrop = useCallback((acceptedFiles) => {
      if (acceptedFiles.length > 0) {
          setFile(acceptedFiles[0]);
      }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open: openFile } = useDropzone({
      onDrop,
      accept: { 'application/pdf': ['.pdf'] },
      noClick: true,
  });

  return (
    <div className="App">
      <div>
        Choose Bank: &nbsp;
        <select onChange={onChangeSelectBank} value={selectedBank}>
          <option value={BankName.JAGO_SYARIAH}>{BankName.JAGO_SYARIAH}</option>
          <option value={BankName.OCBC}>{BankName.OCBC}</option>
        </select>
      </div>
      <br></br>
      <form onSubmit={handleSubmit}>
        <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
          <input {...getInputProps()} />
          {
              <p>Drop the PDF file here ...</p>
          }
        </div>
        {file && <p>Selected file: {file.name}</p>}
        {file && (
          <>
            <button type="submit" disabled={!file} style={{marginRight: "20px"}}>
              Parse Statement
            </button>
            <button disabled={!file} 
              onClick={clear}>
              Clear
            </button>
          </>
        )}
      </form>
      <div>
        {result && (
          <div>
            <h2>Result:</h2>
            <p>{result}</p>
          </div>
        )}
        {/* {errors.length > 0 && (
          <div>
            <h2>Parsing Errors:</h2>
            <ul>
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )} */}
      </div>
    </div>
  );
}

export default App;