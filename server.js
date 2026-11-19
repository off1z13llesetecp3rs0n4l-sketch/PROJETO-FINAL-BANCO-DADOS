// Servidor da Loja do Zé: o navegador conversa com este servidor;
// somente este servidor conversa com o Neon.
require('dotenv').config({ quiet: true })
const http = require('http')
const fs = require('fs')
const path = require('path')
const { executarQueryNeon } = require('./script_db_quantum.js')

const PORTA = process.env.PORT || 3001
const arquivos = {
    '/': { arquivo: 'index.html', tipo: 'text/html; charset=utf-8' },
    '/index.html': { arquivo: 'index.html', tipo: 'text/html; charset=utf-8' },
    '/app.js': { arquivo: 'app.js', tipo: 'text/javascript; charset=utf-8' },
    '/style.css': { arquivo: 'style.css', tipo: 'text/css; charset=utf-8' }
}

function responderJSON(res, status, dados) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify(dados))
}

function lerCorpo(req) {
    return new Promise((resolve, reject) => {
        let corpo = ''
        req.on('data', pedaco => {
            corpo += pedaco
            if (corpo.length > 1_000_000) {
                reject(new Error('Corpo demasiado grande'))
                req.destroy()
            }
        })
        req.on('end', () => {
            try { resolve(JSON.parse(corpo || '{}')) }
            catch (erro) { reject(erro) }
        })
        req.on('error', reject)
    })
}

const servidor = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)

    if (url.pathname === '/api/categorias' && req.method === 'GET') {
        const linhas = await executarQueryNeon('SELECT * FROM categoria ORDER BY id_categoria')
        if (linhas === null) return responderJSON(res, 500, { erro: 'Falha ao consultar o banco' })
        return responderJSON(res, 200, linhas)
    }

    if (url.pathname === '/api/categorias' && req.method === 'POST') {
        let corpo
        try { corpo = await lerCorpo(req) }
        catch { return responderJSON(res, 400, { erro: 'JSON inválido' }) }
        const descricao = String(corpo.descricao || '').trim()
        if (!descricao) return responderJSON(res, 400, { erro: 'Informe a descrição' })
        const linhas = await executarQueryNeon(
            'INSERT INTO categoria (descricao) VALUES ($1) RETURNING *', [descricao]
        )
        if (linhas === null) return responderJSON(res, 500, { erro: 'Falha ao inserir no banco' })
        return responderJSON(res, 201, linhas[0])
    }

    const correspondencia = url.pathname.match(/^\/api\/categorias\/(\d+)$/)
    if (correspondencia && req.method === 'PUT') {
        let corpo
        try { corpo = await lerCorpo(req) }
        catch { return responderJSON(res, 400, { erro: 'JSON inválido' }) }
        const id = Number(correspondencia[1])
        const descricao = String(corpo.descricao || '').trim()
        if (!descricao) return responderJSON(res, 400, { erro: 'Informe a descrição' })
        const linhas = await executarQueryNeon(
            'UPDATE categoria SET descricao = $1 WHERE id_categoria = $2 RETURNING *', [descricao, id]
        )
        if (linhas === null) return responderJSON(res, 500, { erro: 'Falha ao atualizar no banco' })
        if (linhas.length === 0) return responderJSON(res, 404, { erro: 'Categoria não encontrada' })
        return responderJSON(res, 200, linhas[0])
    }

    if (correspondencia && req.method === 'DELETE') {
        const id = Number(correspondencia[1])
        const linhas = await executarQueryNeon(
            'DELETE FROM categoria WHERE id_categoria = $1 RETURNING *', [id]
        )
        if (linhas === null) return responderJSON(res, 500, { erro: 'Falha ao excluir no banco' })
        if (linhas.length === 0) return responderJSON(res, 404, { erro: 'Categoria não encontrada' })
        return responderJSON(res, 200, linhas[0])
    }

    if (req.method === 'GET') {
        const rota = arquivos[url.pathname]
        if (rota) {
            const caminho = path.join(__dirname, rota.arquivo)
            if (!fs.existsSync(caminho)) return responderJSON(res, 404, { erro: 'Arquivo não encontrado' })
            res.writeHead(200, { 'Content-Type': rota.tipo })
            return fs.createReadStream(caminho).pipe(res)
        }
    }

    return responderJSON(res, 404, { erro: 'Página ou rota não encontrada' })
})

servidor.listen(PORTA, () => {
    console.log(`Loja do Zé rodando em http://localhost:${PORTA}`)
})
