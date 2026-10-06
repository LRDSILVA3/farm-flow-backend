const fs = require('fs');
const path = require('path');

const authFilePath = path.resolve(__dirname, '../../farm-flow-frontend/src/pages/Auth.tsx');
let content = fs.readFileSync(authFilePath, 'utf8');

content = content.replace(
  'const Auth = ({ onAuthSuccess }: AuthProps) => {',
  'const Auth = ({ onAuthSuccess }: AuthProps) => {\n  const { signIn, signUp } = useAuth();'
);

fs.writeFileSync(authFilePath, content, 'utf8');
console.log('✅ Auth.tsx fixed: destructured signIn and signUp from useAuth()');
