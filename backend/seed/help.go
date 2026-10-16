package seed

import (
	"fazbrike-backend/models"
	"log"

	"gorm.io/gorm"
)

// SeedLegalDocuments cria os termos e políticas que ainda não existem.
// Nunca sobrescreve: depois do primeiro boot o texto é mantido pelo admin.
func SeedLegalDocuments(db *gorm.DB) error {
	for _, document := range defaultLegalDocuments() {
		var count int64
		if err := db.Model(&models.LegalDocument{}).Where("slug = ?", document.Slug).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			continue
		}
		document.Published = true
		if err := db.Create(&document).Error; err != nil {
			return err
		}
		log.Printf("legal: documento %s criado", document.Slug)
	}
	return nil
}

// SeedHelpArticles cria as perguntas frequentes iniciais só quando a central
// está vazia, para não recriar perguntas apagadas pelo admin.
func SeedHelpArticles(db *gorm.DB) error {
	var count int64
	if err := db.Model(&models.HelpArticle{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	articles := defaultHelpArticles()
	for i := range articles {
		articles[i].Published = true
	}
	if err := db.Create(&articles).Error; err != nil {
		return err
	}
	log.Printf("help: %d perguntas iniciais criadas", len(articles))
	return nil
}

func defaultHelpArticles() []models.HelpArticle {
	return []models.HelpArticle{
		{Category: "conta", Position: 1, Title: "Como crio minha conta?",
			Body: "Toque em Entrar e escolha Criar conta. Informe nome, e-mail e uma senha com pelo menos 8 caracteres e aceite os Termos de Uso e a Política de Privacidade. Enviamos um código para o seu e-mail: digite-o para ativar a conta."},
		{Category: "conta", Position: 2, Title: "Não recebi o código de verificação",
			Body: "Confira a caixa de spam e a aba Promoções. O código vale por tempo limitado; na tela de verificação use Reenviar código. Se o problema continuar, abra um chamado nesta central com o assunto Minha conta."},
		{Category: "conta", Position: 3, Title: "Como altero meus dados e minha foto?",
			Body: "Acesse Meu perfil e use Editar perfil para mudar nome, bio, telefone e cidade. A foto e a capa são trocadas tocando nos ícones de câmera do perfil."},
		{Category: "conta", Position: 4, Title: "Como excluo minha conta?",
			Body: "Abra um chamado nesta central com o assunto Excluir minha conta, usando a conta que deseja remover. Confirmamos o pedido e excluímos seus dados pessoais, anúncios e mensagens, exceto o que a lei nos obriga a guardar (veja a Política de Privacidade)."},
		{Category: "anuncios", Position: 1, Title: "Como publico um anúncio?",
			Body: "Toque em Vender, escolha a categoria, preencha título, descrição, preço, estado de conservação e cidade, e envie fotos reais do item. Anúncios claros e com boas fotos vendem mais rápido."},
		{Category: "anuncios", Position: 2, Title: "Meu anúncio está em análise. O que isso significa?",
			Body: "Quando a moderação está ativa, novos anúncios e anúncios editados passam por uma revisão rápida antes de ficarem visíveis. Se algo precisar ser corrigido, você verá o motivo no seu perfil e poderá editar o anúncio."},
		{Category: "anuncios", Position: 3, Title: "Por que meu anúncio foi retirado?",
			Body: "Anúncios que descumprem as Regras de Publicação (itens proibidos, informações enganosas, duplicados ou conteúdo ofensivo) podem ser retirados após denúncia ou análise da equipe. O motivo aparece nas suas notificações e no seu perfil. Se discordar, abra um chamado com o assunto Anúncio."},
		{Category: "anuncios", Position: 4, Title: "Como marco um item como vendido ou pauso o anúncio?",
			Body: "Em Meu perfil, na lista Meus anúncios, use Marcar vendido ou Pausar. Anúncios pausados deixam de aparecer nas buscas e podem ser reativados quando quiser."},
		{Category: "compras", Position: 1, Title: "Como falo com o vendedor?",
			Body: "Na página do anúncio, escreva sua mensagem em Fale com o anunciante. A conversa fica em Mensagens. Mantenha a negociação dentro do Fazbrike: assim temos registro caso algo dê errado."},
		{Category: "compras", Position: 2, Title: "O Fazbrike intermedeia o pagamento ou a entrega?",
			Body: "Não. O Fazbrike aproxima compradores e vendedores; pagamento, entrega e garantia são combinados diretamente entre as partes. Por isso, siga as dicas de segurança antes de pagar."},
		{Category: "seguranca", Position: 1, Title: "Dicas para comprar e vender com segurança",
			Body: "Prefira encontros em locais públicos e movimentados, durante o dia. Confira o item antes de pagar. Desconfie de preços muito abaixo do mercado, de pedidos de pagamento antecipado e de links enviados por mensagem. Nunca informe senhas ou códigos recebidos por SMS ou e-mail."},
		{Category: "seguranca", Position: 2, Title: "Recebi uma mensagem suspeita. O que faço?",
			Body: "Não clique em links nem faça pagamentos. Denuncie o anúncio relacionado e, se preferir, abra um chamado com o assunto Denúncia contando o que aconteceu."},
		{Category: "denuncias", Position: 1, Title: "Como denuncio um anúncio?",
			Body: "Na página do anúncio, toque em Denunciar, escolha o motivo e, se quiser, descreva o problema. Cada pessoa pode ter uma denúncia aberta por anúncio. A denúncia é anônima para o anunciante."},
		{Category: "denuncias", Position: 2, Title: "O que acontece depois da denúncia?",
			Body: "Nossa equipe analisa cada denúncia. Se houver violação das regras, o anúncio é retirado e o anunciante é avisado do motivo. Você recebe uma notificação quando a análise terminar."},
		{Category: "privacidade", Position: 1, Title: "Quais dados meus ficam visíveis para outras pessoas?",
			Body: "No perfil público aparecem nome, foto, capa, bio, cidade e seus anúncios ativos. Seu e-mail nunca é exibido. O telefone só aparece se você o cadastrar no perfil. Você pode deixar o perfil privado em Editar perfil."},
		{Category: "privacidade", Position: 2, Title: "Como peço uma cópia ou a correção dos meus dados?",
			Body: "Abra um chamado com o assunto Privacidade e dados informando o que deseja: acesso, correção, portabilidade ou exclusão. Respondemos dentro do prazo previsto na LGPD."},
	}
}

func defaultLegalDocuments() []models.LegalDocument {
	return []models.LegalDocument{
		{
			Slug:    models.LegalSlugTerms,
			Title:   "Termos de Uso",
			Summary: "Regras para usar o Fazbrike: cadastro, anúncios, negociações e responsabilidades.",
			Version: "1.0",
			Content: termsOfUse,
		},
		{
			Slug:    models.LegalSlugPrivacy,
			Title:   "Política de Privacidade",
			Summary: "Quais dados coletamos, para que usamos, com quem compartilhamos e como exercer seus direitos (LGPD).",
			Version: "1.0",
			Content: privacyPolicy,
		},
		{
			Slug:    models.LegalSlugRules,
			Title:   "Regras de Publicação",
			Summary: "O que pode e o que não pode ser anunciado, e como funcionam as denúncias.",
			Version: "1.0",
			Content: publishingRules,
		},
		{
			Slug:    models.LegalSlugCookies,
			Title:   "Política de Cookies",
			Summary: "Como o site usa cookies e armazenamento local do navegador.",
			Version: "1.0",
			Content: cookiePolicy,
		},
	}
}

const termsOfUse = `Estes Termos de Uso regem o acesso e o uso do site fazbrike.com.br e do aplicativo Fazbrike (juntos, a "Plataforma"). Ao criar uma conta ou usar a Plataforma, você declara que leu e concorda com estes Termos, com a Política de Privacidade e com as Regras de Publicação.

## 1. O que é o Fazbrike
O Fazbrike é um espaço online de classificados em que pessoas publicam anúncios de produtos, veículos e imóveis e conversam com interessados. O Fazbrike não é parte das negociações: não vende, não compra, não recebe pagamentos, não entrega itens e não garante a qualidade, a existência ou a legalidade do que é anunciado.

## 2. Cadastro
- Você precisa ter 18 anos ou mais para criar uma conta.
- As informações do cadastro devem ser verdadeiras e mantidas atualizadas.
- A conta é pessoal e intransferível. Você é responsável pela guarda da sua senha e por toda atividade feita com ela.
- Podemos pedir a confirmação do e-mail e de outros dados para manter a segurança da comunidade.

## 3. Anúncios
- O anunciante é o único responsável pelo conteúdo do anúncio, pelas fotos e pela veracidade das informações.
- Só anuncie itens que você tem o direito de vender ou alugar e que estejam de acordo com a lei e com as Regras de Publicação.
- Podemos analisar, pedir correções, pausar ou retirar anúncios que descumpram estes Termos, com ou sem denúncia prévia.
- Ao publicar, você nos autoriza a exibir o conteúdo do anúncio na Plataforma e em divulgações da própria Plataforma, enquanto ele estiver ativo.

## 4. Negociações entre usuários
- Preço, pagamento, entrega, garantia e devolução são combinados diretamente entre comprador e vendedor.
- Recomendamos manter as conversas dentro da Plataforma e seguir as dicas de segurança da Central de Ajuda.
- O Fazbrike não se responsabiliza por prejuízos decorrentes de negociações entre usuários, mas colabora com as autoridades quando solicitado na forma da lei.

## 5. Condutas proibidas
- Publicar conteúdo falso, enganoso, ofensivo, discriminatório ou que viole direitos de terceiros.
- Aplicar golpes, pedir dados bancários ou senhas, ou enviar links maliciosos.
- Enviar mensagens em massa, spam ou propaganda não relacionada a um anúncio.
- Coletar dados de outros usuários ou acessar a Plataforma por meios automatizados sem autorização.
- Tentar burlar a moderação, criar várias contas para contornar suspensões ou denunciar de má-fé.

## 6. Denúncias e moderação
Qualquer usuário pode denunciar um anúncio. A equipe analisa as denúncias e pode retirar anúncios, limitar funcionalidades ou suspender contas que violem estes Termos. O anunciante é avisado do motivo e pode contestar pela Central de Ajuda.

## 7. Suspensão e encerramento
Você pode encerrar sua conta a qualquer momento pela Central de Ajuda. Podemos suspender ou encerrar contas que violem estes Termos ou a lei, preservando os registros exigidos pela legislação.

## 8. Propriedade intelectual
A marca, o layout e o software do Fazbrike pertencem aos seus titulares. O conteúdo dos anúncios continua sendo do anunciante, que garante ter os direitos sobre textos e fotos publicados.

## 9. Limitação de responsabilidade
A Plataforma é oferecida como está. Trabalhamos para mantê-la disponível e segura, mas não garantimos funcionamento ininterrupto nem nos responsabilizamos por conteúdo publicado por usuários ou por negociações entre eles, nos limites permitidos pela lei.

## 10. Alterações destes Termos
Podemos atualizar estes Termos. A versão e a data da última atualização ficam no topo desta página. Mudanças relevantes serão comunicadas na Plataforma; o uso continuado após a mudança significa concordância com a nova versão.

## 11. Lei aplicável e contato
Estes Termos são regidos pelas leis brasileiras, incluindo o Código de Defesa do Consumidor, o Marco Civil da Internet e a Lei Geral de Proteção de Dados. Dúvidas e reclamações podem ser enviadas pela Central de Ajuda.`

const privacyPolicy = `Esta Política explica como o Fazbrike trata os dados pessoais de quem usa o site fazbrike.com.br e o aplicativo Fazbrike, em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018 — LGPD).

## 1. Quem é o controlador
O Fazbrike é o controlador dos dados pessoais tratados na Plataforma. Pedidos, dúvidas e solicitações sobre privacidade são recebidos pela Central de Ajuda, no assunto Privacidade e dados, que funciona como canal de comunicação com o encarregado de proteção de dados.

## 2. Dados que coletamos
- Cadastro: nome, e-mail e senha (guardada somente em formato criptografado).
- Perfil: foto, capa, bio, telefone, site, cidade e estado, quando você os informa.
- Localização aproximada: a cidade escolhida no perfil ou no anúncio, usada para mostrar anúncios próximos. Não coletamos a localização GPS do aparelho.
- Anúncios: textos, fotos, preço, categoria e cidade do item.
- Interações: mensagens e anexos trocados entre usuários, perguntas nos anúncios, favoritos, seguidores, avaliações e denúncias.
- Uso: anúncios visualizados, data e hora de acesso, endereço IP e informações técnicas do navegador ou do aparelho.
- Aparelho: identificador para envio de notificações push, plataforma e versão do aplicativo, quando você permite notificações.
- Atendimento: dados que você envia em chamados da Central de Ajuda.

## 3. Para que usamos
- Criar e manter sua conta e autenticar seu acesso (execução de contrato).
- Publicar anúncios, exibir perfis e permitir conversas entre usuários (execução de contrato).
- Enviar códigos de verificação, avisos sobre sua conta e notificações de atividade (execução de contrato e legítimo interesse).
- Prevenir fraudes, analisar denúncias e moderar conteúdo (legítimo interesse e proteção da comunidade).
- Melhorar a Plataforma com estatísticas de uso agregadas (legítimo interesse).
- Cumprir obrigações legais, como a guarda de registros de acesso exigida pelo Marco Civil da Internet (obrigação legal).

## 4. O que fica público
Nome, foto, capa, bio, cidade e anúncios ativos aparecem no seu perfil público e nos anúncios. O telefone só aparece se você o cadastrar. Seu e-mail nunca é exibido para outros usuários. Você pode deixar o perfil privado nas configurações do perfil.

## 5. Com quem compartilhamos
Não vendemos dados pessoais. Compartilhamos apenas o necessário com:
- Provedores de infraestrutura e hospedagem que mantêm a Plataforma no ar.
- Serviço de envio de e-mails transacionais (por exemplo, códigos de verificação).
- Serviço de armazenamento de arquivos, para guardar fotos e anexos.
- Serviço de notificações push do sistema do seu aparelho, quando ativado.
- Autoridades públicas, mediante ordem judicial ou requisição prevista em lei.
Esses parceiros tratam os dados em nosso nome e seguindo nossas instruções. Alguns podem estar fora do Brasil; nesses casos adotamos as salvaguardas previstas na LGPD.

## 6. Por quanto tempo guardamos
- Dados da conta e anúncios: enquanto a conta estiver ativa.
- Após a exclusão da conta: removemos ou anonimizamos os dados, exceto registros de acesso, guardados por 6 meses (Marco Civil da Internet), e informações necessárias para cumprir obrigações legais ou defender direitos em processos.
- Chamados e denúncias: pelo tempo necessário para a análise e pelos prazos legais aplicáveis.

## 7. Seus direitos
Você pode pedir, a qualquer momento: confirmação de que tratamos seus dados, acesso, correção, anonimização, bloqueio ou eliminação de dados desnecessários, portabilidade, informação sobre compartilhamentos, revogação de consentimento e exclusão da conta. Parte desses pedidos pode ser feita direto no perfil; os demais, pela Central de Ajuda, no assunto Privacidade e dados. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).

## 8. Segurança
Usamos conexão criptografada (HTTPS), senhas com hash, controle de acesso restrito à equipe e validação de arquivos enviados. Nenhum sistema é totalmente imune a incidentes; se algum ocorrer e trouxer risco relevante, comunicaremos os titulares e a ANPD.

## 9. Crianças e adolescentes
A Plataforma é destinada a maiores de 18 anos. Não coletamos intencionalmente dados de menores; se identificarmos uma conta de menor, ela será encerrada.

## 10. Cookies
O uso de cookies e do armazenamento local do navegador está descrito na Política de Cookies.

## 11. Alterações
Esta Política pode ser atualizada. A versão e a data da última atualização ficam no topo desta página, e mudanças relevantes serão avisadas na Plataforma.`

const publishingRules = `Estas regras mantêm o Fazbrike seguro e confiável. Anúncios que as descumprem podem ser recusados na análise ou retirados após denúncia, e contas reincidentes podem ser suspensas.

## Itens proibidos
- Armas de fogo, munições, explosivos e acessórios de uso restrito.
- Drogas, medicamentos controlados, anabolizantes e produtos sem registro na Anvisa.
- Animais silvestres ou em extinção, e produtos derivados deles.
- Produtos falsificados, piratas ou que violem marcas e direitos autorais.
- Itens roubados, de origem ilícita ou sem nota quando a nota for exigida.
- Documentos, contas de serviços, dados pessoais, cartões e moedas virtuais de origem duvidosa.
- Conteúdo adulto, serviços sexuais e qualquer conteúdo envolvendo menores.
- Produtos perigosos, recolhidos (recall) ou proibidos pela legislação brasileira.

## Anúncios enganosos
- Fotos devem ser do item anunciado; não use imagens de catálogo que escondam defeitos.
- Título, descrição, preço e estado de conservação devem corresponder ao item real.
- Não anuncie preço simbólico (como R$ 1) para atrair contato.
- Não publique o mesmo item mais de uma vez nem em categorias erradas.

## Conduta
- Nada de linguagem ofensiva, discriminatória ou que incite violência.
- Não peça pagamento antecipado fora de meios seguros nem envie links externos suspeitos.
- Não use o anúncio para divulgar outros sites, redes sociais ou serviços.

## Como denunciar
Na página do anúncio, toque em Denunciar e escolha o motivo: produto proibido ou ilegal, suspeita de fraude, informações enganosas, anúncio duplicado, conteúdo ofensivo ou outro motivo. A identidade de quem denuncia não é revelada ao anunciante.

## O que acontece depois
A equipe analisa cada denúncia. Se houver violação, o anúncio é retirado e o anunciante recebe o motivo por notificação. Quem denunciou é avisado quando a análise termina. Denúncias falsas ou feitas de má-fé também violam os Termos de Uso.

## Contestação
Se o seu anúncio foi retirado e você discorda, abra um chamado na Central de Ajuda com o assunto Anúncio, informando o anúncio e o motivo da contestação.`

const cookiePolicy = `Esta Política explica como o site fazbrike.com.br usa cookies e tecnologias parecidas.

## O que usamos
- Armazenamento local do navegador (localStorage), para manter você conectado depois do login e lembrar a opção "Lembrar de mim".
Hoje o site não grava cookies próprios. Não usamos cookies de publicidade, de rastreamento ou de redes sociais, nem compartilhamos esses dados com redes de anúncios.

## Aplicativo
O aplicativo guarda a sessão em armazenamento seguro do próprio aparelho e não usa cookies de navegador.

## Como controlar
Você pode apagar os dados do site nas configurações do seu navegador ou sair da conta a qualquer momento. Sem o armazenamento necessário, o login e algumas funções deixam de funcionar.

## Alterações
Se passarmos a usar outros tipos de cookies, esta Política será atualizada antes, com aviso no site.`
