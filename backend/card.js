document.addEventListener('DOMContentLoaded', function() {
  // Atualizar ano no footer
  document.getElementById('currentYear').textContent = new Date().getFullYear();
  
  // Obter ID do cartão da URL
  const urlParams = new URLSearchParams(window.location.search);
  const cardId = urlParams.get('id');
  
  if (!cardId) {
    alert('Cartão não encontrado!');
    return;
  }

  // Carregar dados do cartão
  fetch(`/api/cards/${cardId}`)
    .then(response => {
      if (!response.ok) throw new Error('Cartão não encontrado');
      return response.json();
    })
    .then(card => {
      // Preencher dados do cartão
      document.getElementById('nome').textContent = card.nome;
      
      if (card.data) {
        const dataObj = new Date(card.data);
        document.getElementById('data').textContent = `Juntos desde: ${dataObj.toLocaleDateString('pt-BR')}`;
      } else {
        document.getElementById('data').style.display = 'none';
      }
      
      document.getElementById('mensagem').textContent = card.mensagem;
      
      // Exibir foto se existir
      if (card.fotoUrl) {
        const img = document.getElementById('foto');
        img.src = card.fotoUrl;
        img.style.display = 'block';
      }
      
      // Exibir Spotify se existir
      if (card.spotifyUrl) {
        const spotifyContainer = document.getElementById('spotify-container');
        const iframe = document.getElementById('spotify');
        const trackId = card.spotifyUrl.split('/').pop();
        iframe.src = `https://open.spotify.com/embed/track/${trackId}`;
        spotifyContainer.style.display = 'block';
      }
      
      // Exibir áudio MP3 se existir
      if (card.mp3Url) {
        const audioContainer = document.getElementById('audio-container');
        const audio = document.getElementById('mp3');
        audio.querySelector('source').src = card.mp3Url;
        audio.load();
        audioContainer.style.display = 'block';
      }
    })
    .catch(error => {
      console.error('Erro ao carregar cartão:', error);
      alert('Erro ao carregar cartão: ' + error.message);
    });
});