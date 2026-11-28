/* 首页「精选房源」六套横向卡片（数据同步自 /houses/ 演示房源） */
(() => {
  'use strict';

  const PREFIX = '/Beijing-Huijin-Real-Estate-Brokerage-Co';

  const HOUSES = [
    {
      title: '长安悦玺 · 东方学府大宅',
      status: '在售',
      district: '石景山区',
      specs: ['4室2厅2卫', '124 ㎡'],
      price: '930 万',
      tags: ['精装现房', 'LDK通厅', '新中式园林'],
      updated: '2026-11-27',
      href: PREFIX + '/houses/demo-s078',
      img: PREFIX + '/images/changanyuexi/cyx-cover.jpg'
    },
    {
      title: '长安一号 · 东南角写字楼',
      status: '在租',
      district: '门头沟区',
      specs: ['写字楼', '266 ㎡'],
      priceCaption: '报价',
      price: '2.5 元/㎡',
      tags: ['长安天街旁', '东南角', '看房有钥匙'],
      updated: '2026-11-28',
      demo: false,
      href: PREFIX + '/houses/demo-s142',
      img: PREFIX + '/images/changanyihao/cy1-cover.jpg'
    },
    {
      title: '湖畔别院 · 无边泳池（演示）',
      status: '已成交',
      district: '顺义区',
      specs: ['6室3厅5卫', '312.8 ㎡'],
      price: '4,260 万',
      tags: ['湖景', '独栋', '私家泳池'],
      updated: '2026-02-28',
      href: PREFIX + '/houses/demo-s205',
      img: PREFIX + '/images/hero-3.webp'
    },
    {
      title: '城市公寓 · 精装两居（演示）',
      status: '已出租',
      district: '西城区',
      specs: ['2室1厅1卫', '89.6 ㎡'],
      price: '¥12,500',
      tags: ['整租', '拎包入住', '近商圈'],
      updated: '2026-03-08',
      href: PREFIX + '/houses/demo-r031',
      img: PREFIX + '/images/city-3.webp'
    },
    {
      title: '望京新盘 · 品质三居（演示）',
      status: '在售',
      district: '朝阳区',
      specs: ['3室2厅2卫', '128 ㎡'],
      price: '988 万',
      tags: ['新房', '品牌开发商', '地铁规划'],
      updated: '2026-03-11',
      href: PREFIX + '/houses/demo-n014',
      img: PREFIX + '/images/hero-2.webp'
    },
    {
      title: '石景山两居 · 近地铁（演示）',
      status: '已下架',
      district: '石景山区',
      specs: ['2室1厅1卫', '76.5 ㎡'],
      price: '¥8,200',
      tags: ['近地铁', '押一付三'],
      updated: '2026-01-20',
      href: PREFIX + '/houses/demo-r066',
      img: PREFIX + '/images/hero-villa.webp'
    }
  ];

  const STATUS_CLASS = {
    '在售': 'is-on',
    '在租': 'is-on',
    '已预订': 'is-booked',
    '已成交': 'is-sold',
    '已出租': 'is-rented',
    '已下架': 'is-off'
  };

  const cardHtml = (h) => `
      <article class="hsix-card">
        <a class="hsix-media" href="${h.href}" aria-label="查看${h.title}详情">
          <img src="${h.img}" alt="${h.title} 房源图片" loading="lazy" decoding="async">
          <span class="hsix-status ${STATUS_CLASS[h.status] || ''}">${h.status}</span>
          ${h.demo === false ? '' : '<span class="hsix-demo">演示数据</span>'}
        </a>
        <div class="hsix-body">
          <h3 class="hsix-title"><a href="${h.href}">${h.title}</a></h3>
          <span class="hsix-district">${h.district}</span>
          <ul class="hsix-meta">${h.specs.map((s) => `<li>${s}</li>`).join('')}</ul>
          <div class="hsix-foot">
            <div class="hsix-price"><span>${h.priceCaption || '总价'}</span><strong>${h.price}</strong></div>
            <a class="hsix-more" href="${h.href}">查看详情 ↗</a>
          </div>
          <ul class="hsix-tags">${h.tags.map((t) => `<li>${t}</li>`).join('')}</ul>
          <p class="hsix-updated">更新于 ${h.updated}</p>
        </div>
      </article>`;

  const sectionHtml = `
    <div class="container">
      <div class="home-six__head">
        <div>
          <p class="eyebrow">精选房源</p>
          <h2 class="display">六套精选房源，<br>横向<span class="accent">一览</span>。</h2>
        </div>
        <a class="btn btn--outline" href="${PREFIX}/houses/">
          <span>查看全部房源</span>
          <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>
      </div>
      <div class="hsix-grid">${HOUSES.map(cardHtml).join('')}</div>
    </div>`;

  const replaceSection = () => {
    const old = document.querySelector('section.about#about');
    if (!old || old.dataset.hsix === 'done') return;
    const section = document.createElement('section');
    section.className = 'section home-six';
    section.id = 'about';
    section.dataset.hsix = 'done';
    section.innerHTML = sectionHtml;
    old.replaceWith(section);
  };

  const start = () => setTimeout(replaceSection, 600);
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
})();
