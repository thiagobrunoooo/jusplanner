-- Tabela de lembretes / quadro de avisos
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    target_date DATE,                    -- Data em que o lembrete aparece (null = sempre)
    subject_id TEXT,                     -- Matéria vinculada (opcional)
    topic_id TEXT,                       -- Tópico vinculado (opcional)
    is_pinned BOOLEAN DEFAULT false,     -- Fixado no topo
    is_done BOOLEAN DEFAULT false,       -- Já resolvido
    color TEXT DEFAULT 'blue',           -- Cor do lembrete (blue, amber, red, green, purple)
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_target_date ON reminders(user_id, target_date);

-- RLS
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders"
    ON reminders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
    ON reminders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
    ON reminders FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
    ON reminders FOR DELETE
    USING (auth.uid() = user_id);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE reminders;
