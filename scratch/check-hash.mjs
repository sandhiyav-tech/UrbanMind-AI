import bcrypt from 'bcryptjs';

const hash1 = '$2a$10$wRFVcXiXwgf4tBmejRZe/OaAdtreLMAKs8vNTZeOmogV5nD.ZEcc6';
const hash2 = '$2a$10$zGVcvKX6RbhfdcNlwJydyOYK5LMzKbPk08J76Jo6pAYazoDs5XPJC';
const hashDemo = '$2a$10$bwQXLBnIsv5q1Bb9FWTWeetIBpgYtb2Ayx2p8sPsaIARJCh9SnxyO';

console.log('asdf1234 matches hash1:', bcrypt.compareSync('asdf1234', hash1));
console.log('sand1234 matches hash2:', bcrypt.compareSync('sand1234', hash2));
console.log('Demo1234 matches hashDemo:', bcrypt.compareSync('Demo1234', hashDemo));
