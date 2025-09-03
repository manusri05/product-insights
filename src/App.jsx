import React, { useState } from "react";
import * as XLSX from "xlsx";

export default function App() {
  const [fileCount, setFileCount] = useState(1);
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const processFiles = async () => {
    let productData = {};

    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });

      // read first sheet
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      rows.forEach((row) => {
        const productCode = row[5]; // 6th column
        const description = row[4]; // 5th column
        const quantity = row[1]; // 2nd column

        if (!productCode) return;

        const cleanedQty = parseFloat(quantity) || 0; 

        if (!productData[productCode]) {
          productData[productCode] = {
            description,
            quantities: Array(files.length).fill(0),
          };
        }

        productData[productCode].quantities[idx] += cleanedQty;
      });
    }

    // build final rows
    const resultRows = [];
    for (const code in productData) {
      const { description, quantities } = productData[code];
      const total = quantities.reduce((a, b) => a + b, 0);
      resultRows.push([code, description, ...quantities, total]);
    }

    // build worksheet
    const headers = [
      "Product Code",
      "Description",
      ...files.map((_, i) => `Qty File ${i + 1}`),
      "Total Quantity",
    ];
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...resultRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Summary");

    // export
    XLSX.writeFile(workbook, "summary_output.xlsx");
  };

  return (
    <div className="container py-5">
      <div className="card shadow p-4">
        <h1 className="text-center mb-4">Product Insights</h1>

        <div className="mb-3">
          <label className="form-label">Number of Files</label>
          <input
            type="number"
            className="form-control"
            min="1"
            value={fileCount}
            onChange={(e) => setFileCount(Number(e.target.value))}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Upload Excel Files</label>
          <input
            type="file"
            className="form-control"
            multiple
            accept=".xlsx,.xls"
            onChange={handleFileChange}
          />
          <div className="form-text">
            Selected: {files.length} / {fileCount}
          </div>

          {/* Show uploaded file names */}
          {files.length > 0 && (
            <ul className="list-group mt-2">
              {files.map((file, i) => (
                <li key={i} className="list-group-item">
                  📄 {file.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          className="btn btn-primary w-100"
          onClick={processFiles}
          disabled={files.length !== fileCount}
        >
          Extract Product File
        </button>
      </div>
    </div>
  );
}
