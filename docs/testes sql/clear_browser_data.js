// Script para limpar dados corrompidos do navegador
console.log('🧹 Limpando dados corrompidos do navegador...')

// Instruções para o usuário
console.log(`
📋 INSTRUÇÕES PARA LIMPAR DADOS CORROMPIDOS:

1. Abra o DevTools (F12) no navegador
2. Vá para a aba Application/Storage
3. Limpe os seguintes itens:
   - Local Storage: sb-lfasosnfehtkzybvdngz-auth-token
   - Session Storage: todos os itens
   - Cookies: todos os cookies do domínio localhost:3000

4. Ou execute este código no Console do navegador:

// Limpar localStorage
localStorage.removeItem('sb-lfasosnfehtkzybvdngz-auth-token')
localStorage.removeItem('sb-lfasosnfehtkzybvdngz-auth-token-code-verifier')
localStorage.clear()

// Limpar sessionStorage
sessionStorage.clear()

// Limpar cookies
document.cookie.split(';').forEach(cookie => {
  const eqPos = cookie.indexOf('=')
  const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
  document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
})

console.log('✅ Dados limpos! Recarregue a página.')

5. Recarregue a página (Ctrl+F5)
`)

console.log('\n🔧 Após limpar, teste o login com:')
console.log('Email: admin@petshop.demo')
console.log('Senha: admin123456')