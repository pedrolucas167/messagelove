let selectedSpotifyTrack = null;

// Função para buscar músicas no Spotify
async function buscarSpotify() {
  const query = document.getElementById('buscaSpotify').value;
  const resultado = document.getElementById('resultadoSpotify');
  resultado.innerHTML = 'Buscando...';

  try {
    const response = await fetch(`http://localhost:3000/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Erro na busca do Spotify');
    const data = await response.json();

    if (data.length === 0) {
      resultado.innerHTML = '<p>Nenhuma música encontrada.</p>';
      return;
    }

    resultado.innerHTML = '';
    data.forEach(track => {
      const div = document.createElement('div');
      div.classList.add('track-item');
      div.innerHTML = `
        <img src="${track.albumImage}" width="50"/>
        <strong>${track.name}</strong> - ${track.artist}
        <button onclick="selecionarMusica('${track.url}', '${track.name}', '${track.artist}')">Selecionar</button>
      `;
      resultado.appendChild(div);
    });

  } catch (error) {
    console.error('Erro:', error);
    resultado.innerHTML = '<p>Erro na busca do Spotify.</p>';
  }
}

function selecionarMusica(url, name, artist) {
  selectedSpotifyTrack = { url, name, artist };
  document.getElementById('musicaSelecionada').innerText = `🎶 Música selecionada: ${name} - ${artist}`;
}

// Função principal de gerar cartão
function gerarCartao() {
  const nome = document.getElementById('nome').value;
  const data = document.getElementById('data').value;
  const mensagem = document.getElementById('mensagem').value;
  const fotoFile = document.getElementById('foto').files[0];
  const mp3File = document.getElementById('mp3').files[0];

  const preview = document.getElementById('preview');
  preview.innerHTML = '';

  const title = document.createElement('h3');
  title.innerText = nome;
  preview.appendChild(title);

  const dataTexto = document.createElement('p');
  dataTexto.innerText = `Juntos desde: ${data}`;
  preview.appendChild(dataTexto);

  const mensagemTexto = document.createElement('p');
  mensagemTexto.innerText = mensagem;
  preview.appendChild(mensagemTexto);

  if (fotoFile) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(fotoFile);
    preview.appendChild(img);
  }

  if (selectedSpotifyTrack) {
    const iframe = document.createElement('iframe');
    const embedUrl = selectedSpotifyTrack.url.replace('open.spotify.com/track/', 'open.spotify.com/embed/track/');
    iframe.src = embedUrl;
    iframe.width = "300";
    iframe.height = "80";
    iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    iframe.frameBorder = "0";
    preview.appendChild(iframe);
  }

  if (mp3File) {
    const audio = document.createElement('audio');
    audio.controls = true;
    const source = document.createElement('source');
    source.src = URL.createObjectURL(mp3File);
    source.type = "audio/mpeg";
    audio.appendChild(source);
    preview.appendChild(audio);
  }

  const cardData = {
    nome,
    data,
    mensagem,
    spotifyUrl: selectedSpotifyTrack ? selectedSpotifyTrack.url : '',
    fotoUrl: fotoFile ? URL.createObjectURL(fotoFile) : '',
    mp3Url: mp3File ? URL.createObjectURL(mp3File) : ''
  };

  fetch('http://localhost:3001/api/cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cardData)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Link gerado:', data.link);
      alert(`Cartão criado! Acesse: ${data.link}`);
      window.location.href = data.link;
    })
    .catch(error => {
      console.error('Erro ao criar cartão:', error);
      alert('Erro ao criar cartão. Tente novamente.');
    });
}
