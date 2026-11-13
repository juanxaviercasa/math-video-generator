export type AudienceMode = 'student' | 'teacher' | 'social'

export type EducationPreset = {
  id: string
  icon: string
  title: string
  description: string
  audience: AudienceMode
  titleTemplate: string
  example: string
  quality: 'low' | 'medium' | 'high'
  aspectRatio: '16:9' | '1:1' | '9:16'
  layoutDensity: 'comfortable' | 'compact'
  narrationStyle: 'warm_teacher' | 'neutral_teacher'
  enableNarration: boolean
}

export const AUDIENCE_MODES: Array<{ id: AudienceMode; label: string; description: string; icon: string }> = [
  { id: 'student', label: 'Estudiante', description: 'Explicación clara, pausada y paso a paso', icon: '◒' },
  { id: 'teacher', label: 'Docente', description: 'Material editable para explicar en clase', icon: '▣' },
  { id: 'social', label: 'Contenido social', description: 'Formato breve para Shorts, Reels o TikTok', icon: '✦' },
]

export const EDUCATION_PRESETS: EducationPreset[] = [
  {
    id: 'quadratic', icon: 'x²', title: 'Ecuación cuadrática', description: 'Raíces, discriminante y factorización', audience: 'student',
    titleTemplate: 'Resolver una ecuación cuadrática', example: 'x^2 - 5x + 6 = 0', quality: 'medium', aspectRatio: '16:9', layoutDensity: 'comfortable', narrationStyle: 'warm_teacher', enableNarration: true,
  },
  {
    id: 'function', icon: 'f(x)', title: 'Gráfica de función', description: 'Curva, puntos notables y lectura visual', audience: 'student',
    titleTemplate: 'Analizar una función paso a paso', example: 'f(x) = x^2 - 4x + 3', quality: 'medium', aspectRatio: '16:9', layoutDensity: 'comfortable', narrationStyle: 'warm_teacher', enableNarration: true,
  },
  {
    id: 'geometry', icon: '△', title: 'Demostración geométrica', description: 'Construcción, propiedades y conclusión', audience: 'teacher',
    titleTemplate: 'Demostración geométrica visual', example: 'Teorema de Pitágoras: a^2 + b^2 = c^2', quality: 'high', aspectRatio: '16:9', layoutDensity: 'comfortable', narrationStyle: 'neutral_teacher', enableNarration: true,
  },
  {
    id: 'short-explainer', icon: '9:16', title: 'Explicación breve', description: 'Una idea matemática en formato vertical', audience: 'social',
    titleTemplate: 'Una idea matemática en 60 segundos', example: '¿Por qué (-1)(-1) = 1?', quality: 'medium', aspectRatio: '9:16', layoutDensity: 'compact', narrationStyle: 'warm_teacher', enableNarration: true,
  },
  {
    id: 'teacher-lesson', icon: '▤', title: 'Clase completa', description: 'Guion estructurado para enseñar un concepto', audience: 'teacher',
    titleTemplate: 'Lección de matemáticas', example: 'Derivada de x^2 y significado de la pendiente', quality: 'high', aspectRatio: '16:9', layoutDensity: 'comfortable', narrationStyle: 'neutral_teacher', enableNarration: true,
  },
]
