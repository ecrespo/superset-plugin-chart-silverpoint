// SUP-REQ-012, H-4: the conformance kit through the module entries the plugin resolves
// (@silverpoint/embed), bundled the way a Superset frontend bundles them, in the browser.
import { conformance } from '@silverpoint/embed/conformance';
import { renderToSVG, VERSION } from '@silverpoint/embed';
import cases from '@silverpoint/embed/conformance.json';

const out = document.getElementById('result')!;
conformance((spec) => {
  const r = renderToSVG(spec as never);
  if (!r.ok) throw new Error(JSON.stringify(r.error));
  return r.value.svg;
}, undefined, cases as never).then(
  (result) => { out.textContent = JSON.stringify({ version: VERSION, cases: (cases as { version: string }).version, passed: result.passed, failed: result.failed }); },
  (error: unknown) => { out.textContent = JSON.stringify({ error: String(error) }); },
);
