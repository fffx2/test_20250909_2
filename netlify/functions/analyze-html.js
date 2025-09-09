const cheerio = require('cheerio');
const tinycolor = require('tinycolor2');

// WCAG & IRI 규칙 데이터 (rules.json의 핵심 부분)
const RULES = {
  colorContrast: {
    normalText: { aa: 4.5, aaa: 7.0 },
    largeText: { aa: 3.0, aaa: 4.5, sizeThreshold: 18 }
  },
  fontRequirements: {
    minFontSize: { mobile: 16, desktop: 14 },
    lineHeight: { minimum: 1.5, recommended: 1.6 },
    letterSpacing: { minimum: 0.12, recommended: 0.15 }
  },
  semanticHTML: {
    requiredAttributes: {
      img: ['alt'],
      input: ['type', 'id'],
      label: ['for'],
      form: ['action', 'method'],
      button: ['type'],
      a: ['href']
    }
  }
};

class HTMLAccessibilityAnalyzer {
  constructor(html) {
    this.$ = cheerio.load(html);
    this.critical = [];
    this.warnings = [];
    this.suggestions = [];
    this.score = 100;
  }

  analyze() {
    try {
      this.checkColorContrast();
      this.checkSemanticHTML();
      this.checkImages();
      this.checkForms();
      this.checkHeadingStructure();
      this.checkFontSizes();
      this.checkKeyboardAccessibility();
      this.checkARIALabels();

      return this.generateReport();
    } catch (error) {
      console.error('분석 중 오류:', error);
      throw new Error('HTML 분석 중 내부 오류가 발생했습니다.');
    }
  }

  // 색상 대비 검사
  checkColorContrast() {
    const elements = this.$('*').filter((i, el) => {
      const $el = this.$(el);
      return $el.css('color') || $el.css('background-color');
    });

    elements.each((i, el) => {
      const $el = this.$(el);
      const color = $el.css('color');
      const bgColor = $el.css('background-color') || '#ffffff';
      
      if (color && color !== 'inherit') {
        const contrast = this.calculateContrast(color, bgColor);
        const fontSize = parseInt($el.css('font-size')) || 16;
        const isLargeText = fontSize >= RULES.colorContrast.largeText.sizeThreshold;
        
        const requiredRatio = isLargeText ? 
          RULES.colorContrast.largeText.aa : 
          RULES.colorContrast.normalText.aa;

        if (contrast < requiredRatio) {
          this.critical.push({
            rule: '색상 대비 부족',
            description: `색상 대비가 ${contrast.toFixed(2)}:1로 기준(${requiredRatio}:1)에 미달합니다.`,
            element: `${el.tagName.toLowerCase()}${$el.attr('class') ? '.' + $el.attr('class').split(' ')[0] : ''}`,
            suggestion: '텍스트와 배경색의 대비를 높이세요.'
          });
          this.score -= 10;
        }
      }
    });
  }

  // 시맨틱 HTML 검사
  checkSemanticHTML() {
    // 필수 속성 검사
    Object.entries(RULES.semanticHTML.requiredAttributes).forEach(([tag, attrs]) => {
      this.$(tag).each((i, el) => {
        const $el = this.$(el);
        attrs.forEach(attr => {
          if (!$el.attr(attr)) {
            this.critical.push({
              rule: `${tag} 태그 필수 속성 누락`,
              description: `${attr} 속성이 누락되었습니다.`,
              element: `<${tag}>`,
              suggestion: `${attr} 속성을 추가하세요.`
            });
            this.score -= 8;
          }
        });
      });
    });

    // div/span 남용 검사
    const divCount = this.$('div').length;
    const spanCount = this.$('span').length;
    const semanticTags = this.$('header, nav, main, section, article, aside, footer').length;
    
    if (divCount > 10 && semanticTags < 3) {
      this.warnings.push({
        rule: '시맨틱 태그 사용 권장',
        description: `div 태그(${divCount}개)가 많이 사용되었습니다.`,
        suggestion: 'header, nav, main, section, article 등의 시맨틱 태그 사용을 권장합니다.'
      });
      this.score -= 5;
    }
  }

  // 이미지 접근성 검사
  checkImages() {
    this.$('img').each((i, el) => {
      const $el = this.$(el);
      const alt = $el.attr('alt');
      const src = $el.attr('src');
      
      if (alt === undefined) {
        this.critical.push({
          rule: '이미지 대체 텍스트 누락',
          description: 'alt 속성이 없습니다.',
          element: `<img src="${src || ''}">`,
          suggestion: '이미지의 내용을 설명하는 alt 속성을 추가하세요.'
        });
        this.score -= 12;
      } else if (alt.length === 0 && !$el.attr('role') && !$el.attr('aria-hidden')) {
        this.warnings.push({
          rule: '빈 대체 텍스트',
          description: 'alt 속성이 비어있습니다.',
          element: `<img src="${src || ''}">`,
          suggestion: '장식용 이미지라면 aria-hidden="true"를 추가하고, 의미있는 이미지라면 적절한 alt 텍스트를 제공하세요.'
        });
        this.score -= 3;
      }
    });
  }

  // 폼 접근성 검사
  checkForms() {
    // 라벨 연결 검사
    this.$('input, textarea, select').each((i, el) => {
      const $el = this.$(el);
      const id = $el.attr('id');
      const type = $el.attr('type');
      
      if (type !== 'hidden' && type !== 'submit' && type !== 'button') {
        const hasLabel = id && this.$(`label[for="${id}"]`).length > 0;
        const hasAriaLabel = $el.attr('aria-label') || $el.attr('aria-labelledby');
        
        if (!hasLabel && !hasAriaLabel) {
          this.critical.push({
            rule: '폼 요소 라벨 누락',
            description: '연결된 라벨이 없습니다.',
            element: `<${el.tagName.toLowerCase()} type="${type || 'text'}">`,
            suggestion: 'label 요소를 연결하거나 aria-label 속성을 추가하세요.'
          });
          this.score -= 10;
        }
      }
    });

    // 필수 입력 표시 검사
    this.$('input[required], textarea[required], select[required]').each((i, el) => {
      const $el = this.$(el);
      if (!$el.attr('aria-required') && !$el.closest('form').find('*').is(':contains("필수"), :contains("*"), :contains("required")')) {
        this.warnings.push({
          rule: '필수 입력 표시 부족',
          description: '필수 입력 필드임을 명확히 표시하지 않았습니다.',
          element: `<${el.tagName.toLowerCase()}>`,
          suggestion: 'aria-required="true" 속성을 추가하고 시각적으로도 필수임을 표시하세요.'
        });
        this.score -= 3;
      }
    });
  }

  // 제목 구조 검사
  checkHeadingStructure() {
    const headings = this.$('h1, h2, h3, h4, h5, h6');
    const h1Count = this.$('h1').length;
    
    // H1 개수 검사
    if (h1Count === 0) {
      this.critical.push({
        rule: 'H1 태그 누락',
        description: '페이지에 H1 태그가 없습니다.',
        suggestion: '페이지의 주제를 나타내는 H1 태그를 추가하세요.'
      });
      this.score -= 15;
    } else if (h1Count > 1) {
      this.warnings.push({
        rule: 'H1 태그 중복',
        description: `H1 태그가 ${h1Count}개 사용되었습니다.`,
        suggestion: 'H1 태그는 페이지당 하나만 사용하는 것이 권장됩니다.'
      });
      this.score -= 5;
    }

    // 제목 순서 검사
    let prevLevel = 0;
    headings.each((i, el) => {
      const currentLevel = parseInt(el.tagName.charAt(1));
      if (prevLevel > 0 && currentLevel > prevLevel + 1) {
        this.warnings.push({
          rule: '제목 레벨 건너뛰기',
          description: `H${prevLevel} 다음에 H${currentLevel}이 나타났습니다.`,
          element: `<${el.tagName.toLowerCase()}>`,
          suggestion: '제목 레벨을 순차적으로 사용하세요.'
        });
        this.score -= 3;
      }
      prevLevel = currentLevel;
    });
  }

  // 폰트 크기 검사
  checkFontSizes() {
    this.$('*').each((i, el) => {
      const $el = this.$(el);
      const fontSize = $el.css('font-size');
      
      if (fontSize) {
        const size = parseInt(fontSize);
        if (size < RULES.fontRequirements.minFontSize.desktop) {
          this.warnings.push({
            rule: '폰트 크기 부족',
            description: `폰트 크기가 ${size}px로 권장 크기(${RULES.fontRequirements.minFontSize.desktop}px) 미만입니다.`,
            element: `${el.tagName.toLowerCase()}`,
            suggestion: '읽기 쉬운 크기로 폰트를 키우세요.'
          });
          this.score -= 2;
        }
      }
    });
  }

  // 키보드 접근성 검사
  checkKeyboardAccessibility() {
    // 포커스 가능한 요소 검사
    const focusableElements = this.$('a, button, input, textarea, select, [tabindex]');
    
    focusableElements.each((i, el) => {
      const $el = this.$(el);
      const tabindex = $el.attr('tabindex');
      
      if (tabindex && parseInt(tabindex) > 0) {
        this.warnings.push({
          rule: '양수 tabindex 사용',
          description: `tabindex="${tabindex}"는 키보드 탐색 순서를 예측하기 어렵게 만듭니다.`,
          element: `<${el.tagName.toLowerCase()}>`,
          suggestion: 'tabindex="0" 또는 음수 값을 사용하거나, HTML 구조로 탐색 순서를 조정하세요.'
        });
        this.score -= 2;
      }
    });

    // 클릭 이벤트만 있는 요소 검사 (JavaScript로는 완전 검사 불가하지만 기본 체크)
    this.$('[onclick]').each((i, el) => {
      const $el = this.$(el);
      if (!$el.is('a, button, input, textarea, select') && !$el.attr('tabindex')) {
        this.suggestions.push({
          rule: '키보드 접근 불가 요소',
          description: 'onclick 이벤트가 있지만 키보드로 접근할 수 없는 요소입니다.',
          element: `<${el.tagName.toLowerCase()}>`,
          suggestion: 'button 태그를 사용하거나 tabindex="0"과 키보드 이벤트 핸들러를 추가하세요.'
        });
      }
    });
  }

  // ARIA 라벨 검사
  checkARIALabels() {
    // 랜드마크 역할 검사
    const landmarks = ['main', 'navigation', 'banner', 'contentinfo', 'complementary'];
    landmarks.forEach(landmark => {
      const elements = this.$(`[role="${landmark}"], ${landmark}`);
      if (elements.length === 0 && landmark === 'main') {
        this.suggestions.push({
          rule: 'main 랜드마크 누락',
          description: '페이지의 주요 콘텐츠를 나타내는 main 요소나 role="main"이 없습니다.',
          suggestion: '<main> 태그나 role="main"을 추가하여 주요 콘텐츠 영역을 명시하세요.'
        });
      }
    });

    // ARIA 속성 유효성 검사
    this.$('[aria-labelledby]').each((i, el) => {
      const $el = this.$(el);
      const labelledby = $el.attr('aria-labelledby');
      if (labelledby && !this.$(`#${labelledby}`).length) {
        this.warnings.push({
          rule: '잘못된 aria-labelledby 참조',
          description: `aria-labelledby="${labelledby}"가 참조하는 요소가 존재하지 않습니다.`,
          element: `<${el.tagName.toLowerCase()}>`,
          suggestion: '존재하는 ID를 참조하거나 해당 ID를 가진 요소를 추가하세요.'
        });
        this.score -= 3;
      }
    });
  }

  // 색상 대비 계산
  calculateContrast(color1, color2) {
    try {
      const c1 = tinycolor(color1);
      const c2 = tinycolor(color2);
      
      if (!c1.isValid() || !c2.isValid()) {
        return 21; // 기본값으로 최고 대비 반환
      }
      
      return tinycolor.readability(c1, c2);
    } catch (error) {
      return 21; // 오류 시 최고 대비 반환
    }
  }

  // 점수 등급 계산
  calculateGrade(score) {
    if (score >= 90) return 'AAA (우수)';
    if (score >= 80) return 'AA (양호)';
    if (score >= 70) return 'A (보통)';
    if (score >= 60) return 'B (개선 필요)';
    return 'C (대폭 개선 필요)';
  }

  // 최종 보고서 생성
  generateReport() {
    const totalIssues = this.critical.length + this.warnings.length;
    
    return {
      summary: {
        score: Math.max(0, this.score),
        grade: this.calculateGrade(this.score),
        totalIssues,
        criticalCount: this.critical.length,
        warningCount: this.warnings.length,
        suggestionCount: this.suggestions.length
      },
      critical: this.critical,
      warnings: this.warnings,
      suggestions: this.suggestions,
      timestamp: new Date().toISOString(),
      wcagVersion: '2.1'
    };
  }
}

// Netlify Function 핸들러
exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // POST 요청만 허용
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // 요청 본문 파싱
    const body = JSON.parse(event.body || '{}');
    const { html, filename } = body;

    // 입력 검증
    if (!html || typeof html !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'HTML 내용이 필요합니다.',
          message: 'html 필드는 필수이며 문자열이어야 합니다.'
        })
      };
    }

    // HTML 길이 제한 (보안 및 성능)
    if (html.length > 500000) { // 500KB 제한
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'HTML 파일이 너무 큽니다.',
          message: '파일 크기는 500KB 이하여야 합니다.'
        })
      };
    }

    // HTML 분석 실행
    const analyzer = new HTMLAccessibilityAnalyzer(html);
    const results = analyzer.analyze();
    
    // 파일명이 있으면 결과에 포함
    if (filename) {
      results.filename = filename;
    }

    console.log(`HTML 분석 완료: ${filename || 'unknown'} - 점수: ${results.summary.score}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(results)
    };

  } catch (error) {
    console.error('HTML 분석 함수 오류:', error);
    
    // 개발 환경에서는 상세 오류, 프로덕션에서는 일반적 오류
    const isDev = process.env.NODE_ENV === 'development';
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: '서버 내부 오류',
        message: isDev ? error.message : '분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        ...(isDev && { stack: error.stack })
      })
    };
  }
};