# HEX TO THINK

Site e distribuição pública do HEX TO THINK para Windows.

- Site: https://valteromega2019-blip.github.io/hex-to-think/
- Instaladores: https://github.com/valteromega2019-blip/hex-to-think/releases
- Canal de atualização: `updates.json`, manifesto assinado pelo projeto.

O conversor é a ferramenta principal. O gerador de paletas é experimental.
O aplicativo converte e mantém a biblioteca localmente, sem conta e sem conexão obrigatória.

Este repositório contém o site estático, a demonstração web e os metadados de distribuição. A demonstração usa sRGB/D65 e CIEDE2000; o aplicativo usa Little CMS e os perfis ICC selecionados. Os resultados podem variar.

A base Pantone é parcial, de aproximações de terceiros, e não representa valores oficiais. Leia [NOTICE.md](NOTICE.md). Confira as cores físicas antes da produção.

## Publicação

GitHub Pages a partir de `main`, pasta raiz. Não há build, dependências, testes ou scripts de validação na publicação.

## Atualizações

O aplicativo confere a assinatura RSA SHA-256 do manifesto e do instalador, além do hash SHA-256. A chave privada não é publicada. Essa assinatura de atualização não é um certificado Authenticode de editor do Windows.
