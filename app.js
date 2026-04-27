
        let wakeLock = null;

        async function enableWakeLock() {
          if ('wakeLock' in navigator) {
            try { wakeLock = await navigator.wakeLock.request('screen'); } catch(e) {}
          }
        }

        function disableWakeLock() {
          if (wakeLock) { wakeLock.release(); wakeLock = null; }
        }

        const configScreen = document.getElementById('config-screen');
        const gameScreen = document.getElementById('game-screen');

        let config = JSON.parse(localStorage.getItem('config')) || {
          team1: 'VB', numPeriods: 4, scoring: {1:false,2:true,3:true}
        };

        let game = null;
        let history = [];

        team1.value = config.team1;
        team2.value = '';
        numPeriods.value = config.numPeriods;
        p1.checked = config.scoring[1];
        p2.checked = config.scoring[2];
        p3.checked = config.scoring[3];

        startGame.onclick = () => {
          if (!team1.value || !team2.value) return alert('Enter team names');
          if (![p1,p2,p3].some(c=>c.checked)) return alert('Select scoring');

          config = {
            team1: team1.value,
            numPeriods: Number(numPeriods.value),
            scoring: {1:p1.checked,2:p2.checked,3:p3.checked}
          };

          localStorage.setItem('config', JSON.stringify(config));

          game = { period:1, scores: Array.from({length:config.numPeriods}, ()=>({a:0,b:0})) };
          history = [];

          configScreen.classList.add('hidden');
          gameScreen.classList.remove('hidden');
          enableWakeLock();
          render();
        };

        function total(t){ return game.scores.reduce((s,p)=>s+p[t],0); }

        function add(t,p){ game.scores[game.period-1][t]+=p; history.push({t,p,period:game.period}); render(); }

        undo.onclick = () => { const l=history.pop(); if(!l) return; game.scores[l.period-1][l.t]-=l.p; render(); };
        prevPeriod.onclick = () => { if(game.period>1) game.period--; render(); };
        nextPeriod.onclick = () => { if(game.period<config.numPeriods) game.period++; render(); };

        share.onclick = async () => {
          const title = game.period===config.numPeriods ? 'Slutresultat' : 'Period '+game.period;
          await navigator.share({ text: `${title}
${config.team1} ${total('a')} - ${total('b')} ${team2.value}` });
        };

        newGame.onclick = () => { if(confirm('Start new game?')){ disableWakeLock(); location.reload(); } };

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && !gameScreen.classList.contains('hidden')) enableWakeLock();
          else disableWakeLock();
        });

        function render(){
          gameTitle.textContent = `${config.team1} vs ${team2.value}`;
          periodLabel.textContent = `Period ${game.period}`;
          name1.textContent = config.team1;
          name2.textContent = team2.value;
          score1.textContent = total('a');
          score2.textContent = total('b');
          buttons1.innerHTML=''; buttons2.innerHTML='';
          [1,2,3].forEach(p=>{
            if(config.scoring[p]){
              buttons1.appendChild(btn('+'+p,()=>add('a',p)));
              buttons2.appendChild(btn('+'+p,()=>add('b',p)));
            }
          });
        }

        function btn(text,fn){ const b=document.createElement('button'); b.textContent=text; b.onclick=fn; return b; }
