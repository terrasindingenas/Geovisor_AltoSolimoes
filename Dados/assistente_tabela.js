/* Assistente de Dados Territoriais — tabela combinada. Sem API e sem dependências. */
(() => {
  'use strict';
  const dados = [
    { nome: 'Terra Indígena Kokama do Baixo Içá', apelidos: ['baixo ica'], grupo: 'demarcacao', area: 111152.43, aldeias: 9, pessoas: 580, familias: null },
    { nome: 'Terra Indígena Kokama Wikakanaka', apelidos: ['wikakanaka', 'wikanakana'], grupo: 'demarcacao', area: 112083.14, aldeias: 20, pessoas: null, familias: null },
    { nome: 'Terra Indígena Kokama Uyarika – Médio Içá', apelidos: ['uyarika', 'medio ica'], grupo: 'demarcacao', area: 212301.39, aldeias: 15, pessoas: 455, familias: null },
    { nome: 'Área Proposta Amaturá', apelidos: ['amatura'], grupo: 'proposta', area: 159861.72, aldeias: 9, pessoas: null, familias: 54 },
    { nome: 'Área Proposta Tonantins', apelidos: ['tonantins'], grupo: 'proposta', area: 52424.29, aldeias: 8, pessoas: null, familias: 300 }
  ];
  const normalizar = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const fmt = (n, casas = 0) => n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
  const soma = (arr, campo) => arr.reduce((acc, d) => acc + (d[campo] ?? 0), 0);
  const demarcacao = dados.filter(d => d.grupo === 'demarcacao');
  const propostas = dados.filter(d => d.grupo === 'proposta');
  const nomeCurto = d => d.nome;
  const dica = 'Você pode perguntar sobre área, aldeias, população registrada, famílias, maior/menor território ou percentuais. Ex.: "Quantas aldeias existem no Baixo Içá?"';
  function responder(pergunta) {
    const q = normalizar(pergunta);
    if (!q) return 'Digite uma pergunta sobre a tabela.';
    const menciona = d => d.apelidos.some(a => q.includes(a));
    const selecionados = dados.filter(menciona);
    const pedeGrupoDem = /demarcacao|demarcadas|em demarcacao|terras indigenas|territorios kokama/.test(q);
    const pedeGrupoProp = /propost/.test(q);
    let conjunto = selecionados.length ? selecionados : (pedeGrupoDem && !pedeGrupoProp ? demarcacao : pedeGrupoProp && !pedeGrupoDem ? propostas : dados);
    const escopo = selecionados.length ? selecionados.map(nomeCurto).join(' e ') : (conjunto === demarcacao ? 'terras indígenas em demarcação' : conjunto === propostas ? 'áreas propostas de Amaturá e Tonantins' : 'cinco territórios da tabela');
    const tem = (...palavras) => palavras.some(p => q.includes(p));
    const querArea = tem('area', 'hectare', 'hectares', 'ha ', 'extensao', 'tamanho', 'superficie');
    const querAldeias = tem('aldeia', 'aldeias', 'comunidade', 'comunidades');
    const querPessoas = tem('populacao', 'habitantes', 'pessoas', 'moradores');
    const querFamilias = tem('familia', 'familias');
    const maior = /maior|mais (aldeias|populacao|pessoas|familias|area)|maxim/.test(q);
    const menor = /menor|menos (aldeias|populacao|pessoas|familias|area)|minim/.test(q);
    const percentual = /porcent|percent|proporcao|representa|participacao/.test(q);
    const listar = /liste|listar|quais|relacao|nomes|mostrar|mostre/.test(q);
    const comparar = /compar|diferenca|versus| vs /.test(q);
    const campo = querArea ? 'area' : querAldeias ? 'aldeias' : querFamilias ? 'familias' : querPessoas ? 'pessoas' : null;
    const unidade = campo === 'area' ? 'ha' : campo === 'aldeias' ? 'aldeias' : campo === 'familias' ? 'famílias' : 'pessoas';
    const valor = (d, f) => fmt(d[f], f === 'area' ? 2 : 0);
    if (tem('ajuda', 'exemplo', 'perguntar', 'como funciona')) return dica;
    if (tem('quantos territorios', 'quantas terras', 'numero de territorios')) return `A tabela contém 5 territórios: 3 terras indígenas em demarcação e 2 áreas propostas.`;
    if (!campo && !listar) return `Não consegui identificar o indicador solicitado. ${dica}`;
    if (!campo && listar) return `Territórios da tabela: ${conjunto.map(nomeCurto).join('; ')}.`;
    const validos = conjunto.filter(d => d[campo] !== null);
    if (!validos.length) return `A tabela não informa ${unidade} para ${escopo}.`;
    if (comparar && selecionados.length === 2) {
      if (selecionados.some(d => d[campo] === null)) return `Não é possível comparar ${unidade}: falta informação para um dos territórios.`;
      const [a, b] = selecionados;
      const dif = Math.abs(a[campo] - b[campo]);
      return `${a.nome}: ${valor(a, campo)} ${unidade}. ${b.nome}: ${valor(b, campo)} ${unidade}. Diferença: ${fmt(dif, campo === 'area' ? 2 : 0)} ${unidade}.`;
    }
    if (maior || menor) {
      const ordem = [...validos].sort((a,b) => maior ? b[campo] - a[campo] : a[campo] - b[campo]);
      const d = ordem[0];
      return `${maior ? 'Maior' : 'Menor'} valor de ${unidade} entre ${escopo}: ${d.nome}, com ${valor(d, campo)} ${unidade}.${validos.length !== conjunto.length ? ' Foram considerados apenas os registros com dados disponíveis.' : ''}`;
    }
    if (percentual) {
      if (selecionados.length !== 1) return 'Para calcular uma porcentagem, indique um território. Ex.: "Qual percentual da área total representa o Baixo Içá?"';
      if (selecionados[0][campo] === null) return `Não há informação de ${unidade} para ${selecionados[0].nome}.`;
      const base = soma(dados, campo);
      if (!base) return 'Não há dados suficientes para calcular esse percentual.';
      const porcentagem = selecionados[0][campo] / base * 100;
      return `${selecionados[0].nome} representa ${fmt(porcentagem, 2)}% do total de ${unidade} registrado na tabela.${campo === 'pessoas' || campo === 'familias' ? ' Atenção: o total considera somente os registros que informam esse indicador.' : ''}`;
    }
    if (listar && !selecionados.length && !pedeGrupoDem && !pedeGrupoProp) {
      return dados.map(d => `${d.nome}: ${d[campo] === null ? 'não informado' : valor(d, campo) + ' ' + unidade}`).join('\n');
    }
    const total = soma(conjunto, campo);
    if (campo === 'pessoas') {
      const falta = conjunto.filter(d => d.pessoas === null);
      return `População registrada em ${escopo}: ${fmt(total)} pessoas.${falta.length ? ` Total parcial: não há informação de população para ${falta.map(nomeCurto).join(', ')}. Não representa a população total desses territórios.` : ''}`;
    }
    if (campo === 'familias') {
      const falta = conjunto.filter(d => d.familias === null);
      if (!validos.length) return `A tabela não informa o número de famílias para ${escopo}.`;
      return `Número de famílias registrado em ${escopo}: ${fmt(total)} famílias.${falta.length ? ` Dado parcial: não há número de famílias para ${falta.map(nomeCurto).join(', ')}.` : ''}`;
    }
    return `${campo === 'area' ? 'Área' : 'Número de aldeias'} de ${escopo}: ${fmt(total, campo === 'area' ? 2 : 0)} ${unidade}.`;
  }
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) { console.warn('Assistente: elemento .sidebar não encontrado.'); return; }
  const estilo = document.createElement('style');
  estilo.textContent = `
    .assistente-territorial{box-sizing:border-box;width:100%;padding:13px;margin:12px 0 18px;background:#f7f8f2;border:1px solid #b9c9be;border-radius:10px;color:#243d32;font:13px/1.45 Arial,sans-serif}
    .assistente-territorial *{box-sizing:border-box}
    .assistente-territorial h3{font-size:15px;margin:0 0 5px;color:#23483b}
    .assistente-territorial p{margin:0 0 9px;font-size:12px}
    .assistente-territorial textarea{width:100%;min-height:64px;resize:vertical;border:1px solid #a5b8aa;border-radius:6px;padding:8px;background:#fff;color:#182e25;font:13px Arial,sans-serif}
    .assistente-territorial button{background:#23483b;color:#fff;border:0;border-radius:6px;padding:8px 12px;margin-top:7px;cursor:pointer;font-weight:600}
    .assistente-territorial button:hover{background:#31654f}
    .assistente-territorial .resposta{white-space:pre-line;margin-top:10px;padding:10px;background:#fff;border-left:3px solid #348c78;border-radius:4px;font-size:12px;overflow-wrap:anywhere}
    .assistente-territorial .sugestoes{display:flex;gap:5px;flex-wrap:wrap;margin-top:9px}
    .assistente-territorial .sugestoes button{background:#e4ece5;color:#23483b;border:1px solid #c5d7c8;font-size:11px;padding:5px 7px;margin:0;text-align:left}
  `;
  document.head.appendChild(estilo);
  const bloco = document.createElement('section');
  bloco.className = 'assistente-territorial';
  bloco.setAttribute('aria-label', 'Assistente de Dados Territoriais');
  bloco.innerHTML = `<h3>Assistente de Dados Territoriais</h3><p>Faça perguntas sobre as 5 áreas da tabela combinada.</p><form><textarea aria-label="Sua pergunta" placeholder="Ex.: Quantas aldeias existem no total?"></textarea><button type="submit">Perguntar</button></form><div class="sugestoes"></div><div class="resposta" role="status" aria-live="polite">Consulte área, aldeias, população registrada e famílias.</div>`;
  const sugestoes = ['Qual é a área total?', 'Quantas aldeias existem?', 'Qual é a maior área?', 'Qual é a população registrada?', 'Quantas famílias existem nas áreas propostas?'];
  const input = bloco.querySelector('textarea');
  const resposta = bloco.querySelector('.resposta');
  const executar = () => { resposta.textContent = responder(input.value); };
  bloco.querySelector('form').addEventListener('submit', e => { e.preventDefault(); executar(); });
  sugestoes.forEach(s => { const b = document.createElement('button'); b.type = 'button'; b.textContent = s; b.addEventListener('click', () => { input.value = s; executar(); }); bloco.querySelector('.sugestoes').appendChild(b); });
  const titulo = sidebar.querySelector('h2');
  if (titulo) titulo.insertAdjacentElement('afterend', bloco); else sidebar.prepend(bloco);
})();
