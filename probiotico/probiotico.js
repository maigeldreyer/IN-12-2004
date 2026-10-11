// Probiótico - cálculo
// Mesma lógica da planilha do Google "Probiótico - Cálculo", com "(mín)" acentuado no texto de garantia
// e a maior inclusão necessária destacada.
//   Concentração no produto final (C) = concentração no probiótico (B) × inclusão
//   Inclusão necessária (E)          = concentração desejada (D) ÷ concentração no probiótico (B)
// Para incluir ou alterar um probiótico de forma permanente, edite a lista PRODUTOS abaixo.

(function (global) {
  'use strict';

  // inclusao em fração (0.002 = 0,20%); concentrações em UFC/kg
  var PRODUTOS = [
    { nome: 'DBR Probiótico', inclusao: 0.002, itens: [
      ['Ruminobacter amylophilum', 3e11, 6e8],
      ['Ruminobacter succinogenes', 3e11, 6e8],
      ['Succinovibrio dextrinosolvens', 4.4e11, 9e8],
      ['Bacillus cereus', 3.5e11, 7e8],
      ['Lactobacillus acidophilus', 3.5e11, 1.4e9],
      ['Enterococcus faecium', 3.5e11, 1.4e9]
    ] },
    { nome: 'DBR Sacch Probiótico', inclusao: 0.02, itens: [
      ['Ruminobacter amylophilum', 3e11, 6e8],
      ['Ruminobacter succinogenes', 3e11, 6e8],
      ['Succinovibrio dextrinosolvens', 4.4e11, 9e8],
      ['Bacillus cereus', 3.5e11, 7e8],
      ['Lactobacillus acidophilus', 3.5e11, 1.4e9],
      ['Enterococcus faecium', 3.5e11, 1.4e9],
      ['Saccharomyces cerevisiae', 7.5e12, 1.4e9]
    ] },
    { nome: 'Multsacch Biomart', inclusao: 0.0007, itens: [
      ['Bacillus subtilis', 3e12, 2e9],
      ['Bifidobacterium bifidum', 1e12, 7e8],
      ['Enterococcus faecium', 1e12, 7e8],
      ['Lactobacillus acidophilus', 1e12, 2e8],
      ['Lactobacillus buchneri', 2e12, 2e8],
      ['Lactobacillus casei', 1e12, 2e8],
      ['Lactobacillus lactis', 1e12, 2e8],
      ['Saccharomyces cerevisiae', 2e12, 2e8]
    ] },
    { nome: 'Probiotic Multiplicação', inclusao: 0.0002, itens: [
      ['Bacillus subtilis', 5e11, 2e8],
      ['Bifidobacterium bifidum', 3.75e11, 2e8],
      ['Enterococcus faecium', 3.75e11, 2e8],
      ['Lactobacillus acidophilus', 3.75e11, 2e8],
      ['Lactobacillus casei', 3.25e11, 2e8],
      ['Lactobacillus lactis', 1.75e11, 2e8]
    ] },
    { nome: 'Probimais R (DBR)', inclusao: 0.0019, itens: [
      ['Bacillus subtilis', 5.5e11, 1.045e10],
      ['Bifidobacterium bifidum', 3.74e11, 7.106e9],
      ['Enterococcus faecium', 3.74e11, 7.106e9],
      ['Lactobacillus acidophilus', 3.74e11, 7.106e9],
      ['Lactobacillus casei', 3.52e11, 6.688e9],
      ['Lactobacillus lactis', 1.76e11, 3.344e9]
    ] },
    { nome: 'Rural Immunity (Nutrivital) - Cópia DBR Probiótico', inclusao: 0.0005, itens: [
      ['Ruminobacter amylophilum', 2.4e11, 2e8],
      ['Ruminobacter succinogenes', 2.4e11, 2e8],
      ['Succinovibrio dextrinosolvens', 3.52e11, 2e8],
      ['Bacillus cereus', 2.8e11, 2e8],
      ['Lactobacillus acidophilus', 2.8e11, 2e8],
      ['Enterococcus faecium', 2.8e11, 2e8]
    ] }
  ];

  var UNIDADE = 'UFC/kg';
  var ERRO = { erro: '#DIV/0!' };
  function eErro(x) { return x === ERRO; }
  function n0(x) { return (x === null || x === undefined || (typeof x === 'number' && isNaN(x))) ? 0 : x; }

  // ---------------------------------------------------------------------------
  // Formatação
  // ---------------------------------------------------------------------------
  // Arredonda a mantissa de um número em notação científica (half-up), trabalhando sobre os dígitos
  // decimais para evitar erros de ponto flutuante (ex.: 550e9 × 0,0019 = 1,045E+09 → "1,05E+09").
  function cientifico(n, casas) {
    if (casas === undefined) casas = 2;
    if (n === 0) return '0,' + '0'.repeat(casas) + 'E+00';
    var neg = n < 0;
    var s = Math.abs(Number(Math.abs(n).toPrecision(15))).toExponential(14); // "1.04500000000000e+9"
    var m = s.split('e');
    var digitos = m[0].replace('.', '');
    var exp = parseInt(m[1], 10);
    var mant = digitos.slice(0, casas + 1).split('').map(Number);
    if (parseInt(digitos.charAt(casas + 1), 10) >= 5) {
      var i = mant.length - 1;
      while (i >= 0) {
        if (mant[i] < 9) { mant[i] += 1; break; }
        mant[i] = 0; i -= 1;
      }
      if (i < 0) { mant.unshift(1); mant.pop(); exp += 1; }
    }
    var txt = mant[0] + (casas ? ',' + mant.slice(1).join('') : '');
    var e = Math.abs(exp);
    return (neg ? '-' : '') + txt + 'E' + (exp < 0 ? '-' : '+') + (e < 10 ? '0' + e : String(e));
  }

  // Formato "0.00%" da planilha.
  function percentual(fracao, casas) {
    if (casas === undefined) casas = 2;
    if (eErro(fracao)) return '#DIV/0!';
    var v = Number((n0(fracao) * 100).toPrecision(15));
    var r = Math.round(Number(Math.abs(v) + 'e' + casas));
    var s = (Number(r + 'e-' + casas)).toFixed(casas).replace('.', ',');
    return (v < 0 && r !== 0 ? '-' : '') + s + '%';
  }

  // Mostra um valor de entrada (UFC/kg) sem perder precisão: "3,00E+11", "1,045E+10".
  function cientificoEntrada(n) {
    if (n === null || n === undefined) return '';
    var casas = 2;
    while (casas < 14 && Number(cientifico(n, casas).replace(',', '.')) !== Number(Number(n).toPrecision(15))) casas++;
    return cientifico(n, casas);
  }

  // Mostra uma fração como percentual para o campo de inclusão: 0.002 → "0,2"; 0.0019 → "0,19".
  function percentualEntrada(fracao) {
    if (fracao === null || fracao === undefined) return '';
    return String(Number((fracao * 100).toPrecision(12))).replace('.', ',');
  }

  // ---------------------------------------------------------------------------
  // Leitura de números digitados
  // ---------------------------------------------------------------------------
  // Aceita "3,00E+11", "3E11", "3e+11", "3.5E11", "300.000.000.000", "300000000000", "27,5".
  // Devolve null para vazio e NaN para texto inválido.
  function lerNumero(texto) {
    var t = String(texto === undefined || texto === null ? '' : texto).trim().replace(/\s+/g, '').replace(/×10\^?/i, 'E');
    if (!t) return null;
    var exp = 0;
    var m = t.match(/^(.*?)[eE]([+-]?\d+)$/);
    if (m) { t = m[1]; exp = parseInt(m[2], 10); if (!t) return NaN; }
    if (t.indexOf(',') >= 0) {
      t = t.replace(/\./g, '').replace(',', '.');
    } else if (!m && /^\d{1,3}(\.\d{3})+$/.test(t)) {
      t = t.replace(/\./g, '');
    }
    if (!/^\d*\.?\d+$|^\d+\.$/.test(t)) return NaN;
    return Number(t + 'e' + exp);
  }

  // ---------------------------------------------------------------------------
  // Cálculo
  // ---------------------------------------------------------------------------
  // e = { inclusao: fração|null, itens: [{ nome, concentracao, desejada }] }
  function calcular(e) {
    var inc = n0(e.inclusao);
    var linhas = (e.itens || []).map(function (it) {
      var b = it.concentracao, d = it.desejada;
      var noProduto = n0(b) * inc;                                   // C = B × inclusão
      var inclusaoNecessaria = n0(b) === 0 ? ERRO : n0(d) / n0(b);   // E = D ÷ B
      var nome = (it.nome || '').trim();
      return {
        nome: nome,
        concentracao: b,
        noProduto: noProduto,
        textoConcentracao: cientifico(noProduto),                    // F = TEXT(C; "0.00E+00")
        desejada: d,
        inclusaoNecessaria: inclusaoNecessaria,
        texto: nome + ' (mín) ' + cientifico(noProduto) + ' ' + UNIDADE // G
      };
    });

    // Maior inclusão necessária: a que atende a todas as concentrações desejadas.
    var maior = null;
    linhas.forEach(function (l) {
      if (!eErro(l.inclusaoNecessaria) && n0(l.desejada) > 0 && (maior === null || l.inclusaoNecessaria > maior)) {
        maior = l.inclusaoNecessaria;
      }
    });
    var definidores = [];
    linhas.forEach(function (l, i) {
      l.ehMaior = maior !== null && l.inclusaoNecessaria === maior;
      if (l.ehMaior) definidores.push(i);
    });

    return {
      linhas: linhas,
      // Texto de garantia: linhas sem nome (microrganismo adicionado e ainda não preenchido) ficam de fora.
      textoGarantia: linhas.filter(function (l) { return l.nome; }).map(function (l) { return l.texto; }).join(', '),
      maiorInclusao: maior,
      definidores: definidores
    };
  }

  // Cópia editável de um produto da lista.
  function produtoInicial(indice) {
    var p = PRODUTOS[indice];
    return {
      nome: p.nome,
      inclusao: p.inclusao,
      itens: p.itens.map(function (it) { return { nome: it[0], concentracao: it[1], desejada: it[2] }; })
    };
  }

  var api = {
    PRODUTOS: PRODUTOS, UNIDADE: UNIDADE, ERRO: ERRO, eErro: eErro,
    calcular: calcular, produtoInicial: produtoInicial, lerNumero: lerNumero,
    cientifico: cientifico, percentual: percentual,
    cientificoEntrada: cientificoEntrada, percentualEntrada: percentualEntrada
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.Probiotico = api;
})(this);
