const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/orders/ATVServiceForm.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace hardcoded 160 Km
content = content.replace(
  'Carregamento ({diasServico} diária(s) Pá Carregadeira + Prancha 160 Km):',
  'Carregamento ({diasServico} diária(s) Pá Carregadeira + Prancha {(distanciaIdaKm || 0) * 4} Km desloc.):'
);

const target = `            {details.jurosFactor > 1 && (
              <div className="flex justify-between text-muted-foreground pt-1">
                <span>Fator de juros até vencimento (1,5%/mês):</span>
                <span>{details.jurosFactor.toFixed(4)}x</span>
              </div>
            )}`;

const addition = `            {details.jurosFactor > 1 && (
              <div className="flex justify-between text-muted-foreground pt-1">
                <span>Fator de juros até vencimento (1,5%/mês):</span>
                <span>{details.jurosFactor.toFixed(4)}x</span>
              </div>
            )}

            {calculationResult?.descontoNF && calculationResult.descontoNF > 0 ? (
              <div className="flex justify-between text-destructive py-1 border-b">
                <span>Desconto sem Nota Fiscal (4%):</span>
                <span>-{atvService.formatCurrency(calculationResult.descontoNF)}</span>
              </div>
            ) : null}

            {((calculationResult?.subtotalFrete || 0) > 0 || (calculationResult?.adicionalDeslocamento || 0) > 0) && (
              <div className="flex justify-between py-1 border-b">
                <span>Frete ({calculationResult?.totalToneladas} TON / {calculationResult?.totalCargas} Cargas):</span>
                <span>{atvService.formatCurrency((calculationResult?.subtotalFrete || 0) + (calculationResult?.adicionalDeslocamento || 0))}</span>
              </div>
            )}

            <div className="pt-2 text-muted-foreground flex flex-col sm:flex-row sm:justify-between gap-1 text-[11px] font-mono border-t">
              <span>
                {calculationResult?.totalAreaAlq.toFixed(1)}Alq/{calculationResult?.totalToneladas.toFixed(0)}Ton (R$/Alq = {precoPorAlqueire.toFixed(2)} - R$/CARGA = {precoPorCarga.toFixed(1)})
              </span>
              <span className="font-semibold">R$ {precoPorTonelada.toFixed(2)}/Ton</span>
            </div>

            <div className="pt-1 text-[11px] text-muted-foreground italic">
              OBS: Cliente {clienteAlmoco ? 'providencia almoço' : 'NÃO providencia almoço'} // Mapa origem {mapaPreciza ? 'Preciza' : 'NÃO Preciza'}
            </div>`;

if (content.includes(target)) {
  content = content.replace(target, addition);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully enhanced ATVServiceForm.tsx');
} else {
  console.log('Target string not found in ATVServiceForm.tsx');
}
