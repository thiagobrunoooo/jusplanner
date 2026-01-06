-- =====================================================
-- JusPlanner: Sistema de Cronogramas Flexíveis
-- Etapa 1: Estrutura de Dados
-- =====================================================

-- 1. Tabela de Cronogramas
CREATE TABLE schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  is_preset BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tópicos selecionados por cronograma
CREATE TABLE schedule_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID REFERENCES schedules ON DELETE CASCADE NOT NULL,
  topic_id TEXT NOT NULL,
  UNIQUE(schedule_id, topic_id)
);

-- 3. Adicionar coluna schedule_id na tabela existente
ALTER TABLE topic_progress 
ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES schedules ON DELETE SET NULL;

-- 4. Habilitar RLS
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_topics ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de acesso
CREATE POLICY "Users can manage own schedules" 
  ON schedules FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own schedule_topics" 
  ON schedule_topics FOR ALL 
  USING (
    schedule_id IN (
      SELECT id FROM schedules WHERE user_id = auth.uid()
    )
  );

-- 6. Índices para performance
CREATE INDEX idx_schedules_user_id ON schedules(user_id);
CREATE INDEX idx_schedules_active ON schedules(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_schedule_topics_schedule_id ON schedule_topics(schedule_id);
CREATE INDEX idx_topic_progress_schedule_id ON topic_progress(schedule_id);
