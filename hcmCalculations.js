/**
 * HCM 6th Edition / 2010 - Two-Lane Highway Calculations
 * Nota para el estudiante: Los factores utilizados aquí son aproximaciones 
 * de las tablas generales del HCM. Debes verificarlos y ajustarlos 
 * según las tablas exactas proporcionadas en tu clase o manual.
 */

const hcmCalculations = {
    // Factor de ajuste por ancho de carril y berma (f_LS) en km/h - HCM 2020 Exhibit 20-5
    get_fLS: function(laneWidth, shoulderWidth) {
        const lw = parseFloat(laneWidth);
        const sw = parseFloat(shoulderWidth);
        
        let f_LS = 0;
        
        if (lw >= 3.6) {
            if (sw >= 1.8) f_LS = 0.0;
            else if (sw >= 1.2) f_LS = 1.6;
            else if (sw >= 0.6) f_LS = 3.0;
            else f_LS = 4.8;
        } else if (lw >= 3.3) {
            if (sw >= 1.8) f_LS = 2.1;
            else if (sw >= 1.2) f_LS = 3.7;
            else if (sw >= 0.6) f_LS = 5.1;
            else f_LS = 6.9;
        } else if (lw >= 3.0) {
            if (sw >= 1.8) f_LS = 5.6;
            else if (sw >= 1.2) f_LS = 7.2;
            else if (sw >= 0.6) f_LS = 8.6;
            else f_LS = 10.4;
        } else {
            // lw < 3.0 (2.7-2.9)
            if (sw >= 1.8) f_LS = 10.0;
            else if (sw >= 1.2) f_LS = 11.6;
            else if (sw >= 0.6) f_LS = 13.0;
            else f_LS = 14.8;
        }
        
        return f_LS;
    },

    // Factor de ajuste por densidad de puntos de acceso (f_A) en km/h - HCM 2020 Exhibit 20-6
    get_fA: function(accessPoints) {
        const ap = parseFloat(accessPoints);
        // Interpolación lineal de la tabla
        // 0 -> 0.0, 6 -> 4.0, 12 -> 8.0, 18 -> 12.0, 24 -> 16.0
        // Matemáticamente es exactamente ap * (4.0 / 6.0) = ap * 0.6667
        let f_A = ap * (4.0 / 6.0);
        return f_A;
    },

    // Equivalentes para ATS
    get_ET_ATS: function(terrain, vp_guess = 1500, grade = 0, length = 0) {
        if (grade >= 3 && length > 0) {
            // Aproximación de Pendiente Específica para ATS (HCM)
            let et_base = 1.5 + (grade - 2) * 0.6 + (length * 0.5);
            if (vp_guess > 800) et_base *= 0.8; // Menor impacto a mayor volumen
            return Math.max(1.5, Number(et_base.toFixed(2)));
        }

        if (terrain === 'ondulado') {
            return vp_guess <= 450 ? 1.9 : 1.5; // Aproximación de Exhibit 20-8
        } else if (terrain === 'plano') {
            return 1.5;
        } else if (terrain === 'montanoso') {
            return 4.5;
        } else if (terrain === 'escarpado') {
            return 7.0;
        }
        return 1.5;
    },

    // Equivalentes para PTSF
    get_ET_PTSF: function(terrain, vp_guess = 1500, grade = 0, length = 0) {
        if (grade >= 3 && length > 0) {
            // Aproximación de Pendiente Específica para PTSF (HCM)
            let et_base = 1.0 + (grade - 2) * 0.4 + (length * 0.3);
            if (vp_guess > 800) et_base *= 0.85; 
            return Math.max(1.0, Number(et_base.toFixed(2)));
        }

        if (terrain === 'ondulado') {
            return 1.0; // Exhibit 20-10: ET es 1.0 para todos los niveles de flujo
        } else if (terrain === 'plano') {
            return 1.0;
        } else if (terrain === 'montanoso') {
            return 2.0;
        } else if (terrain === 'escarpado') {
            return 3.0;
        }
        return 1.0;
    },

    // Factor de ajuste por zonas de no rebase para ATS (f_np, ATS) - Exhibit 20-19
    get_fnp_ATS: function(noPassingPct, vo) {
        const pct = parseFloat(noPassingPct);
        const vo_val = Math.max(0, Math.min(1200, vo));
        
        // Tabla de interpolación 2D [pct_index][vo_index]
        // Filas: 0, 20, 40, 60, 80, 100
        // Columnas: 200, 400, 600, 800, 1000, 1200
        const table = [
            [0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
            [0.0, 0.7, 1.1, 1.4, 1.6, 1.8],
            [0.0, 1.3, 2.0, 2.6, 3.1, 3.5],
            [0.0, 2.0, 3.2, 4.2, 5.0, 5.7],
            [0.0, 2.9, 4.7, 6.2, 7.4, 8.4],
            [0.0, 4.0, 6.5, 8.5, 10.2, 11.5]
        ];
        
        const pctLevels = [0, 20, 40, 60, 80, 100];
        const voLevels = [200, 400, 600, 800, 1000, 1200];
        
        // Interpolación bilineal
        let r1 = 0, r2 = 0, fr = 0;
        for (let i = 0; i < pctLevels.length - 1; i++) {
            if (pct >= pctLevels[i] && pct <= pctLevels[i+1]) {
                r1 = i; r2 = i + 1;
                fr = (pct - pctLevels[i]) / 20;
                break;
            }
        }
        
        let c1 = 0, c2 = 0, fc = 0;
        if (vo_val <= 200) { c1 = 0; c2 = 0; fc = 0; }
        else {
            for (let j = 0; j < voLevels.length - 1; j++) {
                if (vo_val >= voLevels[j] && vo_val <= voLevels[j+1]) {
                    c1 = j; c2 = j + 1;
                    fc = (vo_val - voLevels[j]) / 200;
                    break;
                }
            }
        }
        
        // Valores de las 4 esquinas
        const q11 = table[r1][c1];
        const q12 = table[r1][c2];
        const q21 = table[r2][c1];
        const q22 = table[r2][c2];
        
        const val_r1 = q11 + fc * (q12 - q11);
        const val_r2 = q21 + fc * (q22 - q21);
        
        return val_r1 + fr * (val_r2 - val_r1);
    },

    // Ajuste por zonas de no rebase para PTSF (f_np, PTSF) - Exhibit 20-21 (coefs)
    get_fnp_PTSF: function(noPassingPct, vd, vo) {
        const pct = parseFloat(noPassingPct);
        const pLevels = [0, 20, 40, 60, 80, 100];
        const aVals = [0.0, 10.0, 17.0, 23.0, 29.0, 35.0];
        const bVals = [0.0, -4.0, -6.0, -7.7, -9.3, -10.5];
        
        let a = 0, b = 0;
        for (let i = 0; i < pLevels.length - 1; i++) {
            if (pct >= pLevels[i] && pct <= pLevels[i+1]) {
                const f = (pct - pLevels[i]) / 20;
                a = aVals[i] + f * (aVals[i+1] - aVals[i]);
                b = bVals[i] + f * (bVals[i+1] - bVals[i]);
                break;
            }
        }
        
        const vo_k = vo / 1000;
        const vd_k = vd / 1000;
        return vd_k * (a * vo_k + b * Math.pow(vo_k, 2));
    },
    
    // Coeficientes a y b para BPTSF - Exhibit 20-21 (parte 1)
    get_BPTSF_coeffs: function(vo) {
        const voLevels = [200, 400, 600, 800, 1000, 1200];
        const aVals = [-0.0014, -0.0022, -0.0033, -0.0045, -0.0049, -0.0054];
        const bVals = [0.973, 0.923, 0.870, 0.833, 0.829, 0.825];
        
        const vo_val = Math.max(200, Math.min(1200, vo));
        
        if (vo_val === 200) return { a: aVals[0], b: bVals[0] };
        
        for (let i = 0; i < voLevels.length - 1; i++) {
            if (vo_val >= voLevels[i] && vo_val <= voLevels[i+1]) {
                const f = (vo_val - voLevels[i]) / 200;
                const a = aVals[i] + f * (aVals[i+1] - aVals[i]);
                const b = bVals[i] + f * (bVals[i+1] - bVals[i]);
                return { a, b };
            }
        }
        return { a: aVals[5], b: bVals[5] };
    },

    // Función principal de cálculo - Análisis Direccional
    calculate: function(inputs) {
        const Vd = parseFloat(inputs.vd);
        const Vo = parseFloat(inputs.vo);
        const PHF = parseFloat(inputs.phf);
        const pT = parseFloat(inputs.trucks) / 100;
        const pR = 0; 
        const BFFS = parseFloat(inputs.ffs);
        const fp = parseFloat(inputs.fp) || 1.0;
        const terrain = inputs.terrain || 'ondulado';
        const length = parseFloat(inputs.gradeLength);
        const lw = parseFloat(inputs.laneWidth);
        const sw = parseFloat(inputs.shoulderWidth);
        const ap = parseFloat(inputs.accessPoints);
        const np = parseFloat(inputs.noPassing);

        // --- VALIDACIONES ESTRICTAS DE RANGOS Y TABLAS (HCM) ---
        if (Vd < 0 || Vo < 0) throw new Error("Los volúmenes direccionales no pueden ser negativos.");
        if (PHF < 0.25 || PHF > 1.00) throw new Error("El Factor de Hora Pico (PHF) debe estar entre 0.25 y 1.00.");
        if (pT < 0 || pT > 1) throw new Error("El porcentaje de camiones debe estar entre 0% y 100%.");
        if (fp < 0.71 || fp > 1.00) throw new Error("El factor de población (fp) debe estar entre 0.71 y 1.00.");
        if (lw < 2.7) throw new Error("El ancho de carril debe ser mayor o igual a 2.7 m (límite inferior Exhibit 20-5).");
        if (sw < 0) throw new Error("El ancho de berma no puede ser negativo.");
        if (ap < 0 || ap > 24) throw new Error("Los puntos de acceso deben estar entre 0 y 24 puntos/km (rango del Exhibit 20-6).");
        if (np < 0 || np > 100) throw new Error("Las zonas de no rebase deben estar entre 0% y 100%.");

        // 1. Calcular FFS [km/h]
        const f_LS = this.get_fLS(lw, sw);
        const f_A = this.get_fA(ap); 
        const FFS = BFFS - f_LS - f_A;

        const fG = 1.0; // En HCM, fG es 1.0 para dos carriles, todo el impacto va a ET
        const grade = parseFloat(inputs.grade) || 0;
        const gradeLength = parseFloat(inputs.gradeLength) || 15.0;

        // --- PROCESO ITERATIVO PARA ATS ---
        // Se aplica la pendiente (grade, length) solo en la dirección de análisis. 
        // La dirección opuesta se asume bajada (pendiente = 0)
        let ET_ATS = this.get_ET_ATS(terrain, 1500, grade, gradeLength); 
        let fHV_d_ATS = 1 / (1 + pT * (ET_ATS - 1));
        let vd_ATS = Vd / (PHF * fG * fHV_d_ATS * fp);
        let vo_ATS = Vo / (PHF * fG * fHV_d_ATS * fp); // Usando el mismo ET para la estimación inicial de vo
        
        // Segunda iteración
        const ET_ATS_2 = this.get_ET_ATS(terrain, vd_ATS, grade, gradeLength);
        if (ET_ATS_2 !== ET_ATS) {
            ET_ATS = ET_ATS_2;
            fHV_d_ATS = 1 / (1 + pT * (ET_ATS - 1));
            vd_ATS = Vd / (PHF * fG * fHV_d_ATS * fp);
        }
        
        // Iteración para dirección opuesta (separado) - pendiente 0
        let ET_ATS_o = this.get_ET_ATS(terrain, vo_ATS, 0, 0);
        let fHV_o_ATS = 1 / (1 + pT * (ET_ATS_o - 1));
        vo_ATS = Vo / (PHF * fG * fHV_o_ATS * fp);

        // --- PROCESO ITERATIVO PARA PTSF ---
        let ET_PTSF = this.get_ET_PTSF(terrain, 1500, grade, gradeLength); 
        let fHV_d_PTSF = 1 / (1 + pT * (ET_PTSF - 1));
        let vd_PTSF = Vd / (PHF * fG * fHV_d_PTSF * fp);
        
        let ET_PTSF_o = this.get_ET_PTSF(terrain, Vo / (PHF * fG * fHV_d_PTSF * fp), 0, 0);
        let fHV_o_PTSF = 1 / (1 + pT * (ET_PTSF_o - 1));
        let vo_PTSF = Vo / (PHF * fG * fHV_o_PTSF * fp);

        // 4. Calcular ATS en km/h
        const f_np_ATS = this.get_fnp_ATS(inputs.noPassing, vo_ATS);
        let ATS = FFS - 0.00776 * (vd_ATS + vo_ATS) - f_np_ATS;
        if (ATS > FFS) ATS = FFS;

        // 5. Calcular PTSF
        const { a, b } = this.get_BPTSF_coeffs(vo_PTSF);
        const BPTSF = 100 * (1 - Math.exp(a * Math.pow(vd_PTSF, b)));
        const f_np_PTSF = this.get_fnp_PTSF(inputs.noPassing, vd_PTSF, vo_PTSF);
        let PTSF = BPTSF + f_np_PTSF;
        if (PTSF > 100) PTSF = 100;

        // 6. Nivel de Servicio (LOS) - Criterios de Exhibit 20-3
        let LOS = 'F';
        if (vd_ATS > 1700 || vd_PTSF > 1700 || ((Vd + Vo) / (PHF * fG * fHV_d_ATS * fp)) > 3200) {
            LOS = 'F';
        } else if (PTSF <= 35 && ATS > 90) {
            LOS = 'A';
        } else if (PTSF <= 50 && ATS > 80) {
            LOS = 'B';
        } else if (PTSF <= 65 && ATS > 70) {
            LOS = 'C';
        } else if (PTSF <= 80 && ATS > 60) {
            LOS = 'D';
        } else {
            LOS = 'E';
        }
        
        // 7. Métricas Adicionales
        const vc = vd_PTSF / 1700; // Capacidad teórica por carril
        const VKT_60 = Vd * length; // veh-km
        const TT_15 = (VKT_60 / 4) / ATS; // veh-h para 15 min
        const t_veh = (length / ATS) * 60; // minutos por vehículo

        return {
            FFS: FFS.toFixed(2),
            vp_ATS: Math.round(vd_ATS),
            vp_PTSF: Math.round(vd_PTSF),
            ATS: ATS.toFixed(1),
            PTSF: PTSF.toFixed(1),
            LOS: LOS,
            fHV_ATS: fHV_d_ATS.toFixed(3),
            fHV_PTSF: fHV_d_PTSF.toFixed(3),
            ET_ATS: ET_ATS,
            ET_PTSF: ET_PTSF,
            vc: vc.toFixed(2),
            VKT_60: VKT_60.toFixed(0),
            t_veh: t_veh.toFixed(1)
        };
    }
};

// Exportar globalmente para usar en Vanilla JS
window.hcmCalculations = hcmCalculations;
