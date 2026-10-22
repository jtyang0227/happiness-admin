import { safeHref } from './safeUrl';
import { csvCell } from './csv';

describe('safeHref', () => {
  it('allows http(s) only', () => {
    expect(safeHref('https://portfolio.example.com/a')).toBe('https://portfolio.example.com/a');
    expect(safeHref('http://x.com')).toBe('http://x.com/');
  });
  // 차단 대상 스킴을 일부러 문자열로 넣는 테스트라 이 규칙만 끈다
  // eslint-disable-next-line no-script-url
  it.each(['javascript:alert(1)', ' JAVASCRIPT:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:x', '/relative', '', null])(
    'blocks %p', (url) => { expect(safeHref(url)).toBeNull(); });
});

describe('csvCell', () => {
  it('neutralizes spreadsheet formulas', () => {
    expect(csvCell('=HYPERLINK("http://evil","x")')).toBe(`"'=HYPERLINK(""http://evil"",""x"")"`);
    expect(csvCell('+1')).toBe(`"'+1"`);
    expect(csvCell('-2')).toBe(`"'-2"`);
    expect(csvCell('@SUM(A1)')).toBe(`"'@SUM(A1)"`);
  });
  it('quotes normal values', () => {
    expect(csvCell('김민준')).toBe('"김민준"');
    expect(csvCell(null)).toBe('""');
  });
});
