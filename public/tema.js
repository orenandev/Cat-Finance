try {
  var tema = localStorage.getItem('catfinance:tema')
  var escuro = tema === 'escuro' || (tema !== 'claro' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', escuro)
} catch (erro) {
  document.documentElement.classList.remove('dark')
}
