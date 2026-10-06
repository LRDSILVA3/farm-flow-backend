const fs = require('fs');

const code = `import React, { useState, useEffect, useMemo, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CityStateSelectProps {
  city: string;
  state: string;
  onCityChange: (city: string) => void;
  onStateChange: (state: string) => void;
  disabled?: boolean;
}

export const ESTADOS_BRASIL = [
  { uf: "AC", nome: "Acre" },
  { uf: "AL", nome: "Alagoas" },
  { uf: "AP", nome: "Amapá" },
  { uf: "AM", nome: "Amazonas" },
  { uf: "BA", nome: "Bahia" },
  { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" },
  { uf: "ES", nome: "Espírito Santo" },
  { uf: "GO", nome: "Goiás" },
  { uf: "MA", nome: "Maranhão" },
  { uf: "MT", nome: "Mato Grosso" },
  { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MG", nome: "Minas Gerais" },
  { uf: "PA", nome: "Pará" },
  { uf: "PB", nome: "Paraíba" },
  { uf: "PR", nome: "Paraná" },
  { uf: "PE", nome: "Pernambuco" },
  { uf: "PI", nome: "Piauí" },
  { uf: "RJ", nome: "Rio de Janeiro" },
  { uf: "RN", nome: "Rio Grande do Norte" },
  { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "RO", nome: "Rondônia" },
  { uf: "RR", nome: "Roraima" },
  { uf: "SC", nome: "Santa Catarina" },
  { uf: "SP", nome: "São Paulo" },
  { uf: "SE", nome: "Sergipe" },
  { uf: "TO", nome: "Tocantins" },
];

// Fallback cidades mais comuns para carregamento imediato
const CIDADES_PADRAO: Record<string, string[]> = {
  PR: ["Corbélia", "Cascavel", "Toledo", "Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Foz do Iguaçu", "Campo Mourão", "Umuarama", "Pato Branco", "Francisco Beltrão", "Guarapuava", "Medianeira", "Palotina"],
  MT: ["Cuiabá", "Rondonópolis", "Sinop", "Sorriso", "Lucas do Rio Verde", "Primavera do Leste", "Nova Mutum", "Tangará da Serra", "Campo Novo do Parecis", "Sapezal"],
  MS: ["Campo Grande", "Dourados", "Três Lagoas", "Maracaju", "São Gabriel do Oeste", "Chapadão do Sul", "Ponta Porã", "Naviraí", "Sidrolândia"],
  GO: ["Goiânia", "Rio Verde", "Jataí", "Anápolis", "Itumbiara", "Cristalina", "Catalão", "Formosa", "Luziânia", "Mineiros"],
  SP: ["São Paulo", "Ribeirão Preto", "Campinas", "Presidente Prudente", "São José do Rio Preto", "Piracicaba", "Bauru", "Assis", "Marília", "Araçatuba"],
  RS: ["Porto Alegre", "Passo Fundo", "Cruz Alta", "Santa Maria", "Pelotas", "Caxias do Sul", "Ijuí", "Erechim", "Santo Ângelo"],
  MG: ["Belo Horizonte", "Uberlândia", "Uberaba", "Patos de Minas", "Unaí", "Paracatu", "Montes Claros", "Poços de Caldas"],
  BA: ["Salvador", "Luís Eduardo Magalhães", "Barreiras", "Feira de Santana", "Vitória da Conquista"],
  SC: ["Florianópolis", "Chapecó", "Joinville", "Blumenau", "Criciúma", "Concórdia"]
};

// Cache de cidades do IBGE em memória para navegação instantânea
const ibgeCache: Record<string, string[]> = {};

export const CityStateSelect: React.FC<CityStateSelectProps> = ({
  city,
  state,
  onCityChange,
  onStateChange,
  disabled = false,
}) => {
  const [openState, setOpenState] = useState(false);
  const [openCity, setOpenCity] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [cityList, setCityList] = useState<string[]>(CIDADES_PADRAO[state] || []);
  const [loadingCities, setLoadingCities] = useState(false);

  // Carrega cidades do IBGE com cache dinâmico quando o estado muda
  useEffect(() => {
    if (!state) {
      setCityList([]);
      return;
    }

    if (ibgeCache[state]) {
      setCityList(ibgeCache[state]);
      return;
    }

    // Carrega do fallback primeiro para render imediato
    if (CIDADES_PADRAO[state]) {
      setCityList(CIDADES_PADRAO[state]);
    }

    setLoadingCities(true);
    fetch(\`https://servicodados.ibge.gov.br/api/v1/localidades/estados/\${state}/municipios\`)
      .then((res) => res.json())
      .then((data: Array<{ nome: string }>) => {
        if (Array.isArray(data) && data.length > 0) {
          const names = data.map((c) => c.nome).sort((a, b) => a.localeCompare(b, "pt-BR"));
          ibgeCache[state] = names;
          setCityList(names);
        }
      })
      .catch((err) => {
        console.warn("Erro ao buscar cidades do IBGE, usando lista padrão:", err);
      })
      .finally(() => {
        setLoadingCities(false);
      });
  }, [state]);

  const filteredStates = useMemo(() => {
    const q = stateSearch.toLowerCase().trim();
    if (!q) return ESTADOS_BRASIL;
    return ESTADOS_BRASIL.filter(
      (e) => e.uf.toLowerCase().includes(q) || e.nome.toLowerCase().includes(q)
    );
  }, [stateSearch]);

  const filteredCities = useMemo(() => {
    const q = citySearch.toLowerCase().trim();
    if (!q) return cityList.slice(0, 100);
    return cityList.filter((c) => c.toLowerCase().includes(q)).slice(0, 100);
  }, [cityList, citySearch]);

  const currentStateLabel = useMemo(() => {
    const found = ESTADOS_BRASIL.find((e) => e.uf === state);
    return found ? \`\${found.uf} - \${found.nome}\` : "Selecione o Estado";
  }, [state]);

  return (
    <>
      {/* Seletor de Estado */}
      <div className="space-y-1.5">
        <Label htmlFor="stateSelect">Estado (UF)</Label>
        <Popover open={openState} onOpenChange={setOpenState}>
          <PopoverTrigger asChild>
            <Button
              id="stateSelect"
              variant="outline"
              role="combobox"
              aria-expanded={openState}
              disabled={disabled}
              className="w-full justify-between font-normal bg-background"
            >
              <span className="truncate">{state ? currentStateLabel : "Selecione o Estado..."}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-2" align="start">
            <div className="flex items-center border-b px-2 pb-2 mb-2">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                placeholder="Buscar estado..."
                value={stateSearch}
                onChange={(e) => setStateSearch(e.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {filteredStates.length === 0 ? (
                <div className="p-2 text-xs text-muted-foreground text-center">Nenhum estado encontrado.</div>
              ) : (
                filteredStates.map((item) => (
                  <button
                    key={item.uf}
                    type="button"
                    onClick={() => {
                      onStateChange(item.uf);
                      setOpenState(false);
                      setStateSearch("");
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground text-left transition-colors",
                      state === item.uf && "bg-accent font-medium text-accent-foreground"
                    )}
                  >
                    <span>
                      <strong className="mr-1.5">{item.uf}</strong>
                      <span className="text-muted-foreground text-xs">{item.nome}</span>
                    </span>
                    {state === item.uf && <Check className="h-4 w-4 text-green-600" />}
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Seletor de Cidade com Busca e Input Livre */}
      <div className="space-y-1.5">
        <Label htmlFor="citySelect">Cidade</Label>
        <Popover open={openCity} onOpenChange={setOpenCity}>
          <PopoverTrigger asChild>
            <Button
              id="citySelect"
              variant="outline"
              role="combobox"
              aria-expanded={openCity}
              disabled={disabled || !state}
              className="w-full justify-between font-normal bg-background"
            >
              <span className="truncate">
                {city || (state ? (loadingCities ? "Carregando municípios..." : "Selecione ou digite a cidade...") : "Escolha o estado primeiro")}
              </span>
              {loadingCities ? (
                <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
              ) : (
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-2" align="start">
            <div className="flex items-center border-b px-2 pb-2 mb-2">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                placeholder="Buscar ou digitar cidade..."
                value={citySearch}
                onChange={(e) => {
                  setCitySearch(e.target.value);
                  onCityChange(e.target.value);
                }}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {citySearch && !cityList.some(c => c.toLowerCase() === citySearch.toLowerCase()) && (
                <button
                  type="button"
                  onClick={() => {
                    onCityChange(citySearch);
                    setOpenCity(false);
                    setCitySearch("");
                  }}
                  className="w-full flex items-center px-2 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded text-left font-medium border-b border-dashed mb-1"
                >
                  Usar cidade digitada: &ldquo;{citySearch}&rdquo;
                </button>
              )}
              {filteredCities.length === 0 ? (
                <div className="p-2 text-xs text-muted-foreground text-center">
                  Nenhuma sugestão encontrada. Digite o nome acima para usar.
                </div>
              ) : (
                filteredCities.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      onCityChange(item);
                      setOpenCity(false);
                      setCitySearch("");
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground text-left transition-colors",
                      city === item && "bg-accent font-medium text-accent-foreground"
                    )}
                  >
                    <span>{item}</span>
                    {city === item && <Check className="h-4 w-4 text-green-600" />}
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
};
`;

const target = 'c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/farms/CityStateSelect.tsx';
fs.writeFileSync(target, code, 'utf8');
console.log('Successfully updated CityStateSelect.tsx with all 27 UFs and searchable Combobox!');
