require('dotenv').config({ quiet: true })

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error('Defina DATABASE_URL no arquivo .env')

const host = new URL(DATABASE_URL).host
const neonHttpEndpoint = `https://${host}/sql`

async function executarQueryNeon(querySQL, parametros = []) {
    try {
        const resposta = await fetch(neonHttpEndpoint, {
            method: 'POST',
            headers: {
                'Neon-Connection-String': DATABASE_URL,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: querySQL, params: parametros })
        })
        if (!resposta.ok) {
            const erroTexto = await resposta.text()
            throw new Error(`Erro HTTP ${resposta.status}: ${erroTexto}`)
        }
        const dados = await resposta.json()
        return dados.rows
    } catch (erro) {
        console.error('Falha ao comunicar com o banco:', erro.message)
        return null
    }
}

module.exports = { executarQueryNeon }
