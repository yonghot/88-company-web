# DESIGN.md - UI/UX 디자인 시스템

> Linear.app의 미니멀하고 성능 중심적인 디자인 철학을 기반으로 한 에이티에잇 컴퍼니 디자인 시스템

## 🎨 디자인 철학

### 핵심 원칙 (Linear-Inspired)
1. **Simplicity Scales**: 단순함이 확장성을 만든다
2. **Performance First**: 빠른 속도와 부드러운 인터랙션
3. **Intentional Design**: 모든 픽셀에 목적이 있다
4. **Clarity Over Cleverness**: 명확함이 현명함보다 중요하다

### 디자인 목표
- **속도감**: 88만원의 빠른 시작처럼, 즉각적인 반응
- **신뢰감**: 정부지원사업 전문가의 전문성 표현
- **접근성**: 예비창업자 누구나 쉽게 이해하고 사용
- **일관성**: Linear처럼 픽셀 단위의 완벽한 일관성

## 🎯 브랜드 아이덴티티

### 브랜드 가치
- **88의 힘**: 숫자 88을 활용한 강력한 브랜딩
- **팔팔한 에너지**: 역동적이고 젊은 이미지
- **전문적 신뢰**: 실제 성공 경험 기반의 확실함

### 톤 & 매너
- **시각적 톤**: Modern + Minimal (Linear 스타일)
- **커뮤니케이션 톤**: Professional + Approachable
- **색상 감정**: Confident + Energetic

## 🌈 컬러 시스템

### Primary Colors - 88 Brand Colors
```css
:root {
  /* 88 Purple - 메인 브랜드 컬러 */
  --primary-50: #f3e8ff;
  --primary-100: #e0c7ff;
  --primary-200: #cc99ff;
  --primary-300: #b366ff;
  --primary-400: #9933ff;
  --primary-500: #8800ff;  /* Main Primary - 88 Purple */
  --primary-600: #7700e6;
  --primary-700: #6600cc;
  --primary-800: #5500aa;
  --primary-900: #440088;  /* Deep 88 */
}
```

### Accent Colors - Success & Energy
```css
:root {
  /* Success Green - 합격의 기쁨 */
  --accent-green: #00e676;
  --accent-green-dark: #00c853;
  
  /* Energy Orange - 팔팔한 에너지 */
  --accent-orange: #ff6d00;
  --accent-orange-light: #ff9100;
  
  /* Trust Blue - 신뢰와 전문성 */
  --accent-blue: #2962ff;
  --accent-blue-light: #448aff;
}
```

### Neutral Colors (Linear Style)
```css
:root {
  /* Light Mode */
  --gray-50: #fafafa;
  --gray-100: #f4f4f5;
  --gray-200: #e4e4e7;
  --gray-300: #d4d4d8;
  --gray-400: #a1a1aa;
  --gray-500: #71717a;
  --gray-600: #52525b;
  --gray-700: #3f3f46;
  --gray-800: #27272a;
  --gray-900: #18181b;
  
  /* Text Colors (Linear Style) */
  --text-primary: #18181b;
  --text-secondary: #71717a;
  --text-tertiary: #a1a1aa;
  --text-quaternary: #d4d4d8;
}
```

### Dark Mode Colors (Linear Default)
```css
:root[data-theme="dark"] {
  /* Background Layers */
  --bg-primary: #0a0a0b;
  --bg-secondary: #111113;
  --bg-tertiary: #1a1a1d;
  --bg-elevated: #222226;
  
  /* Dark Mode Text */
  --text-primary: #fafafa;
  --text-secondary: #a1a1aa;
  --text-tertiary: #71717a;
  --text-quaternary: #52525b;
  
  /* Borders */
  --border-primary: rgba(255, 255, 255, 0.08);
  --border-secondary: rgba(255, 255, 255, 0.04);
}
```

### Semantic Colors
```css
:root {
  --success: #00e676;
  --warning: #ff9100;
  --error: #ff5252;
  --info: #448aff;
  
  /* Special: 88 Gradient */
  --gradient-88: linear-gradient(135deg, #8800ff 0%, #ff6d00 100%);
  --gradient-subtle: linear-gradient(135deg, rgba(136, 0, 255, 0.1) 0%, rgba(255, 109, 0, 0.1) 100%);
}
```

## 📝 타이포그래피 (Linear Style)

### 폰트 패밀리
```css
:root {
  /* Inter Variable - Linear의 시그니처 폰트 */
  --font-primary: 'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-secondary: 'Pretendard Variable', 'Pretendard', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

### 폰트 크기 (Linear Scale)
```css
:root {
  --text-mini: 0.6875rem;   /* 11px */
  --text-tiny: 0.75rem;     /* 12px */
  --text-small: 0.8125rem;  /* 13px */
  --text-base: 0.875rem;    /* 14px - Linear Default */
  --text-medium: 0.9375rem; /* 15px */
  --text-large: 1rem;       /* 16px */
  --text-xlarge: 1.125rem;  /* 18px */
  --text-title-3: 1.25rem;  /* 20px */
  --text-title-2: 1.5rem;   /* 24px */
  --text-title-1: 1.875rem; /* 30px */
  --text-display: 2.25rem;  /* 36px */
  --text-hero: 3rem;        /* 48px */
  
  /* 88 Special Size */
  --text-88: 5.5rem;        /* 88px */
}
```

### 폰트 무게
```css
:root {
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Linear는 주로 400, 500, 600만 사용 */
}
```

### 줄 높이 (Linear Style)
```css
:root {
  --leading-dense: 1.2;
  --leading-tight: 1.35;
  --leading-normal: 1.5;
  --leading-relaxed: 1.65;
  --leading-loose: 1.8;
}
```

### 글자 간격
```css
:root {
  --tracking-tighter: -0.02em;
  --tracking-tight: -0.01em;
  --tracking-normal: 0;
  --tracking-wide: 0.01em;
}
```

## 📐 레이아웃 시스템 (Linear Grid)

### Container System
```css
.container {
  --max-width: 1280px;
  --padding-x: 24px;
  --padding-x-mobile: 16px;
  
  width: 100%;
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 var(--padding-x);
}

@media (max-width: 768px) {
  .container {
    padding: 0 var(--padding-x-mobile);
  }
}
```

### Breakpoints (Linear Style)
```css
/* Mobile First Approach */
--breakpoint-sm: 640px;   /* Mobile Landscape */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large Desktop */
--breakpoint-2xl: 1536px; /* Ultra Wide */
```

### Spacing System (8px Base)
```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px - Base Unit */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
  
  /* 88 Special Spacing */
  --space-88: 5.5rem;   /* 88px */
}
```

### Border Radius (Linear Style)
```css
:root {
  --radius-none: 0;
  --radius-small: 4px;
  --radius-medium: 6px;
  --radius-large: 8px;
  --radius-xlarge: 12px;
  --radius-2xlarge: 16px;
  --radius-full: 9999px;
  
  /* Linear Default */
  --radius-default: 6px;
}
```

### Shadows (Subtle & Elegant)
```css
:root {
  /* Light Mode Shadows */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 16px 32px rgba(0, 0, 0, 0.12);
  
  /* Dark Mode Shadows */
  --shadow-dark-sm: 0 2px 4px rgba(0, 0, 0, 0.3);
  --shadow-dark-md: 0 4px 8px rgba(0, 0, 0, 0.4);
  --shadow-dark-lg: 0 8px 16px rgba(0, 0, 0, 0.5);
  
  /* 88 Special Shadow */
  --shadow-88: 0 0 88px rgba(136, 0, 255, 0.2);
}
```

## 🧩 UI 컴포넌트 (Linear Style + shadcn/ui)

### shadcn/ui 설정 (Linear 테마 적용)

#### 1. shadcn/ui 초기화
```bash
npx shadcn-ui@latest init
```

#### 2. components.json 설정
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

#### 3. tailwind.config.ts (Linear + 88 테마)
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // 88 브랜드 컬러
        "88": {
          purple: "#8800ff",
          "purple-dark": "#6600cc",
          orange: "#ff6d00",
          green: "#00e676",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "88": "88px",
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        // Linear 스케일
        'mini': '0.6875rem',
        'tiny': '0.75rem',
        'small': '0.8125rem',
        'base': '0.875rem',
        '88': '5.5rem',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-88": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(0.95)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-88": "pulse-88 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
```

#### 4. globals.css (Linear 다크모드 우선)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Linear + 88 Light Mode */
    --background: 0 0% 100%;
    --foreground: 0 0% 9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 9%;
    --primary: 266 100% 50%; /* 88 Purple */
    --primary-foreground: 0 0% 100%;
    --secondary: 0 0% 96%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96%;
    --muted-foreground: 0 0% 45%;
    --accent: 24 100% 50%; /* 88 Orange */
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 90%;
    --input: 0 0% 90%;
    --ring: 266 100% 50%;
    --radius: 0.375rem;
  }

  .dark {
    /* Linear Dark Mode (Default) */
    --background: 0 0% 4%; /* #0a0a0b */
    --foreground: 0 0% 98%; /* #fafafa */
    --card: 0 0% 7%; /* #111113 */
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 7%;
    --popover-foreground: 0 0% 98%;
    --primary: 266 100% 50%; /* 88 Purple */
    --primary-foreground: 0 0% 100%;
    --secondary: 0 0% 10%; /* #1a1a1d */
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 10%;
    --muted-foreground: 0 0% 64%; /* #a1a1aa */
    --accent: 24 100% 50%; /* 88 Orange */
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62% 30%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 15%;
    --input: 0 0% 15%;
    --ring: 266 100% 50%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

/* Inter Font */
@font-face {
  font-family: 'Inter Variable';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('/fonts/InterVariable.woff2') format('woff2');
}
```

## 🧩 UI 컴포넌트 (Linear Style)

### Button 컴포넌트 (shadcn/ui + Linear Style)

#### Button 설치
```bash
npx shadcn-ui@latest add button
```

#### 커스텀 Button 컴포넌트
```tsx
// components/ui/button.tsx
import { cn } from "@/lib/utils"
import { ButtonHTMLAttributes, forwardRef } from "react"
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:-translate-y-0.5",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // 88 Special Variants
        "88": "bg-gradient-to-r from-88-purple to-88-orange text-white shadow-lg hover:scale-105 rounded-88",
        "success": "bg-88-green text-white hover:bg-88-green/90",
      },
      size: {
        default: "h-8 px-3 py-1", // Linear default
        sm: "h-7 rounded-md px-2 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-8 w-8",
        // 88 Special Size
        "88": "h-12 px-6 text-base font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

#### 사용 예시
```tsx
// 기본 버튼
<Button>클릭하세요</Button>

// 88 특별 버튼
<Button variant="88" size="88">
  88만원으로 시작하기
</Button>

// 성공 버튼
<Button variant="success">
  무료 상담 신청
</Button>

// Ghost 버튼
<Button variant="ghost">
  더 알아보기
</Button>
```

### Form 컴포넌트 (shadcn/ui)

#### Form 관련 컴포넌트 설치
```bash
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add switch
```

#### 사용 예시
```tsx
// 무료 상담 신청 폼
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const formSchema = z.object({
  name: z.string().min(2, "이름을 입력해주세요"),
  email: z.string().email("올바른 이메일을 입력해주세요"),
  phone: z.string().min(10, "연락처를 입력해주세요"),
  idea: z.string().min(50, "아이디어를 50자 이상 설명해주세요"),
})

export function ConsultationForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이름</FormLabel>
              <FormControl>
                <Input placeholder="홍길동" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="idea"
          render={({ field }) => (
            <FormItem>
              <FormLabel>아이디어 설명</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="어떤 아이디어로 창업하시려고 하나요?"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                최소 50자 이상 작성해주세요
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" variant="88" size="88">
          무료 상담 신청하기
        </Button>
      </form>
    </Form>
  )
}
```

### Card 컴포넌트 (shadcn/ui)

#### Card 설치
```bash
npx shadcn-ui@latest add card
```

#### 88 Feature Card 컴포넌트
```tsx
// components/ui/feature-card.tsx
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Feature88CardProps {
  title: string
  description: string
  price?: string
  features?: string[]
  className?: string
  highlight?: boolean
}

export function Feature88Card({
  title,
  description,
  price,
  features,
  className,
  highlight = false,
}: Feature88CardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1",
        highlight && "border-primary shadow-88 scale-105",
        className
      )}
    >
      {/* 88 Background Watermark */}
      <div className="absolute -top-5 -right-5 text-[120px] font-bold text-primary/5 rotate-[-15deg] select-none">
        88
      </div>
      
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        {price && (
          <div className="mb-4">
            <span className="text-3xl font-bold text-primary">{price}</span>
            <span className="text-muted-foreground ml-2">만원</span>
          </div>
        )}
        
        {features && (
          <ul className="space-y-2">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-88-green"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      
      <CardFooter>
        <Button variant={highlight ? "88" : "default"} className="w-full">
          자세히 알아보기
        </Button>
      </CardFooter>
    </Card>
  )
}
```

#### 사용 예시
```tsx
// 서비스 패키지 카드
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <Feature88Card
    title="기본 상담"
    description="아이디어 구체화 상담"
    price="44"
    features={[
      "30분 1:1 화상 상담",
      "아이디어 분석",
      "기본 가이드 제공",
    ]}
  />
  
  <Feature88Card
    title="88 패키지"
    description="프로토타입 + 사업계획서"
    price="88"
    features={[
      "AI 기반 프로토타이핑",
      "전문가 사업계획서 작성",
      "합격 보장 프로그램",
      "성공보수 880만원",
    ]}
    highlight={true}
  />
  
  <Feature88Card
    title="프리미엄 코칭"
    description="1:1 전담 코칭"
    price="200"
    features={[
      "전담 컨설턴트 배정",
      "주 2회 진행 체크",
      "발표 코칭 포함",
    ]}
  />
</div>
```

### Navigation 컴포넌트 (shadcn/ui)

#### Navigation 설치
```bash
npx shadcn-ui@latest add navigation-menu
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add dropdown-menu
```

#### Linear Style Navigation
```tsx
// components/navigation.tsx
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

export function MainNavigation() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Logo */}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="text-lg font-semibold">
            <span className="text-primary font-bold">88</span>
            <span>Company</span>
          </span>
        </Link>
        
        {/* Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>서비스</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                  <li className="row-span-3">
                    <NavigationMenuLink asChild>
                      <a
                        className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                        href="/"
                      >
                        <div className="text-88 font-bold">88</div>
                        <div className="mb-2 mt-4 text-lg font-medium">
                          88 패키지
                        </div>
                        <p className="text-sm leading-tight text-muted-foreground">
                          88만원으로 시작하는 정부지원금 합격 프로젝트
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                  <ListItem href="/services/consulting" title="컨설팅">
                    전문가와 함께하는 사업계획서 작성
                  </ListItem>
                  <ListItem href="/services/prototype" title="프로토타이핑">
                    AI 기반 초고속 프로토타입 제작
                  </ListItem>
                  <ListItem href="/services/bootcamp" title="부트캠프">
                    예비창업자를 위한 교육 프로그램
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Link href="/success-stories" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  성공사례
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Link href="/resources" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  자료실
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Link href="/about" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  회사소개
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        
        {/* CTA Button */}
        <div className="ml-auto flex items-center space-x-4">
          <Button variant="ghost" size="sm">
            로그인
          </Button>
          <Button variant="88" size="default">
            무료 상담 신청
          </Button>
        </div>
      </div>
    </header>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"
```

### 추가 shadcn/ui 컴포넌트 활용

#### 필수 컴포넌트 설치 목록
```bash
# 핵심 컴포넌트
npx shadcn-ui@latest add accordion
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add avatar
```

## 🎭 애니메이션 & 인터랙션 (Linear Motion)

### 애니메이션 원칙
1. **Speed**: 모든 애니메이션은 200ms 이하
2. **Smoothness**: 60fps 유지, GPU 가속 활용
3. **Subtlety**: 미묘하고 자연스러운 움직임
4. **Purpose**: 사용자 행동에 대한 즉각적 피드백

### Timing Functions (Linear Style)
```css
:root {
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.32, 0, 0.67, 0);
  --ease-out: cubic-bezier(0.33, 1, 0.68, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  
  /* Linear Default */
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Duration
```css
:root {
  --duration-instant: 75ms;
  --duration-fast: 150ms;
  --duration-base: 200ms;
  --duration-slow: 300ms;
  
  /* Linear는 주로 150ms 사용 */
}
```

### Hover Effects
```css
/* Subtle Scale */
.hover-scale {
  transition: transform var(--duration-fast) var(--ease-default);
  
  &:hover {
    transform: scale(1.02);
  }
}

/* Subtle Lift */
.hover-lift {
  transition: all var(--duration-fast) var(--ease-default);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
}

/* Color Fade */
.hover-fade {
  transition: opacity var(--duration-fast) var(--ease-default);
  
  &:hover {
    opacity: 0.8;
  }
}
```

### Loading States
```css
/* Linear Style Spinner */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-primary);
  border-top-color: var(--primary-500);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* 88 Pulse */
@keyframes pulse-88 {
  0%, 100% { 
    opacity: 1;
    transform: scale(1);
  }
  50% { 
    opacity: 0.5;
    transform: scale(0.95);
  }
}

.pulse-88 {
  animation: pulse-88 2s ease-in-out infinite;
}
```

## 🌐 다크모드 우선 설계

### 다크모드 기본 설정
```css
/* Default to Dark Mode (Linear Style) */
:root {
  color-scheme: dark;
}

/* Automatic Theme Detection */
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    /* Light mode overrides */
  }
}

/* Manual Theme Toggle */
[data-theme="light"] {
  /* Light mode colors */
}

[data-theme="dark"] {
  /* Dark mode colors (default) */
}
```

## 📱 반응형 디자인 전략

### Mobile First Approach
```css
/* Base (Mobile) */
.component {
  font-size: var(--text-small);
  padding: var(--space-3);
}

/* Tablet */
@media (min-width: 768px) {
  .component {
    font-size: var(--text-base);
    padding: var(--space-4);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .component {
    font-size: var(--text-medium);
    padding: var(--space-6);
  }
}
```

### 88 Hero Section
```css
.hero-88 {
  /* Mobile */
  .hero-number {
    font-size: 48px;
    font-weight: 700;
    background: var(--gradient-88);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .hero-text {
    font-size: var(--text-title-2);
    margin-top: var(--space-4);
  }
  
  /* Desktop */
  @media (min-width: 1024px) {
    .hero-number {
      font-size: var(--text-88);
    }
    
    .hero-text {
      font-size: var(--text-display);
      margin-top: var(--space-6);
    }
  }
}
```

## ♿ 접근성 (Linear Standards)

### WCAG 2.1 Guidelines
- **Level AA Compliance** 필수
- **Focus Indicators**: 명확한 포커스 표시
- **Color Contrast**: 최소 4.5:1 (일반 텍스트), 3:1 (큰 텍스트)
- **Keyboard Navigation**: 모든 인터랙티브 요소 키보드 접근 가능

### Focus Styles
```css
/* Linear Style Focus */
:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
  border-radius: var(--radius-small);
}

/* Remove default outline */
:focus:not(:focus-visible) {
  outline: none;
}
```

## 🎯 에이티에잇 컴퍼니 특별 요소

### 88 브랜딩 요소
```css
/* 88 Badge */
.badge-88 {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--gradient-88);
  color: white;
  font-weight: 700;
  border-radius: 50%;
  font-size: var(--text-small);
}

/* 88만원 Price Tag */
.price-88 {
  position: relative;
  font-size: var(--text-display);
  font-weight: 700;
  color: var(--primary-500);
  
  &::before {
    content: '₩';
    font-size: 0.6em;
    vertical-align: super;
    opacity: 0.6;
  }
  
  &::after {
    content: '만원';
    font-size: 0.5em;
    margin-left: 4px;
    color: var(--text-secondary);
  }
}

/* Success Rate Display */
.success-rate {
  font-size: var(--text-hero);
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-green) 0%, var(--primary-500) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  
  &::after {
    content: '%';
    font-size: 0.5em;
    opacity: 0.6;
  }
}
```

## 📊 성능 지표 (Linear Performance)

### 목표 지표
- First Contentful Paint (FCP): < 1s
- Largest Contentful Paint (LCP): < 2s
- Cumulative Layout Shift (CLS): < 0.05
- First Input Delay (FID): < 50ms
- Time to Interactive (TTI): < 2s

### 최적화 전략
1. **Font Loading**: Inter Variable 폰트 preload
2. **CSS-in-JS**: Zero runtime CSS (Tailwind CSS)
3. **Image Optimization**: WebP with lazy loading
4. **Code Splitting**: Route-based splitting
5. **Caching**: Aggressive caching strategy

## 📌 현재 구현 상태 (v4.0.0 - 챗봇 시스템)

### 실제 구현된 컴포넌트 (2025-09-13)
✅ **ChatInterface**
- 풀스크린 챗봇 인터페이스
- 실시간 대화 스크롤 관리
- 단계별 진행 상태 표시
- 사용자 입력 검증 및 처리

✅ **ChatMessage**
- 봇/사용자 메시지 구분 표시
- 88 로고 통합
- 시간 표시 기능
- 애니메이션 효과 적용

✅ **ChatInput**
- 다양한 입력 타입 지원 (text, textarea, select)
- 실시간 유효성 검증
- 엔터키 전송 지원
- 모바일 최적화

✅ **QuickReplyOptions**
- 빠른 답변 버튼 그룹
- 호버 효과 및 애니메이션
- 모바일 터치 최적화
- 다크 모드 스타일링

✅ **VerificationInput**
- 휴대폰 번호 입력 및 포맷팅
- **[NEW] 실시간 전화번호 형식 검증 (2025-01-20)**
  - 자동 하이픈 삽입 (010-1234-5678 형식)
  - 11자리 제한 및 유효성 실시간 표시
  - 잘못된 형식 시 재입력 안내 UI
  - "✅ 올바른 형식" / "⚠️ 숫자를 더 입력해주세요" 피드백
- SMS 인증 코드 발송/확인
- 타이머 기능 (3분)
- 에러 처리 및 피드백

✅ **ProgressBar**
- **동적 단계 계산**: 활성 질문 수에 따라 자동 조정
- 완료 단계 체크 표시
- 부드러운 전환 애니메이션
- 모바일 반응형
- **비활성 질문 제외**: is_active가 false인 질문은 진행률에서 제외

✅ **Admin Dashboard**
- 리드 목록 테이블 뷰 (12개 컬럼 모두 표시)
  - 표시 컬럼: 이름, 전화번호, 예비창업자, 지원사업경험, 사업아이템, 학력/전공, 직업, 지역, 성별, 나이, 등록일시, 보기
- Excel 다운로드 기능
- 실시간 데이터 새로고침
- **[UPDATED] 읽기 전용 인터페이스** (2025-10-04)
  - 리드 삭제/수정 기능 제거 (데이터 보호)
  - 리드 조회 및 Excel 내보내기 전용

### 적용된 디자인 시스템
✅ **Soomgo 스타일 UI/UX**
- 깔끔하고 직관적인 인터페이스
- 단계별 진행 방식
- 카드 기반 레이아웃
- 부드러운 전환 효과

✅ **다크 모드 최적화**
- 배경: #0a0a0b (순수 검정)
- 카드: #111113 (약간 밝은 검정)
- 테두리: rgba(255, 255, 255, 0.08)
- 텍스트: 계층적 명도 조절

✅ **컬러 시스템**
- Primary: #8800ff (88 보라색)
- Success: #00e676 (성공 녹색)
- Error: #ff5252 (오류 빨강)
- Muted: #71717a (비활성 회색)

✅ **타이포그래피**
- 시스템 폰트 스택 사용
- 14px 기본 크기 (채팅)
- 16px 입력 필드
- 계층적 크기 체계

✅ **인터랙션 패턴**
- 즉각적인 피드백
- 로딩 상태 표시
- 에러 메시지 애니메이션
- 스크롤 자동 관리

✅ **모바일 최적화**
- 100% 반응형 디자인
- 터치 친화적 버튼 크기
- 가상 키보드 대응
- 스크롤 성능 최적화

### 미구현 요소
⏳ 타이핑 인디케이터
⏳ 이미지/파일 업로드
⏳ 이모지 선택기
⏳ 대화 내역 저장/불러오기
⏳ 다국어 지원

### 아키텍처 클린업 (2025-10-01)

#### 제거된 컴포넌트 및 서비스 (총 27개 파일)
**컴포넌트 (5개)**:
- ❌ RealTimeChatInterface
- ❌ QuestionCard
- ❌ QuestionEditModal
- ❌ ChatPreview
- ❌ DatabaseStatusIndicator

**서비스 (3개)**:
- ❌ enhanced-realtime-service
- ❌ dynamic-question-service
- ❌ question-manager

**API 라우트 (4개)**:
- ❌ /api/admin/questions (CRUD)

**페이지 (3개)**:
- ❌ /test, /recover, /test-verify

**테스트 스크립트 (9개)**:
- ❌ 실시간 동기화 관련 테스트 전체

**문서 (3개)**:
- ❌ 오래된 리포트 파일들

#### 현재 아키텍처
✅ **StaticQuestionService (Singleton)**
- Supabase에서 질문 로드
- 캐싱 지원
- 간단하고 안정적인 구조
- 총 196줄의 간결한 코드

**코드 정리 결과**:
- 삭제: 5,671 lines
- 추가: 201 lines
- 순 감소: 96.5% (5,470 lines)
- 아키텍처 간소화: 84.3%

## 🔄 디자인 시스템 버전 관리

### 버전 히스토리
| 버전 | 날짜 | 주요 변경사항 |
|------|------|--------------|
| v1.0.0 | 2025-01-12 | 초기 디자인 시스템 구축 |
| v2.0.0 | 2025-09-12 | Linear.app 디자인 시스템 적용 |
| v2.1.0 | 2025-09-12 | 88 브랜딩 요소 추가 |
| v3.0.0 | 2025-01-13 | 심플한 원페이지 디자인으로 전면 개편 |
| v4.0.0 | 2025-09-13 | 챗봇 시스템으로 전환, Soomgo 스타일 UI 적용 |
| v4.0.1 | 2025-09-14 | SMS 인증 UI 개선, 코드 구조 최적화 |
| v4.1.0 | 2025-09-14 | 동적 질문 관리 시스템 UI 추가 |
| v4.1.1 | 2025-09-18 | 진행률 표시 동적 계산 개선 |
| v4.2.0 | 2025-09-19 | Supabase 통합 및 관리자 UI 대폭 개선 |
| v4.2.1 | 2025-01-20 | 전화번호 유효성 검사 UX 개선, localStorage 완전 제거, 데이터 소스 통합 |
| v4.3.0 | 2025-01-21 | 아키텍처 클린업, 서비스 통합, 코드베이스 최적화 |
| v4.3.1 | 2025-01-22 | 백엔드 안정화 - NHN Cloud SMS 프로덕션 설정 완료, 코드 클린업 |
| v4.3.2 | 2025-01-24 | 보안 강화 - Supabase RLS 정책 적용, Admin Client 패턴 구현 |
| v4.4.0 | 2025-01-22 | 데이터 보호 시스템 - 데이터 손실 방지, 백업 시스템, 페이지 이탈 경고 |
| v5.0.0 | 2025-10-01 | **아키텍처 간소화 - 동적 질문 편집 시스템 제거, 정적 로딩 방식으로 전환** |
| v5.0.1 | 2025-10-04 | **Admin 페이지 UI 개선 - 테이블 완성, Favicon 설정, 보안 강화** |

## 🎨 컴포넌트 현황 (v5.0.0)

### 아키텍처 간소화 (2025-10-01)

**주요 변경사항**:
- 동적 질문 편집 시스템 완전 제거
- 정적 질문 로딩 방식으로 전환 (StaticQuestionService)
- 질문은 Supabase 데이터베이스에서 직접 관리
- 챗봇 페이지 로드 시 한 번만 질문 불러오기
- 관리자 페이지는 간단한 안내 페이지로 변경

**제거된 컴포넌트** (27개 파일, ~5,671 라인):
- ❌ QuestionCard - 드래그앤드롭 질문 카드
- ❌ QuestionEditModal - 질문 편집 모달
- ❌ ChatPreview - 실시간 미리보기
- ❌ DatabaseStatusIndicator - DB 상태 표시
- ❌ RealTimeChatInterface - 실시간 동기화 챗봇
- ❌ EnhancedRealtimeService - 실시간 동기화 서비스
- ❌ DynamicQuestionService - 동적 질문 관리

**현재 아키텍처**:
- `StaticQuestionService`: Singleton 패턴으로 질문 로드
- `ChatInterface`: 단순화된 챗봇 인터페이스
- `ProgressBar`: 정적 단계 수 기반 진행률
- `BackupService`: 자동 백업 시스템 (유지)

**장점**:
- 코드베이스 96.5% 축소 (5,671 lines → 201 lines)
- 복잡도 대폭 감소
- 유지보수성 향상
- 성능 개선 (불필요한 실시간 동기화 제거)

### 디자인 토큰 관리
```javascript
// design-tokens.js
export const tokens = {
  colors: {
    primary: {
      50: '#f3e8ff',
      // ... all color tokens
    }
  },
  typography: {
    fontFamily: {
      primary: 'Inter Variable',
      // ... all font tokens
    }
  },
  spacing: {
    // ... all spacing tokens
  },
  // ... all other tokens
};
```

---

*이 문서는 Linear.app의 디자인 철학과 에이티에잇 컴퍼니의 브랜드 아이덴티티를 결합한 디자인 시스템입니다.*
*"Simplicity Scales" - 단순함이 성공을 만듭니다.*