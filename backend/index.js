require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// Importa os arquivos de rotas
const fornecedoresRoutes = require('./routes/fornecedores');
const produtosRoutes = require('./routes/produtos');
const clientesRoutes = require('./routes/clientes');
const vendasRoutes = require('./routes/vendas');
const dashboardRoutes = require('./routes/dashboard.js');
const devolucaoRoutes = require('./routes/devolucoes.js');


// Middleware essencial para o Express entender JSON
app.use(express.json());

app.use(cors());

// Rota principal da API (continua aqui, como uma "página de rosto")
app.get('/', (req, res) => {
  res.send('API de Controle de Estoque no ar!');
});

// "Plug-in" das rotas de fornecedores no nosso app
app.use('/fornecedores', fornecedoresRoutes);
app.use('/produtos', produtosRoutes);
app.use('/clientes', clientesRoutes);
app.use('/vendas', vendasRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/devolucoes', devolucaoRoutes);


// Inicia o servidor e o faz "escutar" na porta definida
app.listen(port, () => {
  console.log(`Servidor Express rodando em http://localhost:${port}`);
});