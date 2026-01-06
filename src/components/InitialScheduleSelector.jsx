import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { BookOpen, Building2, Check, Sparkles } from 'lucide-react';
import { SCHEDULE_PRESETS } from '../data/schedulePresets';
import { useSchedules } from '../hooks/useSchedules';

const ICON_MAP = {
    BookOpen,
    Building2
};

export function InitialScheduleSelector() {
    const { schedules, createSchedule, loading } = useSchedules();
    const [selectedPreset, setSelectedPreset] = useState(null);
    const [creating, setCreating] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleCreate = async () => {
        if (!selectedPreset) return;

        const preset = SCHEDULE_PRESETS.find(p => p.id === selectedPreset);
        if (!preset) return;

        setCreating(true);
        try {
            await createSchedule(preset.name, preset.topicIds, true);
            setDismissed(true);
        } catch (err) {
            console.error('Failed to create preset schedule:', err);
        } finally {
            setCreating(false);
        }
    };

    // Mostrar apenas quando: carregou, não há schedules, não foi dispensado
    const shouldShow = mounted && !loading && schedules.length === 0 && !dismissed;

    if (!shouldShow) return null;

    const modalContent = (
        <motion.div
            className="fixed inset-0 bg-gradient-to-br from-indigo-900/90 via-purple-900/90 to-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <motion.div
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
                {/* Header */}
                <div className="p-8 pb-4 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Sparkles className="text-white" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Bem-vindo ao JusPlanner!
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        Escolha um cronograma para começar seus estudos
                    </p>
                </div>

                {/* Presets */}
                <div className="p-6 pt-2 space-y-4">
                    {SCHEDULE_PRESETS.map(preset => {
                        const Icon = ICON_MAP[preset.icon] || BookOpen;
                        const isSelected = selectedPreset === preset.id;

                        return (
                            <motion.button
                                key={preset.id}
                                onClick={() => setSelectedPreset(preset.id)}
                                className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${isSelected
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-lg shadow-indigo-500/20'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                                    }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${isSelected
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                        }`}>
                                        <Icon size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className={`font-bold ${isSelected
                                                ? 'text-indigo-700 dark:text-indigo-300'
                                                : 'text-slate-900 dark:text-white'
                                                }`}>
                                                {preset.name}
                                            </h3>
                                            {isSelected && (
                                                <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                                                    <Check size={14} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                            {preset.description}
                                        </p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                            {preset.topicIds.length} tópicos incluídos
                                        </p>
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-6 pt-2 bg-slate-50 dark:bg-slate-800/50">
                    <button
                        onClick={handleCreate}
                        disabled={!selectedPreset || creating}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
                    >
                        {creating ? (
                            <>Criando...</>
                        ) : (
                            <>
                                <Check size={20} />
                                Começar Estudos
                            </>
                        )}
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-3">
                        Você pode criar ou modificar cronogramas depois
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
}
