// Monta as linhas do arquivo Excel da Tabela VR a partir das entradas e do resultado do cálculo.
(function (global) {
  'use strict';

  function linhasPlanilha(T, e, r) {
    var L = [];
    function linha() { L.push(Array.prototype.slice.call(arguments)); }
    function txt(v, extra) { var c = { v: v }; for (var k in extra || {}) c[k] = extra[k]; return c; }
    function b(v) { return { v: v, b: true }; }
    function valor(v, formato, extra) {
      if (typeof v === 'number') v = Number(v.toPrecision(15)); // evita resíduos como 1,1199999999999999
      var c = { v: v === null || v === undefined ? null : (T.eErro(v) ? '#DIV/0!' : v), f: formato };
      for (var k in extra || {}) c[k] = extra[k];
      return c;
    }

    linha({ v: 'Tabela VR - bovinos de corte', t: true });
    linha();
    linha(b('Nome do produto'), txt(r.nome));
    linha(b('Classificação'), txt(r.classificacao.texto, { a: r.classificacao.desacordo }));
    linha();

    linha(b('Níveis de garantia informados'));
    linha(b('Nutriente'), b('Unidade'), b('Valor'));
    T.GRUPOS.forEach(function (g) {
      g.campos.forEach(function (c) {
        var v = e.c[c.linha];
        linha(txt(c.nome), txt(c.unidade), valor(v === undefined ? null : v));
      });
    });
    linha();

    linha(b('Texto dos níveis de garantia'));
    linha(txt(r.textoGarantia, { q: true }));
    linha();

    linha(b('TABELA VALOR DE REFERÊNCIA - VR'));
    linha(b('Garantia'), b('Valor de referência - VR*'), b('Quantidade fornecida por 100g de suplemento'),
          b('Quantidade em % do VR fornecido por 100g de suplemento'));
    r.vr.forEach(function (x) {
      if (x.grupo) { linha(b(x.grupo)); return; }
      linha(txt(x.nome), valor(x.ref, x.formatoRef), valor(x.fornecido, x.formatoFornecido), valor(x.pct, '0.0%'));
    });
    linha(txt('*Valor diário de referência para mantença de um animal de 450 kg de peso corporal.'));
    linha();

    linha(b('Premissas'));
    r.premissas.forEach(function (p) {
      linha(txt(p.nome), valor(p.valor, p.formato, p.alerta ? { b: true, cor: 'vermelho' } : {}), txt(p.regra));
    });
    linha();

    linha(b('Critérios de classificação'));
    linha(b('Categoria'), b('Critério'), b('Atende'));
    r.criterios.forEach(function (c) {
      linha(txt(c.grupo), txt(c.texto, { q: true }), txt(c.valor ? 'Sim' : 'Não', { cor: c.valor ? 'azul' : 'vermelho' }));
    });
    linha();

    linha(b('Avaliação de atendimento dos teores mínimos - Tabelas 1 e 2 do Anexo II'));
    if (r.avaliacao) {
      linha(b('Nutrientes'), b('Teor mínimo/máximo regulamentar'), b('Teores do produto informado pelo usuário'), b('Resultado'));
      r.avaliacao.linhas.forEach(function (x) {
        linha(txt(x.nome), valor(x.minimo, x.formatoMinimo), valor(x.produto, x.formatoProduto),
              txt(T.eErro(x.status) ? '#DIV/0!' : x.status, { a: x.status === 'EM DESACORDO' }));
      });
      if (r.avaliacao.parecer) linha(txt(r.avaliacao.parecer, { a: true, q: true }));
    } else {
      linha(txt('Produto em desacordo com a IN 12/2004: não há uma categoria com teores mínimos para comparar.', { a: true }));
    }
    linha();

    linha(b('Avaliações adicionais'));
    r.adicionais.forEach(function (x) {
      linha(txt(x.nome), valor(x.valor, x.formato, x.alerta ? { a: true } : {}), txt(x.regra));
    });

    return L;
  }

  var api = { linhasPlanilha: linhasPlanilha, larguras: [46, 30, 30, 30] };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.RelatorioExcel = api;
})(this);
