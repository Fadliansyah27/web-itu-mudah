// pages/index.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Head from 'next/head';

const order = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const total = order.length;
const anglePer = 360/total;

const colorFor = (num: number) => {
  if (num === 0) return '#0b7a3b';
  const reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  return reds.includes(num) ? '#ef4444' : '#08101a';
}

export default function Home() {
  const [playerChoice, setPlayerChoice] = useState(order[0]);
  const [spinInProgress, setSpinInProgress] = useState(false);
  const [finalResult, setFinalResult] = useState<number | null>(null);
  const [adminPick, setAdminPick] = useState<number | null>(null);

  // hiddenFlag hanya akan diisi client-side setelah fetch potongan
  const [hiddenFlag, setHiddenFlag] = useState<string | null>(null);

  const ringRef = useRef<HTMLDivElement>(null);
  const wheelSvgRef = useRef<SVGSVGElement | null>(null);
  const adminResultBadgeRef = useRef<HTMLDivElement>(null);
  const playerResultBadgeRef = useRef<HTMLDivElement>(null);

  const buildWheel = useCallback(() => {
    if (!ringRef.current) return;
    ringRef.current.innerHTML = '';

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('id', 'wheelSvg');
    svg.setAttribute('viewBox', '0 0 438 438');

    for (let i = 0; i < total; i++) {
      const num = order[i];
      const angle = i * anglePer;
      const centerX = 219, centerY = 219, radius = 219;

      const angleOffset = -90;
      const angleStart = (angle + angleOffset) * Math.PI/180;
      const angleEnd = (angle + anglePer + angleOffset) * Math.PI/180;

      const x1 = centerX + radius * Math.cos(angleStart);
      const y1 = centerY + radius * Math.sin(angleStart);
      const x2 = centerX + radius * Math.cos(angleEnd);
      const y2 = centerY + radius * Math.sin(angleEnd);

      const d = `M${centerX},${centerY} L${x1},${y1} A${radius},${radius} 0 0,1 ${x2},${y2} Z`;

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute('fill', colorFor(num));
      path.setAttribute('d', d);
      path.setAttribute('data-num', String(num));
      path.setAttribute('class', 'slice');
      svg.appendChild(path);

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      const textAngle = angle + anglePer / 2;
      const textRadius = radius * 0.82;

      const textX = centerX + textRadius * Math.cos((textAngle + angleOffset) * Math.PI/180);
      const textY = centerY + textRadius * Math.sin((textAngle + angleOffset) * Math.PI/180) + 7;

      text.setAttribute('x', String(textX));
      text.setAttribute('y', String(textY));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', '#fff');
      text.setAttribute('font-size', '1.1rem');
      text.setAttribute('class', 'slice-text');
      text.textContent = String(num);

      const rotateAngle = textAngle + 90;
      text.setAttribute('transform', `rotate(${rotateAngle} ${textX} ${textY})`);

      svg.appendChild(text);
    }

    ringRef.current.appendChild(svg);
    wheelSvgRef.current = svg;
  }, []);

  const spin = useCallback(() => {
    if (spinInProgress || !wheelSvgRef.current || !ringRef.current) return;
    setSpinInProgress(true);
    setFinalResult(null);

    ringRef.current.querySelectorAll('.slice-win').forEach(el => el.classList.remove('slice-win'));

    // Admin selalu memilih angka lebih besar (CTF logic)
    const playerPickValue = Number(playerChoice);
    let biggerNums = order.filter(n => n > playerPickValue);
    let adminNum: number;
    if (biggerNums.length > 0) {
      adminNum = biggerNums[Math.floor(Math.random() * biggerNums.length)];
    } else {
      adminNum = Math.max(...order);
    }
    setAdminPick(adminNum);

    const winningIndex = order.indexOf(adminNum);

    const direction = Math.random() > 0.5 ? 1 : -1;
    const targetSliceCenter = (total - winningIndex) * anglePer;
    const initialRotation = Math.floor(Math.random() * 360);
    const numTurns = Math.floor(Math.random() * 5) + 3;
    const finalRotation = (numTurns * 360) + targetSliceCenter - initialRotation;

    const wheelSvg = wheelSvgRef.current;
    if (wheelSvg) {
      wheelSvg.style.transition = `none`;
      wheelSvg.style.transform = `rotate(${initialRotation}deg)`;

      requestAnimationFrame(() => {
        wheelSvg.style.transition = `transform 3000ms cubic-bezier(.17,.67,.83,.67)`;
        wheelSvg.style.transform = `rotate(${direction * finalRotation}deg)`;
      });

      wheelSvg.ontransitionend = function(e) {
        if(e.propertyName && e.propertyName !== 'transform') return;

        setFinalResult(adminNum);
        const targetPath = ringRef.current?.querySelector(`.slice[data-num="${adminNum}"]`);
        if(targetPath) { targetPath.classList.add('slice-win'); }

        const playerWin = playerPickValue === adminNum;
        if (adminResultBadgeRef.current) {
          adminResultBadgeRef.current.textContent = 'WIN';
          adminResultBadgeRef.current.classList.remove('lose');
        }
        if (playerResultBadgeRef.current) {
          playerResultBadgeRef.current.textContent = playerWin ? 'WIN' : 'LOSE';
          playerResultBadgeRef.current.classList.toggle('lose', !playerWin);
        }

        setSpinInProgress(false);
        wheelSvg.ontransitionend = null;
      };
    }
  }, [spinInProgress, playerChoice]);

  useEffect(() => {
    buildWheel();
  }, [buildWheel]);

  useEffect(() => {
    setAdminPick(null);
    setFinalResult(null);
    if (playerResultBadgeRef.current) playerResultBadgeRef.current.textContent = '—';
    if (adminResultBadgeRef.current) adminResultBadgeRef.current.textContent = '—';
  }, [playerChoice]);

  // --------------------
  // NEW: client-side fetch flag parts (obfuscated filenames)
  // --------------------
  useEffect(() => {
    // Nama file "txt.p_a" direverse sehingga jadi "a_p.txt" di array -> kita reverse lagi ke original
    // Ini hanya obfuscation ringan.
    const revParts = ["txt.oya","txt.anamid","txt.ayngalf"].map(s => s.split("").reverse().join(""));
    const urls = revParts.map(p => `/hidden/${p}`);

    // fetch semua potongan (urutan sesuai revParts)
    Promise.all(urls.map(u => fetch(u).then(r => r.text())))
      .then(parts => {
        const combined = parts.join('');
        // coba reverse combined dulu (jika saat generate kita menyimpan reversed)
        const maybeReversed = combined.split('').reverse().join('');
        let decoded: string | null = null;
        try {
          decoded = atob(maybeReversed);
        } catch(e) {
          try { decoded = atob(combined); } catch(e2){ decoded = null; }
        }
        if(decoded) {
          // taruh flag ke elemen tersembunyi (bukan attribute)
          const el = document.getElementById('flagHolder');
          if (el) el.textContent = decoded;
          setHiddenFlag(decoded);
        }
      })
      .catch(err => {
        // jika fetch gagal, jangan ganggu UX utama
        console.debug('fetch hidden parts failed', err);
      });
  }, []);

  return (
    <div className="container">
      <Head>
        <title>Roulette — Admin Always Wins (CTF) | Web Itu Mudah</title>
      </Head>
      <div className="card">
        <div className="title">🎰 Live Roulette</div>
        <div className="subtitle">Pilih angka, lalu klik SPIN — semangaat cari flagnya.</div>
        <div className="layout-main">
          <div className="main-left">
            <div className="wheel-wrap">
              <div id="ring" ref={ringRef}></div>
              <svg id="arrow" width="48" height="48" viewBox="0 0 48 48">
                <polygon points="24,44 36,18 30,18 30,6 18,6 18,18 12,18" fill="#ffd166" stroke="#111" strokeWidth="1.8"/>
              </svg>
            </div>

            <div className="controls">
              <label htmlFor="playerPick">Angka pilihan kamu:</label>
              <select 
                id="playerPick" 
                className="select" 
                value={playerChoice} 
                onChange={(e) => setPlayerChoice(Number(e.target.value))}
                disabled={spinInProgress}
              >
                 {order.map(num => (
                    <option key={num} value={num}>{num}</option>
                 ))}
              </select>
              <button 
                id="spinBtn" 
                className="spin-btn" 
                onClick={spin} 
                disabled={spinInProgress}
              >
                {spinInProgress ? 'SPINNING...' : 'SPIN'}
              </button>
            </div>
          </div>

          <div className="main-right">
            <div className="title-info">Result</div>
            <div className="info-row">
              <div className="avatar player-avatar">P</div>
              <div>
                <div className="name">Player</div>
                <div className="pill" id="playerPickDisplay">{playerChoice}</div>
                <div id="playerResult" className="result-badge" ref={playerResultBadgeRef}>—</div>
              </div>
            </div>

            <div className="info-row">
              <div className="avatar admin-avatar">A</div>
              <div>
                <div className="name">Admin</div>
                {/* HAPUS atribut data-flag karena flag TIDAK lagi disisipkan di server */}
                <div className="pill" id="adminPickDisplay">
                    {adminPick !== null ? adminPick : '—'}
                </div>
                <div id="adminResult" className="result-badge" ref={adminResultBadgeRef}>—</div>
              </div>
            </div>

            <div className="title-info">Final Result</div>
            <div id="finalResultText" className="final-result">{finalResult !== null ? finalResult : '—'}</div>

            {/* Elemen tersembunyi untuk memegang flag (tidak muncul di View Source; diisi client-side) */}
            <div id="flagHolder" style={{display: 'none'}} aria-hidden="true">.</div>
          </div>
        </div>
      </div>
    </div>
  );
}