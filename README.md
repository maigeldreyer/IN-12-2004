# Ferramentas de rotulagem de suplementos (IN 12/2004)

Duas páginas web para apoiar a rotulagem de suplementos para bovinos. Não usam fontes, bibliotecas nem serviços externos, e todo o processamento acontece no navegador: nada do que é digitado é enviado para nenhum servidor.

## Composição e substitutivos

https://maigeldreyer.github.io/IN-12-2004/

Gera o texto de rótulo (composição básica qualitativa, eventuais substitutivos, modo de usar e restrições), com o log das respostas no final. É a versão web do notebook do Colab "Composição e Substitutivos - Suplementos - Rural (v2)", e o texto gerado é idêntico ao do notebook.

- `index.html`: o formulário e os links dos templates.
- `relatorio.js`: a lógica do relatório. Para mudar ingredientes, substitutivos ou recomendações, edite este arquivo. Se mudar aqui, mude também no Colab (e vice-versa).
- `templates/`: templates de rótulo do LibreOffice (Suplemento, Ração e núcleo, Alvorada), baixados pela primeira página. Para trocar um template, substitua o arquivo mantendo o mesmo nome.

## Tabela VR: bovinos de corte

https://maigeldreyer.github.io/IN-12-2004/tabela-vr/

Versão web da aba "Corte" da planilha "Tabela VR - cálculo": classificação pela IN 12/2004, texto dos níveis de garantia, Tabela Valor de Referência, premissas, critérios de classificação, avaliação dos teores mínimos e avaliações adicionais. Permite copiar o texto e a tabela VR e baixar tudo em Excel.

Os resultados são idênticos aos da planilha, com duas correções:

1. No texto dos níveis de garantia, valores abaixo de 10 g/kg que são convertidos (×1000) saem em "mg", não em "g".
2. "Suplemento mineral" também exige fósforo de 40 g/kg ou mais (critério que já estava listado na planilha, mas não era usado).

Arquivos:

- `tabela-vr/index.html`: a página.
- `tabela-vr/tabela-vr.js`: a lógica dos cálculos, com a linha correspondente da planilha indicada nos comentários. Se mudar aqui, mude também na planilha (e vice-versa).
- `tabela-vr/relatorio-excel.js`: o conteúdo do arquivo Excel.
- `tabela-vr/xlsx.js`: gerador de arquivos .xlsx.

## Probióticos

https://maigeldreyer.github.io/IN-12-2004/probiotico/

Versão web da planilha "Probiótico - Cálculo", com os seis probióticos da planilha. Pela inclusão, calcula a concentração de cada microrganismo no produto final e o texto de garantia; pela concentração desejada, calcula a inclusão necessária de cada microrganismo e destaca a maior, que atende a todos. Os valores e microrganismos podem ser ajustados na página para um cálculo avulso.

Os resultados são idênticos aos da planilha, com "(mín)" acentuado no texto de garantia. Em empates exatos no terceiro algarismo (ex.: 2,115E+09), o texto arredonda para cima (2,12E+09).

- `probiotico/index.html`: a página.
- `probiotico/probiotico.js`: a lista de probióticos e a lógica dos cálculos. Para incluir ou alterar um probiótico de forma permanente, edite a lista `PRODUTOS` neste arquivo.

## Marca d'água em PDF

https://maigeldreyer.github.io/IN-12-2004/marca-dagua/

Insere "Elaborado e aprovado por Maigel Dreyer em dd/mm/aa às hh:mm", na cor #0000CC, em todas as páginas de um ou mais PDFs. A posição é escolhida arrastando a marca sobre a prévia da página (ou por atalhos de topo e rodapé), e vale para todas as páginas, inclusive as giradas ou de outro tamanho. Um PDF é baixado direto; vários vêm num arquivo .zip. Os arquivos são processados no navegador e não são enviados para nenhum servidor. PDFs protegidos por criptografia não podem ser alterados.

- `marca-dagua/index.html`: a página.
- `marca-dagua/marca.js`: a lógica da marca (texto, posição, rotação das páginas e ZIP).
- `marca-dagua/vendor/`: pdf-lib 1.17.1 (MIT), que escreve a marca, e pdf.js 6.2.108 legacy (Apache 2.0), que mostra a prévia, com as respectivas licenças.
