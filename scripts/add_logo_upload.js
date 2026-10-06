const fs = require('fs');
const path = require('path');

const tabPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/settings/PdfHeaderTab.tsx');
let content = fs.readFileSync(tabPath, 'utf8');

// Adicionar função de upload de arquivo de imagem
const uploadInputMarkup = `<div>
                <Label htmlFor="logoUrl">Logotipo da Empresa</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="logoUrl"
                    value={config.logoUrl || ""}
                    onChange={(e) => handleChange("logoUrl", e.target.value)}
                    placeholder="URL ou selecione uma imagem do seu computador"
                    className="flex-1"
                  />
                  <label className="cursor-pointer inline-flex items-center justify-center px-3 py-2 text-xs font-medium border rounded-md shadow-sm bg-muted hover:bg-muted/80 shrink-0">
                    <span>Selecionar Arquivo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const base64 = event.target?.result as string;
                            if (base64) {
                              handleChange("logoUrl", base64);
                              toast({
                                title: "Imagem carregada!",
                                description: "O logotipo foi incorporado ao cabeçalho com sucesso."
                              });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  {config.logoUrl && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleChange("logoUrl", "")}
                      className="text-xs text-red-500 hover:text-red-700 h-9"
                    >
                      Remover
                    </Button>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  Formatos aceitos: PNG, JPG ou SVG. A imagem é incorporada e funciona mesmo sem internet.
                </span>
              </div>`;

const oldLogoBlockRegex = /<div>\s*<Label htmlFor="logoUrl">URL do Logotipo \(Opcional\)<\/Label>[\s\S]*?placeholder="https:\/\/exemplo\.com\/logo\.png"\s*\/>\s*<\/div>/;

if (oldLogoBlockRegex.test(content)) {
  content = content.replace(oldLogoBlockRegex, uploadInputMarkup);
  fs.writeFileSync(tabPath, content, 'utf8');
  console.log('✅ PdfHeaderTab.tsx updated with direct file upload and Base64 embedding!');
} else {
  console.log('❌ oldLogoBlockRegex did not match');
}
