class BeyerNew {
    run(ch) {
      let dt = 5 / 60; // // in h
      let nrSteps = 8760 / dt; // Anzahl der Schritte
  
      let ausrichtung = "S";
      let neigung = 30;
      let results = [];
      let T_vor;
      for (let t = 0; t < nrSteps; t++) {
          let result = this.calcPV(t, ausrichtung, neigung, ch[t][0], ch[t][1], ch[t][2], ch[t][3], T_vor, true);
          let pv = result[0];
          T_vor = result[1];  
          results.push([ch[t][0], T_vor]); 
      }
      return results;
    }
    calcPV(i, ausrichtung, neigung, t, G_h, G_dh, T_amb, T_vor, T_Vor_Anpassen) {
      let a_pv;
      switch(ausrichtung){
          case "N":
              a_pv = 180;
              break;
          case "O":
              a_pv = -90;
              break;
          case "W":
              a_pv = 90;
              break;
          case "S":
              a_pv = 0;
              break;
      }
    
      let result = this.calcPOA(G_h-G_dh,G_dh,t,a_pv,neigung,[52.21,14.122],1)
      let G_pv = result[0];
      //console.log(G_pv)
      result = this.calcPvDcBeyer(G_pv, T_amb, 300, 1, T_vor, T_Vor_Anpassen);
      let p_dc = result[0];
      T_vor = result[1];
  
      // AC-Leistungsabgabe
  
      let ppv = p_dc;
  
      let P_PVErtrag = 10;
      let P_PV2AC_in = 10.2145046;
      let P_PV2AC_out = 10;
  
      let PV2AC_a_in = 1.405573334011434e+02;
      let PV2AC_b_in = 43.872319822462500;
      let PV2AC_c_in = 28.855218465838200;
  
      let Ppv = Math.min(ppv * P_PVErtrag, P_PV2AC_in) * 1000;
      //console.log(Ppv);
      let ppvinvin = Ppv / P_PV2AC_in / 1000;
  
      let Ppvs = Math.min(Math.max(0, Ppv - (PV2AC_a_in * ppvinvin * ppvinvin + PV2AC_b_in * ppvinvin + PV2AC_c_in)), P_PV2AC_out * 1000);
  
      let flos = 1.0 / 1.0079;
  
      // 2.3 Für weitere Verwendung relevant Variablen
      let ppvs = Ppvs / P_PVErtrag / 1000 * flos;
  
      return [ppvs,T_vor];
  }
  calcPvDcBeyer( G, T_a, dt,pv_mod, T_vor, T_Vor_Anpassen){
      // Richtige Technik angeben.
      // A =[      a1                  a2                  a3              alpha_T];
      let A=[ 
          [0.0905386081543195, -1.81302304974591e-05, 0.0109430081539134,     -0.0045],
          [0.0944020384680716, -1.27046832540756e-05, 0.00930876126744881,    -0.004],
          [0.103407597,        -8.14439E-06,          0.015755848,            -0.003]];
      let a
      if (pv_mod <= A.length) {
          a = A[pv_mod];
      } else {
          throw new Error('Waehle eine gueltige PV-Technik!');
      }
      
      let result = this.Temperaturmodell(T_a, G, dt, T_vor, T_Vor_Anpassen);
      let T_pv = result[0];
      T_vor = result[1];
      
      let eta_stc = a[0] + a[1] * 1000 + a[2] * Math.log(1000);
      let eta_MPP = a[0] + a[1] * G + a[2] * Math.max(0, Math.log(G));
      eta_MPP = eta_MPP * (1 + a[3] * (T_pv - 25));
      
      let eta_losses = 0.92;
      
      let eta_degradation = 0.975;
      
      let eta_pv = (eta_MPP * eta_losses * eta_degradation) / eta_stc;
      
      let p_dc = G / 1000 * eta_pv;
      //console.log(p_dc, G, T_a, T_pv);
      return  [p_dc, T_vor];
      
  }
  
  
    // Anpassung JW: 2/2018: (1-exp(-1/tau)); durch (1-exp(-dt/tau)); ersetzt
    // damit die Berechnung auch mit anderen Zeitschritten funktioniert
    // Temperaturerhoehung bei PV gegenueber der Luft
    Temperaturmodell(T_a, G, dt, T_vor, T_Vor_Anpassen) {
        let T_pv;

        if(T_Vor_Anpassen){
            T_pv = this.tempRungeKutta(T_a, G, dt, T_vor);
            T_vor = T_pv;
        }else{
            T_pv = T_vor;
        }

        //console.log(T_vor)
        // // if(T_Vor == )
        // // Zeitkonstante
        // // T_a = Array(G[0].length).fill(T_a); 
        // let T_pv = Array(G.length).fill(0);
        // T_pv[0] = T_vor;
        //console.log(T_pv);
    
        // for (let i = 1; i < G.length; i++) {
        //     let T_stat = T_a[i] + c * G[i] / 1000;
        //     T_pv[i] = T_vor + (T_stat - T_vor) * (1 - Math.exp(-dt / tau));
        //     T_vor = T_pv[i];
        // }
    
        return [T_pv, T_vor];
    }

    tempRungeKutta(T_a, G, dt, T_vor) {
        if(T_vor === undefined){
            return this.tempIncrementFormula(T_a, G, dt, T_vor);
        }
        let k1 = this.tempIncrementFormula(T_a, G, dt/2, dt, T_vor) * 2;
        let k2 = this.tempIncrementFormula(T_a, G, dt/2, dt, T_vor + 0.5*k1) * 2;
        let k3 = this.tempIncrementFormula(T_a, G, dt/2, dt, T_vor + 0.5*k2) * 2;
        let k4 = this.tempIncrementFormula(T_a + k3, G, dt, dt, T_vor + 0.5*k3);
        // console.log(k1, k2, k3, k4);
        let T_Next = T_vor + (1/6)*(k1 + 2*k2 + 2*k3 + k4)

        return T_Next
    }

    tempIncrementFormula(T_a, G, dt,dt_step, T_vor){
        let c = 29;
        let tau = 10 * 60;
        if(T_vor === undefined){
            return T_a + c * G / 1000;
        }else{
            let T_stat = T_a + c * G / 1000;
            return (T_stat - T_vor) * (1 - Math.exp(-dt / tau)) *dt/dt_step;
        }
    }
  /*
  * Rechnet die Strahlung aus der Horizontalen in die geneigte Ebene um
  * Syntax G_pv = poa(G_bh, G_dh, time, alpha_PV, gamma_PV, [Breite,Laenge], Zeitzone);
  * 
  * G_pv:         Globalstrahlung auf der Generator Ebene
  * G_dpv:        Diffusstrahlung auf der Generator Ebene
  * G_bh:         Direktstrahlung auf der Horizontalen (beam horizontal)
  * G_dh:         Diffusstrahlung auf der Horizontalen (sky-diffuse horizontal)
  * t:            Zeit als unix
  * alpha_pv:     Ausrichtung des Generators mit 0 Grad =Suedausrichtung
  * gamma_pv:     Neigung der Generators
  * Koordinaten:  [Breitengrad, Laengengrad]
  * Zeitzone:     1 fuer MEZ, 2 fuer MESZ, etc. oder Vektor bei variablen Daten
  *
  * Algorithmus nach Volker Quaschning, "Regenerative Energiesysteme",
  * Auflage 8 Kapitel 7.5
  *
  * v.13.11.2014
  * Author: Joseph Bergner
  * Übesetzt in JS: Tobias Henning
  * Changelog:
  * 2015:     Horizontverschattung ueber einen Winkel von 2 Grad beruecksichtigt.
  * 2018:     JW: Hinweis zum Vermeidung von Artefakte am Morgen und Abend: G_bh=max(G_h-G_dh,0) statt G_h-G_dh; [G_pv] = poa(G_bh,G_dh,t,a_pv,g_pv,[53.1523,8.1659],1);
  */
  calcPOA(G_bh,G_dh,t,alpha_pv,gamma_pv,Koordinaten,Zeitzone){
      // Der Sonnenstand des Tages soll sich ueber die Funktion Sonnenposition
      // geholt werden
      let doy = this.calcDOY(t);
      let resultSunPos = this.calcSunPos(t,Koordinaten,Zeitzone,doy);
      let alpha_s = resultSunPos[0];
      let gamma_s = resultSunPos[1];
      
      //Einfallswinkel Theta
      let Theta = Math.acos(-Math.cos(this.degToRad(gamma_s)) * Math.sin(this.degToRad(gamma_pv)) * Math.cos(this.degToRad(alpha_s - alpha_pv)) + Math.sin(this.degToRad(gamma_s)) * Math.cos(this.degToRad(gamma_pv))) * (180 / Math.PI);
      //console.log(Theta+" "+gamma_s+" "+gamma_pv+" "+alpha_s+" "+alpha_pv);
      
      //Array incidence loss (IAM)
      let l_IAM = Math.max(0, 1 - 0.05 * (1 / Math.cos(Math.min(90, this.degToRad(Theta))) - 1));
      //console.log(Theta);
  
      // Direkte Strahlung auf geneigter Ebene
      // Um die Randwerte, kleine Sonnenstands Winkel bei "gro�em" Direktanteil in
      // den Griff zu bekommen wurde folgende Annahme getroffen:
      // Es liegt mindestens eine Horizontverschattung von 2� vor, sodass der
      // Direktanteil unterhalb von 2� nicht ber�cksichtigt wird.
      let i = gamma_s <= 2 && G_bh > 0;
      if (i) {
          G_bh = 0;
      }
      
      let G_bpv = l_IAM * G_bh * Math.cos(this.degToRad(Theta)) / Math.sin(this.degToRad(gamma_s));
      
      if (G_bpv < 0) {
          G_bpv = 0;
      }
      //console.log(G_bpv)
  
      // Diffusberechnung nach dem Modell von Klucher (Aufhellung um Sonne und Horizontaufhellung)
      // Korrektur weil das Teilen durch Null unzul�ssig ist.
      // Wenn keine Strahlung vorhanden ist, ist F=0 
      let F = Array(G_bh.length).fill(0);
      i = (G_dh + G_bh) !== 0;
      
      if (i) {
          F = 1 - Math.pow((G_dh / (G_dh + G_bh)), 2);
      }
      
      let G_dpv = G_dh * 0.5 * (1 + Math.cos(this.degToRad(gamma_pv))) * (1 + F * Math.pow(Math.sin(this.degToRad(0.5 * gamma_pv)), 3)) * (1 + F * Math.pow(Math.cos(this.degToRad(Theta)), 2) * Math.pow(Math.cos(this.degToRad(gamma_s)), 3));
      //console.log(G_dpv);
  
      // Reflexion mit Bodenalbedo 0.2
      let G_gpv = (G_dh + G_bh) * 0.1 * (1 - Math.cos(this.degToRad(gamma_pv)));
      //console.log(G_gpv);
  
      // Gesamteglobalstrahlung
      let G_pv = G_bpv + G_dpv + G_gpv;
      //console.log(G_pv);
  
      if (G_pv < 0) {
          G_pv = 0;
      }
  
      return [G_pv, G_dpv]
  
  }
  
  /*
  * calcSunPos berechnet aus Zeitstempel und Koordinaten die dazugehörigen Sonnenposition
  * DIN 5034 nach Volker Quaschning "Regenerative Energiesysteme" Auflage 8 Kap. 2.5
  *
  * Syntax:
  * [alpha_s, gamma_s] = calcSunPos(t,[BREITE, LAENGE], Zeitzone,doy);
  *
  * t:            Zeitstempel in unix Format
  * Koordinaten:  in ° mit der Aufteilung [BREITE, LAENGE]
  * Zeitzone:     MEZ=+1 (default), UTC=0, MESZ=+2 ...
  *
  * Benutzte Funktionen:
  * calcDOY
  *
  * Author Joseph Bergner
  * Übesetzt in JS: Tobias Henning
  */
  calcSunPos(t,Koordinaten, Zeitzone,doy){
      let LAENGE = Koordinaten[1];
      let BREITE = Koordinaten[0];
  
      //Anzahl Tage im Jahr
      let date = new Date(t * 1000);
  
      // Schaltjahr?
      var ly = date.getFullYear() % 4 == 0 ? 366 : 365;
      
      // Berechnung
      // Gradtagzahl
      const J = 360 * doy / ly;
      
      // max Sonnenstandshöhe (Deklination) an einem Bestimmten Tag
      const DEK = 0.3948 - 23.2559 * Math.cos(this.degToRad(J + 9.1)) - 0.3915 * Math.cos(this.degToRad(2 * J + 5.4)) - 0.1764 * Math.cos(this.degToRad(3 * J + 26));
  
      // Zeitgleichung
      const ZGL = 0.0066 + 7.3525 * Math.cos(this.degToRad(J + 85.9)) + 9.9359 * Math.cos(this.degToRad(2 * J + 108.9)) + 0.3387 * Math.cos(this.degToRad(3 * J + 105.2)); // min
  
  
      const hour = (date.getUTCHours() + Zeitzone) % 24;
      const minute = date.getUTCMinutes();
      const LZ = hour * 60 + minute; // min
      const MOZ = LZ - (Zeitzone * 60) + 4 * LAENGE; // min
  
      // Wahre Orts Zeit
      const WOZ = ZGL + MOZ; // min
  
      // Stundenwinkel
      const omega = (12 - WOZ / 60) * 15; // °
  
      // Sonnenstand und Azimut
      const gamma_s = Math.asin(Math.cos(this.degToRad(omega)) * Math.cos(this.degToRad(DEK)) * Math.cos(this.degToRad(BREITE)) + Math.sin(this.degToRad(BREITE)) * Math.sin(this.degToRad(DEK))) * (180 / Math.PI); // °
  
      // Unterscheidung ob Vormittag oder Nachmittag
      const AMPM = (WOZ / 60 <= 12) ? -1 : 1; // Binär
  
      const alpha_s = 180 + AMPM * this.radToDeg(Math.acos(Math.max(-1, Math.min(1, (Math.sin(this.degToRad(gamma_s)) * Math.sin(this.degToRad(BREITE)) - Math.sin(this.degToRad(DEK))) / (Math.cos(this.degToRad(gamma_s)) * Math.cos(this.degToRad(BREITE)))))));            
      //console.log(AMPM + " " + omega+ " " + gamma_s+ " " +LZ+ " " + MOZ+ " " + DEK+ " " + ZGL + " " + alpha_s);
  
      return [alpha_s, gamma_s, omega, DEK];            
  }
  
  // to convert degrees to radians
  degToRad(degrees) {
      return degrees * (Math.PI / 180);
  }
  // to convert radians to degrees
  radToDeg(radians) {
      return radians * (180 / Math.PI);
  }
  
  /*
  * calcDOY gibt den Tag des Jahres für einen Zeitstempel an
  *
  * Syntax:
  * [ doy ] = calcDOY( t )
  *
  * Variablen
  * t:    Zeitstempel im unix-Format
  * doy:  Tag des Jahres von jedem Eintrag in t
  *
  * Author Joseph Bergner
  * Change: 17.12.2018 (JW)
  * Übesetzt in JS: Tobias Henning
  */
  calcDOY(timestamp){
      let now = new Date(timestamp * 1000);
      //console.log(timestamp, now)
      let start = new Date(now.getFullYear(), 0, 0);
      let diff = now - start;
      let oneDay = 1000 * 60 * 60 * 24;
      let day = Math.floor(diff / oneDay);
      //console.log('Day of year: ' + day);
      return day
  }
  }
  