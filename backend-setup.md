# Setup do backend — Google Apps Script

Tempo estimado: **5 minutos**. Custo: **zero**. Os dados ficam em uma planilha sua no Google Drive.

## 1. Criar a planilha

1. Vá em [sheets.google.com](https://sheets.google.com) e crie uma planilha nova.
2. Nomeie como `Primeiro Saque - Reservas`.
3. Na primeira linha (linha 1), coloque os cabeçalhos, cada um em uma coluna:

```
timestamp | nome | whatsapp | raquetes | qtd_raquetes | urgencia | bairro | valor_total | user_agent
```

## 2. Colar o script

1. Na planilha, menu **Extensões → Apps Script**.
2. Apague o código padrão e cole isto:

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.nome || '',
      data.whatsapp || '',
      data.raquetes || '',
      data.qtd_raquetes || 0,
      data.urgencia || '',
      data.bairro || '',
      data.valor_total || 0,
      data.user_agent || ''
    ]);
    return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ok:false, error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Salve (ícone de disquete ou Ctrl+S). Nomeie o projeto como `Primeiro Saque`.

## 3. Publicar como Web App

1. Botão azul **Implantar → Nova implantação**.
2. Clique na engrenagem ao lado de "Selecionar tipo" → **App da Web**.
3. Preencha:
   - Descrição: `Reservas LP`
   - Executar como: **Eu** (seu email)
   - Quem pode acessar: **Qualquer pessoa**
4. Clique **Implantar**.
5. Autorize o acesso (pode aparecer aviso "app não verificado" — clique em "Avançado → Acessar projeto não seguro", é seu próprio script).
6. Copie a **URL do app da Web** (termina em `/exec`).

## 4. Conectar na LP

Abra [index.html](index.html), procure esta linha (perto do final do arquivo, dentro do `<script>`):

```javascript
const ENDPOINT = ''; // <-- cole aqui a URL do Google Apps Script Web App quando tiver
```

Cole a URL entre as aspas. Pronto.

## 5. Testar

1. Abra a LP no navegador.
2. Clique em qualquer "Reservar meu teste" / "Quero testar".
3. Preencha o formulário e envie.
4. Confira a planilha — a linha deve aparecer em poucos segundos.

## Observações

- **Se atualizar o script depois**, precisa criar uma **Nova implantação** (não só salvar). A URL muda a cada nova implantação — atualize no `index.html`.
- **Sem endpoint configurado**, o form continua funcionando em modo simulado (loga no console do navegador e mostra tela de sucesso) — útil pra desenvolver.
- Enquanto a planilha cresce, dá pra criar tabela dinâmica pra ver: % que escolheu cada raquete, distribuição por bairro, % de cada tier (1/2/3+ raquetes), % por urgência.
