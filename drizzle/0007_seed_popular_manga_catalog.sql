DROP TABLE IF EXISTS seed_manga_catalog;
--> statement-breakpoint
CREATE TEMP TABLE seed_manga_catalog (
  title varchar(255) NOT NULL,
  author varchar(100) NOT NULL,
  release_year integer,
  status varchar(20) NOT NULL,
  rating real NOT NULL,
  cover_url text NOT NULL,
  description text NOT NULL,
  genre_names text[] NOT NULL
);
--> statement-breakpoint
INSERT INTO seed_manga_catalog (
  title,
  author,
  release_year,
  status,
  rating,
  cover_url,
  description,
  genre_names
) VALUES
  (
    'One Piece',
    'Eiichiro Oda',
    1997,
    'ongoing',
    0.0,
    'https://placehold.co/600x800/0f172a/f8fafc/png?text=One+Piece',
    'Placeholder catalog entry for the pirate adventure manga One Piece.',
    ARRAY['Action', 'Adventure', 'Comedy', 'Fantasy']
  ),
  (
    'Naruto',
    'Masashi Kishimoto',
    1999,
    'completed',
    0.0,
    'https://placehold.co/600x800/7c2d12/fff7ed/png?text=Naruto',
    'Placeholder catalog entry for the ninja adventure manga Naruto.',
    ARRAY['Action', 'Adventure', 'Martial Arts', 'Drama']
  ),
  (
    'Bleach',
    'Tite Kubo',
    2001,
    'completed',
    0.0,
    'https://placehold.co/600x800/111827/e5e7eb/png?text=Bleach',
    'Placeholder catalog entry for the supernatural action manga Bleach.',
    ARRAY['Action', 'Supernatural', 'Adventure', 'Drama']
  ),
  (
    'Attack on Titan',
    'Hajime Isayama',
    2009,
    'completed',
    0.0,
    'https://placehold.co/600x800/3f3f46/fef3c7/png?text=Attack+on+Titan',
    'Placeholder catalog entry for the dark fantasy manga Attack on Titan.',
    ARRAY['Action', 'Drama', 'Fantasy', 'Horror']
  ),
  (
    'Demon Slayer',
    'Koyoharu Gotouge',
    2016,
    'completed',
    0.0,
    'https://placehold.co/600x800/14532d/ecfdf5/png?text=Demon+Slayer',
    'Placeholder catalog entry for the demon hunting manga Demon Slayer.',
    ARRAY['Action', 'Adventure', 'Supernatural', 'Drama']
  ),
  (
    'Jujutsu Kaisen',
    'Gege Akutami',
    2018,
    'completed',
    0.0,
    'https://placehold.co/600x800/1e1b4b/e0e7ff/png?text=Jujutsu+Kaisen',
    'Placeholder catalog entry for the cursed energy manga Jujutsu Kaisen.',
    ARRAY['Action', 'Supernatural', 'Horror', 'School']
  ),
  (
    'Death Note',
    'Tsugumi Ohba',
    2003,
    'completed',
    0.0,
    'https://placehold.co/600x800/18181b/f4f4f5/png?text=Death+Note',
    'Placeholder catalog entry for the psychological thriller manga Death Note.',
    ARRAY['Mystery', 'Supernatural', 'Thriller', 'Drama']
  ),
  (
    'Dragon Ball',
    'Akira Toriyama',
    1984,
    'completed',
    0.0,
    'https://placehold.co/600x800/7f1d1d/ffedd5/png?text=Dragon+Ball',
    'Placeholder catalog entry for the classic martial arts manga Dragon Ball.',
    ARRAY['Action', 'Adventure', 'Comedy', 'Martial Arts']
  ),
  (
    'Fullmetal Alchemist',
    'Hiromu Arakawa',
    2001,
    'completed',
    0.0,
    'https://placehold.co/600x800/713f12/fef9c3/png?text=Fullmetal+Alchemist',
    'Placeholder catalog entry for the alchemy adventure manga Fullmetal Alchemist.',
    ARRAY['Action', 'Adventure', 'Drama', 'Fantasy']
  ),
  (
    'My Hero Academia',
    'Kohei Horikoshi',
    2014,
    'completed',
    0.0,
    'https://placehold.co/600x800/1e3a8a/dbeafe/png?text=My+Hero+Academia',
    'Placeholder catalog entry for the superhero school manga My Hero Academia.',
    ARRAY['Action', 'Comedy', 'School', 'Superhero']
  );
--> statement-breakpoint
INSERT INTO authors (name, country)
SELECT DISTINCT s.author, 'Japan'
FROM seed_manga_catalog s
WHERE NOT EXISTS (
  SELECT 1
  FROM authors a
  WHERE a.name = s.author
);
--> statement-breakpoint
INSERT INTO genres (name)
SELECT DISTINCT genre_name
FROM seed_manga_catalog s
CROSS JOIN LATERAL unnest(s.genre_names) AS seed_genres(genre_name)
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint
INSERT INTO comics (
  title,
  description,
  author_id,
  release_year,
  status,
  rating,
  cover_url
)
SELECT
  s.title,
  s.description,
  a.id,
  s.release_year,
  s.status,
  s.rating,
  s.cover_url
FROM seed_manga_catalog s
INNER JOIN authors a ON a.name = s.author
WHERE NOT EXISTS (
  SELECT 1
  FROM comics c
  WHERE c.title = s.title
);
--> statement-breakpoint
INSERT INTO covers (comic_id, image_url, is_main)
SELECT c.id, s.cover_url, true
FROM seed_manga_catalog s
INNER JOIN authors a ON a.name = s.author
INNER JOIN comics c ON c.title = s.title AND c.author_id = a.id
WHERE NOT EXISTS (
  SELECT 1
  FROM covers cv
  WHERE cv.comic_id = c.id AND cv.image_url = s.cover_url
);
--> statement-breakpoint
INSERT INTO comic_genres (comic_id, genre_id)
SELECT c.id, g.id
FROM seed_manga_catalog s
INNER JOIN authors a ON a.name = s.author
INNER JOIN comics c ON c.title = s.title AND c.author_id = a.id
CROSS JOIN LATERAL unnest(s.genre_names) AS seed_genres(genre_name)
INNER JOIN genres g ON g.name = genre_name
WHERE NOT EXISTS (
  SELECT 1
  FROM comic_genres cg
  WHERE cg.comic_id = c.id AND cg.genre_id = g.id
);
--> statement-breakpoint
INSERT INTO chapters (comic_id, title, chapter_number)
SELECT
  c.id,
  'Placeholder chapter ' || chapter_number::text,
  chapter_number
FROM seed_manga_catalog s
INNER JOIN authors a ON a.name = s.author
INNER JOIN comics c ON c.title = s.title AND c.author_id = a.id
CROSS JOIN generate_series(1, 10) AS seed_chapters(chapter_number)
WHERE NOT EXISTS (
  SELECT 1
  FROM chapters ch
  WHERE ch.comic_id = c.id AND ch.chapter_number = chapter_number
);
--> statement-breakpoint
INSERT INTO chapter_pages (chapter_id, page_number, image_url)
SELECT
  ch.id,
  1,
  'https://placehold.co/900x1300/111827/f8fafc/png?text='
    || replace(s.title, ' ', '+')
    || '+Chapter+'
    || ch.chapter_number::text
    || '+Placeholder'
FROM seed_manga_catalog s
INNER JOIN authors a ON a.name = s.author
INNER JOIN comics c ON c.title = s.title AND c.author_id = a.id
INNER JOIN chapters ch ON ch.comic_id = c.id AND ch.chapter_number BETWEEN 1 AND 10
WHERE NOT EXISTS (
  SELECT 1
  FROM chapter_pages cp
  WHERE cp.chapter_id = ch.id AND cp.page_number = 1
);
--> statement-breakpoint
DROP TABLE seed_manga_catalog;
