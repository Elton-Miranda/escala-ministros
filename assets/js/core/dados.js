// Carrega os dados publicados (data/dados.json).
// O arquivo é público: ele fica no GitHub Pages junto com o site. Por isso NÃO guardamos telefones nele.

export const CAMINHO_DADOS = 'data/dados.json';

export async function carregarDados() {
  const r = await fetch(`${CAMINHO_DADOS}?v=${Date.now()}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`Não foi possível abrir ${CAMINHO_DADOS} (erro ${r.status}).`);
  return r.json();
}
