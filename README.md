# Ferramentas de rotulagem de suplementos (IN 12/2004)

Duas páginas web para apoiar a rotulagem de suplementos para bovinos. Não usam fontes, bibliotecas nem serviços externos, e todo o processamento acontece no navegador: nada do que é digitado é enviado para nenhum servidor.

## Composição e substitutivos

https://maigeldreyer.github.io/IN-12-2004/

Gera o texto de rótulo (composição básica qualitativa, eventuais substitutivos, modo de usar e restrições), com o log das respostas no final. É a versão web do notebook do Colab "Composição e Substitutivos - Suplementos - Rural (v2)", e o texto gerado é idêntico ao do notebook.

- `index.html`: o formulário.
- `relatorio.js`: a lógica do relatório. Para mudar ingredientes, substitutivos ou recomendações, edite este arquivo. Se mudar aqui, mude também no Colab (e vice-versa).

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
