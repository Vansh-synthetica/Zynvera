import Big from 'big.js'

export type SubmissionScore = {
  id: string
  score: number | null
  pointsPossible: number
}

export type DropRule = {
  dropLowest: number
  dropHighest: number
  neverDrop: string[]
}

export const DEFAULT_DROP_RULE: DropRule = {
  dropLowest: 0,
  dropHighest: 0,
  neverDrop: [],
}

const toBig = (n: number | null | undefined): Big => new Big(n ?? 0)

/** Percentage for a single submission, 0-100 scale. Null when ungradeable. */
export function scoreToPercentage(
  score: number | null | undefined,
  pointsPossible: number | null | undefined,
): number | null {
  if (!pointsPossible || pointsPossible <= 0) return null
  if (score === null || score === undefined) return null
  return Number(new Big(score).div(pointsPossible).times(100).toFixed(4))
}

/** Weighted contribution of one graded item. */
export function weightedPercent(score: number, possible: number, weight: number): Big {
  if (!score || !possible || !weight) return new Big(0)
  return new Big(score).div(possible).times(weight)
}

/**
 * Decide which submissions to exclude from a group grade.
 *
 * Standard academic "drop rules": remove the N lowest-scoring and M
 * highest-scoring graded items, skipping anything marked never-drop.
 * Ranking is by raw percentage so items with different point values
 * compare fairly.
 */
export function pickDroppedIds(submissions: SubmissionScore[], rule: DropRule): Set<string> {
  const dropped = new Set<string>()

  const eligible = submissions.filter(
    s =>
      s.score !== null &&
      s.score !== undefined &&
      s.pointsPossible > 0 &&
      !rule.neverDrop.includes(s.id),
  )

  const ranked = [...eligible].sort((a, b) => {
    const pctA = (a.score as number) / a.pointsPossible
    const pctB = (b.score as number) / b.pointsPossible
    return pctA - pctB
  })

  let remaining = ranked.length

  for (let i = 0; i < rule.dropLowest && remaining > 1; i++) {
    const candidate = ranked[i]
    if (!candidate) break
    dropped.add(candidate.id)
    remaining--
  }

  for (let i = 0; i < rule.dropHighest && remaining > 1; i++) {
    const idx = ranked.length - 1 - i
    const candidate = ranked[idx]
    if (!candidate || dropped.has(candidate.id)) continue
    dropped.add(candidate.id)
    remaining--
  }

  return dropped
}

export type GroupGradeResult = {
  score: number
  pointsPossible: number
  percentage: number | null
  droppedCount: number
  gradedCount: number
  totalCount: number
}

/**
 * Grade for one weighted category (e.g. "Homework 20%").
 * Applies drop rules, sums kept scores, returns the category percentage.
 */
export function calculateGroupGrade(
  submissions: SubmissionScore[],
  rule: DropRule = DEFAULT_DROP_RULE,
): GroupGradeResult {
  const dropped = pickDroppedIds(submissions, rule)

  let totalScore = new Big(0)
  let totalPossible = new Big(0)
  let gradedCount = 0

  submissions.forEach(s => {
    if (s.score === null || s.score === undefined) return
    if (dropped.has(s.id)) return
    totalScore = totalScore.plus(toBig(s.score))
    totalPossible = totalPossible.plus(toBig(s.pointsPossible))
    gradedCount++
  })

  const percentage =
    totalPossible.gt(0) ? Number(totalScore.div(totalPossible).times(100).toFixed(2)) : null

  return {
    score: Number(totalScore.toString()),
    pointsPossible: Number(totalPossible.toString()),
    percentage,
    droppedCount: dropped.size,
    gradedCount,
    totalCount: submissions.length,
  }
}

export type CategoryInput = {
  id: string
  name: string
  weight: number
  submissions: SubmissionScore[]
  dropRule?: DropRule
}

export type CourseGradeResult = {
  /** Final weighted percentage, 0-100. Null until something is graded. */
  finalPercent: number | null
  letterGrade: string | null
  gpa: number | null
  categories: Array<
    CategoryInput & { result: GroupGradeResult; effectiveWeight: number | null }
  >
  gradedCategories: number
  totalCategories: number
}

/**
 * Final course grade across weighted categories.
 *
 * Categories with no graded work are excluded and their weight is
 * redistributed proportionally across the graded ones — the same way
 * mainstream LMS gradebooks behave.
 */
export function calculateCourseGrade(
  categories: CategoryInput[],
): CourseGradeResult {
  const detailed = categories.map(cat => ({
    ...cat,
    dropRule: cat.dropRule ?? DEFAULT_DROP_RULE,
    result: calculateGroupGrade(cat.submissions, cat.dropRule ?? DEFAULT_DROP_RULE),
  }))

  const totalWeight = detailed.reduce((sum, c) => sum + c.weight, 0)

  const graded = detailed.filter(c => c.result.percentage !== null)

  const gradedWeight = graded.reduce((sum, c) => sum + c.weight, 0)

  let weightedSum = new Big(0)
  graded.forEach(c => {
    const effective =
      totalWeight > 0 && gradedWeight > 0 ? (c.weight / gradedWeight) * totalWeight : 0
    weightedSum = weightedSum.plus(
      new Big(c.result.percentage as number).times(effective),
    )
  })

  const finalPercent =
    graded.length > 0 && gradedWeight > 0
      ? Number(weightedSum.div(gradedWeight > 0 ? totalWeight : 1).toFixed(2))
      : null

  const withMeta = detailed.map(c => ({
    ...c,
    effectiveWeight:
      c.result.percentage !== null && gradedWeight > 0
        ? Number(((c.weight / gradedWeight) * totalWeight).toFixed(2))
        : null,
  }))

  const letterGrade = finalPercent !== null ? percentToLetter(finalPercent) : null
  const gpa = letterGrade ? letterToGpa(letterGrade) : null

  return {
    finalPercent,
    letterGrade,
    gpa,
    categories: withMeta,
    gradedCategories: graded.length,
    totalCategories: detailed.length,
  }
}

// ── Letter grades / GPA ──────────────────────────────────────────

export type GradingSchemeRow = [letter: string, minPercent: number, gpaPoints: number]

export const STANDARD_SCHEME: GradingSchemeRow[] = [
  ['A', 93, 4.0],
  ['A-', 90, 3.7],
  ['B+', 87, 3.3],
  ['B', 83, 3.0],
  ['B-', 80, 2.7],
  ['C+', 77, 2.3],
  ['C', 73, 2.0],
  ['C-', 70, 1.7],
  ['D+', 67, 1.3],
  ['D', 60, 1.0],
  ['F', 0, 0.0],
]

export function percentToLetter(
  percent: number,
  scheme: GradingSchemeRow[] = STANDARD_SCHEME,
): string {
  const row = scheme.find(([, min]) => percent >= min)
  return row ? row[0] : 'F'
}

export function letterToGpa(
  letter: string,
  scheme: GradingSchemeRow[] = STANDARD_SCHEME,
): number | null {
  const row = scheme.find(([l]) => l.toLowerCase() === letter.toLowerCase())
  return row ? row[2] : null
}

export function percentToGpa(
  percent: number,
  scheme: GradingSchemeRow[] = STANDARD_SCHEME,
): number | null {
  const letter = percentToLetter(percent, scheme)
  return letterToGpa(letter, scheme)
}

// ── Formatting ───────────────────────────────────────────────────

export type GradeFormat = 'percent' | 'points' | 'letter' | 'gpa' | 'pass_fail'

export function formatGrade(
  value: number | null,
  format: GradeFormat,
  opts: { pointsPossible?: number; decimals?: number } = {},
): string {
  const decimals = opts.decimals ?? 1
  switch (format) {
    case 'percent':
      return value === null ? '—' : `${value.toFixed(decimals)}%`
    case 'points':
      return value === null
        ? '—'
        : `${value.toFixed(0)}${opts.pointsPossible ? `/${opts.pointsPossible}` : ''}`
    case 'letter':
      return value === null ? '—' : percentToLetter(value)
    case 'gpa': {
      if (value === null) return '—'
      const gpa = percentToGpa(value)
      return gpa === null ? '—' : gpa.toFixed(1)
    }
    case 'pass_fail':
      return value === null ? '—' : value >= 60 ? 'Pass' : 'Fail'
  }
}

/** Detect suspicious entries: negative or more than 1.5x the max. */
export function isOutlierScore(score: number, pointsPossible: number): boolean {
  return score < 0 || (pointsPossible > 0 && score > pointsPossible * 1.5)
}
