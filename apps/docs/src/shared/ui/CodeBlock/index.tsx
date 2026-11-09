import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import groovy from 'react-syntax-highlighter/dist/esm/languages/prism/groovy';
import http from 'react-syntax-highlighter/dist/esm/languages/prism/http';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import kotlin from 'react-syntax-highlighter/dist/esm/languages/prism/kotlin';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import powershell from 'react-syntax-highlighter/dist/esm/languages/prism/powershell';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('go', go);
SyntaxHighlighter.alias('go', 'golang');
SyntaxHighlighter.registerLanguage('html', markup);
SyntaxHighlighter.registerLanguage('http', http);
SyntaxHighlighter.registerLanguage('java', java);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('kotlin', kotlin);
SyntaxHighlighter.registerLanguage('powershell', powershell);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('yaml', yaml);
SyntaxHighlighter.registerLanguage('groovy', groovy);
SyntaxHighlighter.registerLanguage('csharp', csharp);

interface CodeBlockProps {
  language: string;
  children: string;
  customStyle?: React.CSSProperties;
}

const CodeBlock = ({ language, children, customStyle }: CodeBlockProps) => {
  return (
    <SyntaxHighlighter
      language={language}
      style={vscDarkPlus}
      customStyle={{
        margin: 0,
        borderRadius: 0,
        fontSize: '0.875rem',
        ...customStyle,
      }}
    >
      {children}
    </SyntaxHighlighter>
  );
};

export default CodeBlock;
