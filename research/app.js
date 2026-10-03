(() => {
  'use strict';
  const rows = window.STARTUP_STUDY.companies;
  const $ = id => document.getElementById(id);
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const groupName = g => g === 'primer' ? '프라이머' : 'YC · 미국 표본';
  const pct = (n, total) => total ? n / total * 100 : 0;
  const format = n => Number(n.toFixed(1)).toLocaleString('ko-KR');
  let page = 1;
  const pageSize = 10;
  let unit = 'percent';
  let chartRows = rows;
  const sectors = ['업무·마케팅','개발·데이터','소비·생활','교육·콘텐츠','건강·바이오','산업·환경','금융','확인 불가'];
  function renderTable() {
    const query = $('search').value.trim().toLocaleLowerCase();
    const filtered = rows.filter(r =>
      ($('group-filter').value === 'all' || r.group === $('group-filter').value) &&
      ($('year-filter').value === 'all' || String(r.year) === $('year-filter').value) &&
      ($('customer-filter').value === 'all' || r.customer === $('customer-filter').value) &&
      (!query || [r.name,r.summary,r.sector,r.basis,r.batch].join(' ').toLocaleLowerCase().includes(query)));
    const totalPages = Math.max(1,Math.ceil(filtered.length/pageSize));
    page = Math.min(page,totalPages);
    $('result-count').textContent = `전체 80개사 중 ${filtered.length}개사 · 프라이머 ${filtered.filter(r=>r.group==='primer').length} / YC ${filtered.filter(r=>r.group==='yc').length}`;
    $('company-rows').innerHTML = filtered.slice((page-1)*pageSize,page*pageSize).map(r => `
      <tr><td><a class="company-name" href="${esc(r.source)}" target="_blank" rel="noopener noreferrer">${esc(r.name)} ↗</a><span class="company-batch"><span class="program-label ${r.group}">${r.group==='primer'?'PRIMER':'YC'}</span>${esc(r.batch)} · ${r.year}</span></td>
      <td>${esc(r.summary)}</td><td><span class="badge ${r.customer==='확인 불가'?'unknown':''}">${esc(r.customer)}</span></td><td><span class="badge ${r.ai==='미확인'?'unknown':''}">${esc(r.ai)}</span></td><td>${esc(r.sector)}</td><td><button class="evidence-button" type="button" data-id="${r.id}" aria-expanded="false" aria-controls="evidence-${r.id}" aria-label="${esc(r.name)} 분류 근거">분류 근거 +</button></td></tr>
      <tr id="evidence-${r.id}" hidden><td colspan="6" class="evidence-cell"><p><strong>분류 근거</strong> · ${esc(r.basis)}</p><p>공개 소개를 바탕으로 한 분석자의 요약·해석입니다. ${r.descriptionAvailable?'소개에서 확인되지 않는 정보는 추정하지 않았습니다.':'원문에 사업 설명이 없어 확인 불가로 유지했습니다.'}</p><a href="${esc(r.source)}" target="_blank" rel="noopener noreferrer">공식 소개 원문 열기 ↗</a> · 수집일 ${r.collected}</td></tr>`).join('');
    $('empty-state').hidden = filtered.length !== 0;
    $('page-info').textContent = filtered.length ? `${page} / ${totalPages} 페이지` : '0개 결과';
    $('previous').disabled = page === 1;
    $('next').disabled = page === totalPages;
  }
  ['search','group-filter','year-filter','customer-filter'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',()=>{page=1;renderTable();}));
  $('reset-filters').addEventListener('click',()=>{ $('search').value=''; ['group-filter','year-filter','customer-filter'].forEach(id=>$(id).value='all');page=1;renderTable(); });
  $('previous').addEventListener('click',()=>{page--;renderTable();});
  $('next').addEventListener('click',()=>{page++;renderTable();});
  $('company-rows').addEventListener('click',e=>{
    const b=e.target.closest('.evidence-button');if(!b)return;
    const expanded=b.getAttribute('aria-expanded')!=='true';
    b.setAttribute('aria-expanded',String(expanded));b.textContent=expanded?'분류 근거 −':'분류 근거 +';
    $(b.getAttribute('aria-controls')).hidden=!expanded;
  });

  const count = (g,field,value) => chartRows.filter(r=>r.group===g && r[field]===value).length;
  const total = g => chartRows.filter(r=>r.group===g).length;
  const percent = (g,field,value) => pct(count(g,field,value),total(g));
  function gapText(a,b) {const diff=a-b;return diff===0?'두 표본의 비중이 같습니다':`${diff>0?'YC':'프라이머'} 표본에서 ${format(Math.abs(diff))}%p 높습니다`;}
  function renderFinding({index,field,title,body,stat,statLabel,categories,note}) {
    const max = unit === 'percent' ? 100 : Math.ceil(Math.max(total('primer'),total('yc'))/10)*10;
    return `<article class="finding" aria-labelledby="finding-${field}"><div class="finding-intro"><div><span class="finding-number">FINDING ${index}</span><h3 id="finding-${field}">${esc(title)}</h3><p>${esc(body)}</p></div><div class="finding-stat"><strong>${esc(stat)}</strong><span>${esc(statLabel)}</span></div></div>
      <div class="chart-body"><div class="legend chart-legend"><span><i class="dot primer"></i>프라이머</span><span><i class="dot yc"></i>YC · 미국 표본</span></div><div class="chart-axis" aria-hidden="true"><span>0</span><span>${format(max/2)}${unit==='percent'?'%':'개'}</span><span>${max}${unit==='percent'?'%':'개'}</span></div>
      <div role="group" aria-label="${esc(title)} 비교 그래프">${categories.map(category => `<div class="bar-group"><div class="bar-category">${esc(category)}</div><div class="bar-pair">${['primer','yc'].map(g=>{
        const n=count(g,field,category),nTotal=total(g),p=pct(n,nTotal),value=unit==='percent'?p:n;
        return `<button type="button" class="bar-row ${g}" data-field="${field}" data-category="${esc(category)}" data-group="${g}" aria-expanded="false" aria-controls="chart-detail-${field}" aria-label="${esc(groupName(g))}, ${esc(category)}, ${n}개사 / ${nTotal}개사, ${format(p)}퍼센트. 해당 기업 보기"><span class="bar-track"><span class="bar-fill" style="width:${value/max*100}%"></span></span><span class="bar-value">${unit==='percent'?format(p)+'%':n+'개'} <span aria-hidden="true">↗</span></span></button>`;
      }).join('')}</div></div>`).join('')}</div>
      <div class="chart-detail" id="chart-detail-${field}" hidden></div><p class="chart-note">${esc(note)} 막대를 누르면 해당 기업 목록이 열립니다. 기업 이름은 공식 소개로 연결됩니다.</p></div></article>`;
  }
  function renderCharts() {
    const year=$('chart-year').value;
    chartRows=rows.filter(r=>year==='all'||String(r.year)===year);
    const kp=percent('primer','customer','B2B'),yp=percent('yc','customer','B2B');
    const kai=100-percent('primer','ai','미확인'),yai=100-percent('yc','ai','미확인');
    const ranked=sectors.map(s=>({s,diff:percent('yc','sector',s)-percent('primer','sector',s)})).sort((a,b)=>Math.abs(b.diff)-Math.abs(a.diff));
    const largest=ranked[0];
    $('chart-scope').textContent=`${year==='all'?'2024–2025 전체':year+'년'} · 프라이머 n=${total('primer')} / YC n=${total('yc')} · 확인 불가 포함 · 각 그룹 전체가 비율의 분모`;
    const customerUnknown=`고객 확인 불가: 프라이머 ${count('primer','customer','확인 불가')}개, YC ${count('yc','customer','확인 불가')}개.`;
    $('charts').innerHTML=[
      renderFinding({index:'01',field:'customer',title:`B2B 비중, ${gapText(yp,kp)}`,body:`공개 소개상 B2B로 분류한 기업은 프라이머 ${count('primer','customer','B2B')}개(${format(kp)}%), YC ${count('yc','customer','B2B')}개(${format(yp)}%)입니다. 기업·기관뿐 아니라 업무용 전문가·개발자 도구를 포함합니다.`,stat:format(Math.abs(yp-kp))+'%p',statLabel:'B2B 비중의 절대 차이',categories:['B2B','B2C','혼합','확인 불가'],note:customerUnknown+' 혼합형 플랫폼을 B2B에 합산하지 않았습니다.'}),
      renderFinding({index:'02',field:'ai',title:`AI 관련 제품·인프라, ${gapText(yai,kai)}`,body:`제품·기능과 지원 인프라를 합친 비중은 프라이머 ${format(kai)}%, YC ${format(yai)}%입니다. AI를 사용하는 제품과 AI 개발·운영을 돕는 기반 산업을 나누어 표시했습니다.`,stat:format(Math.abs(yai-kai))+'%p',statLabel:'AI 관련 분류 비중의 절대 차이',categories:['제품·기능','지원 인프라','미확인'],note:'미확인은 AI를 쓰지 않는다는 뜻이 아닙니다. 일반 자동화는 제외했고, AI 지원 인프라는 학습 데이터·평가·RAG·냉각 등을 포함합니다. 설명 분량 차이의 영향이 있습니다.'}),
      renderFinding({index:'03',field:'sector',title:`가장 큰 분야 차이는 ‘${largest.s}’`,body:`${largest.s} 분야는 프라이머 ${count('primer','sector',largest.s)}개(${format(percent('primer','sector',largest.s))}%), YC ${count('yc','sector',largest.s)}개(${format(percent('yc','sector',largest.s))}%)입니다. ${largest.diff>0?'YC':'프라이머'} 표본에서 더 큰 비중을 차지합니다. 각 기업을 하나의 대표 분야로 분류했습니다.`,stat:format(Math.abs(largest.diff))+'%p',statLabel:'해당 분야 비중의 절대 차이',categories:ranked.map(r=>r.s),note:'분야는 이번 비교를 위한 소개 내용의 해석이며 공식 산업분류가 아닙니다. 차이가 큰 순서로 표시하며, 기업 수가 같아도 사업 규모·성과가 같다는 의미는 아닙니다.'})
    ].join('');
  }
  $('chart-year').addEventListener('change',renderCharts);
  document.querySelectorAll('[data-unit]').forEach(b=>b.addEventListener('click',()=>{
    unit=b.dataset.unit;document.querySelectorAll('[data-unit]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderCharts();
  }));
  $('charts').addEventListener('click',e=>{
    const b=e.target.closest('.bar-row');if(!b)return;
    const {field,category,group}=b.dataset;
    const expanded=b.getAttribute('aria-expanded')!=='true';
    b.closest('.chart-body').querySelectorAll('.bar-row').forEach(x=>x.setAttribute('aria-expanded','false'));
    const panel=$('chart-detail-'+field);panel.hidden=!expanded;
    if(!expanded)return;
    b.setAttribute('aria-expanded','true');
    const selected=chartRows.filter(r=>r.group===group&&r[field]===category);
    panel.innerHTML=`<h4>${esc(groupName(group))} · ${esc(category)} · ${selected.length}개사</h4>${selected.length?`<div class="company-chips">${selected.map(r=>`<a href="${esc(r.source)}" target="_blank" rel="noopener noreferrer" title="${esc(r.summary)}">${esc(r.name)} ↗</a>`).join('')}</div>`:'<p>해당하는 기업이 없습니다.</p>'}`;
  });
  renderTable();renderCharts();
})();
