'use strict';

const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
const PUBLIC_DIR = path.join(__dirname, 'public');

if (!require('fs').existsSync(path.join(PUBLIC_DIR, 'css', 'styles.css'))) {
  console.warn('[aviso] public/css/styles.css não existe. Execute "npm run build" para gerar o CSS.');
}

app.disable('x-powered-by');

// Cabeçalhos básicos de segurança
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Verificação de saúde (útil para o Render)
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Arquivos estáticos com cache moderado
app.use(
  express.static(PUBLIC_DIR, {
    maxAge: '1h',
    etag: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  })
);

// 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Tratamento de erros
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[erro]', err);
  res.status(500).send('Erro interno do servidor.');
});

app.listen(PORT, HOST, () => {
  console.log(`LVS Bio rodando. Abra no navegador: http://localhost:${PORT}`);
});
