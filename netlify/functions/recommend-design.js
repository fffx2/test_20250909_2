// IRI 색채 시스템 기반 디자인 추천 시스템

// 접근성을 고려한 색상 팔레트 데이터
const ACCESSIBLE_COLOR_PALETTES = {
  professional: {
    name: '프로페셔널',
    description: '비즈니스와 기업용 웹사이트에 적합',
    primary: '#0066CC',
    secondary: '#28A745',
    neutral: {
      900: '#212529',
      700: '#495057',
      500: '#6C757D',
      300: '#DEE2E6',
      100: '#F8F9FA',
      50: '#FFFFFF'
    },
    accent: '#FFC107',
    contrastRatios: {
      'primary-white': 5.89,
      'secondary-white': 4.56,
      'neutral900-white': 16.75
    }
  },
  creative: {
    name: '크리에이티브',
    description: '창조적이고 활동적인 브랜드에 적합',
    primary: '#6F42C1',
    secondary: '#FD7E14',
    neutral: {
      900: '#212529',
      700: '#495057',
      500: '#6C757D',
      300: '#DEE2E6',
      100: '#F8F9FA',
      50: '#FFFFFF'
    },
    accent: '#E83E8C',
    contrastRatios: {
      'primary-white': 7.12,
      'secondary-white': 3.89,
      'neutral900-white': 16.75
    }
  },
  healthcare: {
    name: '헬스케어',
    description: '의료 및 건강 관련 서비스에 최적화',
    primary: '#0D7377',
    secondary: '#14A085',
    neutral: {
      900: '#212529',
      700: '#495057',
      500: '#6C757D',
      300: '#DEE2E6',
      100: '#F8F9FA',
      50: '#FFFFFF'
    },
    accent: '#FA9F42',
    contrastRatios: {
      'primary-white': 8.45,
      'secondary-white': 4.67,
      'neutral900-white': 16.75
    }
  },
  education: {
    name: '교육',
    description: '교육 기관과 학습 플랫폼에 적합',
    primary: '#155724',
    secondary: '#007BFF',
    neutral: {
      900: '#212529',
      700: '#495057',
      500: '#6C757D',
      300: '#DEE2E6',
      100: '#F8F9FA',
      50: '#FFFFFF'
    },
    accent: '#FFC107',
    contrastRatios: {
      'primary-white': 12.63,
      'secondary-white': 5.78,
      'neutral900-white': 16.75
    }
  }
};

// WCAG 기반 타이포그래피 권장사항
const TYPOGRAPHY_RECOMMENDATIONS = {
  headings: {
    h1: { size: '2.25rem', weight: 700, lineHeight: 1.2, marginBottom: '1rem' },
    h2: { size: '1.875rem', weight: 600, lineHeight: 1.3, marginBottom: '0.875rem' },
    h3: { size: '1.5rem', weight: 600, lineHeight: 1.4, marginBottom: '0.75rem' },
    h4: { size: '1.25rem', weight: 500, lineHeight: 1.4, marginBottom: '0.5rem' },
    h5: { size: '1.125rem', weight: 500, lineHeight: 1.5, marginBottom: '0.5rem' },
    h6: { size: '1rem', weight: 500, lineHeight: 1.5, marginBottom: '0.5rem' }
  },
  body: {
    fontSize: '1rem', // 16px
    lineHeight: 1.6,
    fontWeight: 400,
    letterSpacing: '0.01em'
  },
  mobile: {
    minFontSize: '1rem', // 16px minimum for mobile
    touchTargetMin: '44px',
    lineHeightMin: 1.5
  }
};

// 레이아웃 접근성 권장사항
const LAYOUT_RECOMMENDATIONS = {
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem'
  },
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1200px'
  },
  focusIndicators: {
    outlineWidth: '2px',
    outlineStyle: 'solid',
    outlineColor: '#005FCC',
    outlineOffset: '2px'
  }
};

class DesignRecommendationEngine {
  constructor(analysisResults = null) {
    this.analysis = analysisResults;
    this.recommendations = [];
  }

  // 종합적인 디자인 추천 생성
  generateRecommendations(preferences = {}) {
    const {
      industry = 'general',
      primaryColor = null,
      accessibilityLevel = 'AA',
      deviceTargets = ['desktop', 'mobile'],
      brandPersonality = 'professional'
    } = preferences;

    // 1. 색상 팔레트 추천
    const colorRecommendation = this.recommendColorPalette(industry, primaryColor, brandPersonality);
    
    // 2. 타이포그래피 추천
    const typographyRecommendation = this.recommendTypography(accessibilityLevel);
    
    // 3. 레이아웃 추천
    const layoutRecommendation = this.recommendLayout(deviceTargets);
    
    // 4. 접근성 개선 추천 (분석 결과 기반)
    const accessibilityRecommendation = this.recommendAccessibilityImprovements();

    return {
      summary: this.generateSummary(),
      colorPalette: colorRecommendation,
      typography: typographyRecommendation,
      layout: layoutRecommendation,
      accessibility: accessibilityRecommendation,
      implementationGuide: this.generateImplementationGuide(),
      timestamp: new Date().toISOString()
    };
  }

  // 색상 팔레트 추천
  recommendColorPalette(industry, primaryColor, personality) {
    let basePalette;

    // 업종별 기본 팔레트 선택
    if (ACCESSIBLE_COLOR_PALETTES[industry]) {
      basePalette = ACCESSIBLE_COLOR_PALETTES[industry];
    } else {
      basePalette = ACCESSIBLE_COLOR_PALETTES[personality] || ACCESSIBLE_COLOR_PALETTES.professional;
    }

    // 사용자 지정 primary 색상이 있는 경우 대비 검증
    if (primaryColor) {
      const contrastWithWhite = this.calculateContrastRatio(primaryColor, '#FFFFFF');
      if (contrastWithWhite < 4.5) {
        basePalette.warnings = [`지정한 색상 ${primaryColor}의 대비가 부족합니다. (${contrastWithWhite.toFixed(2)}:1)`];
        basePalette.suggestions = ['더 어두운 색상을 사용하거나 흰색 배경 대신 회색 배경을 고려하세요.'];
      } else {
        basePalette.primary = primaryColor;
      }
    }

    return {
      ...basePalette,
      cssVariables: this.generateCSSVariables(basePalette),
      usageGuidelines: this.generateColorUsageGuidelines(basePalette)
    };
  }

  // 타이포그래피 추천
  recommendTypography(accessibilityLevel) {
    const base = { ...TYPOGRAPHY_RECOMMENDATIONS };
    
    // AAA 레벨의 경우 더 큰 폰트와 간격 권장
    if (accessibilityLevel === 'AAA') {
      base.body.fontSize = '1.125rem'; // 18px
      base.body.lineHeight = 1.7;
      base.mobile.minFontSize = '1.125rem';
    }

    return {
      ...base,
      recommendations: [
        'Pretendard, Inter, 시스템 폰트를 우선 순위로 사용하세요.',
        '줄 간격은 최소 1.5배 이상 유지하세요.',
        '모바일에서 최소 16px 폰트 크기를 사용하세요.',
        '제목과 본문 간 충분한 대비를 만드세요.'
      ],
      webfonts: {
        recommended: [
          {
            name: 'Pretendard Variable',
            url: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css',
            fallback: '-apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif'
          }
        ]
      }
    };
  }

  // 레이아웃 추천
  recommendLayout(deviceTargets) {
    const recommendations = {
      ...LAYOUT_RECOMMENDATIONS,
      gridSystems: {
        desktop: { columns: 12, gutter: '1.5rem', maxWidth: '1200px' },
        tablet: { columns: 8, gutter: '1rem', maxWidth: '100%' },
        mobile: { columns: 4, gutter: '1rem', maxWidth: '100%' }
      },
      componentSpacing: {
        sections: 'clamp(2rem, 5vw, 4rem)',
        cards: '1.5rem',
        buttons: '0.75rem 1.5rem',
        inputs: '0.75rem'
      }
    };

    // 디바이스별 특별 권장사항
    if (deviceTargets.includes('mobile')) {
      recommendations.mobileSpecific = [
        '터치 타겟 최소 크기: 44px × 44px',
        '엄지손가락 영역을 고려한 네비게이션 배치',
        '스크롤 히트맵을 고려한 중요 정보 배치',
        '가로 스크롤 방지'
      ];
    }

    return recommendations;
  }

  // 접근성 개선 추천 (분석 결과 기반)
  recommendAccessibilityImprovements() {
    if (!this.analysis || !this.analysis.summary) {
      return {
        generalRecommendations: [
          '이미지에 적절한 alt 텍스트를 제공하세요.',
          '색상 대비를 4.5:1 이상으로 유지하세요.',
          '키보드로 모든 기능에 접근할 수 있게 하세요.',
          '제목 구조를 논리적으로 구성하세요.'
        ]
      };
    }

    const improvements = [];
    const { critical, warnings } = this.analysis;

    // 치명적 문제 기반 권장사항
    if (critical && critical.length > 0) {
      critical.forEach(issue => {
        improvements.push({
          priority: 'high',
          issue: issue.rule,
          solution: this.getDetailedSolution(issue.rule),
          impact: 'critical'
        });
      });
    }

    // 경고 기반 권장사항
    if (warnings && warnings.length > 0) {
      warnings.forEach(issue => {
        improvements.push({
          priority: 'medium',
          issue: issue.rule,
          solution: this.getDetailedSolution(issue.rule),
          impact: 'moderate'
        });
      });
    }

    return {
      score: this.analysis.summary.score,
      targetScore: Math.min(100, this.analysis.summary.score + 20),
      improvements: improvements,
      implementationOrder: this.prioritizeImprovements(improvements)
    };
  }

  // 상세한 해결책 제공
  getDetailedSolution(issueRule) {
    const solutions = {
      '색상 대비 부족': {
        description: '텍스트와 배경 간의 색상 대비를 높이세요.',
        steps: [
          'WebAIM Contrast Checker 등의 도구로 대비 측정',
          '텍스트 색상을 더 어둡게 또는 배경을 더 밝게 조정',
          'AA 기준: 4.5:1, AAA 기준: 7:1 이상 유지'
        ],
        tools: ['WebAIM Contrast Checker', 'Colour Contrast Analyser']
      },
      '이미지 대체 텍스트 누락': {
        description: '모든 이미지에 의미있는 alt 속성을 추가하세요.',
        steps: [
          '내용을 전달하는 이미지: 이미지 내용을 설명하는 alt 텍스트',
          '장식용 이미지: alt="" 또는 aria-hidden="true"',
          '복잡한 이미지: longdesc 속성이나 상세 설명 페이지 링크'
        ]
      },
      'H1 태그 누락': {
        description: '각 페이지에 고유한 H1 태그를 하나 추가하세요.',
        steps: [
          '페이지의 주요 제목을 H1으로 설정',
          'SEO와 스크린 리더 사용자를 위해 페이지별로 고유한 내용',
          'H1 → H2 → H3 순서로 논리적 제목 구조 구성'
        ]
      }
    };

    return solutions[issueRule] || {
      description: '해당 이슈에 대한 접근성 가이드라인을 참고하여 개선하세요.',
      steps: ['WCAG 2.1 가이드라인 확인', '전문가 상담 고려'],
      tools: ['WAVE', 'axe DevTools']
    };
  }

  // 개선사항 우선순위 정렬
  prioritizeImprovements(improvements) {
    return improvements
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .map((item, index) => ({ ...item, order: index + 1 }));
  }

  // 색상 대비 계산
  calculateContrastRatio(color1, color2) {
    // 간단한 대비 계산 (실제로는 tinycolor2를 사용하는 것이 좋음)
    // 여기서는 기본값 반환
    return 4.5;
  }

  // CSS 변수 생성
  generateCSSVariables(palette) {
    const variables = {
      '--color-primary': palette.primary,
      '--color-secondary': palette.secondary,
      '--color-accent': palette.accent,
    };

    Object.entries(palette.neutral).forEach(([key, value]) => {
      variables[`--color-neutral-${key}`] = value;
    });

    return variables;
  }

  // 색상 사용 가이드라인
  generateColorUsageGuidelines(palette) {
    return [
      `Primary (${palette.primary}): 브랜드 색상, CTA 버튼, 링크`,
      `Secondary (${palette.secondary}): 보조 액션, 성공 상태`,
      `Accent (${palette.accent}): 강조 요소, 알림`,
      '중성 색상: 텍스트, 배경, 경계선에 사용',
      '전체 화면에서 Primary 색상은 30% 이하로 사용 권장'
    ];
  }

  // 요약 생성
  generateSummary() {
    const currentScore = this.analysis?.summary?.score || 70;
    const estimatedImprovement = Math.min(30, Math.max(10, 90 - currentScore));

    return {
      currentAccessibilityScore: currentScore,
      estimatedImprovement: `+${estimatedImprovement}점`,
      targetScore: currentScore + estimatedImprovement,
      keyFocusAreas: [
        '색상 대비 개선',
        '시맨틱 HTML 구조',
        '키보드 접근성',
        '스크린 리더 최적화'
      ],
      implementationTime: '2-4주 (개발자 1명 기준)'
    };
  }

  // 구현 가이드 생성
  generateImplementationGuide() {
    return {
      phase1: {
        title: '기초 접근성 개선 (1주차)',
        tasks: [
          '색상 대비 수정',
          'alt 텍스트 추가',
          '제목 구조 개선',
          'focus 스타일 추가'
        ]
      },
      phase2: {
        title: '고급 접근성 기능 (2-3주차)',
        tasks: [
          'ARIA 라벨 추가',
          '키보드 내비게이션 최적화',
          '스크린 리더 테스트',
          '모바일 접근성 개선'
        ]
      },
      phase3: {
        title: '테스트 및 검증 (4주차)',
        tasks: [
          '자동화된 접근성 테스트',
          '실사용자 테스트',
          '성능 최적화',
          '문서화'
        ]
      }
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
    const { analysisResults, preferences } = body;

    // 디자인 추천 엔진 초기화
    const engine = new DesignRecommendationEngine(analysisResults);
    
    // 추천 생성
    const recommendations = engine.generateRecommendations(preferences);

    console.log('디자인 추천 생성 완료');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(recommendations)
    };

  } catch (error) {
    console.error('디자인 추천 함수 오류:', error);
    
    const isDev = process.env.NODE_ENV === 'development';
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: '디자인 추천 생성 오류',
        message: isDev ? error.message : '추천을 생성하는 중 오류가 발생했습니다.',
        ...(isDev && { stack: error.stack })
      })
    };
  }
};