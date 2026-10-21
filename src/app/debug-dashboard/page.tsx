'use client';
import { useState } from 'react';
import { getStudentResults, getStudentSimulations } from '@features/simulacro/lib/firestoreService';

export default function DebugDashboard() {
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} ${msg}`]);
    };

    const testGetStudentResults = async () => {
        setLogs([]);
        setLoading(true);
        
        const studentId = '1097912847'; // Rosa Mendieta
        const simId = 'SG11-14';
        
        addLog(`🔍 Iniciando test para ${studentId} / ${simId}`);
        
        try {
            addLog('⏳ Llamando getStudentResults...');
            const result = await getStudentResults(studentId, simId);
            
            if (result) {
                addLog('✅ Datos encontrados!');
                addLog(`   Puntaje: ${result.puntaje_global}`);
                addLog(`   Nombres: ${result.informacion_personal?.nombres}`);
                addLog(`   Apellidos: ${result.informacion_personal?.apellidos}`);
            } else {
                addLog('❌ getStudentResults retornó NULL');
                addLog('   Esto significa que no encontró el documento');
            }
        } catch (error: any) {
            addLog(`❌ Error: ${error.message}`);
            addLog(`   Code: ${error.code}`);
        }
        
        setLoading(false);
    };

    const testGetStudentSimulations = async () => {
        setLogs([]);
        setLoading(true);
        
        const studentId = '1097912847'; // Rosa Mendieta
        
        addLog(`🔍 Iniciando test de simulacros para ${studentId}`);
        
        try {
            addLog('⏳ Llamando getStudentSimulations...');
            const sims = await getStudentSimulations(studentId);
            
            addLog(`✅ Simulacros encontrados: ${sims.length}`);
            sims.forEach(sim => {
                addLog(`   • ${sim}`);
            });
        } catch (error: any) {
            addLog(`❌ Error: ${error.message}`);
        }
        
        setLoading(false);
    };

    const testFullFlow = async () => {
        setLogs([]);
        setLoading(true);
        
        const studentId = '1097912847'; // Rosa Mendieta
        
        addLog(`🔍 Test completo para ${studentId}`);
        addLog('═'.repeat(60));
        
        try {
            // 1. Get simulations
            addLog('\n📋 Paso 1: Obtener simulacros');
            const sims = await getStudentSimulations(studentId);
            addLog(`✅ Encontrados: ${sims.join(', ')}`);
            
            // 2. Get results for each
            addLog('\n📊 Paso 2: Obtener resultados de cada simulacro');
            for (const sim of sims) {
                addLog(`\n⏳ Consultando ${sim}...`);
                const result = await getStudentResults(studentId, sim);
                
                if (result) {
                    addLog(`   ✅ ${sim}: Puntaje=${result.puntaje_global}`);
                } else {
                    addLog(`   ❌ ${sim}: Sin datos`);
                }
            }
            
            addLog('\n═'.repeat(60));
            addLog('✅ Test completado');
            
        } catch (error: any) {
            addLog(`\n❌ Error: ${error.message}`);
        }
        
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-900 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-8">
                    🔍 Debug Dashboard
                </h1>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <button
                        onClick={testGetStudentResults}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Test getStudentResults
                    </button>
                    
                    <button
                        onClick={testGetStudentSimulations}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Test getStudentSimulations
                    </button>
                    
                    <button
                        onClick={testFullFlow}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Test Flujo Completo
                    </button>
                </div>
                
                <div className="bg-slate-800 rounded-lg p-6 min-h-[400px]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white">Logs</h2>
                        {loading && (
                            <div className="flex items-center gap-2 text-yellow-400">
                                <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm">Ejecutando...</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-slate-950 rounded p-4 font-mono text-sm text-emerald-400 max-h-[600px] overflow-y-auto">
                        {logs.length === 0 ? (
                            <div className="text-slate-500 text-center py-8">
                                Selecciona un test para comenzar
                            </div>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className="mb-1">
                                    {log}
                                </div>
                            ))
                        )}
                    </div>
                </div>
                
                <div className="mt-8 bg-slate-800 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Información</h3>
                    <div className="text-slate-300 text-sm space-y-2">
                        <p><strong>Estudiante de prueba:</strong> Rosa Mendieta (1097912847)</p>
                        <p><strong>Simulacro de prueba:</strong> SG11-14</p>
                        <p><strong>Puntaje esperado:</strong> 468</p>
                        <p className="mt-4 text-yellow-400">
                            ⚠️ Si ves "Sin datos" o "retornó NULL", hay un problema en getStudentResults()
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
