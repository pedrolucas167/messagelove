function gerarCartao() {
  const nome = document.getElementById('nome').value;
  const data = document.getElementById('data').value;
  const mensagem = document.getElementById('mensagem').value;
  const spotify = document.getElementById('spotify').value;
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

  if (spotify) {
    const iframe = document.createElement('iframe');
    iframe.src = `https://open.spotify.com/embed/track/${spotify}`;
    iframe.width = "300";
    iframe.height = "80";
    iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
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
    spotify,
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
      console.log('Link gerado:', data.link); // Para depuração
      alert(`Cartão criado! Acesse: ${data.link}`);
      window.location.href = data.link;
    })
    .catch(error => {
      console.error('Erro ao criar cartão:', error);
      alert('Erro ao criar cartão. Tente novamente.');
    });
}