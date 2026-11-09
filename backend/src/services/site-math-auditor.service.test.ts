import assert from 'node:assert/strict';
import test from 'node:test';
import {
  auditWebpageMathOpportunities,
  BACKEND_MATH_ENGINES,
  crawlAndAuditDomain,
  extractInternalLinks,
  generateWidgetEmbedCode,
  listMathEnginesCatalog,
  recommendEngineForTopic,
} from './site-math-auditor.service.js';

test('catalog contains exactly 60 open-source deterministic engines across 12 categories', () => {
  const full = listMathEnginesCatalog();
  assert.equal(full.totalEngines, 60);
  assert.equal(full.categoriesCount, 12);
  assert.equal(BACKEND_MATH_ENGINES[0].number, 1);
  assert.equal(BACKEND_MATH_ENGINES[59].number, 60);

  const graph2d = listMathEnginesCatalog('graph_2d');
  assert.equal(graph2d.totalEngines, 5);
  assert.ok(graph2d.engines.some((e) => e.id === 'mafs-react'));
});

test('recommendEngineForTopic routes calculus, 3D, geometry, CAS, and formal logic accurately', () => {
  const calc = recommendEngineForTopic({
    topic: 'Cálculo de derivada, recta tangente y sumas de Riemann',
    sampleEquations: ['x^2 - 5x + 6 = 0'],
  });
  assert.equal(calc.detectedCategoryId, 'graph_2d');
  assert.equal(calc.primaryEngine.id, 'mafs-react');
  assert.equal(calc.deterministicValidation.valid, true);

  const space3d = recommendEngineForTopic({
    topic: 'Superficie 3D de un paraboloide elíptico y derivadas parciales en tres dimensiones',
  });
  assert.equal(space3d.detectedCategoryId, 'space_3d');
  assert.equal(space3d.primaryEngine.id, 'mathbox2');

  const conics = recommendEngineForTopic({
    topic: 'Lugar geométrico de las secciones cónicas: foco y directriz de una parábola',
  });
  assert.equal(conics.detectedCategoryId, 'geometry');
  assert.equal(conics.primaryEngine.id, 'cindyjs');

  const formal = recommendEngineForTopic({
    topic: 'Demostración formal de teoremas por inducción en Lean',
  });
  assert.equal(formal.detectedCategoryId, 'formal_logic');
  assert.equal(formal.primaryEngine.id, 'lean4');
});

test('auditWebpageMathOpportunities splits multi-section HTML/Markdown and produces embed codes', () => {
  const html = `
    <h1>Curso de Matemáticas Interactivas</h1>
    <h2>1. Factorización Paso a Paso</h2>
    <p>Resolvemos la ecuación cuadrática x^2 - 7x + 12 = 0 despejando sus factores.</p>
    <h2>2. Derivada y Recta Tangente</h2>
    <p>Observa cómo cambia la pendiente de la tangente en la curva.</p>
    <img src="tangente_fija.png" />
    <h2>3. Método Numérico de Newton-Raphson</h2>
    <p>Aproximación iterativa de raíces con semilla inicial.</p>
  `;
  const report = auditWebpageMathOpportunities({
    url: 'https://academia.edu/matematicas',
    htmlOrMarkdown: html,
    baseEmbedUrl: 'https://math.forjavia.site',
  });

  assert.ok(report.totalSectionsAnalyzed >= 3);
  assert.equal(report.pipelineSummary.deterministicEnginesCount, 60);
  assert.ok(report.sections.some((s) => s.iframeCode.includes('https://math.forjavia.site/?embed=1')));
  assert.ok(report.sections.some((s) => s.recommendedEngine.id === 'scipy-optimize'));
});

test('generateWidgetEmbedCode produces valid iframe and React snippet', () => {
  const res = generateWidgetEmbedCode({
    toolId: 'mathsteps',
    expression: 'x^2 - 5x + 6 = 0',
    baseEmbedUrl: 'https://math.forjavia.site/',
    height: 600,
  });
  assert.equal(res.tool.number, 7);
  assert.ok(res.embedUrl.startsWith('https://math.forjavia.site/?embed=1&tool=mathsteps'));
  assert.ok(res.iframeHtml.includes('height="600"'));
  assert.ok(res.reactComponent.includes('<MathSuiteEmbed toolId="mathsteps"'));
});

test('extractInternalLinks discovers internal domain links and discards external and asset URLs', () => {
  const html = `
    <nav>
      <a href="/cursos/algebra">Álgebra</a>
      <a href="/cursos/calculo">Cálculo</a>
      <a href="https://example.com/geometria">Geometría</a>
      <a href="https://google.com">Google</a>
      <a href="/logo.png">Logo</a>
      <a href="#contacto">Contacto</a>
    </nav>
  `;
  const links = extractInternalLinks(html, new URL('https://example.com/'));
  assert.equal(links.length, 3);
  assert.ok(links.includes('https://example.com/cursos/algebra'));
  assert.ok(links.includes('https://example.com/cursos/calculo'));
  assert.ok(links.includes('https://example.com/geometria'));
});

test('crawlAndAuditDomain crawls multiple pages across a domain and produces structured report', async () => {
  const homeHtml = `
    <h1>Academia de Matemáticas</h1>
    <nav><a href="/algebra">Álgebra</a><a href="/calculo">Cálculo</a></nav>
    <h2>Bienvenida al Portal</h2>
    <p>Aprende matemáticas interactivas con ejercicios como x^2 - 5x + 6 = 0.</p>
  `;
  const algebraHtml = `
    <h1>Curso de Álgebra</h1>
    <h2>Factorización</h2>
    <p>Despejamos x^2 - 7x + 12 = 0 paso a paso.</p>
  `;
  const calculoHtml = `
    <h1>Curso de Cálculo</h1>
    <h2>Recta Tangente y Derivada</h2>
    <p>Pendiente en la curva de x^2 - 4x + 3 = 0.</p>
    <img src="tangente.png" />
  `;

  const report = await crawlAndAuditDomain({
    domainOrUrl: 'https://miacademia.edu',
    maxPages: 5,
    htmlOverride: {
      '/': homeHtml,
      'https://miacademia.edu/': homeHtml,
      '/algebra': algebraHtml,
      'https://miacademia.edu/algebra': algebraHtml,
      '/calculo': calculoHtml,
      'https://miacademia.edu/calculo': calculoHtml,
    },
  });

  assert.equal(report.targetDomain, 'miacademia.edu');
  assert.equal(report.crawledPagesCount, 3);
  assert.ok(report.totalOpportunitiesFound >= 3);
  assert.ok(report.pages.some((p) => p.pagePath === '/algebra'));
  assert.ok(report.pages.some((p) => p.pagePath === '/calculo'));
});
