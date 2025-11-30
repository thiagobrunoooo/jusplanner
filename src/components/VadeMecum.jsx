import React, { useState } from 'react';
import { Search, ExternalLink, Book, Scale, Gavel, FileText, Shield, Briefcase, HeartPulse, Building2, Landmark, ScrollText } from 'lucide-react';
import { cn } from '../lib/utils';

const CODES = [
    {
        id: 'cf',
        title: 'Constituição Federal',
        description: 'Constituição da República Federativa do Brasil de 1988',
        url: 'http://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm',
        category: 'Constitucional',
        icon: Landmark,
        color: 'text-amber-500',
        bg: 'bg-amber-50 dark:bg-amber-900/20'
    },
    {
        id: 'cc',
        title: 'Código Civil',
        description: 'Lei nº 10.406, de 10 de janeiro de 2002',
        url: 'http://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm',
        category: 'Civil',
        icon: Scale,
        color: 'text-blue-600',
        bg: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
        id: 'cpc',
        title: 'Código de Processo Civil',
        description: 'Lei nº 13.105, de 16 de março de 2015',
        url: 'http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm',
        category: 'Processo Civil',
        icon: ScrollText,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50 dark:bg-indigo-900/20'
    },
    {
        id: 'cp',
        title: 'Código Penal',
        description: 'Decreto-Lei nº 2.848, de 7 de dezembro de 1940',
        url: 'http://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm',
        category: 'Penal',
        icon: Gavel,
        color: 'text-red-600',
        bg: 'bg-red-50 dark:bg-red-900/20'
    },
    {
        id: 'cpp',
        title: 'Código de Processo Penal',
        description: 'Decreto-Lei nº 3.689, de 3 de outubro de 1941',
        url: 'http://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm',
        category: 'Processo Penal',
        icon: Shield,
        color: 'text-rose-600',
        bg: 'bg-rose-50 dark:bg-rose-900/20'
    },
    {
        id: 'clt',
        title: 'CLT',
        description: 'Consolidação das Leis do Trabalho',
        url: 'http://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
        category: 'Trabalho',
        icon: Briefcase,
        color: 'text-cyan-600',
        bg: 'bg-cyan-50 dark:bg-cyan-900/20'
    },
    {
        id: 'ctn',
        title: 'Código Tributário Nacional',
        description: 'Lei nº 5.172, de 25 de outubro de 1966',
        url: 'http://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm',
        category: 'Tributário',
        icon: Building2,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50 dark:bg-indigo-900/20'
    },
    {
        id: 'cdc',
        title: 'Código de Defesa do Consumidor',
        description: 'Lei nº 8.078, de 11 de setembro de 1990',
        url: 'http://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm',
        category: 'Consumidor',
        icon: HeartPulse,
        color: 'text-purple-600',
        bg: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
        id: 'oab',
        title: 'Estatuto da OAB',
        description: 'Lei nº 8.906, de 4 de julho de 1994',
        url: 'http://www.planalto.gov.br/ccivil_03/leis/l8906.htm',
        category: 'Ética',
        icon: Scale,
        color: 'text-slate-600',
        bg: 'bg-slate-100 dark:bg-slate-800'
    }
];

const VadeMecum = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCodes = CODES.filter(code =>
        code.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Book className="text-blue-600 dark:text-blue-400" />
                        Vade Mecum
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        Acesso rápido aos principais códigos e leis atualizados.
                    </p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar código ou lei..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCodes.map((code, index) => (
                    <a
                        key={code.id}
                        href={code.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block glass-card p-6 rounded-2xl hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md transition-all duration-300 animate-slide-up"
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", code.bg, code.color)}>
                                <code.icon size={24} />
                            </div>
                            <ExternalLink className="text-slate-300 group-hover:text-blue-500 transition-colors" size={18} />
                        </div>

                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                                {code.category}
                            </span>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {code.title}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                {code.description}
                            </p>
                        </div>
                    </a>
                ))}
            </div>

            {filteredCodes.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="text-slate-300 dark:text-slate-600" size={32} />
                    </div>
                    <h3 className="text-slate-500 dark:text-slate-400 font-medium">Nenhum código encontrado</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500">Tente buscar por outro termo.</p>
                </div>
            )}
        </div>
    );
};

export default VadeMecum;
