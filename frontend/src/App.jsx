import { Outlet } from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <header className="main-header">
        <div className="container">
          <h1>Crie um Cartão Especial</h1>
          <p className="subtitle">Compartilhe seu amor com mensagens, fotos e músicas</p>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="main-footer">
        <div className="container">
          <p>
            <span>Messagelove © {new Date().getFullYear()}</span>
            <span>Feito com ❤️ por Pedro Marques</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;