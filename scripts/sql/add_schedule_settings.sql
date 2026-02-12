-- =====================================================
-- JusPlanner: Adicionar coluna settings na tabela schedules
-- Para suportar personalização de cronogramas
-- =====================================================

-- Adicionar coluna settings como JSONB
ALTER TABLE schedules 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Comentário explicativo
COMMENT ON COLUMN schedules.settings IS 'Configurações personalizadas do cronograma: studyDaysPerWeek, restDays, subjectWeights, subjectOrder, reviewEveryNDays';
