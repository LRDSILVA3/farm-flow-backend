const fs = require('fs');
const path = require('path');

const printPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/orders/OrderPrintDialog.tsx');
let content = fs.readFileSync(printPath, 'utf8');

// Adicionar import de getStoredPdfHeaderConfig
if (!content.includes('getStoredPdfHeaderConfig')) {
  content = `import { getStoredPdfHeaderConfig } from '../settings/PdfHeaderTab';\n` + content;
}

// Dentro do componente OrderPrintDialog, obter pdfConfig
if (!content.includes('const pdfConfig = getStoredPdfHeaderConfig();')) {
  content = content.replace(
    'const [isEditingHeaders, setIsEditingHeaders] = useState(false);',
    'const [isEditingHeaders, setIsEditingHeaders] = useState(false);\n  const pdfConfig = getStoredPdfHeaderConfig();'
  );
}

// Substituir o cabeçalho estático pelo cabeçalho dinâmico
const staticHeaderRegex = /\{\/\* 1\. CABEÇALHO EMPRESA \*\/\}[\s\S]*?\{\/\* 2\. BARRA DE TÍTULO DINÂMICA \*\/\}/;

const dynamicHeaderMarkup = `{/* 1. CABEÇALHO EMPRESA DINÂMICO CONFORME CONFIGURAÇÃO */}
            <div className="text-center pb-2 border-b border-black">
              <div className="flex items-center justify-center gap-2 mb-1">
                {pdfConfig.logoUrl ? (
                  <img src={pdfConfig.logoUrl} alt="Logo" className="h-9 max-w-[120px] object-contain inline-block" />
                ) : (
                  <svg className="w-8 h-8 text-green-700 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                <div className="text-left inline-block">
                  <h1 className="text-2xl font-black tracking-wider leading-none text-black">
                    {pdfConfig.companyName || 'PRECIZA'}
                  </h1>
                  <p className="text-[10px] font-bold tracking-widest text-black">
                    {pdfConfig.tagline || 'AGRICULTURA DE PRECISÃO'}
                  </p>
                </div>
              </div>
              <div className="text-[11px] font-semibold text-gray-800">
                <span>{pdfConfig.website || 'www.preciza.com.br'}</span>
                {pdfConfig.phone && <span> &nbsp;•&nbsp; {pdfConfig.phone}</span>}
                {pdfConfig.email && <span> &nbsp;•&nbsp; {pdfConfig.email}</span>}
              </div>
              <div className="text-[10px] text-gray-700 mt-0.5">
                {pdfConfig.address} &nbsp;•&nbsp; {pdfConfig.cityState} {pdfConfig.cep && \`• CEP: \${pdfConfig.cep}\`}
              </div>
              <div className="flex justify-between items-center text-[10px] text-gray-700 mt-0.5 px-2">
                <span>CNPJ: {pdfConfig.cnpj}</span>
                <span>FONE: {pdfConfig.phone}</span>
                <span>{pdfConfig.versionCode || 'V.:Versão: 45791'}</span>
              </div>
            </div>

            {/* 2. BARRA DE TÍTULO DINÂMICA */}`;

if (staticHeaderRegex.test(content)) {
  content = content.replace(staticHeaderRegex, dynamicHeaderMarkup);
  fs.writeFileSync(printPath, content, 'utf8');
  console.log('✅ OrderPrintDialog.tsx updated to use dynamic configured PDF header!');
} else {
  console.log('❌ staticHeaderRegex did not match');
}
