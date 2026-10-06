import React, { useState } from 'react';
import { translations } from './translations';
import { calculateStatus, isBlockingStatus } from './utils/statusEngine';
import { generatePdfPackage } from './utils/pdfGenerator';
import confetti from 'canvas-confetti';

export default function App() {
  const [lang, setLang] = useState('en');
  const t = translations[lang];

  const [tenderData, setTenderData] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [matches, setMatches] = useState({});
  const [expiryDates, setExpiryDates] = useState({});

  const handleJsonUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        setTenderData(json.tender);
        setRequirements(json.requirements || []);
      } catch (err) {
        alert("Invalid requirements.json file!");
      }
    };
    reader.readAsText(file);
  };

  const handlePdfUpload = async (e) => {
    const files = Array.from(e.target.files);
    const validPdfs = files.filter(f => f.type === "application/pdf" || f.name.endsWith(".pdf"));

    if (validPdfs.length !== files.length) {
      alert("Only PDF files are allowed!");
    }

    const newFiles = validPdfs.map(file => ({
      id: Math.random().toString(),
      name: file.name,
      rawFile: file
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleMatchChange = (reqId, fileName) => {
    const file = uploadedFiles.find(f => f.name === fileName);
    setMatches(prev => ({ ...prev, [reqId]: file || null }));
  };

  const handleExpiryChange = (reqId, date) => {
    setExpiryDates(prev => ({ ...prev, [reqId]: date }));
  };

  let hasBlockingIssues = false;
  if (!tenderData || requirements.length === 0) {
    hasBlockingIssues = true;
  } else {
    for (const req of requirements) {
      const status = calculateStatus(req, matches[req.id], expiryDates[req.id], tenderData.submission_deadline);
      if (isBlockingStatus(status)) {
        hasBlockingIssues = true;
        break;
      }
    }
  }

  const handleGenerate = async () => {
    try {
      const pdfBlob = await generatePdfPackage(tenderData, requirements, matches, expiryDates);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${tenderData.tender_id}_Package.pdf`;
      link.click();
      confetti();
    } catch (err) {
      console.error(err);
      alert("Error generating PDF Package.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t.appTitle}</h1>
            <p className="text-sm text-slate-500">{t.subtitle}</p>
          </div>
          <button
            onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
          >
            {lang === 'en' ? 'বাংলা' : 'English'}
          </button>
        </div>

        {/* Upload Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h2 className="font-semibold text-lg mb-2">{t.loadJSON}</h2>
            <input type="file" accept=".json" onChange={handleJsonUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h2 className="font-semibold text-lg mb-2">{t.uploadPDFs}</h2>
            <input type="file" accept=".pdf" multiple onChange={handlePdfUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
          </div>
        </div>

        {/* Tender Info Header */}
        {tenderData && (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-2">
            <h2 className="font-bold text-lg text-indigo-900 border-b pb-2">{t.tenderInfo}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><span className="font-semibold">{t.tenderId}:</span> {tenderData.tender_id}</div>
              <div><span className="font-semibold">{t.title}:</span> {tenderData.title}</div>
              <div><span className="font-semibold">{t.entity}:</span> {tenderData.procuring_entity}</div>
              <div><span className="font-semibold">{t.bidder}:</span> {tenderData.bidder}</div>
              <div><span className="font-semibold">{t.deadline}:</span> <span className="text-red-600 font-medium">{tenderData.submission_deadline}</span></div>
            </div>
          </div>
        )}

        {/* Requirements Table */}
        {requirements.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b bg-slate-100">
              <h2 className="font-bold text-lg">{t.requirements}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b text-slate-600">
                    <th className="p-3">{t.order}</th>
                    <th className="p-3">{t.docTitle}</th>
                    <th className="p-3">{t.type}</th>
                    <th className="p-3">{t.matchedFile}</th>
                    <th className="p-3">{t.expiryDate}</th>
                    <th className="p-3">{t.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {requirements.map((req) => {
                    const matchedFile = matches[req.id];
                    const status = calculateStatus(req, matchedFile, expiryDates[req.id], tenderData.submission_deadline);
                    
                    return (
                      <tr key={req.id} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold">{req.order}</td>
                        <td className="p-3">{lang === 'bn' ? req.title_bn : req.title_en}</td>
                        <td className="p-3">
                          {req.mandatory ? <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">{t.mandatory}</span> : <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded">{t.optional}</span>}
                        </td>
                        <td className="p-3">
                          <select
                            onChange={(e) => handleMatchChange(req.id, e.target.value)}
                            className="p-1 border rounded text-xs w-full bg-white"
                          >
                            <option value="">{t.selectMatch}</option>
                            {uploadedFiles.map(f => (
                              <option key={f.id} value={f.name}>{f.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          {req.has_expiry ? (
                            <input
                              type="date"
                              onChange={(e) => handleExpiryChange(req.id, e.target.value)}
                              className="p-1 border rounded text-xs bg-white"
                            />
                          ) : '-'}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            status === 'OK' ? 'bg-green-100 text-green-700' :
                            status === 'Not provided' ? 'bg-slate-100 text-slate-600' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {t[`status${status.replace(/\s+/g, '')}`]}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 text-center space-y-3">
          <button
            disabled={hasBlockingIssues}
            onClick={handleGenerate}
            className={`w-full py-3 px-6 text-lg font-bold rounded-xl transition ${
              hasBlockingIssues
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'
            }`}
          >
            {t.generateBtn}
          </button>
          {hasBlockingIssues && (
            <p className="text-xs text-red-500 font-medium">{t.blockingIssues}</p>
          )}
        </div>

      </div>
    </div>
  );
}