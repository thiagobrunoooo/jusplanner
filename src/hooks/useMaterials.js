import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { safeParse } from './helpers';

// --- MATERIALS ---
export const useMaterials = (initialMaterials) => {
    const { user } = useAuth();
    const [materials, setMaterials] = useState(() => {
        if (!user) return initialMaterials;
        const saved = localStorage.getItem(`studyMaterials_${user.id}`);
        return safeParse(saved, initialMaterials);
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setMaterials(initialMaterials);
            setLoading(false);
            return;
        }

        const load = async () => {
            try {
                const { data } = await supabase.from('materials').select('*').eq('user_id', user.id);
                if (data) {
                    setMaterials(data);
                    localStorage.setItem(`studyMaterials_${user.id}`, JSON.stringify(data));
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        load();

        const channel = supabase.channel('materials_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'materials', filter: `user_id=eq.${user.id}` },
                (payload) => {
                    if (payload.eventType === 'DELETE' && payload.old) {
                        setMaterials(prev => {
                            const newState = prev.filter(m => m.id !== payload.old.id);
                            if (!window.isResetting) localStorage.setItem(`studyMaterials_${user.id}`, JSON.stringify(newState));
                            return newState;
                        });
                    } else if (payload.new) {
                        load(); // Reload for inserts/updates to be safe with lists
                    }
                })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [user?.id]);

    const addMaterial = async (material) => {
        if (!user) return;
        try {
            const { data, error } = await supabase.from('materials').insert({
                user_id: user.id,
                ...material,
                updated_at: new Date().toISOString()
            }).select().single();

            if (data) {
                setMaterials(prev => {
                    const newState = [...prev, data];
                    localStorage.setItem(`studyMaterials_${user.id}`, JSON.stringify(newState));
                    return newState;
                });
            }
        } catch (err) { console.error(err); }
    };

    const deleteMaterial = async (id) => {
        if (!user) {
            console.error("No user logged in for delete");
            return;
        }
        try {
            // 1. Fetch item to get URL
            const { data: item, error: fetchError } = await supabase.from('materials').select('*').eq('id', id).single();

            if (fetchError) {
                console.error("Error fetching material to delete:", fetchError);
            }

            if (item) {
                // 2. If it's a file in Supabase Storage, delete it
                if ((item.type === 'pdf' || item.type === 'image') && item.file_url && item.file_url.includes('supabase.co')) {
                    try {
                        // Extract path: .../materials/user_id/subject_id/filename
                        const parts = item.file_url.split('/materials/');
                        if (parts.length > 1) {
                            const path = parts[1];

                            const { error: storageError } = await supabase.storage.from('materials').remove([path]);
                            if (storageError) console.error("Storage delete error:", storageError);
                        }
                    } catch (storageErr) {
                        console.error("Failed to delete file from storage:", storageErr);
                    }
                }

                // 3. Delete metadata row
                const { error: deleteError } = await supabase.from('materials').delete().eq('id', id);
                if (deleteError) {
                    console.error("Database delete error:", deleteError);
                    alert("Erro ao excluir do banco de dados: " + deleteError.message);
                } else {
                    setMaterials(prev => {
                        const newState = prev.filter(m => m.id !== id);
                        if (!window.isResetting) localStorage.setItem(`studyMaterials_${user.id}`, JSON.stringify(newState));
                        return newState;
                    });
                }
            }
        } catch (err) { console.error("Delete material exception:", err); }
    };

    return { materials, addMaterial, deleteMaterial };
};
