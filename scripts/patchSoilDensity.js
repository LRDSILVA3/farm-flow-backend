const fs = require('fs');

const path = 'c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/SoilSamplingServiceForm.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add density badge calculation
// In lines around numPontos input
const targetBlock = `          <div>
            <Label htmlFor="ap-pontos">Número de Pontos de Amostragem:</Label>
            <Input
              id="ap-pontos"
              type="number" step="any"
              value={numPontos === null ? '' : numPontos}
              onChange={(e) => {
                const value = e.target.value;
                setNumPontos(value === '' ? null : parseInt(value));
              }}
              min="0"
              placeholder={'Sugerido: ' + (details?.numMinimoAnalises || 0)}
            />
          </div>`;

const replacementBlock = `          <div>
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="ap-pontos">Número de Pontos de Amostragem:</Label>
              {(() => {
                const currentHa = Number(((alqueires || 0) * 2.42).toFixed(2));
                const pts = numPontos || details?.numMinimoAnalises || 0;
                const density = currentHa > 0 && pts > 0 ? (currentHa / pts) : 0;
                return density > 0 ? (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {density.toFixed(2)} ha/ponto
                  </span>
                ) : null;
              })()}
            </div>
            <Input
              id="ap-pontos"
              type="number" step="any"
              value={numPontos === null ? '' : numPontos}
              onChange={(e) => {
                const value = e.target.value;
                setNumPontos(value === '' ? null : parseInt(value));
              }}
              min="0"
              placeholder={'Sugerido: ' + (details?.numMinimoAnalises || 0)}
            />
            {(() => {
              const currentHa = Number(((alqueires || 0) * 2.42).toFixed(2));
              const pts = numPontos || details?.numMinimoAnalises || 0;
              const density = currentHa > 0 && pts > 0 ? (currentHa / pts) : 0;
              return density > 0 ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Densidade da malha: <strong>{density.toFixed(2)} ha</strong> por ponto de amostragem.
                </p>
              ) : null;
            })()}
          </div>`;

if (content.includes(targetBlock)) {
  content = content.replace(targetBlock, replacementBlock);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully updated SoilSamplingServiceForm.tsx with real-time ha/ponto density!');
} else {
  console.error('Target block not found in SoilSamplingServiceForm.tsx');
}
