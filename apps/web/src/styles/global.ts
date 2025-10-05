import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body, #root {
    height: 100%; // Garante que o layout ocupe a tela toda
  }

  /* Estilos para o React Datepicker */
  .react-datepicker-wrapper {
    width: 100%;
  }

  .react-datepicker__input-container input {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    background-color: #EDEDED;
    color: ${({ theme }) => theme.colors.text};
  }

  
  body {
    -webkit-font-smoothing: antialiased;
    background-color: #FAFAFA;
    color: #272221;
  }

  body, input, textarea, button {
    font-family: 'Roboto', sans-serif;
    font-weight: 400;
    font-size: 1rem;
  }

  button {
    cursor: pointer;
  }

  a {
    text-decoration: none;
  }
`;
