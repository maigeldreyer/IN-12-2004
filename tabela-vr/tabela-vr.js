// Tabela VR - cálculo (aba "Corte")
// Mesma lógica da planilha do Google, com duas correções pedidas:
//   1. No texto dos níveis de garantia, valores abaixo de 10 g/kg convertidos para mg/kg saem com a unidade "mg".
//   2. Para "Suplemento mineral", a classificação também exige fósforo de 40 g/kg ou mais.
// As linhas da planilha (C2, N31, P67...) estão indicadas nos comentários para facilitar a conferência.

(function (global) {
  'use strict';

  // ---------------------------------------------------------------------------
  // Campos de entrada (coluna C da planilha)
  // ---------------------------------------------------------------------------
  var GRUPOS = [
    { titulo: 'Proteína e energia', campos: [
      { linha: 2, nome: 'Proteína bruta', unidade: 'g/kg' },
      { linha: 3, nome: 'NNP', unidade: 'g/kg' },
      { linha: 4, nome: 'NDT', unidade: 'g/kg' }
    ] },
    { titulo: 'Macrominerais', campos: [
      { linha: 5, nome: 'Cálcio (mín)', unidade: 'g/kg' },
      { linha: 6, nome: 'Cálcio (máx)', unidade: 'g/kg' },
      { linha: 7, nome: 'Fósforo', unidade: 'g/kg' },
      { linha: 8, nome: 'Sódio', unidade: 'g/kg' },
      { linha: 9, nome: 'Magnésio', unidade: 'g/kg' },
      { linha: 10, nome: 'Enxofre', unidade: 'g/kg' },
      { linha: 11, nome: 'Potássio', unidade: 'g/kg' }
    ] },
    { titulo: 'Microminerais', campos: [
      { linha: 12, nome: 'Cobalto', unidade: 'mg/kg' },
      { linha: 13, nome: 'Cobre', unidade: 'mg/kg' },
      { linha: 14, nome: 'Iodo', unidade: 'mg/kg' },
      { linha: 15, nome: 'Manganês', unidade: 'mg/kg' },
      { linha: 16, nome: 'Selênio', unidade: 'mg/kg' },
      { linha: 17, nome: 'Zinco', unidade: 'mg/kg' },
      { linha: 18, nome: 'Ferro', unidade: 'mg/kg' }
    ] },
    { titulo: 'Vitaminas', campos: [
      { linha: 19, nome: 'Vitamina A', unidade: 'UI/kg' },
      { linha: 20, nome: 'Vitamina D', unidade: 'UI/kg' },
      { linha: 21, nome: 'Vitamina E', unidade: 'UI/kg' }
    ] },
    { titulo: 'Aditivos', campos: [
      { linha: 22, nome: 'Monensina', unidade: 'mg/kg' },
      { linha: 23, nome: 'Salinomicina', unidade: 'mg/kg' },
      { linha: 24, nome: 'Narasina', unidade: 'mg/kg' },
      { linha: 25, nome: 'Flavomicina', unidade: 'mg/kg' }
    ] },
    { titulo: 'Consumo', campos: [
      { linha: 26, nome: 'Valor mínimo da faixa de consumo', unidade: 'g/100kg pv' }
    ] }
  ];

  // Exemplo que está hoje na planilha.
  var EXEMPLO = {
    nome: 'Alvoradaphos 40 Up Águas',
    c: { 2: 120, 3: 115, 4: 80, 5: 190, 6: 210, 7: 40, 8: 70, 9: 6, 10: 8, 12: 30, 13: 600, 14: 27.5,
         15: 750, 16: 11.2, 17: 1800, 25: 70, 26: 31.75 }
  };

  // Faixas de consumo de referência (A28:C39).
  var FAIXAS_PRODUTOS = [
    ['Sal mineral', '25'], ['Adensado', '50'], ['Proteinado', '100'], ['Energético', '300 - 500']
  ];
  var FAIXAS_ADITIVOS = [
    ['Monensina (confinamento)', '100', '300'], ['Salinomicina', '100', '120'],
    ['Narasina', '', ''], ['Flavomicina', '10', '20']
  ];

  var CATEGORIAS = [
    'Suplemento mineral para bovinos de corte',
    'Suplemento mineral com ureia para bovinos de corte',
    'Suplemento mineral proteico para bovinos de corte',
    'Suplemento mineral proteico energético para bovinos de corte',
    'Produto em desacordo com a IN 12/2004. Consulte o inciso III do item 3.1.'
  ];

  // Teores mínimos/máximos por categoria (G2:J19). null = célula vazia.
  var MINIMOS = {
    nomes: ['Proteína bruta (%)', 'NNP:Proteína bruta (máx)', 'NNP Equiv. Proteico (%)', 'Proteína bruta (g/100kg pv)',
            'NDT (g/100kg pv)', 'Relação Ca:P (mín)', 'Relação Ca:P (máx)', 'Fósforo (g)', 'Magnésio (g)',
            'Cobalto (mg)', 'Cobre (mg)', 'Iodo (mg)', 'Manganês (mg)', 'Selênio (mg)', 'Zinco (mg)',
            'Vitamina A (UI)', 'Vitamina D (UI)', 'Vitamina E (UI)'],
    colunas: [
      [null, null, null, null, null, 1, 7, 40, 5, 15, 400, 30, 500, 5, 2000, 100000, 10000, 1000],
      [null, null, 42, null, null, 1, 7, 0.6, 0.1, 0.2, 6, 0.5, 7.8, 0.1, 31.1, 1500, 150, 15],
      [20, 85, null, 30, null, 1, 7, 0.6, 0.1, 0.2, 6, 0.5, 7.8, 0.1, 31.1, 1500, 150, 15],
      [20, 85, null, 30, 100, 1, 7, 0.6, 0.1, 0.2, 6, 0.5, 7.8, 0.1, 31.1, 1500, 150, 15]
    ],
    // Formato do teor mínimo (N67:N84)
    formatos: ['0.0', '0.0', '0.0', '0.0', '0.0', '0.0', '0.0', '0.0', '0.0', '0.0', '0.0', '0.0', '0.0', '0.0', '0.0',
               '#,##0', '#,##0', 'General']
  };

  var PARECER = 'Para suplementos que apresentam níveis dos nutrientes menores do que os constantes nas Tabelas 1 e 2 do Anexo II da IN 12/2004, deverá ser comprovada a eficácia dos novos teores propostos por meio de publicações científicas, nacionais ou internacionais, ou por experimentações próprias.';

  // ---------------------------------------------------------------------------
  // Valores especiais: null = célula vazia; ERRO = divisão por zero (#DIV/0! na planilha)
  // ---------------------------------------------------------------------------
  var ERRO = { erro: '#DIV/0!' };
  function eErro(x) { return x === ERRO; }
  function n0(x) { return (x === null || x === undefined) ? 0 : x; } // vazio vale 0 nas contas
  function div(a, b) {
    if (eErro(a) || eErro(b)) return ERRO;
    return n0(b) === 0 ? ERRO : n0(a) / n0(b);
  }
  function mul(a, b) {
    if (eErro(a) || eErro(b)) return ERRO;
    return n0(a) * n0(b);
  }

  // ---------------------------------------------------------------------------
  // Formatação de números no padrão brasileiro, como o Google Planilhas exibe
  // ---------------------------------------------------------------------------
  function arredondar(n, casas) {
    var sinal = n < 0 ? -1 : 1;
    var r = Math.round(Number(Math.abs(n) + 'e' + casas));
    return sinal * Number(r + 'e-' + casas);
  }
  function milhares(inteiro) {
    return inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function fixo(n, casas, comMilhar) {
    var s = arredondar(n, casas).toFixed(casas);
    var neg = s.charAt(0) === '-';
    if (neg) s = s.slice(1);
    var partes = s.split('.');
    var inteiro = comMilhar ? milhares(partes[0]) : partes[0];
    var res = inteiro + (partes[1] ? ',' + partes[1] : '');
    if (neg && Number(s) !== 0) res = '-' + res;
    return res;
  }
  // Número "Geral" (sem formato definido): até 10 algarismos significativos, sem zeros à direita.
  function geral(n) {
    var v = Number(n.toPrecision(10));
    var s = String(v);
    if (/e/.test(s)) s = v.toFixed(12).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('.', ',');
  }
  // Número dentro de texto (CONCATENATE): até 15 algarismos significativos.
  function numTexto(n) {
    var v = Number(n.toPrecision(15));
    var s = String(v);
    if (/e/.test(s)) s = v.toFixed(15).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('.', ',');
  }
  function formatar(valor, formato) {
    if (valor === null || valor === undefined) return '';
    if (eErro(valor)) return '#DIV/0!';
    if (typeof valor === 'string') return valor;
    switch (formato) {
      case '0.0': return fixo(valor, 1, false);
      case '0.00': return fixo(valor, 2, false);
      case '0.0%': return fixo(valor * 100, 1, false) + '%';
      case '#,##0': return fixo(valor, 0, true);
      default: return geral(valor);
    }
  }

  // Lê um número digitado no padrão brasileiro ("27,5", "1.500", "100.000") ou com ponto decimal ("27.5").
  // Devolve null para campo vazio e NaN para texto inválido.
  function lerNumero(texto) {
    var t = String(texto === undefined || texto === null ? '' : texto).trim().replace(/\s+/g, '');
    if (!t) return null;
    if (t.indexOf(',') >= 0) {
      t = t.replace(/\./g, '').replace(',', '.');
    } else if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
      t = t.replace(/\./g, '');
    }
    if (!/^\d*\.?\d+$|^\d+\.$/.test(t)) return NaN;
    return Number(t);
  }

  // ---------------------------------------------------------------------------
  // Cálculo
  // ---------------------------------------------------------------------------
  // e = { nome: 'texto', c: { 2: número|null, ..., 26: número|null } }
  function calcular(e) {
    var C = {};
    for (var i = 2; i <= 26; i++) {
      var v = e.c ? e.c[i] : null;
      C[i] = (v === undefined || v === '' || (typeof v === 'number' && isNaN(v))) ? null : v;
    }
    function c(i) { return n0(C[i]); }
    function pos(i) { return c(i) > 0; }

    // --- Texto dos níveis de garantia (coluna D e A41) ---
    function simples(linha, rotulo, meio, unidade) { // D2-D6, D12-D25
      return pos(linha) ? rotulo + meio + numTexto(c(linha)) + ' ' + unidade + ', ' : '';
    }
    function macro(linha, rotulo) { // D7-D11, com a correção de unidade
      if (!pos(linha)) return '';
      var v = c(linha);
      return v < 10 ? rotulo + ' (mín) ' + numTexto(v * 1000) + ' mg, ' : rotulo + ' (mín) ' + numTexto(v) + ' g, ';
    }
    var D = {};
    D[2] = simples(2, 'Proteína bruta', ' (mín) ', 'g');
    D[3] = simples(3, 'NNP', ' equivalente proteico (mín) ', 'g');
    D[4] = simples(4, 'NDT', ' (mín) ', 'g');
    D[5] = simples(5, 'Cálcio (mín)', ' ', 'g');
    D[6] = simples(6, 'Cálcio (máx)', ' ', 'g');
    D[7] = macro(7, 'Fósforo');
    D[8] = macro(8, 'Sódio');
    D[9] = pos(9) ? macro(9, 'Magnésio') : 'Magnésio (min) 1.000 mg, ';
    D[10] = macro(10, 'Enxofre');
    D[11] = macro(11, 'Potássio');
    D[12] = simples(12, 'Cobalto', ' (mín) ', 'mg');
    D[13] = simples(13, 'Cobre', ' (mín) ', 'mg');
    D[14] = simples(14, 'Iodo', ' (mín) ', 'mg');
    D[15] = simples(15, 'Manganês', ' (mín) ', 'mg');
    D[16] = simples(16, 'Selênio', ' (mín) ', 'mg');
    D[17] = simples(17, 'Zinco', ' (mín) ', 'mg');
    D[18] = simples(18, 'Ferro', ' (mín) ', 'mg');
    D[19] = simples(19, 'Vitamina A', ' (mín) ', 'UI');
    D[20] = simples(20, 'Vitamina D', ' (mín) ', 'UI');
    D[21] = simples(21, 'Vitamina E', ' (mín) ', 'UI');
    D[22] = simples(22, 'Monensina', ' ', 'mg');
    D[23] = simples(23, 'Salinomicina', ' ', 'mg');
    D[24] = simples(24, 'Narasina', ' ', 'mg');
    D[25] = simples(25, 'Flavomicina', ' ', 'mg');
    var fluor = c(7) * 10; // N40
    var textoGarantia = D[4] + D[2] + D[3] + D[5] + D[6] + D[7] + ' Flúor (máx) ' + numTexto(fluor) + ' mg, ' +
      D[8] + D[9] + D[10] + D[11] + D[17] + D[15] + D[18] + D[13] + D[12] + D[14] + D[16] +
      D[19] + D[20] + D[21] + D[22] + D[23] + D[24] + D[25];

    // --- Premissas (N31:N40) ---
    var caP = pos(7) ? ((c(5) + c(6)) / 2) / c(7) : 0;   // N31
    var nacl = c(8) / 395.5;                             // N32
    var pb = c(2) / 1000;                                // N33
    var pbFornecida = c(2) * (c(26) / 1000);             // N34
    var ndtFornecido = c(4) * (c(26) / 1000);            // N35
    var nnp = c(3) / 1000;                               // N36
    var nnpPb = pos(2) ? nnp / pb : 'Não se aplica.';    // N37
    var ns = pos(3) ? div(c(3) / 6.25, C[10]) : 'Não se aplica.'; // N38

    var premissas = [
      { nome: 'Relação Ca:P', valor: caP, formato: '0.00', alerta: caP < 1 || caP > 7,
        regra: 'Suplementos devem ter relação Ca:P entre 1 e 7.' },
      { nome: 'Inclusão de cloreto de sódio', valor: nacl, formato: '0.0%', alerta: nacl > 0.6,
        regra: 'Suplementos de pronto uso devem ter no máximo 60% de cloreto de sódio.' },
      { nome: 'Proteína bruta', valor: pb, formato: '0.0%', alerta: false, regra: '' },
      { nome: 'Proteína bruta fornecida', valor: pbFornecida, formato: 'General', alerta: false, regra: 'g/100kg pv' },
      { nome: 'NDT fornecido', valor: ndtFornecido, formato: 'General', alerta: false, regra: 'g/100kg pv' },
      { nome: 'NNP', valor: nnp, formato: '0.0%', alerta: false, regra: '' },
      { nome: 'Relação NNP:Proteína bruta', valor: nnpPb, formato: '0.0%',
        alerta: typeof nnpPb === 'number' && nnpPb > 0.85,
        regra: 'Suplementos proteicos e proteicos energéticos devem ter no máximo 85% da proteína proveniente de NNP.' },
      { nome: 'Relação N:S', valor: ns, formato: '0.0', alerta: typeof ns === 'number' && ns > 10,
        regra: 'Suplementos com NNP devem ter relação máxima de N:S igual a 10.' },
      { nome: 'Consumo do produto', valor: C[26], formato: 'General', alerta: false,
        regra: 'g/100kg pv. Informado pelo usuário.' },
      { nome: 'Flúor (máx) mg/kg', valor: fluor, formato: 'General', alerta: false,
        regra: 'Suplementos devem ter nível máximo de Flúor de 2.000 mg/kg.' }
    ];

    // --- Critérios de classificação (R42:R54) ---
    var R = {
      42: c(7) >= 40, 43: nnp < 0.42, 44: pb <= 0, 45: ndtFornecido <= 0,
      46: nnp >= 0.42, 47: pb <= 0, 48: ndtFornecido <= 0,
      49: pb >= 0.2, 50: pbFornecida >= 30, 51: ndtFornecido < 100,
      52: pb >= 0.2, 53: pbFornecida >= 30, 54: ndtFornecido >= 100
    };
    var criterios = [
      { grupo: 'Mineral', texto: 'O produto tem 40 g ou mais de fósforo por kg.', valor: R[42] },
      { grupo: 'Mineral', texto: 'O produto tem menos de 42% de NNP.', valor: R[43] },
      { grupo: 'Mineral', texto: 'O produto não tem proteína verdadeira.', valor: R[44] },
      { grupo: 'Mineral', texto: 'O produto não tem NDT.', valor: R[45] },
      { grupo: 'Mineral com ureia', texto: 'O produto tem 42% ou mais de NNP.', valor: R[46] },
      { grupo: 'Mineral com ureia', texto: 'O produto não tem proteína verdadeira.', valor: R[47] },
      { grupo: 'Mineral com ureia', texto: 'O produto não tem NDT.', valor: R[48] },
      { grupo: 'Proteico', texto: 'O produto tem 20% ou mais de proteína bruta.', valor: R[49] },
      { grupo: 'Proteico', texto: 'O produto fornece 30g de proteína bruta ou mais para cada 100kg de peso vivo.', valor: R[50] },
      { grupo: 'Proteico', texto: 'O produto fornece menos de 100g de NDT para cada 100kg de peso vivo.', valor: R[51] },
      { grupo: 'Proteico Energético', texto: 'O produto tem 20% ou mais de proteína bruta.', valor: R[52] },
      { grupo: 'Proteico Energético', texto: 'O produto fornece 30g de proteína bruta ou mais para cada 100kg de peso vivo.', valor: R[53] },
      { grupo: 'Proteico Energético', texto: 'O produto fornece 100g ou mais de NDT para cada 100kg de peso vivo.', valor: R[54] }
    ];
    var soma = 0;
    for (var s = 2; s <= 21; s++) soma += c(s);
    var categorias = [
      R[42] && R[43] && R[44] && R[45] && soma > 0, // M57 (com a correção do fósforo)
      R[46] && R[47] && R[48],                      // M58
      R[49] && R[50] && R[51],                      // M59
      R[52] && R[53] && R[54]                       // M60
    ];
    categorias.push(!categorias[0] && !categorias[1] && !categorias[2] && !categorias[3]); // M61
    var indice = categorias.indexOf(true);

    // --- Tabela Valor de Referência (M7:P27) ---
    function linhaVR(nome, ref, fmtRef, fornecido, fmtFornecido) {
      return { nome: nome, ref: ref, formatoRef: fmtRef, fornecido: fornecido,
               formatoFornecido: fmtFornecido || 'General', pct: fornecido / ref };
    }
    var vr = [
      linhaVR('Consumo de PB (g/dia)', 550, '0.0', c(2) / 10),
      linhaVR('Consumo de NDT (g/dia)', 4000, '0.0', c(4) / 10),
      { grupo: 'MACROMINERAIS (g/dia)' },
      linhaVR('Cálcio', 14, '0.0', ((c(5) + c(6)) / 2) / 10),
      linhaVR('Fósforo', 11, '0.0', c(7) / 10),
      linhaVR('Sódio', 7, '0.0', c(8) / 10),
      linhaVR('Magnésio', 9, '0.0', c(9) / 10, '0.00'),
      linhaVR('Enxofre', 13.5, '0.0', c(10) / 10),
      linhaVR('Potássio', 54, '0.0', c(11) / 10),
      { grupo: 'MICROMINERAIS (mg/dia)' },
      linhaVR('Cobalto', 0.9, '0.0', c(12) / 10),
      linhaVR('Cobre', 90, '0.0', c(13) / 10),
      linhaVR('Iodo', 4.5, '0.0', c(14) / 10),
      linhaVR('Manganês', 180, '0.0', c(15) / 10),
      linhaVR('Selênio', 0.9, '0.0', c(16) / 10),
      linhaVR('Zinco', 270, '0.0', c(17) / 10),
      linhaVR('Ferro', 450, '0.0', c(18) / 10),
      { grupo: 'VITAMINAS (UI/dia)' },
      linhaVR('Vitamina A', 20000, '#,##0', c(19) / 10),
      linhaVR('Vitamina D', 2500, '#,##0', c(20) / 10),
      linhaVR('Vitamina E', 350, 'General', c(21) / 10)
    ];

    // --- Avaliação dos teores mínimos (M67:P84) ---
    var avaliacao = null;
    if (indice >= 0 && indice <= 3) {
      var k = indice; // 0=G, 1=H, 2=I, 3=J
      var cons = c(26) / 1000;
      var porPv = function (linha) { return c(linha) * cons; };       // ex.: H29 = $C$7*($C$26/1000)
      var direto = function (linha) { return C[linha]; };            // ex.: G29 = C7 (vazio continua vazio)
      // Teores do produto (G22:J38) na coluna da categoria. A planilha não tem linha da vitamina D aqui,
      // por isso a vitamina D é comparada com o valor da vitamina E e a vitamina E fica sem valor (como na planilha).
      var produto = [
        k >= 2 ? c(2) / 10 : null,                                        // 22 Proteína bruta (%)
        k >= 2 ? (pos(3) ? mul(div(C[3], C[2]), 100) : null) : null,     // 23 NNP:Proteína bruta
        k >= 1 ? (pos(3) ? c(3) / 10 : null) : null,                      // 24 NNP Equiv. Proteico
        k >= 2 ? c(2) * cons : null,                                      // 25 PB (g/100kg pv)
        k === 3 ? c(4) * cons : null,                                     // 26 NDT (g/100kg pv)
        div(C[5], C[7]),                                                  // 27 Ca:P (mín)
        div(C[6], C[7]),                                                  // 28 Ca:P (máx)
        k === 0 ? direto(7) : porPv(7),                                   // 29 Fósforo
        k === 0 ? direto(9) : porPv(9),                                   // 30 Magnésio
        k === 0 ? direto(12) : porPv(12),                                 // 31 Cobalto
        k === 0 ? direto(13) : porPv(13),                                 // 32 Cobre
        k === 0 ? direto(14) : porPv(14),                                 // 33 Iodo
        k === 0 ? direto(15) : porPv(15),                                 // 34 Manganês
        k === 0 ? direto(16) : porPv(16),                                 // 35 Selênio
        k === 0 ? direto(17) : porPv(17),                                 // 36 Zinco
        k === 0 ? direto(19) : (pos(19) ? porPv(19) : null),              // 37 Vitamina A
        k === 0 ? direto(21) : (pos(21) ? porPv(21) : null),              // 38 Vitamina E
        null                                                              // (sem valor)
      ];
      var minimos = MINIMOS.colunas[k];
      var NAO_INF = 'Não há nível informado pelo usuário.';
      var NAO_APL = 'Não se aplica.';
      var gte = function (a, b) { return n0(a) >= n0(b); };
      var lte = function (a, b) { return n0(a) <= n0(b); };
      var maior0 = function (x) { return !eErro(x) && n0(x) > 0; };
      var status = function (cond, a, b, comparar) {
        if (!cond) return null;
        if (eErro(a) || eErro(b)) return ERRO;
        return comparar(a, b) ? 'OK' : 'EM DESACORDO';
      };
      var st = [];
      // P67, P70, P71: mínimo e valor informados
      var completo = function (i) {
        if (!maior0(minimos[i])) return NAO_APL;
        if (!maior0(produto[i])) return eErro(produto[i]) ? ERRO : NAO_INF;
        return gte(produto[i], minimos[i]) ? 'OK' : 'EM DESACORDO';
      };
      st[0] = completo(0);
      st[1] = maior0(minimos[1]) ? (eErro(produto[1]) ? ERRO : (lte(produto[1], minimos[1]) ? 'OK' : 'EM DESACORDO')) : NAO_APL; // P68
      st[2] = maior0(minimos[2]) ? (eErro(produto[7]) ? ERRO : (gte(produto[7], minimos[7]) ? 'OK' : 'EM DESACORDO')) : NAO_APL; // P69 (compara o fósforo, como na planilha)
      st[3] = completo(3);
      st[4] = completo(4);
      var porInsumo = [5, 6, 7, 9, 12, 13, 14, 15, 16, 17, 19, 20, 21]; // C5..C21 usados em P72:P84
      for (var j = 5; j <= 17; j++) {
        var linhaC = porInsumo[j - 5];
        var cmp = (j === 6) ? lte : gte;
        st[j] = status(pos(linhaC), produto[j], minimos[j], cmp) || NAO_INF;
      }
      var linhas = [];
      var algumDesacordo = false;
      for (var m = 0; m < 18; m++) {
        if (st[m] === 'EM DESACORDO') algumDesacordo = true;
        linhas.push({ nome: MINIMOS.nomes[m], minimo: minimos[m], formatoMinimo: MINIMOS.formatos[m],
                      produto: produto[m], formatoProduto: '0.00', status: st[m] });
      }
      avaliacao = { linhas: linhas, parecer: algumDesacordo ? PARECER : '' };
    }

    // --- Avaliações adicionais (M87:N88) ---
    var adicionais = [
      { nome: 'Inclusão de cloreto de sódio', valor: nacl, formato: '0.0%', alerta: nacl > 0.6,
        regra: 'Suplementos de pronto uso devem ter no máximo 60% de cloreto de sódio.' },
      { nome: 'Relação NNP:S', valor: ns, formato: '0.0', alerta: typeof ns === 'number' && ns > 10,
        regra: 'Suplementos com NNP devem ter relação máxima de NNP:S igual a 10.' }
    ];

    return {
      nome: (e.nome || '').trim(),
      textoGarantia: textoGarantia,
      classificacao: { indice: indice, texto: CATEGORIAS[indice], desacordo: indice === 4 },
      categorias: categorias,
      criterios: criterios,
      vr: vr,
      premissas: premissas,
      avaliacao: avaliacao,
      adicionais: adicionais
    };
  }

  var api = {
    GRUPOS: GRUPOS, EXEMPLO: EXEMPLO, CATEGORIAS: CATEGORIAS,
    FAIXAS_PRODUTOS: FAIXAS_PRODUTOS, FAIXAS_ADITIVOS: FAIXAS_ADITIVOS,
    ERRO: ERRO, eErro: eErro, calcular: calcular, formatar: formatar, lerNumero: lerNumero
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.TabelaVR = api;
})(this);
