import React, { useState } from 'react';
import { User, Settings as SettingsIcon, Moon, Sun, Monitor, Save, Database, AlertTriangle, LogOut, Camera, BookMarked } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '../contexts/AuthContext';
import SubjectsEditor from './SubjectsEditor';

const Settings = ({ userName, setUserName, userAvatar, setUserAvatar, setShowBackup, onReset, onManualSave }) => {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [nameInput, setNameInput] = useState(userName);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveName = () => {
    setUserName(nameInput);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setUserAvatar(compressedBase64);
      } catch (error) {
        console.error("Error compressing image:", error);
        alert("Erro ao processar a imagem. Tente uma menor.");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <SettingsIcon size={32} className="text-slate-700 dark:text-slate-200" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Configurações</h2>
          <p className="text-slate-500 dark:text-slate-400">Gerencie seu perfil e preferências do sistema</p>
        </div>
      </div>

      {/* SECTION 1: PROFILE */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
          <User className="text-blue-500" size={24} />
          Perfil do Usuário
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nome de Exibição
                </label>
                <button
                  onClick={onManualSave}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200 transition-colors"
                  title="Forçar salvamento na nuvem"
                >
                  Salvar Agora
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Seu nome"
                />
                <button
                  onClick={handleSaveName}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  <Save size={18} />
                  {isSaved ? 'Salvo!' : 'Salvar'}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">Este nome será exibido na saudação inicial.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email da Conta
              </label>
              <div className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed flex items-center justify-between">
                <span>{user?.email || 'Não conectado'}</span>
                {user && (
                  <button
                    onClick={() => signOut()}
                    className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                  >
                    <LogOut size={12} /> Sair
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-800">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-slate-700 shadow-lg mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                {userAvatar ? (
                  <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-4xl font-bold">{nameInput ? nameInput[0].toUpperCase() : 'U'}</span>
                )}
              </div>
              <label className="absolute bottom-4 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full cursor-pointer shadow-md transition-transform hover:scale-110">
                <Camera size={16} />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-lg">{nameInput || 'Usuário'}</h4>
            <p className="text-slate-500 text-sm">{user?.email || 'Visitante'}</p>
          </div>
        </div>
      </section >

      {/* SECTION 2: SYSTEM */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
          <SettingsIcon className="text-slate-500" size={24} />
          Preferências do Sistema
        </h3>

        <div className="space-y-8">
          {/* Theme Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Aparência
            </label>
            <div className="grid grid-cols-3 gap-4 max-w-md">
              <button
                onClick={() => setTheme('light')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'light'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-500'
                  }`}
              >
                <Sun size={24} />
                <span className="text-sm font-medium">Claro</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'dark'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-500'
                  }`}
              >
                <Moon size={24} />
                <span className="text-sm font-medium">Escuro</span>
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'system'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-500'
                  }`}
              >
                <Monitor size={24} />
                <span className="text-sm font-medium">Sistema</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* Data Management */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Dados e Armazenamento
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowBackup(true)}
                className="px-6 py-3 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <Database size={20} />
                Gerenciar Backup e Sincronização
              </button>

              <button
                onClick={onReset}
                className="px-6 py-3 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <AlertTriangle size={20} />
                Resetar Tudo
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Gerencie seus backups na nuvem ou resete o aplicativo para o estado inicial.
            </p>
          </div>
        </div>
      </section >

      {/* SECTION 3: SUBJECTS MANAGEMENT */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
          <BookMarked className="text-emerald-500" size={24} />
          Banco de Matérias
        </h3>
        <SubjectsEditor />
      </section>
    </div >
  );
};

export default Settings;
