// Marca d'água de aprovação em PDF.
// Insere "Elaborado e aprovado por Maigel Dreyer em dd/mm/aa às hh:mm" em todas as páginas, na cor #0000CC,
// na posição escolhida (frações da largura e da altura da página como ela aparece na tela).
// Tudo acontece no navegador: o PDF não é enviado para nenhum servidor.
// Depende da pdf-lib (vendor/pdf-lib.min.js), disponível como PDFLib.

(function (global) {
  'use strict';

  var PDFLib = global.PDFLib || (typeof require === 'function' ? require('pdf-lib') : null);

  var TEXTO_BASE = 'Elaborado e aprovado por Maigel Dreyer';
  var COR_HEX = '#0000CC';
  var COR = { r: 0, g: 0, b: 0xCC / 255 };
  // Métricas da Helvetica (por 1 pt de tamanho): ascendente e descendente.
  var ASCENDENTE = 0.718;
  var DESCENDENTE = 0.207;
  var ALTURA_CAIXA = ASCENDENTE + DESCENDENTE;

  function doisDigitos(n) { return (n < 10 ? '0' : '') + n; }

  // "Elaborado e aprovado por Maigel Dreyer em 12/10/26 às 11:44"
  function texto(data) {
    var d = data || new Date();
    return TEXTO_BASE + ' em ' + doisDigitos(d.getDate()) + '/' + doisDigitos(d.getMonth() + 1) + '/' +
      doisDigitos(d.getFullYear() % 100) + ' às ' + doisDigitos(d.getHours()) + ':' + doisDigitos(d.getMinutes());
  }

  function limitar(v, min, max) { return Math.max(min, Math.min(max, v)); }

  // Converte um ponto da página como ela aparece na tela (origem no canto superior esquerdo, y para baixo)
  // para o sistema de coordenadas do PDF, considerando a rotação da página.
  function paraPdf(xd, yd, caixa, rotacao) {
    var x0 = caixa.x, y0 = caixa.y, w = caixa.width, h = caixa.height;
    switch (rotacao) {
      case 90: return { x: x0 + yd, y: y0 + xd };
      case 180: return { x: x0 + w - xd, y: y0 + yd };
      case 270: return { x: x0 + w - yd, y: y0 + h - xd };
      default: return { x: x0 + xd, y: y0 + h - yd };
    }
  }

  // Posição da caixa do texto na página exibida, em pontos, mantendo o texto inteiro dentro da página.
  function posicaoNaPagina(larguraPagina, alturaPagina, larguraTexto, tamanho, fx, fy) {
    var alturaTexto = ALTURA_CAIXA * tamanho;
    var x = limitar(fx * larguraPagina, 0, Math.max(0, larguraPagina - larguraTexto));
    var y = limitar(fy * alturaPagina, 0, Math.max(0, alturaPagina - alturaTexto));
    return { x: x, y: y, baseline: y + ASCENDENTE * tamanho };
  }

  // bytes: ArrayBuffer/Uint8Array do PDF; opcoes: { fx, fy, tamanho, texto }
  async function marcarPdf(bytes, opcoes) {
    try {
      return await marcar(bytes, opcoes);
    } catch (erro) {
      if (erro && /encrypt/i.test(erro.name + ' ' + erro.message)) {
        throw new Error('O PDF está protegido (criptografado) e não pode ser alterado.');
      }
      throw new Error('Não foi possível abrir o PDF. O arquivo pode estar corrompido ou não ser um PDF.');
    }
  }

  async function marcar(bytes, opcoes) {
    var doc = await PDFLib.PDFDocument.load(bytes, { updateMetadata: false });
    var fonte = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    var txt = opcoes.texto;
    var tamanho = opcoes.tamanho;
    var larguraTexto = fonte.widthOfTextAtSize(txt, tamanho);
    var cor = PDFLib.rgb(COR.r, COR.g, COR.b);
    var paginas = doc.getPages();
    paginas.forEach(function (pagina) {
      var caixa = pagina.getCropBox();
      var rotacao = ((pagina.getRotation().angle % 360) + 360) % 360;
      var deitada = rotacao === 90 || rotacao === 270;
      var W = deitada ? caixa.height : caixa.width;
      var H = deitada ? caixa.width : caixa.height;
      var p = posicaoNaPagina(W, H, larguraTexto, tamanho, opcoes.fx, opcoes.fy);
      var ponto = paraPdf(p.x, p.baseline, caixa, rotacao);
      pagina.drawText(txt, {
        x: ponto.x, y: ponto.y, size: tamanho, font: fonte, color: cor,
        rotate: PDFLib.degrees(rotacao)
      });
    });
    var saida = await doc.save();
    return { bytes: saida, paginas: paginas.length };
  }

  // ---------------------------------------------------------------------------
  // ZIP sem compressão, para baixar vários PDFs de uma vez
  // ---------------------------------------------------------------------------
  var TABELA_CRC = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) c = TABELA_CRC[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function zip(arquivos, data) {
    var agora = data || new Date();
    var hora = (agora.getHours() << 11) | (agora.getMinutes() << 5) | Math.floor(agora.getSeconds() / 2);
    var dia = ((agora.getFullYear() - 1980) << 9) | ((agora.getMonth() + 1) << 5) | agora.getDate();
    var codificador = new TextEncoder();
    var partes = [], central = [], offset = 0;
    arquivos.forEach(function (a) {
      var nome = codificador.encode(a.nome), dados = a.dados, crc = crc32(dados);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
      h.setUint16(8, 0, true); h.setUint16(10, hora, true); h.setUint16(12, dia, true);
      h.setUint32(14, crc, true); h.setUint32(18, dados.length, true); h.setUint32(22, dados.length, true);
      h.setUint16(26, nome.length, true); h.setUint16(28, 0, true);
      partes.push(new Uint8Array(h.buffer), nome, dados);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true);
      c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, hora, true); c.setUint16(14, dia, true);
      c.setUint32(16, crc, true); c.setUint32(20, dados.length, true); c.setUint32(24, dados.length, true);
      c.setUint16(28, nome.length, true); c.setUint32(42, offset, true);
      central.push(new Uint8Array(c.buffer), nome);
      offset += 30 + nome.length + dados.length;
    });
    var tamCentral = central.reduce(function (s, p) { return s + p.length; }, 0);
    var fim = new DataView(new ArrayBuffer(22));
    fim.setUint32(0, 0x06054b50, true); fim.setUint16(8, arquivos.length, true); fim.setUint16(10, arquivos.length, true);
    fim.setUint32(12, tamCentral, true); fim.setUint32(16, offset, true);
    var tudo = partes.concat(central, [new Uint8Array(fim.buffer)]);
    var total = tudo.reduce(function (s, p) { return s + p.length; }, 0);
    var saida = new Uint8Array(total), pos = 0;
    tudo.forEach(function (p) { saida.set(p, pos); pos += p.length; });
    return saida;
  }

  // "Relatório.pdf" → "Relatório - aprovado.pdf"; nomes repetidos ganham (2), (3)...
  function nomesDeSaida(nomes) {
    var usados = {};
    return nomes.map(function (n) {
      var base = n.replace(/\.pdf$/i, '') + ' - aprovado';
      var nome = base + '.pdf', i = 2;
      while (usados[nome.toLowerCase()]) { nome = base + ' (' + i + ').pdf'; i++; }
      usados[nome.toLowerCase()] = true;
      return nome;
    });
  }

  var api = {
    TEXTO_BASE: TEXTO_BASE, COR_HEX: COR_HEX, ASCENDENTE: ASCENDENTE, ALTURA_CAIXA: ALTURA_CAIXA,
    texto: texto, marcarPdf: marcarPdf, posicaoNaPagina: posicaoNaPagina, paraPdf: paraPdf,
    zip: zip, nomesDeSaida: nomesDeSaida
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.MarcaDagua = api;
})(this);
