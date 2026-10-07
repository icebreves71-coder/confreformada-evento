/**
 * @OnlyCurrentDoc  (o script só tem acesso a esta planilha)
 *
 * Recebe as inscrições do site e grava numa Planilha Google.
 *
 * A planilha terá duas abas:
 *  - "Inscrições 2026": todas as inscrições, com todos os campos.
 *  - "Remarketing 2027": somente quem marcou "Quero receber convites das próximas edições".
 *    Já está no formato aceito pela Meta (Instagram/Facebook) para "Público personalizado":
 *    Arquivo > Fazer download > CSV, e envie no Gerenciador de Anúncios > Públicos.
 *    A mesma lista serve para lista de transmissão no WhatsApp e para e-mail marketing.
 *
 * COMO CONFIGURAR (uma vez só):
 * 1. Crie uma planilha no Google Planilhas (ex.: "Conferência Reformada do Marajó").
 * 2. Menu Extensões > Apps Script. Apague o conteúdo e cole este arquivo inteiro. Salve.
 * 3. Clique em Implantar > Nova implantação > tipo "App da Web".
 *      - Executar como: Eu
 *      - Quem pode acessar: Qualquer pessoa
 *    Autorize o acesso quando o Google pedir.
 * 4. Copie a URL do App da Web (termina em /exec) e cole em ENDPOINT,
 *    no fim do arquivo inscricao.html.
 * Se você já tinha implantado a versão anterior: cole este código, salve e use
 * Implantar > Gerenciar implantações > editar (lápis) > Nova versão. A URL continua a mesma.
 */

const ABA_INSCRICOES = 'Inscrições 2026';
const ABA_REMARKETING = 'Remarketing 2027';

const COLUNAS = [
  ['data_inscricao', 'Data da inscrição'],
  ['nome', 'Nome completo'],
  ['email', 'E-mail'],
  ['cpf', 'CPF'],
  ['telefone', 'Telefone (WhatsApp)'],
  ['nascimento', 'Data de nascimento'],
  ['genero', 'Gênero'],
  ['profissao', 'Profissão'],
  ['igreja', 'Igreja'],
  ['funcao', 'Função na igreja'],
  ['participacao', 'Tipo de participação'],
  ['primeira_vez', 'Primeira vez'],
  ['cep', 'CEP'],
  ['rua', 'Rua'],
  ['numero', 'Número'],
  ['complemento', 'Complemento'],
  ['bairro', 'Bairro'],
  ['cidade', 'Cidade'],
  ['estado', 'Estado'],
  ['pais', 'País'],
  ['consentimento', 'Consentimento (inscrição)'],
  ['aceita_novidades', 'Aceita convites das próximas edições'],
  ['uso_imagem', 'Autoriza uso de imagem e voz']
];

// Cabeçalhos no padrão da Meta (Públicos personalizados) + colunas de apoio
const COLUNAS_REMARKETING = ['email', 'phone', 'fn', 'ln', 'ct', 'st', 'country', 'doby', 'igreja', 'edicao_origem', 'data_optin'];

function aba(nome, cabecalho) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(nome);
  if (!sh) {
    // aproveita a aba vazia padrão ("Página1") de uma planilha nova
    const vazia = ss.getSheets().find(s => s.getLastRow() === 0 && !/Inscrições|Remarketing/.test(s.getName()));
    sh = vazia ? vazia.setName(nome) : ss.insertSheet(nome);
  }
  // cria o cabeçalho, ou acrescenta colunas novas quando o formulário ganha campos
  if (sh.getLastRow() === 0 || sh.getLastColumn() < cabecalho.length) {
    sh.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);

    // 1) Todas as inscrições
    // o apóstrofo mantém CPF, CEP e telefone como texto (sem perder zeros à esquerda)
    aba(ABA_INSCRICOES, COLUNAS.map(c => c[1])).appendRow(COLUNAS.map(([k]) => {
      const v = (d[k] || '').toString();
      return ['cpf', 'cep', 'telefone', 'nascimento', 'numero'].includes(k) && v ? "'" + v : v;
    }));

    // 2) Lista de remarketing: só com consentimento explícito (LGPD)
    if (d.aceita_novidades === 'Sim') {
      const partes = (d.nome || '').trim().split(/\s+/);
      const fone = (d.telefone || '').replace(/\D/g, '');
      const ano = ((d.nascimento || '').match(/(\d{4})$/) || [])[1] || '';
      aba(ABA_REMARKETING, COLUNAS_REMARKETING).appendRow([
        (d.email || '').trim().toLowerCase(),
        fone ? "'55" + fone : '',
        partes[0] || '',
        partes.length > 1 ? partes[partes.length - 1] : '',
        d.cidade || '',
        d.estado || '',
        'BR',
        ano,
        d.igreja || '',
        '4ª Conferência (2026)',
        d.data_inscricao || ''
      ]);
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
