// Este arquivo roda no navegador. O navegador conversa com o server.js
// pelas rotas /api; a senha do banco nunca é enviada para o navegador.
const lista = document.getElementById('lista-categorias')
const formulario = document.getElementById('form-categoria')
const campoDescricao = document.getElementById('descricao')
const mensagem = document.getElementById('mensagem')

let categorias = []
let idEmEdicao = null

async function carregarCategorias() {
    lista.innerHTML = '<li class="lista-vazia">Carregando...</li>'
    try {
        const resposta = await fetch('/api/categorias')
        const dados = await resposta.json()
        if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível carregar as categorias')
        categorias = dados
        renderizarLista()
    } catch (erro) {
        lista.innerHTML = ''
        mostrarMensagem(`Erro: ${erro.message}`, 'erro')
    }
}

function renderizarLista() {
    lista.innerHTML = ''
    if (categorias.length === 0) {
        lista.innerHTML = '<li class="lista-vazia">Nenhuma categoria cadastrada!</li>'
        return
    }
    for (const categoria of categorias) {
        lista.appendChild(categoria.id_categoria === idEmEdicao
            ? criarItemEdicao(categoria)
            : criarItemVisualizacao(categoria))
    }
}

function criarItemVisualizacao(categoria) {
    const item = document.createElement('li')
    item.className = 'categoria-item'

    const info = document.createElement('span')
    info.className = 'categoria-info'
    info.textContent = `#${categoria.id_categoria} ${categoria.descricao}`

    const btnEditar = document.createElement('button')
    btnEditar.type = 'button'
    btnEditar.textContent = 'Editar'
    btnEditar.className = 'btn btn-editar'
    btnEditar.addEventListener('click', () => {
        idEmEdicao = categoria.id_categoria
        renderizarLista()
    })

    const btnExcluir = document.createElement('button')
    btnExcluir.type = 'button'
    btnExcluir.textContent = 'Excluir'
    btnExcluir.className = 'btn btn-excluir'
    btnExcluir.addEventListener('click', () => excluirCategoria(categoria.id_categoria))

    const acoes = document.createElement('div')
    acoes.className = 'categoria-acoes'
    acoes.append(btnEditar, btnExcluir)
    item.append(info, acoes)
    return item
}

function criarItemEdicao(categoria) {
    const item = document.createElement('li')
    item.className = 'categoria-item categoria-item-edicao'

    const input = document.createElement('input')
    input.type = 'text'
    input.value = categoria.descricao
    input.className = 'input-edicao'
    input.setAttribute('aria-label', 'Descrição da categoria')

    const btnSalvar = document.createElement('button')
    btnSalvar.type = 'button'
    btnSalvar.textContent = 'Salvar'
    btnSalvar.className = 'btn btn-salvar'
    btnSalvar.addEventListener('click', () => editarCategoria(categoria.id_categoria, input.value))

    const btnCancelar = document.createElement('button')
    btnCancelar.type = 'button'
    btnCancelar.textContent = 'Cancelar'
    btnCancelar.className = 'btn btn-cancelar'
    btnCancelar.addEventListener('click', () => {
        idEmEdicao = null
        renderizarLista()
    })

    input.addEventListener('keydown', (evento) => {
        if (evento.key === 'Enter') editarCategoria(categoria.id_categoria, input.value)
        if (evento.key === 'Escape') {
            idEmEdicao = null
            renderizarLista()
        }
    })

    const acoes = document.createElement('div')
    acoes.className = 'categoria-acoes'
    acoes.append(btnSalvar, btnCancelar)
    item.append(input, acoes)
    input.focus()
    return item
}

async function editarCategoria(id, descricao) {
    const descricaoLimpa = descricao.trim()
    if (!descricaoLimpa) return mostrarMensagem('Informe a descrição.', 'erro')
    try {
        const resposta = await fetch(`/api/categorias/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descricao: descricaoLimpa })
        })
        const dados = await resposta.json()
        if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível editar')
        idEmEdicao = null
        mostrarMensagem(`Categoria "${dados.descricao}" atualizada!`)
        await carregarCategorias()
    } catch (erro) {
        mostrarMensagem(`Erro: ${erro.message}`, 'erro')
    }
}

async function excluirCategoria(id) {
    if (!confirm('Tem certeza de que deseja excluir esta categoria?')) return
    try {
        const resposta = await fetch(`/api/categorias/${id}`, { method: 'DELETE' })
        const dados = await resposta.json()
        if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível excluir')
        mostrarMensagem(`Categoria "${dados.descricao}" excluída!`)
        await carregarCategorias()
    } catch (erro) {
        mostrarMensagem(`Erro: ${erro.message}`, 'erro')
    }
}

formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault()
    const descricao = campoDescricao.value.trim()
    if (!descricao) return mostrarMensagem('Informe a descrição.', 'erro')
    try {
        const resposta = await fetch('/api/categorias', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descricao })
        })
        const dados = await resposta.json()
        if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível cadastrar')
        mostrarMensagem(`Categoria "${dados.descricao}" cadastrada!`)
        campoDescricao.value = ''
        await carregarCategorias()
    } catch (erro) {
        mostrarMensagem(`Erro: ${erro.message}`, 'erro')
    }
})

formulario.addEventListener('reset', () => mostrarMensagem(''))

function mostrarMensagem(texto, tipo = 'sucesso') {
    mensagem.textContent = texto
    mensagem.className = texto ? `mensagem mensagem-${tipo}` : 'mensagem'
}

carregarCategorias()
