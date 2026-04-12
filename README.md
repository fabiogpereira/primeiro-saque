# Primeiro Saque

Landing page do Primeiro Saque — serviço de teste de raquetes de tênis antes da compra, em São Paulo.

Fase atual: **validação de demanda** via fake-door test. LP apresenta o serviço como se já estivesse operando; formulário captura interesse (nome, WhatsApp, raquetes desejadas, urgência, bairro) pra medir:

- Existe demanda?
- Quantas raquetes as pessoas querem testar (1, 2 ou 3+)?
- Distribuição geográfica por bairro de SP
- Urgência do interesse

## Stack

- HTML único (`index.html`)
- Tailwind CSS via CDN
- JS vanilla (modal de reserva, máscara de telefone, cálculo ao vivo, menu mobile)
- Backend: Google Apps Script → Google Sheet (ver [backend-setup.md](backend-setup.md))

## Rodar local

```bash
python -m http.server 8000
```

Acesse [http://localhost:8000](http://localhost:8000).

## Configurar captura de leads

Veja [backend-setup.md](backend-setup.md). Enquanto o endpoint não estiver configurado, o formulário funciona em modo simulado (loga no console, mostra tela de sucesso).
