// CSV 셀 이스케이프 + 수식 주입(CSV injection) 방지 — =, +, -, @, 탭, CR로 시작하는 값은
// 엑셀이 수식으로 실행하므로 앞에 '를 붙여 문자열로 고정한다(회원 이름·이메일은 사용자 입력).
const FORMULA_START = /^[=+\-@\t\r]/;

export const csvCell = (v) => {
  const s = String(v ?? '');
  const safe = FORMULA_START.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};
