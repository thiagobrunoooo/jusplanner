-- Tabela para matérias customizadas do usuário
-- Execute este SQL no Supabase SQL Editor

-- Criar tabela user_subjects
CREATE TABLE IF NOT EXISTS user_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_id TEXT NOT NULL,
  title TEXT NOT NULL,
  color TEXT DEFAULT 'text-blue-600',
  bg_color TEXT DEFAULT 'bg-blue-600',
  bg_light TEXT DEFAULT 'bg-blue-50',
  icon TEXT DEFAULT 'BookOpen',
  topics JSONB DEFAULT '[]'::jsonb,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, subject_id)
);

-- Habilitar RLS
ALTER TABLE user_subjects ENABLE ROW LEVEL SECURITY;

-- Policy para SELECT
CREATE POLICY "Users can view own subjects" ON user_subjects
  FOR SELECT USING (auth.uid() = user_id);

-- Policy para INSERT
CREATE POLICY "Users can insert own subjects" ON user_subjects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy para UPDATE
CREATE POLICY "Users can update own subjects" ON user_subjects
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy para DELETE
CREATE POLICY "Users can delete own subjects" ON user_subjects
  FOR DELETE USING (auth.uid() = user_id);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_user_subjects_user_id ON user_subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subjects_position ON user_subjects(user_id, position);
