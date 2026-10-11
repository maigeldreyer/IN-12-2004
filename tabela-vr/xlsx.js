// Gerador mínimo de arquivos .xlsx (uma planilha), sem bibliotecas externas.
// Uso: XLSX.gerar({ nomePlanilha, larguras: [40, 18, ...], linhas: [[celula, ...], ...] }) -> Uint8Array
// celula: null | { v: texto|número, f: '0.0'|'0.00'|'0.0%'|'#,##0', b: negrito, t: título, a: fundo amarelo,
//                  cor: 'vermelho'|'azul', q: quebra de linha }

(function (global) {
  'use strict';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function colNome(i) {
    var s = '';
    i += 1;
    while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); }
    return s;
  }

  // ---- ZIP sem compressão ----
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
  function utf8(s) { return new TextEncoder().encode(s); }

  function zip(arquivos) {
    var partes = [], central = [], offset = 0;
    var agora = new Date();
    var hora = (agora.getHours() << 11) | (agora.getMinutes() << 5) | Math.floor(agora.getSeconds() / 2);
    var data = ((agora.getFullYear() - 1980) << 9) | ((agora.getMonth() + 1) << 5) | agora.getDate();
    arquivos.forEach(function (a) {
      var nome = utf8(a.nome), dados = utf8(a.conteudo), crc = crc32(dados);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
      h.setUint16(8, 0, true); h.setUint16(10, hora, true); h.setUint16(12, data, true);
      h.setUint32(14, crc, true); h.setUint32(18, dados.length, true); h.setUint32(22, dados.length, true);
      h.setUint16(26, nome.length, true); h.setUint16(28, 0, true);
      partes.push(new Uint8Array(h.buffer), nome, dados);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true);
      c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, hora, true); c.setUint16(14, data, true);
      c.setUint32(16, crc, true); c.setUint32(20, dados.length, true); c.setUint32(24, dados.length, true);
      c.setUint16(28, nome.length, true); c.setUint16(30, 0, true); c.setUint16(32, 0, true);
      c.setUint16(34, 0, true); c.setUint16(36, 0, true); c.setUint32(38, 0, true); c.setUint32(42, offset, true);
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

  // ---- Estilos ----
  var FORMATOS = { 'General': 0, '0.00': 2, '#,##0': 3, '0.0': 164, '0.0%': 165 };
  // fontes: 0 normal, 1 negrito, 2 título, 3 vermelho negrito, 4 azul, 5 vermelho
  function fonteDe(c) {
    if (c.t) return 2;
    if (c.cor === 'vermelho') return c.b ? 3 : 5;
    if (c.cor === 'azul') return 4;
    return c.b ? 1 : 0;
  }

  function gerar(opcoes) {
    var xfs = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'];
    var mapa = { '0|0|0|0': 0 };
    function estilo(c) {
      var fmt = FORMATOS[c.f || 'General'] || 0, fonte = fonteDe(c), fundo = c.a ? 2 : 0, quebra = c.q ? 1 : 0;
      var chave = fmt + '|' + fonte + '|' + fundo + '|' + quebra;
      if (mapa[chave] === undefined) {
        mapa[chave] = xfs.length;
        xfs.push('<xf numFmtId="' + fmt + '" fontId="' + fonte + '" fillId="' + fundo + '" borderId="0" xfId="0"' +
          (fmt ? ' applyNumberFormat="1"' : '') + (fonte ? ' applyFont="1"' : '') + (fundo ? ' applyFill="1"' : '') +
          (quebra ? ' applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>' : '/>'));
      }
      return mapa[chave];
    }

    var linhasXml = opcoes.linhas.map(function (linha, i) {
      var r = i + 1;
      var celulas = (linha || []).map(function (c, j) {
        if (c === null || c === undefined || c.v === null || c.v === undefined || c.v === '') return '';
        var ref = colNome(j) + r, s = estilo(c);
        var sAttr = s ? ' s="' + s + '"' : '';
        if (typeof c.v === 'number' && isFinite(c.v)) return '<c r="' + ref + '"' + sAttr + '><v>' + c.v + '</v></c>';
        return '<c r="' + ref + '"' + sAttr + ' t="inlineStr"><is><t xml:space="preserve">' + esc(c.v) + '</t></is></c>';
      }).join('');
      return '<row r="' + r + '">' + celulas + '</row>';
    }).join('');

    var cols = (opcoes.larguras || []).map(function (w, j) {
      return '<col min="' + (j + 1) + '" max="' + (j + 1) + '" width="' + w + '" customWidth="1"/>';
    }).join('');

    var ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
    var nsR = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    var planilha = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="' + ns + '" xmlns:r="' + nsR + '">' +
      (cols ? '<cols>' + cols + '</cols>' : '') + '<sheetData>' + linhasXml + '</sheetData></worksheet>';

    var estilos = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<styleSheet xmlns="' + ns + '">' +
      '<numFmts count="2"><numFmt numFmtId="164" formatCode="0.0"/><numFmt numFmtId="165" formatCode="0.0%"/></numFmts>' +
      '<fonts count="6">' +
      '<font><sz val="11"/><name val="Calibri"/></font>' +
      '<font><b/><sz val="11"/><name val="Calibri"/></font>' +
      '<font><b/><sz val="14"/><name val="Calibri"/></font>' +
      '<font><b/><sz val="11"/><color rgb="FFFF0000"/><name val="Calibri"/></font>' +
      '<font><sz val="11"/><color rgb="FF0000FF"/><name val="Calibri"/></font>' +
      '<font><sz val="11"/><color rgb="FFFF0000"/><name val="Calibri"/></font>' +
      '</fonts>' +
      '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FFFFFF00"/><bgColor indexed="64"/></patternFill></fill></fills>' +
      '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="' + xfs.length + '">' + xfs.join('') + '</cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
      '</styleSheet>';

    var arquivos = [
      { nome: '[Content_Types].xml', conteudo: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        '</Types>' },
      { nome: '_rels/.rels', conteudo: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>' },
      { nome: 'xl/workbook.xml', conteudo: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="' + ns + '" xmlns:r="' + nsR + '"><sheets>' +
        '<sheet name="' + esc((opcoes.nomePlanilha || 'Planilha1').slice(0, 31)) + '" sheetId="1" r:id="rId1"/>' +
        '</sheets></workbook>' },
      { nome: 'xl/_rels/workbook.xml.rels', conteudo: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        '</Relationships>' },
      { nome: 'xl/styles.xml', conteudo: estilos },
      { nome: 'xl/worksheets/sheet1.xml', conteudo: planilha }
    ];
    return zip(arquivos);
  }

  var api = { gerar: gerar };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.XLSX_MINIMO = api;
})(this);
