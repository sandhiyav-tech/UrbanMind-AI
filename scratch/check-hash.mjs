import bcrypt from 'bcryptjs';

const hash = '$2a$10$w8.484xT6w7eNqGfZz4UeOHy9/39097q758sWq5mD/R5z550L135a';
console.log('Compare with Demo1234:', bcrypt.compareSync('Demo1234', hash));

const newHash = bcrypt.hashSync('Demo1234', 10);
console.log('Real hash of Demo1234:', newHash);
console.log('Compare newHash:', bcrypt.compareSync('Demo1234', newHash));
