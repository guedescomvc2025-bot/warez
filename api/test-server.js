// Usando fetch nativo do Vercel
const { URL } = require('url');

// Simples contador de usuários online
let userCount = 0;

module.exports = async (req, res) => {
    // Configurar cabeçalhos CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Lidar com requisições pre-flight (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Obter o caminho da URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    
    // Rota para obter contador de usuários
    if (pathname === '/api/user-count' && req.method === 'GET') {
        return res.status(200).json({ count: userCount });
    }
    
    // Rota para testar combos
    if (pathname === '/api/test-server' && req.method === 'POST') {
        try {
            // Incrementar contador de usuários
            userCount++;
            
            // Definir timeout para decrementar o contador (usuário offline após 5 minutos)
            setTimeout(() => {
                userCount = Math.max(0, userCount - 1);
            }, 300000); // 5 minutos
            
            // Obter o corpo da requisição
            let body;
            if (typeof req.body === 'string') {
                try {
                    body = JSON.parse(req.body);
                } catch (e) {
                    body = {};
                }
            } else {
                body = req.body || {};
            }
            
            const { username, password, host } = body;
            
            if (!username || !password || !host) {
                return res.status(400).json({ error: 'Parâmetros inválidos' });
            }
            
            // Construir a URL para o servidor IPTV
            const targetUrl = `${host}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
            
            // Fazer a requisição para o servidor IPTV usando fetch nativo
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(targetUrl, {
                signal: controller.signal,
                headers: { 
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Retornar os dados para o frontend
            return res.status(200).json(data);
        } catch (error) {
            console.error('Erro no proxy:', error);
            return res.status(500).json({ error: error.message });
        }
    }
    
    // Rota não encontrada
    return res.status(404).json({ error: 'Rota não encontrada' });
};