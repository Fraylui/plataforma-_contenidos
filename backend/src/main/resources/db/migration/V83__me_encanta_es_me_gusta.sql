-- Un solo sistema de reacciones (2026-11-05): «Me encanta» ES el «me gusta».
-- Antes había dos corazones distintos (el «me gusta» del feed y el «Me
-- encanta» de las reacciones) y confundía. Desde ahora LOVE vive solo en
-- engagement.content_likes (rankings, panel e Historias siguen contándolo) y
-- content_reactions guarda las otras tres. Un visitante tiene una sola
-- reacción por contenido (ContentReactionService).

-- 1. Los «Me encanta» ya dados pasan a ser «me gusta» (sin duplicar).
INSERT INTO engagement.content_likes (id, content_type, content_id, visitor_id, created_at)
SELECT gen_random_uuid(), content_type, content_id, visitor_id, created_at
  FROM engagement.content_reactions
 WHERE reaction = 'LOVE'
ON CONFLICT (content_type, content_id, visitor_id) DO NOTHING;

DELETE FROM engagement.content_reactions WHERE reaction = 'LOVE';

-- 2. Quien tenía «me gusta» y además otra reacción se queda con la más reciente.
DELETE FROM engagement.content_likes l
 USING engagement.content_reactions r
 WHERE r.content_type = l.content_type AND r.content_id = l.content_id AND r.visitor_id = l.visitor_id
   AND r.created_at >= l.created_at;

DELETE FROM engagement.content_reactions r
 USING engagement.content_likes l
 WHERE r.content_type = l.content_type AND r.content_id = l.content_id AND r.visitor_id = l.visitor_id;

-- 3. La tabla ya no acepta LOVE.
ALTER TABLE engagement.content_reactions DROP CONSTRAINT IF EXISTS content_reactions_reaction_check;
ALTER TABLE engagement.content_reactions
    ADD CONSTRAINT content_reactions_reaction_check CHECK (reaction IN ('FUNNY', 'WOW', 'INSPIRED'));
