// Composição e substitutivos - Suplementos - Rural
// Lógica do relatório (mesma do notebook do Colab, versão v2).
// Para alterar textos de ingredientes, substitutivos ou recomendações, edite este arquivo.

(function (global) {
  'use strict';

  // Perguntas de sim/não, na ordem em que aparecem.
  var PERGUNTAS = [
    { id: 'n1',  texto: '1. Contém milho, casca de soja, triguilho, aveia, milheto, sorgo, farelo de trigo, farelo de arroz, DDGS?' },
    { id: 'n2',  texto: '2. Contém farelo de soja, farelo de algodão, refinazil?' },
    { id: 'n3',  texto: '3. Contém calcário?' },
    { id: 'n4',  texto: '4. Contém fosfato?' },
    { id: 'n4b', texto: '4b. Contém sal?' },
    { id: 'n5',  texto: '5. Contém ureia?' },
    { id: 'n6',  texto: '6. Contém enxofre?' },
    { id: 'n8',  texto: '8. Contém cloreto de potássio?' },
    { id: 'n9',  texto: '9. Contém premix?' },
    { id: 'n10', texto: '10. Contém vitaminas ADE?' },
    { id: 'n11', texto: '11. Contém probiótico (Multsacch, Probiotic)?' },
    { id: 'n12', texto: '12. Contém aroma?' },
    { id: 'n13', texto: '13. Contém virginiamicina?' },
    { id: 'n14', texto: '14. Contém monensina, salinomicina, narasina ou outro ionóforo?' },
    { id: 'n15', texto: '15. Este produto é para misturar?' },
    { id: 'n16', texto: '16. Este produto é um suplemento?' }
  ];

  var TEXTO_NOME = 'Qual o nome do produto?';
  var TEXTO_IONOFORO = 'Informe qual é o ionóforo:';
  var TEXTO_SAL = '18. Qual a inclusão de sal? (%)';

  // Quando a pergunta do ionóforo aparece: resposta "sim" na 14.
  function perguntaIonoforo(r) { return r.n14 === 's'; }
  // Quando a pergunta do sal aparece: suplemento (16) e contém sal (4b).
  function perguntaSal(r) { return r.n16 === 's' && r.n4b === 's'; }

  // Junta apenas os itens preenchidos; respostas negativas ('') ficam de fora.
  function juntar(itens, sep) {
    return itens.filter(function (i) { return i; }).join(sep === undefined ? ', ' : sep);
  }

  // Seção sem itens: mantém apenas o título.
  function secao(titulo, texto, ponto) {
    return texto ? titulo + ': ' + texto + (ponto || '') : titulo + ':';
  }

  // r: { nome, n1..n16 ('s' ou 'n'), ionoforo, sal }
  function gerarRelatorio(r) {
    var log = [];
    function registrar(texto, resposta) { log.push(texto + ' → ' + resposta); }
    function sn(id) { return r[id] === 's' ? 'Sim' : 'Não'; }

    var nome = (r.nome || '').trim();
    registrar(TEXTO_NOME, nome);

    var c1 = '', s1 = '', c2 = '', s2 = '', c3 = '', s3 = '', c4 = '', s4 = '', c4b = '',
        c5 = '', s5 = '', c6 = '', s6 = '', c8 = '', c9 = '', s9 = '', c10 = '', c11 = '',
        c12 = '', s12 = '', c13 = '', c14 = '', a13, a15, a15b = '', a16 = '', a17 = '';

    if (r.n1 === 's') {
      c1 = 'milho moído (espécies doadoras do gene transgênico: Agrobacterium tumefaciens, Bacillus thuringiensis, Streptomyces viridochromogenes, Zea maiz)';
      s1 = 'casca de soja, triguilho, aveia, milheto, sorgo integral moído, grão integral de centeio, grão de triticale, farelo de trigo, farelo de arroz, DDGS – resíduo seco de destilaria com solúveis (milho), DDG – resíduo seco de destilaria (milho)';
    }
    if (r.n2 === 's') {
      c2 = 'farelo de soja (espécies doadoras do gene transgênico: Agrobacterium tumefaciens, Bacillus thuringiensis, Streptomyces viridochromogenes, Arabidopsis thaliana)';
      s2 = 'farelo proteico de milho, farelo proteico de milho 18, farelo proteico de milho 21, farelo de algodão';
    }
    if (r.n3 === 's') {
      c3 = 'calcário calcítico';
      s3 = 'carbonato de cálcio, sulfato de cálcio dihidratado';
    }
    if (r.n4 === 's') {
      c4 = 'fosfato bicálcico';
      s4 = 'fosfato monocálcico, fosfato monoamônio, fosfato monobicálcico';
    }
    if (r.n4b === 's') {
      c4b = 'cloreto de sódio';
    }
    if (r.n5 === 's') {
      c5 = 'ureia pecuária';
      s5 = 'ureia protegida, amireia';
    }
    if (r.n6 === 's') {
      c6 = 'enxofre ventilado';
      s6 = 'filtrado de enxofre';
    }
    if (r.n8 === 's') {
      c8 = 'cloreto de potássio';
    }
    if (r.n9 === 's') {
      c9 = 'sulfato de zinco, sulfato de manganês, sulfato de cobre, sulfato de cobalto, iodato de cálcio, selenito de sódio, veículo';
      s9 = 'óxido de zinco, cloreto de zinco, cloreto de zinco tribásico, monóxido de manganês, óxido de manganês, cloreto de manganês, cloreto de manganês tribásico (tbmc), hidroxicloreto de manganês, cloreto de cobre, cloreto de cobre tribásico, iodato de potássio, iodeto de potássio';
    }
    if (r.n10 === 's') {
      c10 = 'vitamina A, vitamina D3, vitamina E';
    }
    if (r.n11 === 's') {
      c11 = 'aditivo probiótico';
    }
    if (r.n12 === 's') {
      c12 = 'aroma de frutas vermelhas';
      s12 = 'aroma de leite';
    }
    if (r.n13 === 's') {
      c13 = 'virginiamicina';
    }
    if (r.n14 === 's') {
      c14 = (r.ionoforo || '').trim();
      a13 = 'Não fornecer para outras espécies. Este produto contém ionóforo. Não permitir que equídeos tenham acesso a este produto. A ingestão pode ser fatal.';
    } else {
      a13 = 'Não fornecer para outras espécies.';
    }
    if (r.n15 === 's') {
      a15 = 'Produto para misturar.';
      a15b = 'Não fornecer este produto puro (sem misturar) para os animais.';
    } else {
      a15 = 'Produto pronto para o uso.';
    }
    if (r.n16 === 's' && r.n4 === 's') {
      a16 = 'X';
    }
    if (r.n16 === 's' && r.n5 === 's') {
      a17 = 'Consumo estimado de XXX a YYY gramas do produto para cada 100 kg de peso vivo por dia. Na primeira semana de uso, misturar este produto ao suplemento mineral na proporção de 1:1 para adaptação dos animais. Fornecer o produto sempre em cochos cobertos e/ou com sistema que evite acúmulo de água. Manter boa disponibilidade de pasto. Manter o cocho com o produto. Não fornecer o produto para animais em jejum, famintos e debilitados. Procurar o profissional habilitado de sua confiança em caso de intoxicação.';
    }

    // Log das perguntas de sim/não, na ordem, com as perguntas condicionais no lugar certo.
    PERGUNTAS.forEach(function (p) {
      registrar(p.texto, sn(p.id));
      if (p.id === 'n14' && perguntaIonoforo(r)) {
        registrar(TEXTO_IONOFORO, c14);
      }
    });

    if (perguntaSal(r)) {
      var salBruto = (r.sal || '').trim();
      registrar(TEXTO_SAL, salBruto ? salBruto : '(sem resposta)');
      var sal = salBruto.replace(/%+$/, '').trim();
      if (sal) {
        c4b = 'cloreto de sódio (' + sal + '%)';
      }
    }

    var composicao = juntar([c1, c2, c3, c4, c4b, c5, c6, c8, c9, c10, c11, c12, c13, c14]);
    var substitutivos = juntar([s1, s2, s3, s4, s5, s6, 'óxido de magnésio, sulfato de magnésio', s9, s12]);
    var modoDeUsar = juntar([a15, a17], ' ');
    var restricoes = juntar([a15b, a13], ' ');

    var texto = 'Nome do produto: ' + nome + '\n\n' +
      secao('Composição básica qualitativa', composicao, '.') + '\n\n' +
      secao('Eventuais substitutivos', substitutivos, '.') + '\n\n' +
      secao('Modo de usar', modoDeUsar) + '\n\n' +
      (a16 ? a16 + '\n\n' : '') +
      secao('Restrições e outras recomendações', restricoes) + '\n' +
      '\n\n' + new Array(41).join('-') + '\n' +
      'Log de respostas:\n' +
      log.join('\n') + '\n';

    return texto;
  }

  var api = {
    PERGUNTAS: PERGUNTAS,
    TEXTO_NOME: TEXTO_NOME,
    TEXTO_IONOFORO: TEXTO_IONOFORO,
    TEXTO_SAL: TEXTO_SAL,
    perguntaIonoforo: perguntaIonoforo,
    perguntaSal: perguntaSal,
    gerarRelatorio: gerarRelatorio
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global.Relatorio = api;
  }
})(this);
