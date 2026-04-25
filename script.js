document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('hcm-form');
    
    // UI Elements
    const losGrade = document.getElementById('los-grade');
    const vpVal = document.getElementById('vp-val');
    const atsVal = document.getElementById('ats-val');
    const ptsfVal = document.getElementById('ptsf-val');
    const alertsContainer = document.getElementById('alerts-container');

    const etVal = document.getElementById('et-val');
    const fhvVal = document.getElementById('fhv-val');
    const ffsVal = document.getElementById('ffs-val');
    const losInterpretation = document.getElementById('los-interpretation');

    // Manejar el submit del formulario
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        alertsContainer.innerHTML = ''; // Limpiar alertas anteriores

        // Recolectar datos
        const inputs = {
            vd: document.getElementById('vd_input').value,
            vo: document.getElementById('vo_input').value,
            phf: document.getElementById('phf').value,
            trucks: document.getElementById('trucks').value,
            fp: document.getElementById('fp').value,
            terrain: document.getElementById('terrain').value,
            grade: document.getElementById('grade').value,
            gradeLength: document.getElementById('gradeLength').value,
            laneWidth: document.getElementById('laneWidth').value,
            shoulderWidth: document.getElementById('shoulderWidth').value,
            accessPoints: document.getElementById('accessPoints').value,
            noPassing: document.getElementById('noPassing').value,
            ffs: document.getElementById('ffs').value,
            analysisType: document.getElementById('analysisType').value
        };

        try {
            // Llamar al motor de cálculo
            const results = window.hcmCalculations.calculate(inputs);

            // Actualizar UI
            updateDashboard(results, inputs.analysisType);
            
            // Alertas
            if (results.LOS === 'F') {
                showAlert('El nivel de servicio es F. La demanda excede la capacidad.', 'error');
            }
            if (inputs.grade > 0) {
                showAlert(`Analizado con Pendiente de ${inputs.grade}% (Longitud: ${inputs.gradeLength} km).`, 'info');
            }

        } catch (error) {
            console.error(error);
            showAlert(error.message || 'Error en los cálculos. Verifica los datos ingresados.', 'error');
        }
    });

    function updateDashboard(results, analysisType) {
        // Actualizar valores numéricos (mostrando ATS / PTSF si difieren)
        vpVal.textContent = results.vp_ATS === results.vp_PTSF 
            ? results.vp_ATS 
            : `${results.vp_ATS} (ATS) / ${results.vp_PTSF} (PTSF)`;
        
        if (analysisType === 'ptsf') {
            atsVal.textContent = 'N/A';
            ptsfVal.textContent = results.PTSF;
        } else if (analysisType === 'ats') {
            atsVal.textContent = results.ATS;
            ptsfVal.textContent = 'N/A';
        } else {
            atsVal.textContent = results.ATS;
            ptsfVal.textContent = results.PTSF;
        }

        // Actualizar cálculos intermedios (ATS / PTSF)
        etVal.textContent = results.ET_ATS === results.ET_PTSF 
            ? results.ET_ATS 
            : `${results.ET_ATS} | ${results.ET_PTSF}`;
            
        fhvVal.textContent = results.fHV_ATS === results.fHV_PTSF 
            ? results.fHV_ATS 
            : `${results.fHV_ATS} | ${results.fHV_PTSF}`;
            
        ffsVal.textContent = results.FFS;



        // Actualizar la letra del LOS con animación
        losGrade.style.opacity = 0;
        losInterpretation.style.opacity = 0;
        
        setTimeout(() => {
            losGrade.textContent = results.LOS;
            
            // Interpretación del LOS
            const interpretations = {
                'A': 'Flujo libre. Los usuarios no ven afectados sus movimientos ni velocidades por la presencia de otros vehículos.',
                'B': 'Flujo estable. La presencia de otros vehículos comienza a notarse, pero la libertad de maniobra es alta.',
                'C': 'Flujo estable. El aumento del volumen restringe notablemente la selección de velocidad y el cambio de carril.',
                'D': 'Flujo próximo a la inestabilidad. Las velocidades y la libertad de maniobra están fuertemente restringidas.',
                'E': 'Flujo inestable. Operación en o cerca de la capacidad. Paradas frecuentes e interrupciones.',
                'F': 'Flujo forzado. La demanda excede la capacidad. Congestión extrema y formación de colas.'
            };
            losInterpretation.textContent = interpretations[results.LOS] || '';
            
            // Actualizar color basado en el LOS
            const colors = {
                'A': 'var(--los-a)',
                'B': 'var(--los-b)',
                'C': 'var(--los-c)',
                'D': 'var(--los-d)',
                'E': 'var(--los-e)',
                'F': 'var(--los-f)'
            };
            
            losGrade.style.color = colors[results.LOS] || '#ffffff';
            losGrade.style.textShadow = `0 0 30px ${colors[results.LOS] || '#ffffff'}88`;
            losGrade.style.opacity = 1;
            losInterpretation.style.opacity = 1;
            losInterpretation.style.transition = 'opacity 0.5s ease';
            
        }, 300);
    }

    function showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.style.padding = '1rem';
        alert.style.marginTop = '1rem';
        alert.style.borderRadius = '8px';
        alert.style.fontSize = '0.9rem';
        
        if (type === 'error') {
            alert.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
            alert.style.border = '1px solid var(--los-e)';
            alert.style.color = '#fca5a5';
        } else if (type === 'warning') {
            alert.style.backgroundColor = 'rgba(245, 158, 11, 0.2)';
            alert.style.border = '1px solid var(--los-c)';
            alert.style.color = '#fcd34d';
        } else {
            alert.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
            alert.style.border = '1px solid var(--primary-color)';
            alert.style.color = '#93c5fd';
        }
        
        alert.textContent = message;
        alertsContainer.appendChild(alert);
    }

    // Calcular valores por defecto al cargar
    form.dispatchEvent(new Event('submit'));
});
