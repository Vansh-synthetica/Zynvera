export type RubricRating = {
  id: string
  label: string
  description?: string
  points: number
}

export type RubricCriterion = {
  id: string
  description: string
  longDescription?: string
  points: number
  ratings: RubricRating[]
}

export type Rubric = {
  id: string
  title: string
  description?: string
  criteria: RubricCriterion[]
  pointsPossible: number
}

export type RubricAssessmentRating = {
  criterionId: string
  ratingId: string | null
  points: number | null
  comments?: string
}

export type RubricAssessment = {
  id: string
  rubricId: string
  studentId: string
  assessorId: string
  ratings: RubricAssessmentRating[]
  totalScore: number
  submittedAt: string
}

/** Total possible points across all criteria. */
export function rubricPointsPossible(criteria: RubricCriterion[]): number {
  return criteria.reduce((sum, c) => sum + c.points, 0)
}

/** Score a single assessment from its selected ratings. */
export function scoreAssessment(
  rubric: Rubric,
  ratings: RubricAssessmentRating[],
): number {
  return ratings.reduce((sum, r) => sum + (r.points ?? 0), 0)
}

/** Percentage earned against total rubric points. */
export function assessmentPercentage(rubric: Rubric, totalScore: number): number {
  const max = rubricPointsPossible(rubric.criteria)
  if (!max) return 0
  return Number(((totalScore / max) * 100).toFixed(1))
}

/** Suggest a mastery level for a chosen rating based on its share of the criterion. */
export type MasteryLevel = 'exceeds' | 'meets' | 'near' | 'below'

export function masteryLevelFor(ratingPoints: number, criterionPoints: number): MasteryLevel {
  if (criterionPoints <= 0) return 'below'
  const ratio = ratingPoints / criterionPoints
  if (ratio >= 1) return 'exceeds'
  if (ratio >= 0.75) return 'meets'
  if (ratio >= 0.5) return 'near'
  return 'below'
}

export function emptyAssessment(rubric: Rubric): RubricAssessmentRating[] {
  return rubric.criteria.map(c => ({
    criterionId: c.id,
    ratingId: null,
    points: null,
    comments: '',
  }))
}
