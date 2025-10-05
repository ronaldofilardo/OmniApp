import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      'primary-green': string;
      'primary-blue': string;
      'primary-red': string;
      'secondary-yellow': string;
      'secondary-purple': string;
      'secondary-gray': string;
      'feedback-success': string;
      'feedback-error': string;
      'feedback-loading': string;
      'feedback-highlight': string;
      'background': string;
      'text': string;
      'border': string;
      // allow extra keys
      [key: string]: string;
    };
  }
}
