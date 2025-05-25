import { useState } from 'react';
import styles from './CardForm.module.css';

function CardForm() {
  const [nome, setNome] = useState('');
  const [mensagem, setMensagem] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Cartão criado para ${nome} com mensagem: ${mensagem}`);
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.group}>
          <label className={styles.label}>Nome</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={styles.input}
          />
        </div>
        <div className={styles.group}>
          <label className={styles.label}>Mensagem</label>
          <textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            className={styles.textarea}
          />
        </div>
        <button type="submit" className={styles.button}>Criar Cartão</button>
      </form>
    </div>
  );
}

export default CardForm;