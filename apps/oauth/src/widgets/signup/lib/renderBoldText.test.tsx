import { render } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';

import { renderBoldText } from './renderBoldText';

const renderToHtml = (text: string) => render(<p>{renderBoldText(text)}</p>).container.innerHTML;

describe('renderBoldText', () => {
  it('짝이 맞는 구간만 굵게 그린다', () => {
    expect(renderToHtml('본 방침은 **DataGSM** 서비스의 **수집 목적**을 설명합니다.')).toBe(
      '<p>본 방침은 <b>DataGSM</b> 서비스의 <b>수집 목적</b>을 설명합니다.</p>',
    );
  });

  it('짝이 깨진 표시는 굵게 처리하지 않고 글자 그대로 둔다', () => {
    expect(renderToHtml('**굵게* 뒤 문장')).toBe('<p>**굵게* 뒤 문장</p>');
    expect(renderToHtml('앞 **굵게** 뒤 ** 남은 표시')).toBe(
      '<p>앞 <b>굵게</b> 뒤 ** 남은 표시</p>',
    );
  });

  it('HTML 태그는 해석하지 않고 텍스트로 그린다', () => {
    expect(renderToHtml('<img src=x onerror=alert(1)>')).toBe(
      '<p>&lt;img src=x onerror=alert(1)&gt;</p>',
    );
  });
});
