import Database from 'better-sqlite3';

const db = new Database('bible_qa.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS bible_verses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book TEXT,
    chapter INTEGER,
    verse INTEGER,
    text TEXT
  );
`);

const initialVerses = [
  { book: 'Genesis', chapter: 1, verse: 1, text: 'In the beginning God created the heaven and the earth.' },
  { book: 'Psalm', chapter: 23, verse: 1, text: 'The LORD is my shepherd; I shall not want.' },
  { book: 'Psalm', chapter: 23, verse: 2, text: 'He maketh me to lie down in green pastures: he leadeth me beside the still waters.' },
  { book: 'Psalm', chapter: 23, verse: 3, text: 'He restoreth my soul: he leadeth me in the paths of righteousness for his name\'s sake.' },
  { book: 'Psalm', chapter: 23, verse: 4, text: 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.' },
  { book: 'Psalm', chapter: 23, verse: 5, text: 'Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.' },
  { book: 'Psalm', chapter: 23, verse: 6, text: 'Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.' },
  { book: 'John', chapter: 3, verse: 16, text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
  { book: 'Proverbs', chapter: 3, verse: 5, text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.' },
  { book: 'Philippians', chapter: 4, verse: 13, text: 'I can do all things through Christ which strengtheneth me.' },
  { book: 'Romans', chapter: 8, verse: 28, text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.' }
];

const insert = db.prepare('INSERT INTO bible_verses (book, chapter, verse, text) VALUES (?, ?, ?, ?)');
const insertMany = db.transaction((data) => {
  for (const v of data) insert.run(v.book, v.chapter, v.verse, v.text);
});

try {
  insertMany(initialVerses);
  console.log('Bible seeded successfully');
} catch (e) {
  console.log('Bible already seeded or error occurred');
}
